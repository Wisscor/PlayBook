from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ..database.database import session_maker
from . import frames, service
from . import registry
from .schemas import MessageSend
from .ws_auth import authenticate_socket

router = APIRouter()


async def _reject(ws: WebSocket, reason: str) -> None:
    await ws.send_json({"type": frames.ERROR, "reason": reason})


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    async with session_maker() as db:
        user = await authenticate_socket(websocket, db)
    if user is None:
        return

    registry.register(user.id, websocket)
    try:
        await websocket.send_json(
            {
                "type": frames.READY,
                "user_id": str(user.id),
                "username": user.username,
            }
        )

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
                            is_first = not await service.has_messages(
                                db, data.conversation_id
                            )
                            message = await service.create_message(
                                db, user.id, data.conversation_id, data.body
                            )
                            participants = await service.get_participants(
                                db, message.conversation_id
                            )

                        payload = {
                            "type": frames.MESSAGE_NEW,
                            "id": str(message.id),
                            "conversation_id": str(message.conversation_id),
                            "sender_id": str(message.sender_id),
                            "body": message.body,
                            "created_at": message.created_at.isoformat(),
                        }
                        if is_first:
                            for pid, _ in participants:
                                peer_id, peer_username = next(
                                    (participant_id, username)
                                    for participant_id, username in participants
                                    if participant_id != pid
                                )
                                await registry.send_to_user(
                                    pid,
                                    service.conversation_new_payload(
                                        message.conversation_id, peer_id, peer_username
                                    ),
                                )
                        for pid, _ in participants:
                            await registry.send_to_user(pid, payload)
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
