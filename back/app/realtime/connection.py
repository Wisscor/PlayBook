from uuid import UUID

from fastapi import WebSocket

from ..database.database import session_maker
from . import frames, registry, service


async def _flush_pending_messages(websocket: WebSocket, user_id: UUID) -> None:
    async with session_maker() as db:
        pending = await service.take_pending_messages(db, user_id)
        for row, message in pending:
            await websocket.send_json(service.message_payload(message))
        if pending:
            await service.mark_pending_delivered(db, [row.id for row, _ in pending])


async def _flush_notifications(websocket: WebSocket, user_id: UUID) -> None:
    async with session_maker() as db:
        pending_notifications = await service.get_undelivered_notifications(
            db, user_id
        )
        for notification, actor_username in pending_notifications:
            await websocket.send_json(
                service.notification_payload(notification, actor_username)
            )
        if pending_notifications:
            await service.mark_delivered(
                db, [notification.id for notification, _ in pending_notifications]
            )

        unread_count = await service.get_unread_count(db, user_id)
        await websocket.send_json(
            {
                "type": frames.NOTIFICATION_COUNT,
                "unread_count": unread_count,
            }
        )


async def _send_presence_snapshot(
    websocket: WebSocket, user_id: UUID
) -> set[UUID]:
    async with session_maker() as db:
        contacts = await service.get_contact_ids(db, user_id)
    online_contacts = contacts & registry.online_user_ids()
    await websocket.send_json(
        {
            "type": frames.PRESENCE_SNAPSHOT,
            "online": [str(contact_id) for contact_id in online_contacts],
        }
    )
    return contacts


async def announce_presence(
    contacts: set[UUID], user_id: UUID, online: bool
) -> None:
    frame = {
        "type": frames.PRESENCE,
        "user_id": str(user_id),
        "online": online,
    }
    for contact_id in contacts:
        await registry.send_to_user(contact_id, frame)


async def on_connect(
    websocket: WebSocket, user, first_socket: bool
) -> set[UUID]:
    await _flush_pending_messages(websocket, user.id)
    await _flush_notifications(websocket, user.id)
    contacts = await _send_presence_snapshot(websocket, user.id)
    if first_socket:
        await announce_presence(contacts, user.id, True)
    return contacts


async def on_disconnect(user, websocket: WebSocket, contacts: set[UUID]) -> None:
    registry.unregister(user.id, websocket)
    if not registry.connections_for(user.id):
        await announce_presence(contacts, user.id, False)
