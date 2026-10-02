import logging
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.database import get_db
from ..models.user import User
from ..core.deps import get_curr_user
from . import registry, service
from .schemas import ConversationCreate

logger = logging.getLogger(__name__)


async def _announce_new_conversation(conversation_id: UUID, creator: User, peer: User) -> None:
    """Push `conversation.new` to both users. Never raises: the conversation already exists."""
    try:
        await registry.send_to_user(
            peer.id, service.conversation_new_payload(conversation_id, creator)
        )
        await registry.send_to_user(
            creator.id, service.conversation_new_payload(conversation_id, peer)
        )
    except Exception:
        logger.exception("conversation.new push failed for %s", conversation_id)


router = APIRouter(prefix="/realtime", tags=["realtime"])

@router.post("/conversations")
async def create_conversation(
    body: ConversationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    if body.peer_id == current_user.id:
        raise HTTPException(status_code=422, detail="cannot start a conversation with yourself")
    peer = await db.get(User, body.peer_id)
    if peer is None:
        raise HTTPException(status_code=404, detail="user not found")

    conversation = await service.find_direct(db, current_user.id, body.peer_id)
    if conversation is None:
        if not await service.mutual_follow_exists(db, current_user.id, body.peer_id):
            raise HTTPException(
                status_code=403,
                detail="you can only start a conversation with someone you follow each other with",
            )
        conversation = await service.get_or_create_direct(db, current_user.id, body.peer_id)
        background_tasks.add_task(
            _announce_new_conversation, conversation.id, current_user, peer
        )

    return {"id": conversation.id, "peer_id": body.peer_id}

@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    return await service.list_conversations(db, current_user.id)