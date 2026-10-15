from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..models.session import Session
from ..models.user import User
from . import frames


async def authenticate_socket(
    websocket: WebSocket, db: AsyncSession
) -> Optional[User]:
    raw = websocket.cookies.get(settings.session_cookie_name)
    if not raw:
        await websocket.close(code=frames.CLOSE_AUTH_FAILED)
        return None

    try:
        session_id = UUID(raw)
    except ValueError:
        await websocket.close(code=frames.CLOSE_AUTH_FAILED)
        return None

    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        await websocket.close(code=frames.CLOSE_AUTH_FAILED)
        return None

    if session.expires_at <= datetime.now(timezone.utc):
        await websocket.close(code=frames.CLOSE_AUTH_FAILED)
        return None

    result = await db.execute(select(User).where(User.id == session.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        await websocket.close(code=frames.CLOSE_AUTH_FAILED)
        return None

    return user
