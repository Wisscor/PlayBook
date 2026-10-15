from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, tuple_
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ..database.database import get_db
from ..models.user import User
from ..core.deps import get_curr_user
from . import service
from .schemas import ConversationCreate, NotificationReadRequest
from .models import Message

router = APIRouter(prefix="/realtime", tags=["realtime"])

@router.post("/conversations")
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    if body.peer_id == current_user.id:
        raise HTTPException(status_code=422, detail="cannot start a conversation with yourself")
    if await db.get(User, body.peer_id) is None:
        raise HTTPException(status_code=404, detail="user not found")

    conversation = await service.find_direct(db, current_user.id, body.peer_id)
    if conversation is None:
        if not await service.mutual_follow_exists(db, current_user.id, body.peer_id):
            raise HTTPException(
                status_code=403,
                detail="you can only start a conversation with someone you follow each other with",
            )
        conversation = await service.get_or_create_direct(db, current_user.id, body.peer_id)

    return {"id": conversation.id, "peer_id": body.peer_id}

@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    return await service.list_conversations(db, current_user.id)


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: UUID,
    before: UUID | None = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    participant_ids = await service.get_participant_ids(db, conversation_id)
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=404, detail="conversation not found")

    query = select(Message).where(Message.conversation_id == conversation_id)
    if before is not None:
        anchor = await db.get(Message, before)
        if anchor is None or anchor.conversation_id != conversation_id:
            raise HTTPException(status_code=404, detail="unknown cursor")
        query = query.where(
            tuple_(Message.created_at, Message.id)
            < tuple_(anchor.created_at, anchor.id)
        )

    query = query.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit)
    rows = (await db.execute(query)).scalars().all()
    return {
        "items": rows,
        "next_cursor": rows[-1].id if len(rows) == limit else None,
    }


@router.get("/notifications")
async def list_notifications(
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
async def mark_notifications_read(
    body: NotificationReadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    await service.mark_read(db, current_user.id, body.notification_ids)
    return {"unread_count": await service.get_unread_count(db, current_user.id)}


@router.get("/notifications/count")
async def notification_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    return {"unread_count": await service.get_unread_count(db, current_user.id)}