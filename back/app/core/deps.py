# `deps.py` file is for keep reusable dependencies in one place
from fastapi import (
    Depends,
    Cookie,
)
import uuid
from sqlalchemy import select
from ..database.database import get_db
from datetime import datetime, timezone
from ..models import User
from .config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from ..models import Session
from ..realtime import registry
from .exceptions import ApiException
from .error_codes import ErrorCode


async def get_curr_user(
    session_id: Optional[uuid.UUID] = Cookie(
        default=None, alias=settings.session_cookie_name
    ),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not session_id:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)
    sessions = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session: Optional[Session] = sessions.scalar_one_or_none()

    if not session:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)

    if session.expires_at <= datetime.now(timezone.utc):
        await db.delete(session)
        await db.commit()
        await registry.close_user(session.user_id)
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)
    users = await db.execute(select(User).where(User.id == session.user_id))
    user: Optional[User] = users.scalar_one_or_none()
    if not user:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)
    return user
