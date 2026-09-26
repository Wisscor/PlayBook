# `deps.py` file is for keep reusable dependencies in one place
from fastapi import (
    Depends,
    Cookie,
    HTTPException,
    status,
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


async def get_curr_user(
    session_id: Optional[uuid.UUID] = Cookie(
        default=None, alias=settings.session_cookie_name
    ),
    db: AsyncSession = Depends(get_db),
) -> User:  # ???
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    # Find the session
    sessions = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session: Optional[Session] = sessions.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )

    # Check expiration
    if session.expires_at <= datetime.now(timezone.utc):
        await db.delete(session)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )
    # Find the user associated with the session
    users = await db.execute(select(User).where(User.id == session.user_id))
    user: Optional[User] = users.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
