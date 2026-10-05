import asyncio
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ..database.database import session_maker
from . import connection, frames, service, delivery, registry
from .handlers import ConnectionContext
from .limits import SlidingWindow
from .schemas import MessageRead, MessageSend
from .ws_auth import authenticate_socket

router = APIRouter()


async def _reject(ws: WebSocket, reason: str) -> None:
    await ws.send_json({"type": frames.ERROR, "reason": reason})


async def _idle_watchdog(ctx: ConnectionContext) -> None:
    while True:
        await asyncio.sleep(15)
        if time.monotonic() - ctx.last_seen > 45:
            await ctx.websocket.close(code=frames.CLOSE_IDLE_TIMEOUT)
            return


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    last_seen = time.monotonic()

    async with session_maker() as db:
        user = await authenticate_socket(websocket, db)
    if user is None:
        return

    ctx = ConnectionContext(
        websocket=websocket,
        user=user,
        last_seen=last_seen,
        sends=SlidingWindow(10),
        strikes=SlidingWindow(60),
    )
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
        contacts = await connection.on_connect(websocket, user, first_socket)

        async def receive_loop() -> None:
            while True:
                try:
                    frame = await ctx.websocket.receive_json()
                except ValueError:
                    ctx.last_seen = time.monotonic()
                    await _reject(ctx.websocket, "invalid_json")
                    continue

                now = time.monotonic()
                ctx.last_seen = now
                kind = frame.get("type") if isinstance(frame, dict) else None
                try:
                    match kind:
                        case frames.MESSAGE_SEND:
                            if ctx.sends.hit(now) > 10:
                                await _reject(ctx.websocket, "rate_limited")
                                if ctx.strikes.hit(now) >= 5:
                                    await ctx.websocket.close(code=frames.CLOSE_RATE_LIMIT)
                                    return
                                continue
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
                        case frames.READ:
                            data = MessageRead.model_validate(frame)
                            async with session_maker() as db:
                                peer_ids = await service.mark_conversation_read(
                                    db, user.id, data.conversation_id, data.message_id
                                )
                            receipt = {
                                "type": frames.READ,
                                "user_id": str(user.id),
                                "conversation_id": str(data.conversation_id),
                                "message_id": str(data.message_id),
                            }
                            for peer_id in peer_ids:
                                await registry.send_to_user(peer_id, receipt)
                        case frames.PING:
                            await ctx.websocket.send_json({"type": frames.PONG})
                        case _:
                            await _reject(websocket, "unknown_type")
                except ValidationError:
                    await _reject(websocket, "invalid_frame")
                except PermissionError:
                    await _reject(websocket, "conversation_not_found")

        receive_task = asyncio.create_task(receive_loop())
        watchdog_task = asyncio.create_task(_idle_watchdog(ctx))
        tasks = (receive_task, watchdog_task)
        try:
            done, _ = await asyncio.wait(
                tasks, return_when=asyncio.FIRST_COMPLETED
            )
            for task in done:
                task.result()
        finally:
            for task in tasks:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
    except WebSocketDisconnect:
        pass
    finally:
        await connection.on_disconnect(user, websocket, contacts)
