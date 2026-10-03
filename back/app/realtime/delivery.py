from uuid import UUID

from . import frames, registry
from .service import SentMessage, conversation_new_payload


def other(
    participants: list[tuple[UUID, str]], me: UUID
) -> tuple[UUID, str]:
    """Return (peer_id, peer_username) of the participant who is not *me*.

    Raises ValueError instead of letting StopIteration escape from a
    generator if there is no other participant.
    """
    for user_id, username in participants:
        if user_id != me:
            return user_id, username
    raise ValueError(f"no other participant found for user {me}")


async def deliver_message(result: SentMessage) -> None:
    """Fan-out conversation.new (if first) then message.new to all participants.

    Must be called AFTER the database session is closed.
    Never touches the database.
    """
    payload = {
        "type": frames.MESSAGE_NEW,
        "id": str(result.id),
        "conversation_id": str(result.conversation_id),
        "sender_id": str(result.sender_id),
        "body": result.body,
        "created_at": result.created_at.isoformat(),
    }

    if result.is_first:
        for pid, _ in result.participants:
            peer_id, peer_username = other(result.participants, pid)
            await registry.send_to_user(
                pid,
                conversation_new_payload(
                    result.conversation_id, peer_id, peer_username
                ),
            )

    for pid, _ in result.participants:
        await registry.send_to_user(pid, payload)
