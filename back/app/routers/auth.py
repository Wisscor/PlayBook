from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import User
from ..db.database import get_async_session
from sqlalchemy.exc import IntegrityError

from ..core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

from jose import jwt, JWTError


from .deps import get_current_user

SECRET_KEY = "your_secret"
ALGORITHM = "HS256"


from ..schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenPair,
    RefreshRequest,
)

# `tags` its for OpenAPI docs
router = APIRouter(
    prefix="/auth",
    tags=["Auth`hh`"],
)


# POST /auth/register
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_session),
) -> User:

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
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
@router.post("/login", response_model=TokenPair)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(User).where(User.username == form.username)
    )
    user: None | User = result.scalar_one_or_none()
    if user is None or not verify_password(
        form.password, str(user.hashed_password)
    ):
        raise HTTPException(
            status_code=401, detail="Invalid username or password"
        )
    return TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# GET /auth/me
# * the dependency runs on every request, validates the token,
# * fetches the user, and hands it to your route.
@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
