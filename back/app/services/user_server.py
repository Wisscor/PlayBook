import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from ..models import User, Follower, Post
from pydantic import EmailStr
from ..schemas.user import UserProfileResponse


async def get_user_by_email(
    db: AsyncSession,
    email: EmailStr,
) -> Optional[User]:
    stmt = select(User).where(User.email == email)
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_user_by_username(
    db: AsyncSession,
    username: str,
) -> Optional[User]:
    stmt = select(User).where(User.username == username)
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_user_by_id(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> Optional[User]:
    stmt = select(User).where(User.id == user_id)
    return (await db.execute(stmt)).scalar_one_or_none()


async def build_user_profile(
    db: AsyncSession,
    target_user: User,
    curr_user: User,
) -> UserProfileResponse:
    """Build a UserProfileResponse from a User model.

    If viewer_id is None (e.g. /me), is_following is set to None.
    """
    followers_count = (
        await db.scalar(
            select(func.count())
            .select_from(Follower)
            .where(Follower.following_id == target_user.id)
        )
        or 0
    )

    following_count = (
        await db.scalar(
            select(func.count())
            .select_from(Follower)
            .where(Follower.follower_id == target_user.id)
        )
        or 0
    )

    posts_count = (
        await db.scalar(
            select(func.count())
            .select_from(Post)
            .where(Post.user_id == target_user.id)
        )
        or 0
    )

    # Determine if the viewer (current user) is following the target user
    is_following: Optional[bool] = None
    if curr_user.id != target_user.id:
        is_following_edge = await db.scalar(
            select(Follower).where(
                and_(
                    Follower.follower_id == curr_user.id,
                    Follower.following_id == target_user.id,
                )
            )
        )
        is_following = is_following_edge is not None

    profile = UserProfileResponse.model_validate(target_user)
    profile.followers_count = followers_count
    profile.following_count = following_count
    profile.posts_count = posts_count
    profile.is_following = is_following
    return profile
