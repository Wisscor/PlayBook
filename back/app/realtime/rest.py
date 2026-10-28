from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select, tuple_
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ..database.database import get_db
from ..models.user import User
from ..core.deps import get_curr_user
from ..core.limiter import limiter
from ..core.exceptions import ApiException
from ..core.error_codes import ErrorCode
from . import service
from .schemas import ConversationCreate, NotificationReadRequest
from .models import Message

router = APIRouter(prefix="/realtime", tags=["realtime"])


@router.post("/conversations")
@limiter.limit("20/minute")
async def create_conversation(
    body: ConversationCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    if body.peer_id == current_user.id:
        raise ApiException(
            code=ErrorCode.VALIDATION_ERROR,
            field="peer_id",
        )
    if await db.get(User, body.peer_id) is None:
        raise ApiException(code=ErrorCode.USER_NOT_FOUND)

    conversation = await service.find_direct(db, current_user.id, body.peer_id)
    if conversation is None:
        if not await service.mutual_follow_exists(
            db, current_user.id, body.peer_id
        ):
            raise ApiException(code=ErrorCode.PERMISSION_DENIED)
        conversation = await service.get_or_create_direct(
            db, current_user.id, body.peer_id
        )

    return {"id": conversation.id, "peer_id": body.peer_id}


@router.get("/conversations")
@limiter.limit("60/minute")
async def list_conversations(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    return await service.list_conversations(db, current_user.id)


@router.get("/conversations/{conversation_id}/messages")
@limiter.limit("120/minute")
async def get_messages(
    conversation_id: UUID,
    request: Request,
    before: UUID | None = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    participant_ids = await service.get_participant_ids(db, conversation_id)
    if current_user.id not in participant_ids:
        raise ApiException(code=ErrorCode.CONVERSATION_NOT_FOUND)

    query = select(Message).where(Message.conversation_id == conversation_id)
    if before is not None:
        anchor = await db.get(Message, before)
        if anchor is None or anchor.conversation_id != conversation_id:
            raise ApiException(code=ErrorCode.MESSAGE_NOT_FOUND)
        query = query.where(
            tuple_(Message.created_at, Message.id)
            < tuple_(anchor.created_at, anchor.id)
        )

    query = query.order_by(Message.created_at.desc(), Message.id.desc()).limit(
        limit
    )
    rows = (await db.execute(query)).scalars().all()
    return {
        "items": rows,
        "next_cursor": rows[-1].id if len(rows) == limit else None,
    }


@router.get("/notifications")
@limiter.limit("60/minute")
async def list_notifications(
    request: Request,
    unread_only: bool = False,
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    return {
        "items": await service.list_notifications(
            db, current_user.id, unread_only, limit
        ),
        "unread_count": await service.get_unread_count(db, current_user.id),
    }


@router.post("/notifications/read")
@limiter.limit("30/minute")
async def mark_notifications_read(
    body: NotificationReadRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    await service.mark_read(db, current_user.id, body.notification_ids)
    return {
        "unread_count": await service.get_unread_count(db, current_user.id)
    }
