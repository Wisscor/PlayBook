from collections import defaultdict
from uuid import UUID
from fastapi import WebSocket
import time

from . import frames

_connections: dict[UUID, set[WebSocket]] = defaultdict(set)
_socket_sessions: dict[WebSocket, UUID] = {}

_timeouts: dict[UUID, float] = {}

def register(user_id: UUID, ws: WebSocket, session_id: UUID) -> None:
    _connections[user_id].add(ws)
    _socket_sessions[ws] = session_id

def unregister(user_id: UUID, ws: WebSocket) -> None:
    _socket_sessions.pop(ws, None)
    _connections[user_id].discard(ws)
    if not _connections[user_id]:
        del _connections[user_id]

def connections_for(user_id: UUID) -> set[WebSocket]:
    return set(_connections.get(user_id, ()))

def online_user_ids() -> set[UUID]:
    return set(_connections.keys())


async def close_user(user_id: UUID, *, session_id: UUID | None = None) -> None:
    for ws in connections_for(user_id):
        if session_id is not None and _socket_sessions.get(ws) != session_id:
            continue
        try:
            await ws.close(
                code=frames.CLOSE_SESSION_ENDED,
                reason="session ended",
            )
        except Exception:
            pass
        finally:
            unregister(user_id, ws)


async def send_to_user(user_id: UUID, payload: dict) -> int:
    reached = 0
    for ws in connections_for(user_id):
        try:
            await ws.send_json(payload)
            reached += 1
        except Exception:
            unregister(user_id, ws)
    return reached





async def timeout_user(user_id: UUID) -> None:
    _timeouts[user_id] = time.monotonic() + frames.RATE_LIMIT_TIMEOUT_SECONDS
    await send_to_user(user_id, {
        "type": frames.ERROR,
        "reason": "timed_out",
        "retry_after": frames.RATE_LIMIT_TIMEOUT_SECONDS,
    })


def is_timed_out(user_id: UUID) -> bool:
    expiry = _timeouts.get(user_id)
    if expiry is None:
        return False
    if time.monotonic() >= expiry:
        del _timeouts[user_id]
        return False
    return True


def timeout_remaining(user_id: UUID) -> float:
    expiry = _timeouts.get(user_id)
    if expiry is None:
        return 0.0
    remaining = expiry - time.monotonic()
    if remaining <= 0:
        del _timeouts[user_id]
        return 0.0
    return remaining


def sweep_timeouts() -> int:
    now = time.monotonic()
    expired = [uid for uid, expiry in _timeouts.items() if now >= expiry]
    for uid in expired:
        del _timeouts[uid]
    return len(expired)

