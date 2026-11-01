from uuid import UUID
from . import frames, registry
from .service import SentMessage, conversation_new_payload, message_payload


def other(
    participants: list[tuple[UUID, str]], me: UUID
) -> tuple[UUID, str]:
    for user_id, username in participants:
        if user_id != me:
            return user_id, username
    raise ValueError(f"no other participant found for user {me}")


async def deliver_message(result: SentMessage) -> list[UUID]:
    payload = message_payload(result)

    if result.is_first:
        for pid, _ in result.participants:
            peer_id, peer_username = other(result.participants, pid)
            await registry.send_to_user(
                pid,
                conversation_new_payload(
                    result.conversation_id, peer_id, peer_username
                ),
            )
            await registry.send_to_user(
                pid,
                {
                    "type": frames.PRESENCE,
                    "user_id": str(peer_id),
                    "online": bool(registry.connections_for(peer_id)),
                },
            )

    unreached = []
    for pid, _ in result.participants:
        if await registry.send_to_user(pid, payload) == 0:
            unreached.append(pid)
    return unreached
