from fastapi import (
    APIRouter,
    Depends,
    Cookie,
    Response,
    Request,
)

import uuid
from sqlalchemy import select
from ..models import Session, User
from ..database.database import get_db
from sqlalchemy.exc import IntegrityError

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from ..schemas.user import UserCreate, UserLogin, UserProfileResponse
from ..core.security import hash_password, verify_password
from app.core.config import settings
from app.realtime import registry
from app.core.limiter import limiter
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

    # Create 'session' and Store it
    new_session = Session(
        id=uuid.uuid4(),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.session_expire_days),
    )
    db.add(new_session)
    await db.commit()

    # Set cookie in the response
    response.set_cookie(
        key=settings.session_cookie_name,
        value=str(new_session.id),
        max_age=settings.session_expire_days * 24 * 60 * 60,  # To seconds
        secure=settings.session_cookie_secure,
        httponly=settings.session_cookie_http_only,
        samesite=settings.session_cookie_same_site,
    )
    return await load_user_profile(db, user, user)


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
    await registry.close_user(session.user_id)
    response.delete_cookie(
        key=settings.session_cookie_name,
    )
    return {"message": "Logout successful"}
