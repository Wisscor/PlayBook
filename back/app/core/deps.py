from uuid import UUID
from typing import Optional
from datetime import datetime, timezone

from fastapi import Depends, Cookie
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.database import get_db
from ..models import User, Session
from .config import settings
from ..realtime import registry
from .exceptions import ApiException
from .error_codes import ErrorCode


async def get_curr_user(
    session_id: Optional[UUID] = Cookie(
        default=None, alias=settings.session_cookie_name
    ),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not session_id:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)
    session = await db.scalar(select(Session).where(Session.id == session_id))

    if not session:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)

    if session.expires_at <= datetime.now(timezone.utc):
        await db.delete(session)
        await db.commit()
        await registry.close_user(session.user_id, session_id=session.id)
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)

    user = await db.scalar(select(User).where(User.id == session.user_id))
    if not user:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)
    return user


async def get_curr_session(
    cookie_session_id: Optional[UUID] = Cookie(
        default=None, alias=settings.session_cookie_name
    ),
    db: AsyncSession = Depends(get_db),
) -> Session:
    if not cookie_session_id:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)

    session = await db.scalar(
        select(Session).where(Session.id == cookie_session_id)
    )
    if not session:
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)

    if session.expires_at <= datetime.now(timezone.utc):
        await db.delete(session)
        await db.commit()
        await registry.close_user(session.user_id, session_id=session.id)
        raise ApiException(code=ErrorCode.AUTHENTICATION_REQUIRED)

    return session
