from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..db.database import session_maker
from . import frames
from .ws_auth import authenticate_socket

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    async with session_maker() as db:
        user = await authenticate_socket(websocket, db)
    if user is None:
        return

    await websocket.send_json(
        {
            "type": frames.READY,
            "user_id": str(user.id),
            "username": user.username,
        }
    )

    try:
        while True:
            frame = await websocket.receive_json()
            await websocket.send_json({"type": "echo", "received": frame})
    except WebSocketDisconnect:
        pass
