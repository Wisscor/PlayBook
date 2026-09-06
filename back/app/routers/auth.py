from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import User
from ..database import get_async_session
from ..security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

from jose import jwt, JWTError

# import jwt
# from passlib.context import CryptContext

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


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_session),
) -> User:
    existing_user = await db.execute(
        select(User).where(
            (User.username == user_data.username)
            | (User.email == user_data.username)
        )
    )
    if existing_user.one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A user with this username or email already exists.",
        )
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user  # ! SEEEE MEEEE
    # return UserResponse(
    #     id=user.id,
    #     username=user.username,
    #     email=user.email,
    # )


@router.post("/login", response_model=TokenPair)
async def login(
    form: OAuth2PasswordRequestForm,
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(User).where(User.username == form.username)
    )
    user: None | User = result.scalar_one_or_none()
    if not user or verify_password(form.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=401, detail="Invalid username or password"
        )
    return TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/me")
async def me():
    pass


# POST /auth/register
# POST /auth/login
# GET /auth/me
