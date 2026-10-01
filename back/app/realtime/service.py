from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import aliased

from ..models.user import User
from .models import Conversation, ConversationParticipant , Message

async def get_or_create_direct(db, me: UUID, peer: UUID) -> Conversation:
    a, b = aliased(ConversationParticipant), aliased(ConversationParticipant)
    found = await db.execute(
        select(Conversation)
        .join(a, a.conversation_id == Conversation.id)
        .join(b, b.conversation_id == Conversation.id)
        .where(a.user_id == me, b.user_id == peer)
    )
    conversation = found.scalars().first()
    if conversation is None:
        conversation = Conversation()
        db.add(conversation)
        await db.flush()
        db.add_all([
            ConversationParticipant(conversation_id=conversation.id, user_id=me),
            ConversationParticipant(conversation_id=conversation.id, user_id=peer),
        ])
        await db.commit()
        await db.refresh(conversation)
    return conversation


async def list_conversations(db, me: UUID) -> list[dict]:
    mine, other = aliased(ConversationParticipant), aliased(ConversationParticipant)
    rows = await db.execute(
        select(Conversation.id, other.user_id, User.username)
        .join(mine, mine.conversation_id == Conversation.id)
        .join(other, (other.conversation_id == Conversation.id) & (other.user_id != me))
        .join(User, User.id == other.user_id)
        .where(mine.user_id == me)
        .order_by(Conversation.created_at.desc())
    )
    return [{"id": c, "peer_id": p, "peer_username": u} for c, p, u in rows.all()]


async def create_message(db, sender_id, conversation_id, body: str) -> Message:
    is_participant = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == sender_id,
        )
    )
    if is_participant.scalar_one_or_none() is None:
        raise PermissionError("not a participant")
    message = Message(conversation_id=conversation_id, sender_id=sender_id, body=body)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message