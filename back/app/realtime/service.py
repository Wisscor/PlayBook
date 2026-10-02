from uuid import UUID

from sqlalchemy import exists, func, select
from sqlalchemy.orm import aliased

from ..models import Follower
from ..models.user import User
from . import frames
from .models import Conversation, ConversationParticipant, Message


async def find_direct(db, me: UUID, peer: UUID) -> Conversation | None:
    a, b = aliased(ConversationParticipant), aliased(ConversationParticipant)
    found = await db.execute(
        select(Conversation)
        .join(a, a.conversation_id == Conversation.id)
        .join(b, b.conversation_id == Conversation.id)
        .where(a.user_id == me, b.user_id == peer)
    )
    return found.scalars().first()


async def _follows(db, follower: UUID, followed: UUID) -> bool:
    count = await db.scalar(
        select(func.count()).select_from(Follower).where(
            Follower.follower_id == follower,
            Follower.following_id == followed,
        )
    )
    return count > 0


async def mutual_follow_exists(db, a: UUID, b: UUID) -> bool:
    return await _follows(db, a, b) and await _follows(db, b, a)


def conversation_new_payload(
    conversation_id: UUID, peer_id: UUID, peer_username: str
) -> dict:
    """Build the conversation row for ONE recipient, describing the other user."""
    return {
        "type": frames.CONVERSATION_NEW,
        "id": str(conversation_id),
        "peer_id": str(peer_id),
        "peer_username": peer_username,
    }


async def get_or_create_direct(db, me: UUID, peer: UUID) -> Conversation:
    conversation = await find_direct(db, me, peer)
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
        .where(
            mine.user_id == me,
            exists().where(Message.conversation_id == Conversation.id),
        )
        .order_by(Conversation.created_at.desc())
    )
    return [{"id": c, "peer_id": p, "peer_username": u} for c, p, u in rows.all()]


async def has_messages(db, conversation_id: UUID) -> bool:
    return bool(
        await db.scalar(
            select(exists().where(Message.conversation_id == conversation_id))
        )
    )


async def get_participants(db, conversation_id: UUID) -> list[tuple[UUID, str]]:
    rows = await db.execute(
        select(ConversationParticipant.user_id, User.username)
        .join(User, User.id == ConversationParticipant.user_id)
        .where(ConversationParticipant.conversation_id == conversation_id)
    )
    return [(user_id, username) for user_id, username in rows.all()]


async def get_participant_ids(db, conversation_id: UUID) -> list[UUID]:
    rows = await db.execute(
        select(ConversationParticipant.user_id).where(
            ConversationParticipant.conversation_id == conversation_id
        )
    )
    return [user_id for (user_id,) in rows.all()]


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
