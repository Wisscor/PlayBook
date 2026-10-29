import uuid
from typing import Optional

from pydantic import EmailStr
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Follower, Post, User
from ..realtime import registry
from ..realtime.services.conversations import delete_user_conversations
from ..schemas.user import UserProfileResponse
from .avatar_service import remove_avatar


async def get_user_by_email(
    db: AsyncSession,
    email: EmailStr,
) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return (await db.execute(statement)).scalar_one_or_none()


async def get_user_by_username(
    db: AsyncSession,
    username: str,
) -> Optional[User]:
    statement = select(User).where(User.username == username)
    return (await db.execute(statement)).scalar_one_or_none()


async def get_user_by_id(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> Optional[User]:
    statement = select(User).where(User.id == user_id)
    return (await db.execute(statement)).scalar_one_or_none()


async def load_user_profile(
    db: AsyncSession,
    target_user: User,
    current_user: User,
) -> UserProfileResponse:
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

    is_following = None
    if current_user.id != target_user.id:
        following_edge = await db.scalar(
            select(Follower).where(
                and_(
                    Follower.follower_id == current_user.id,
                    Follower.following_id == target_user.id,
                )
            )
        )
        is_following = following_edge is not None

    profile = UserProfileResponse.model_validate(target_user)
    profile.followers_count = followers_count
    profile.following_count = following_count
    profile.posts_count = posts_count
    profile.is_following = is_following
    return profile


async def delete_user_account(db: AsyncSession, user: User) -> None:
    avatar_path = user.avatar
    await delete_user_conversations(db, user.id)
    await db.delete(user)
    await db.commit()
    await registry.close_user(user.id)
    if avatar_path and avatar_path.startswith("uploads/"):
        remove_avatar(avatar_path)
