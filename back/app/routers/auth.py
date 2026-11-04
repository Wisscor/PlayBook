from fastapi import (
    APIRouter,
    Depends,
    Cookie,
    Response,
    Request,
)

import uuid
from sqlalchemy import delete, select
from ..models import Session, User
from ..database.database import get_db
from sqlalchemy.exc import IntegrityError
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from ..schemas.user import UserCreate, UserLogin, UserProfileResponse
from ..schemas.session import SessionResponse
from ..core.security import hash_password, verify_password
from app.core.config import settings
from app.realtime import registry
from app.core.limiter import limiter
from app.core.deps import get_curr_session
from app.services.session_service import create_session_service
from app.services.user_service import (
    get_user_by_email,
    get_user_by_username,
    load_user_profile,
)

from app.core.exceptions import ApiException
from app.core.error_codes import ErrorCode

router = APIRouter(
    prefix="/auth",
    tags=["Auuthentication"],
)


@router.post("/signup", response_model=UserProfileResponse)
@limiter.limit("5/minute")
async def signup(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Create a user account."""

    user = User(
        firstname=data.firstname,
        lastname=data.lastname,
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )

    if await get_user_by_email(db, data.email):
        raise ApiException(
            code=ErrorCode.EMAIL_ALREADY_EXISTS,
            field="email",
        )

    if await get_user_by_username(db, data.username):
        raise ApiException(
            code=ErrorCode.USERNAME_ALREADY_EXISTS,
            field="username",
        )
    try:
        db.add(user)
        await db.commit()
        await db.refresh(user)
    except IntegrityError:
        await db.rollback()
        raise ApiException(code=ErrorCode.RESOURCE_CONFLICT)

    return user


@router.post("/login", response_model=UserProfileResponse)
@limiter.limit("10/minute")
async def login(
    data: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with email and password."""
    user: Optional[User] = await get_user_by_email(db, data.email)
    if not user:
        raise ApiException(
            code=ErrorCode.INVALID_CREDENTIALS,
            field="email",
            message="Email not found.",
        )
    if not verify_password(
        data.password,
        user.hashed_password,
    ):
        raise ApiException(
            code=ErrorCode.INVALID_CREDENTIALS,
            field="password",
            message="Incorrect password.",
        )

    new_session = await create_session_service(db, user.id, request)

    response.set_cookie(
        key=settings.session_cookie_name,
        value=str(new_session.id),
        max_age=settings.session_expire_days * 24 * 60 * 60,
        secure=settings.session_cookie_secure,
        httponly=settings.session_cookie_http_only,
        samesite=settings.session_cookie_same_site,
    )
    return await load_user_profile(db, user, user)


@router.get("/sessions", response_model=list[SessionResponse])
@limiter.limit("20/minute")
async def get_all_sessions(
    request: Request,
    current_session: Session = Depends(get_curr_session),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Session)
        .where(
            Session.user_id == current_session.user_id,
            Session.expires_at > datetime.now(timezone.utc),
        )
        .order_by(Session.created_at.desc())
    )
    sessions = (await db.scalars(stmt)).all()
    return [
        SessionResponse(
            id=session.id,
            expires_at=session.expires_at,
            created_at=session.created_at,
            ip_address=session.ip_address,
            platform=session.platform,
            browser=session.browser,
            user_agent=session.user_agent,
            is_current=session.id == current_session.id,
        )
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
@limiter.limit("20/minute")
async def delete_session(
    session_id: uuid.UUID,
    request: Request,
    response: Response,
    current_session: Session = Depends(get_curr_session),
    db: AsyncSession = Depends(get_db),
):
    """Delete a specific session."""
    session = await db.get(Session, session_id)
    if not session:
        raise ApiException(
            code=ErrorCode.SESSION_NOT_FOUND,
            field="session_id",
        )
    if session.user_id != current_session.user_id:
        raise ApiException(
            code=ErrorCode.PERMISSION_DENIED,
            field="session_id",
        )
    await db.delete(session)
    await db.commit()
    await registry.close_user(session.user_id, session_id=session.id)
    if session.id == current_session.id:
        response.delete_cookie(
            key=settings.session_cookie_name,
            path="/",
        )
    return {"message": "Session deleted successfully."}


@router.delete("/sessions")
@limiter.limit("20/minute")
async def delete_all_session(
    request: Request,
    response: Response,
    current_session: Session = Depends(get_curr_session),
    db: AsyncSession = Depends(get_db),
):
    """Delete all sessions for the current user."""
    await db.execute(
        delete(Session).where(Session.user_id == current_session.user_id)
    )
    await db.commit()
    await registry.close_user(current_session.user_id)
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
    )
    return {"message": "All sessions deleted successfully."}


@router.post("/logout")
@limiter.limit("20/minute")
async def logout(
    request: Request,
    response: Response,
    session_id: Optional[str] = Cookie(
        default=None,
        alias=settings.session_cookie_name,
    ),
    db: AsyncSession = Depends(get_db),
):
    """End the current session."""
    if session_id is None:
        raise ApiException(
            code=ErrorCode.AUTHENTICATION_REQUIRED,
            field="session_id",
        )

    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise ApiException(
            code=ErrorCode.INVALID_SESSION_ID_FORMAT,
            field="session_id",
        )
    session: Optional[Session] = (
        await db.execute(select(Session).where(Session.id == session_uuid))
    ).scalar_one_or_none()

    if session is None:
        raise ApiException(
            code=ErrorCode.AUTHENTICATION_REQUIRED,
            field="session_id",
        )
    # Delete the session from the database
    await db.delete(session)
    await db.commit()
    await registry.close_user(session.user_id, session_id=session.id)
    response.delete_cookie(
        key=settings.session_cookie_name,
    )
    return {"message": "Logout successful"}
