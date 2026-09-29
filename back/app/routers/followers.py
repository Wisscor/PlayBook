import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus

from ..database.database import get_db
from ..models import User, Follower
from ..schemas.follower import FollowToggleResponse
from ..schemas.user import UserSummaryResponse
from ..core.deps import get_curr_user

router = APIRouter(
    prefix="/users",
    tags=["Followers"],
)


@router.post(
    "/{user_id}/follow",
    status_code=status.HTTP_201_CREATED,
    response_model=FollowToggleResponse,
)
async def follow_user(
    user_id: uuid.UUID,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Follow another user.
    Cannot follow oneself; returns 409 if already following.
    """
    if curr_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself.",
        )

    # Check if target user exists
    target_user = await db.scalar(select(User).where(User.id == user_id))
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Check if already following
    existing = await db.scalar(
        select(Follower).where(
            Follower.follower_id == curr_user.id,
            Follower.following_id == user_id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already following this user.",
        )

    new_follower = Follower(
        follower_id=curr_user.id,
        following_id=user_id,
    )
    db.add(new_follower)
    await db.commit()

    return FollowToggleResponse(following=True, user_id=user_id)


@router.delete(
    "/{user_id}/follow",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unfollow_user(
    user_id: uuid.UUID,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unfollow a user.
    Returns 204 No Content on success.
    """
    if curr_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot unfollow yourself.",
        )

    follower_edge = await db.scalar(
        select(Follower).where(
            Follower.follower_id == curr_user.id,
            Follower.following_id == user_id,
        )
    )
    if not follower_edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not following this user.",
        )

    await db.delete(follower_edge)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{user_id}/followers",
    status_code=status.HTTP_200_OK,
    response_model=List[UserSummaryResponse],
)
async def get_user_followers(
    user_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the list of users following the specified user.
    """
    target_user = await db.scalar(select(User).where(User.id == user_id))
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    query = (
        select(User)
        .join(Follower, Follower.follower_id == User.id)
        .where(Follower.following_id == user_id)
        .order_by(Follower.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.scalars(query)
    return result.all()


@router.get(
    "/{user_id}/following",
    status_code=status.HTTP_200_OK,
    response_model=List[UserSummaryResponse],
)
async def get_user_following(
    user_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the list of users the specified user is following.
    """
    target_user = await db.scalar(select(User).where(User.id == user_id))
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    query = (
        select(User)
        .join(Follower, Follower.following_id == User.id)
        .where(Follower.follower_id == user_id)
        .order_by(Follower.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.scalars(query)
    return result.all()
