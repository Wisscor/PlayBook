import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.error_codes import ErrorCode
from ..core.exceptions import ApiException
from ..models import Follower, User


async def create_follow_relationship(
    db: AsyncSession,
    follower_id: uuid.UUID,
    following_id: uuid.UUID,
) -> None:
    """Create a follow edge unless it already exists."""
    existing = await db.scalar(
        select(Follower).where(
            Follower.follower_id == follower_id,
            Follower.following_id == following_id,
        )
    )
    if existing:
        raise ApiException(code=ErrorCode.ALREADY_FOLLOWING)

    db.add(
        Follower(
            follower_id=follower_id,
            following_id=following_id,
        )
    )
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ApiException(code=ErrorCode.ALREADY_FOLLOWING)


async def remove_follow_relationship(
    db: AsyncSession,
    follower_id: uuid.UUID,
    following_id: uuid.UUID,
) -> None:
    """Remove a follow edge when it exists."""
    follower_edge = await db.scalar(
        select(Follower).where(
            Follower.follower_id == follower_id,
            Follower.following_id == following_id,
        )
    )
    if not follower_edge:
        raise ApiException(code=ErrorCode.FOLLOW_NOT_FOUND)

    await db.delete(follower_edge)
    await db.commit()


def followers_query(user_id: uuid.UUID):
    """Build the query for users following the given user."""
    return (
        select(User)
        .join(Follower, Follower.follower_id == User.id)
        .where(Follower.following_id == user_id)
        .order_by(Follower.created_at.desc())
    )


def following_query(user_id: uuid.UUID):
    """Build the query for users followed by the given user."""
    return (
        select(User)
        .join(Follower, Follower.following_id == User.id)
        .where(Follower.follower_id == user_id)
        .order_by(Follower.created_at.desc())
    )
