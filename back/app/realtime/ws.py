import asyncio
import logging
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ..database.database import session_maker
from . import connection, frames, registry
from .handlers import HANDLERS, CloseConnection, ConnectionContext
from .limits import SlidingWindow
from .ws_auth import authenticate_socket

router = APIRouter()


async def _reject(ws: WebSocket, reason: str) -> None:
    await ws.send_json({"type": frames.ERROR, "reason": reason})


async def receive_loop(ctx: ConnectionContext) -> None:
    while True:
        try:
            frame = await ctx.websocket.receive_json()
        except ValueError:
            ctx.last_seen = time.monotonic()
            await _reject(ctx.websocket, "invalid_json")
            continue

        ctx.last_seen = time.monotonic()
        kind = frame.get("type") if isinstance(frame, dict) else None
        handler = HANDLERS.get(kind) if isinstance(kind, str) else None
        if handler is None:
            await _reject(ctx.websocket, "unknown_type")
            continue

        try:
            await handler(ctx, frame)
        except CloseConnection as exc:
            await ctx.websocket.close(code=exc.code)
            return
        except ValidationError:
            await _reject(ctx.websocket, "invalid_frame")
        except PermissionError:
            await _reject(ctx.websocket, "conversation_not_found")
        except WebSocketDisconnect:
            raise
        except Exception:
            logging.getLogger(__name__).exception("handler failed")
            continue


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

        receive_task = asyncio.create_task(receive_loop(ctx))
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
