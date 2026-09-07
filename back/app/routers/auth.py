from fastapi import (
    APIRouter,
    Depends,
    Cookie,
    HTTPException,
    status,
    Response,
)

import uuid
from sqlalchemy import select, or_
from ..models import User
from ..db.database import get_async_session
from sqlalchemy.exc import IntegrityError

# #####
from typing import Optional
from app.core.deps import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from ..models.session import Session
from datetime import datetime, timedelta, timezone
from ..schemas.user import UserSigup, UserLogin, UserResponse
from ..core.security import hash_password, verify_password
from app.core.config import settings

# `tags` its for OpenAPI docs
router = APIRouter(
    prefix="/auth",
    tags=["Auuthentication"],
)


# POST /auth/signup
@router.post("/signup", response_model=UserResponse)
async def signup(
    data: UserSigup,
    db: AsyncSession = Depends(get_async_session),
) -> User:
    # Create user instance
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
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


# POST /auth/login
@router.post("/login")
async def login(
    data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_async_session),
):
    # 1. Find user by 'username' or 'email'
    users = await db.execute(
        select(User).where(
            # or_(
            #     User.username == data.username_or_email,
            #     User.email == data.username_or_email,
            # )
            User.username
            == data.username_or_email
        )
    )
    user: Optional[User] = users.scalar_one_or_none()
    if user is None or not verify_password(
        data.password,
        str(user.hashed_password),
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username/email or password",
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
    # return {"message": "Login successful",}
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
        },
    }


# POST /logout
@router.post("/logout")
async def logout(
    response: Response,
    session_id: Optional[str] = Cookie(
        default=None,
        alias=settings.session_cookie_name,
    ),
    db: AsyncSession = Depends(get_async_session),
):
    if session_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    sessions = db.execute(select(Session).where(Session.id == session_id))
    session: Optional[Session] = sessions.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )
    # Delete the session from the database
    await db.delete(session)
    await db.commit()
    response.delete_cookie(
        key=settings.session_cookie_name,
    )
    return {"message": "Logout successful"}


# GET /auth/me
# * the dependency runs on every request, validates the token,
# * fetches the user, and hands it to your route.
@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user),
):
    # return current_user
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "bio": current_user.bio,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
    }
