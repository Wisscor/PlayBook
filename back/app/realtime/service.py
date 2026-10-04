from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import exists, func, select, update
from sqlalchemy.orm import aliased

from ..models import Follower
from ..models.user import User
from . import frames
from .models import (
    Conversation,
    ConversationParticipant,
    Message,
    Notification,
    PendingMessage,
)


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


async def create_pending_messages(
    db, user_ids: list[UUID], message_id: UUID
) -> None:
    db.add_all(
        [PendingMessage(user_id=user_id, message_id=message_id) for user_id in user_ids]
    )
    await db.commit()


async def take_pending_messages(
    db, user_id: UUID
) -> list[tuple[PendingMessage, Message]]:
    rows = await db.execute(
        select(PendingMessage, Message)
        .join(Message, Message.id == PendingMessage.message_id)
        .where(
            PendingMessage.user_id == user_id,
            PendingMessage.delivered_at.is_(None),
        )
        .order_by(PendingMessage.created_at.asc())
    )
    return rows.all()


async def mark_pending_delivered(db, pending_ids: list[UUID]) -> None:
    await db.execute(
        update(PendingMessage)
        .where(PendingMessage.id.in_(pending_ids))
        .values(delivered_at=datetime.now(timezone.utc))
    )
    await db.commit()


@dataclass(frozen=True)
class SentMessage:
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    body: str
    created_at: datetime
    is_first: bool
    participants: list[tuple[UUID, str]]  # [(user_id, username), ...]


async def send_message(db, sender_id: UUID, conversation_id: UUID, body: str) -> SentMessage:
    is_first = not await has_messages(db, conversation_id)
    message = await create_message(db, sender_id, conversation_id, body)
    participants = await get_participants(db, message.conversation_id)
    return SentMessage(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        body=message.body,
        created_at=message.created_at,
        is_first=is_first,
        participants=participants,
    )


def message_payload(message: Message | SentMessage) -> dict:
    return {
        "type": frames.MESSAGE_NEW,
        "id": str(message.id),
        "conversation_id": str(message.conversation_id),
        "sender_id": str(message.sender_id),
        "body": message.body,
        "created_at": message.created_at.isoformat(),
    }


async def create_notification(
    db,
    user_id: UUID,
    actor_id: UUID,
    event_type: str,
    target_id: UUID | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        actor_id=actor_id,
        event_type=event_type,
        target_id=target_id,
    )
    db.add(notif)
    await db.commit()
    return notif


async def unread_duplicate_exists(
    db, user_id, actor_id, event_type, target_id
) -> bool:
    result = await db.execute(
        select(Notification.id)
        .where(
            Notification.user_id == user_id,
            Notification.actor_id == actor_id,
            Notification.event_type == event_type,
            Notification.target_id == target_id,
            Notification.read_at.is_(None),
        )
        .limit(1)
    )
    return result.first() is not None


async def get_undelivered_notifications(
    db, user_id
) -> list[tuple[Notification, str]]:
    rows = await db.execute(
        select(Notification, User.username)
        .join(User, User.id == Notification.actor_id)
        .where(
            Notification.user_id == user_id,
            Notification.delivered_at.is_(None),
        )
        .order_by(Notification.created_at.asc())
    )
    return rows.all()


async def list_notifications(
    db, user_id, unread_only: bool, limit: int
) -> list[dict]:
    stmt = (
        select(Notification, User.username)
        .join(User, User.id == Notification.actor_id)
        .where(Notification.user_id == user_id)
    )
    if unread_only:
        stmt = stmt.where(Notification.read_at.is_(None))
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    rows = await db.execute(stmt)
    return [notification_dict(notification, username) for notification, username in rows.all()]


async def mark_delivered(db, notification_ids: list[UUID]):
    await db.execute(
        update(Notification)
        .where(Notification.id.in_(notification_ids))
        .values(delivered_at=datetime.now(timezone.utc))
    )
    await db.commit()


async def mark_read(db, user_id: UUID, notification_ids: list[UUID]):
    await db.execute(
        update(Notification)
        .where(
            Notification.id.in_(notification_ids),
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    await db.commit()


async def get_unread_count(db, user_id: UUID) -> int:
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
    )
    return result.scalar()


def notification_dict(notif: Notification, actor_username: str) -> dict:
    return {
        "id": str(notif.id),
        "event_type": notif.event_type,
        "actor_id": str(notif.actor_id),
        "actor_username": actor_username,
        "target_id": str(notif.target_id) if notif.target_id else None,
        "read_at": notif.read_at.isoformat() if notif.read_at else None,
        "created_at": notif.created_at.isoformat(),
    }


def notification_payload(notif: Notification, actor_username: str) -> dict:
    return {"type": frames.NOTIFICATION, **notification_dict(notif, actor_username)}
