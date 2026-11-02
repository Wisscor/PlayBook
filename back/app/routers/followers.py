import uuid
from typing import Optional, List
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    status,
    Response,
    Request,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import apaginate

from ..database.database import get_db
from ..models import User, Follower
from ..schemas.follower import FollowToggleResponse
from ..schemas.user import UserSummaryResponse
from ..core.deps import get_curr_user
from ..realtime.notify import emit_notification
from app.core.limiter import limiter
from app.core.exceptions import ApiException
from app.core.error_codes import ErrorCode
from app.services.user_service import get_user_by_id
from app.services.follower_service import create_follow_relationship, remove_follow_relationship

router = APIRouter(
    prefix="/users",
    tags=["Followers"],
)


@router.post(
    "/{user_id}/follow",
    status_code=status.HTTP_201_CREATED,
    response_model=FollowToggleResponse,
)
@limiter.limit("30/minute")
async def follow_user(
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Follow another user."""
    if curr_user.id == user_id:
        raise ApiException(code=ErrorCode.CANNOT_FOLLOW_SELF, field="user_id")

    target_user = await get_user_by_id(db, user_id)
    if not target_user:
        raise ApiException(code=ErrorCode.USER_NOT_FOUND)

    await create_follow_relationship(db, curr_user.id, user_id)
    background_tasks.add_task(
        emit_notification,
        event_type="follow",
        actor_id=curr_user.id,
        target_user_id=user_id,
    )

    return FollowToggleResponse(following=True, user_id=user_id)


@router.delete(
    "/{user_id}/follow",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("30/minute")
async def unfollow_user(
    user_id: uuid.UUID,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Unfollow another user."""
    if curr_user.id == user_id:
        raise ApiException(
            code=ErrorCode.CANNOT_UNFOLLOW_SELF,
            field="user_id",
        )

    await remove_follow_relationship(db, curr_user.id, user_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{user_id}/followers",
    status_code=status.HTTP_200_OK,
    response_model=Page[UserSummaryResponse],
)
@limiter.limit("60/minute")
async def get_user_followers(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """List a user's followers."""
    target_user = await get_user_by_id(db, user_id)
    if not target_user:
        raise ApiException(code=ErrorCode.USER_NOT_FOUND)

    stmt = (
        select(User)
        .join(Follower, Follower.follower_id == User.id)
        .where(Follower.following_id == user_id)
        .order_by(Follower.created_at.desc())
    )
    return await apaginate(
        db,
        stmt,
        transformer=lambda rows: [
            UserSummaryResponse.model_validate(r) for r in rows
        ],
    )


@router.get(
    "/{user_id}/following",
    status_code=status.HTTP_200_OK,
    response_model=Page[UserSummaryResponse],
)
@limiter.limit("60/minute")
async def get_user_following(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """List users followed by a user."""
    target_user = await get_user_by_id(db, user_id)
    if not target_user:
        raise ApiException(code=ErrorCode.USER_NOT_FOUND)

    stmt = (
        select(User)
        .join(Follower, Follower.following_id == User.id)
        .where(Follower.follower_id == user_id)
        .order_by(Follower.created_at.desc())
    )
    return await apaginate(
        db,
        stmt,
        transformer=lambda rows: [
            UserSummaryResponse.model_validate(r) for r in rows
        ],
    )
