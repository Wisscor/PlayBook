import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from fastapi import WebSocket, WebSocketDisconnect

from ..database.database import session_maker
from ..models.user import User
from . import delivery, frames, registry, service
from .limits import SlidingWindow
from .schemas import MessageRead, MessageSend


@dataclass
class ConnectionContext:
    websocket: WebSocket
    user: User
    last_seen: float
    inbound_frames: SlidingWindow
    sends: SlidingWindow
    strikes: SlidingWindow


async def handle_message_send(ctx: ConnectionContext, frame) -> None:
    now = time.monotonic()
    if ctx.sends.hit(now) > 10:
        await ctx.websocket.send_json(
            {"type": frames.ERROR, "reason": "rate_limited"}
        )
        if ctx.strikes.hit(now) >= 5:
            await registry.timeout_user(ctx.user.id)
            raise WebSocketDisconnect(code=frames.CLOSE_RATE_LIMIT)
        return

    data = MessageSend.model_validate(frame)
    async with session_maker() as db:
        result = await service.send_message(
            db, ctx.user.id, data.conversation_id, data.body
        )
    unreached = await delivery.deliver_message(result)
    if unreached:
        async with session_maker() as db:
            await service.create_pending_messages(db, unreached, result.id)


async def handle_read(ctx: ConnectionContext, frame) -> None:
    data = MessageRead.model_validate(frame)
    async with session_maker() as db:
        peer_ids = await service.mark_conversation_read(
            db, ctx.user.id, data.conversation_id, data.message_id
        )
    receipt = {
        "type": frames.READ,
        "user_id": str(ctx.user.id),
        "conversation_id": str(data.conversation_id),
        "message_id": str(data.message_id),
    }
    for peer_id in peer_ids:
        await registry.send_to_user(peer_id, receipt)


async def handle_ping(ctx: ConnectionContext, frame) -> None:
    await ctx.websocket.send_json({"type": frames.PONG})


HANDLERS: dict[str, Callable[[ConnectionContext, object], Awaitable[None]]] = {
    frames.MESSAGE_SEND: handle_message_send,
    frames.READ: handle_read,
    frames.PING: handle_ping,
}
