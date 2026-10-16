from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import exists, select, update

from .. import frames
from ..models import (
    ConversationParticipant,
    Message,
    PendingMessage,
)
from ...models.user import User


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


async def mark_conversation_read(
    db, user_id: UUID, conversation_id: UUID, message_id: UUID
) -> list[UUID]:
    participant_result = await db.execute(
        select(ConversationParticipant)
        .where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
        .with_for_update()
    )
    participant = participant_result.scalar_one_or_none()
    if participant is None:
        raise PermissionError("not a participant")

    message_result = await db.execute(
        select(Message).where(
            Message.id == message_id,
            Message.conversation_id == conversation_id,
        )
    )
    message = message_result.scalar_one_or_none()
    if message is None:
        raise PermissionError("message not found in conversation")

    current_created_at = None
    if participant.last_read_message_id is not None:
        current_result = await db.execute(
            select(Message.created_at).where(
                Message.id == participant.last_read_message_id,
                Message.conversation_id == conversation_id,
            )
        )
        current_created_at = current_result.scalar_one_or_none()

    if current_created_at is not None and message.created_at <= current_created_at:
        return []

    participant.last_read_message_id = message.id
    peer_result = await db.execute(
        select(ConversationParticipant.user_id).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id != user_id,
        )
    )
    peer_ids = [peer_id for (peer_id,) in peer_result.all()]
    await db.commit()
    return peer_ids


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
    participants: list[tuple[UUID, str]]


async def send_message(db, sender_id, conversation_id: UUID, body: str) -> SentMessage:
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
