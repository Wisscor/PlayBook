from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ..database.database import session_maker
from . import frames, service, delivery
from . import registry
from .schemas import MessageSend
from .ws_auth import authenticate_socket

router = APIRouter()


async def _reject(ws: WebSocket, reason: str) -> None:
    await ws.send_json({"type": frames.ERROR, "reason": reason})


async def _announce(contacts: set[UUID], user_id: UUID, online: bool) -> None:
    frame = {
        "type": frames.PRESENCE,
        "user_id": str(user_id),
        "online": online,
    }
    for contact_id in contacts:
        await registry.send_to_user(contact_id, frame)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    async with session_maker() as db:
        user = await authenticate_socket(websocket, db)
    if user is None:
        return

    first_socket = not registry.connections_for(user.id)
    registry.register(user.id, websocket)
    contacts = set()
    try:
        await websocket.send_json(
            {
                "type": frames.READY,
                "user_id": str(user.id),
                "username": user.username,
            }
        )
        async with session_maker() as db:
            pending = await service.take_pending_messages(db, user.id)
            for row, message in pending:
                await websocket.send_json(service.message_payload(message))
            if pending:
                await service.mark_pending_delivered(
                    db, [row.id for row, _ in pending]
                )

        async with session_maker() as db:
            pending_notifications = await service.get_undelivered_notifications(
                db, user.id
            )
            for notification, actor_username in pending_notifications:
                await websocket.send_json(
                    service.notification_payload(notification, actor_username)
                )
            if pending_notifications:
                await service.mark_delivered(
                    db, [notification.id for notification, _ in pending_notifications]
                )

            unread_count = await service.get_unread_count(db, user.id)
            await websocket.send_json(
                {
                    "type": frames.NOTIFICATION_COUNT,
                    "unread_count": unread_count,
                }
            )

        async with session_maker() as db:
            contacts = await service.get_contact_ids(db, user.id)
        online_contacts = contacts & registry.online_user_ids()
        await websocket.send_json(
            {
                "type": frames.PRESENCE_SNAPSHOT,
                "online": [str(contact_id) for contact_id in online_contacts],
            }
        )
        if first_socket:
            await _announce(contacts, user.id, True)

        while True:
            try:
                frame = await websocket.receive_json()
            except ValueError:
                await _reject(websocket, "invalid_json")
                continue

            kind = frame.get("type") if isinstance(frame, dict) else None
            try:
                match kind:
                    case frames.MESSAGE_SEND:
                        data = MessageSend.model_validate(frame)
                        async with session_maker() as db:
                            result = await service.send_message(
                                db, user.id, data.conversation_id, data.body
                            )
                        unreached = await delivery.deliver_message(result)
                        if unreached:
                            async with session_maker() as db:
                                await service.create_pending_messages(
                                    db, unreached, result.id
                                )
                    case _:
                        await _reject(websocket, "unknown_type")
            except ValidationError:
                await _reject(websocket, "invalid_frame")
                continue
            except PermissionError:
                await _reject(websocket, "conversation_not_found")
                continue
    except WebSocketDisconnect:
        pass
    finally:
        registry.unregister(user.id, websocket)
        if not registry.connections_for(user.id):
            await _announce(contacts, user.id, False)
