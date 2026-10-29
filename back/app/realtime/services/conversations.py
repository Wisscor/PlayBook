from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import aliased

from ...models import Follower
from ...models.user import User
from .. import frames
from ..models import Conversation, ConversationParticipant, Message


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
    read_marker = aliased(Message)
    unread_count = (
        select(func.count(Message.id))
        .where(
            Message.conversation_id == Conversation.id,
            Message.sender_id == other.user_id,
            or_(
                mine.last_read_message_id.is_(None),
                read_marker.created_at.is_(None),
                Message.created_at > read_marker.created_at,
            ),
        )
        .correlate(Conversation, mine, other, read_marker)
        .scalar_subquery()
    )
    # We need to join the read_marker to get the last_read_message_id for the current user (mine).
    # This is necessary to determine the unread_count for each conversation.
    # The read_marker is an alias for the Message table, and we join it on the last_read_message_id of the current user's ConversationParticipant entry (mine).
    rows = await db.execute(
        select(Conversation.id, other.user_id, User.username, unread_count, other.last_read_message_id, )
        .join(mine, mine.conversation_id == Conversation.id)
        .join(other, (other.conversation_id == Conversation.id) & (other.user_id != me))
        .outerjoin(read_marker, read_marker.id == mine.last_read_message_id)
        .join(User, User.id == other.user_id)
        .where(
            mine.user_id == me,
        )
        .order_by(Conversation.created_at.desc())
    )
    # The result is a list of tuples: (conversation_id, peer_id, peer_username, unread_count, peer_last_read_message_id)
    # We convert it to a list of dictionaries for easier consumption by the frontend.
    # Each dictionary represents a conversation with its associated peer information.
    return [
        {"id": c,"peer_id": p, "peer_username": u, "unread_count": count, "peer_last_read_message_id": last_read_message_id,}
        for c, p, u, count, last_read_message_id in rows.all()
    ]


async def get_contact_ids(db, user_id: UUID) -> set[UUID]:
    mine = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == user_id
    )
    rows = await db.execute(
        select(ConversationParticipant.user_id)
        .where(ConversationParticipant.conversation_id.in_(mine))
        .where(ConversationParticipant.user_id != user_id)
        .distinct()
    )
    return {contact_id for (contact_id,) in rows.all()}


async def get_participant_ids(db, conversation_id: UUID) -> list[UUID]:
    rows = await db.execute(
        select(ConversationParticipant.user_id).where(
            ConversationParticipant.conversation_id == conversation_id
        )
    )
    return [user_id for (user_id,) in rows.all()]
