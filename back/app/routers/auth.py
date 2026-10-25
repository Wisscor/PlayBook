from fastapi import (
    APIRouter,
    Depends,
    Cookie,
    HTTPException,
    status,
    Response,
    Request,
)

import uuid
from sqlalchemy import select
from ..models import Session, User
from ..database.database import get_db
from sqlalchemy.exc import IntegrityError

# #####
from typing import Optional
from app.core.deps import get_curr_user
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from datetime import datetime, timedelta, timezone
from ..schemas.user import UserCreate, UserLogin, UserProfileResponse
from ..core.security import hash_password, verify_password
from .users import build_user_profile
from app.core.config import settings
from app.realtime import registry
from app.core.limiter import limiter

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
    # Create user instance
    user = User(
        firstname=data.firstname,
        lastname=data.lastname,
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        avatar=data.avatar,
        bio=data.bio,
    )
    # Add the user to the database and commit the transaction
    # Handle potential IntegrityError if the username or email already exists
    try:
        db.add(user)
        await db.commit()
        await db.refresh(user)
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="A user with this username or email already exists.",
        )
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
    # 1. Find user by email
    users = await db.execute(select(User).where(User.email == data.email))
    user: Optional[User] = users.scalar_one_or_none()
    if user is None or not verify_password(
        data.password,
        str(user.hashed_password),
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # 2. Create 'session' and Store it
    new_session = Session(
        id=uuid.uuid4(),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.session_expire_days),
    )
    db.add(new_session)
    await db.commit()

    # 3. Set cookie in the response
    response.set_cookie(
        key=settings.session_cookie_name,
        value=str(new_session.id),
        max_age=settings.session_expire_days * 24 * 60 * 60,  # To seconds
        secure=settings.session_cookie_secure,
        httponly=settings.session_cookie_http_only,
        samesite=settings.session_cookie_same_site,
    )
    return await build_user_profile(db, user, user)


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format",
        )
    sessions = await db.execute(
        select(Session).where(Session.id == session_uuid)
    )
    session: Optional[Session] = sessions.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )
    # Delete the session from the database
    await db.delete(session)
    await db.commit()
    await registry.close_user(session.user_id)
    await registry.close_user(session.user_id)
    response.delete_cookie(
        key=settings.session_cookie_name,
    )
    return {"message": "Logout successful"}


@router.get("/me", response_model=UserProfileResponse)
@limiter.limit("60/minute")
async def read_current_user(
    request: Request,
    current_user: User = Depends(get_curr_user),
):
    """Return the authenticated user's profile."""
    return current_user
