from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.database import get_db
from ..models.user import User
from ..core.deps import get_curr_user
from . import service
from .models import ConversationCreate


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
    conversation = await service.get_or_create_direct(db, current_user.id, body.peer_id)
    return {"id": conversation.id, "peer_id": body.peer_id}

@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_curr_user),
):
    return await service.list_conversations(db, current_user.id)