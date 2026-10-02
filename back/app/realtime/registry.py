from collections import defaultdict
from uuid import UUID
from fastapi import WebSocket

_connections: dict[UUID, set[WebSocket]] = defaultdict(set)

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


async def send_to_user(user_id: UUID, payload: dict) -> int:
    reached = 0
    for ws in connections_for(user_id):
        try:
            await ws.send_json(payload)
            reached += 1
        except Exception:
            unregister(user_id, ws)
    return reached
