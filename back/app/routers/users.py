from fastapi import (
    APIRouter,
    Depends,
    Cookie,
    HTTPException,
    status,
    Response,
)
from ..models import User
from ..schemas.user import UserUpdate, UserResponse

# #####
from ..database.database import get_db
from typing import Optional
from app.core.deps import get_curr_user
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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


# Full Replacement
# PUT users/me
@router.patch(
    path="/me",
    status_code=HTTPStatus.OK,
    response_model=UserResponse,
)
async def update(
    data: UserUpdate,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # print(f"{Fore.YELLOW}`{key}` to `{value}`{Fore.RESET}")
        setattr(curr_user, key, value)

    # Commit the changes to the database
    await db.commit()
    await db.refresh(curr_user)
    return curr_user


# Partial Modification
# PATCH	/users/me


# DELETE	/users/me
# @router.delete(path="/users/me", status_code=HTTPStatus.NO_CONTENT)
@router.delete(path="/users/me", status_code=HTTPStatus.OK)
async def delete_user(
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    await db.delete(curr_user)
    await db.commit()
    # response = Response(status_code=HTTPStatus.NO_CONTENT)
    return Response()


# GET	/users?search=
