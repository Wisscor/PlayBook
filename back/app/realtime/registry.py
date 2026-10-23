from collections import defaultdict
from uuid import UUID
from fastapi import WebSocket
import time

from . import frames

_connections: dict[UUID, set[WebSocket]] = defaultdict(set)

# Maps user_id → monotonic timestamp when the timeout expires.
_timeouts: dict[UUID, float] = {}

def register(user_id: UUID, ws: WebSocket) -> None:
    _connections[user_id].add(ws)

def unregister(user_id: UUID, ws: WebSocket) -> None:
    _connections[user_id].discard(ws)
    if not _connections[user_id]:
        del _connections[user_id]

def connections_for(user_id: UUID) -> set[WebSocket]:
    return set(_connections.get(user_id, ()))

def online_user_ids() -> set[UUID]:
    return set(_connections.keys())


async def close_user(user_id: UUID) -> None:
    for ws in connections_for(user_id):
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


# ── Timeout management ────────────────────────────────────────────

async def timeout_user(user_id: UUID) -> None:
    """Close every socket for *user_id* and put them in the timeout dict."""
    for ws in connections_for(user_id):
        try:
            await ws.close(
                code=frames.CLOSE_RATE_LIMIT,
                reason="rate limited – you are timed out",
            )
        except Exception:
            pass
        finally:
            unregister(user_id, ws)
    _timeouts[user_id] = time.monotonic() + frames.RATE_LIMIT_TIMEOUT_SECONDS


def is_timed_out(user_id: UUID) -> bool:
    """Return True if *user_id* is currently serving a timeout."""
    expiry = _timeouts.get(user_id)
    if expiry is None:
        return False
    if time.monotonic() >= expiry:
        # Timeout has expired – clean it up and let them in.
        del _timeouts[user_id]
        return False
    return True


def timeout_remaining(user_id: UUID) -> float:
    """Seconds left on the timeout, or 0 if not timed out."""
    expiry = _timeouts.get(user_id)
    if expiry is None:
        return 0.0
    remaining = expiry - time.monotonic()
    if remaining <= 0:
        del _timeouts[user_id]
        return 0.0
    return remaining


def sweep_timeouts() -> int:
    """Remove expired entries from the timeout dict. Returns count removed."""
    now = time.monotonic()
    expired = [uid for uid, expiry in _timeouts.items() if now >= expiry]
    for uid in expired:
        del _timeouts[uid]
    return len(expired)

