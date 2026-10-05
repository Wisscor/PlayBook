from dataclasses import dataclass

from fastapi import WebSocket

from ..models.user import User
from .limits import SlidingWindow


@dataclass
class ConnectionContext:
    websocket: WebSocket
    user: User
    last_seen: float
    sends: SlidingWindow
    strikes: SlidingWindow
