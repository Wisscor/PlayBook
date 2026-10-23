import asyncio
import json
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ..core.config import settings
from ..database.database import session_maker
from . import connection, frames, registry
from .handlers import HANDLERS, ConnectionContext
from .limits import SlidingWindow
from .ws_auth import authenticate_socket

router = APIRouter()


def _origin_is_allowed(origin: str | None) -> bool:
    return origin is not None and origin in settings.cors_origins


async def _reject(ws: WebSocket, reason: str) -> None:
    await ws.send_json({"type": frames.ERROR, "reason": reason})


async def receive_loop(ctx: ConnectionContext) -> None:
    while True:
        raw = await ctx.websocket.receive_text()

        now = time.monotonic()
        ctx.last_seen = now
        if (
            ctx.inbound_frames.hit(now)
            > frames.MAX_INBOUND_FRAMES_PER_WINDOW
        ):
            await registry.timeout_user(ctx.user.id)
            return

        if len(raw.encode("utf-8")) > frames.MAX_FRAME_BYTES:
            await _reject(ctx.websocket, "frame_too_large")
            continue

        try:
            frame = json.loads(raw)
        except (ValueError, TypeError):
            await _reject(ctx.websocket, "invalid_json")
            continue

        kind = frame.get("type") if isinstance(frame, dict) else None
        handler = HANDLERS.get(kind) if isinstance(kind, str) else None
        if handler is None:
            await _reject(ctx.websocket, "unknown_type")
            continue

        try:
            await handler(ctx, frame)
        except ValidationError:
            await _reject(ctx.websocket, "invalid_frame")
        except PermissionError:
            await _reject(ctx.websocket, "conversation_not_found")
        except WebSocketDisconnect:
            raise
        except Exception:
            continue


async def _idle_watchdog(ctx: ConnectionContext) -> None:
    while True:
        await asyncio.sleep(15)
        if time.monotonic() - ctx.last_seen >= 60:
            await ctx.websocket.close(code=frames.CLOSE_IDLE_TIMEOUT)
            return


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    if not _origin_is_allowed(websocket.headers.get("origin")):
        await websocket.close(code=1008)
        return

    await websocket.accept()
    last_seen = time.monotonic()

    async with session_maker() as db:
        user = await authenticate_socket(websocket, db)
    if user is None:
        return

    remaining = registry.timeout_remaining(user.id)
    if remaining > 0:
        await websocket.send_json(
            {
                "type": frames.ERROR,
                "reason": "timed_out",
                "retry_after": round(remaining, 1),
            }
        )
        await websocket.close(code=frames.CLOSE_TIMED_OUT)
        return

    ctx = ConnectionContext(
        websocket=websocket,
        user=user,
        last_seen=last_seen,
        inbound_frames=SlidingWindow(frames.INBOUND_FRAME_WINDOW_SECONDS),
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
