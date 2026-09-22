from fastapi import (
    APIRouter,
    Depends,
    Cookie,
    HTTPException,
    status,
    Response,
)

from ..models import User

# #####
from ..db.database import get_db
from typing import Optional
from app.core.deps import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, or_
from app.core.config import settings
from http import HTTPStatus

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


import uuid

# GET	/users/{user_id}


@router.get(path="/{user_id}", status_code=HTTPStatus.OK)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    try:
        user_uuid: uuid.UUID = uuid.UUID(int=user_id)
    except Exception as e:
        raise HTTPException(HTTPStatus.BAD_REQUEST)
    
    users = await db.execute(select(User).where(User.id == user_uuid))
    user: Optional[User] = users.scalar_one_or_none()
    if not user:
        raise HTTPException(HTTPStatus.NOT_FOUND)
    return user

# PATCH	/users/me

# DELETE	/users/me

# GET	/users?search=
