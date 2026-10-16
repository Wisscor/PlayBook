import uuid
from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Query, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.models import User, Post, Like
from app.schemas.like import LikeToggleResponse
from app.schemas.user import UserSummaryResponse
from app.core.deps import get_curr_user
from app.realtime.notify import emit_notification

router = APIRouter(
    prefix="/posts",
    tags=["Likes"],
)


@router.post(
    "/{post_id}/like",
    status_code=status.HTTP_201_CREATED,
    response_model=LikeToggleResponse,
)
async def like_post(
    post_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Like a post. Returns 404 if post not found, 409 if already liked.
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    existing = await db.scalar(
        select(Like).where(
            Like.user_id == curr_user.id,
            Like.post_id == post_id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already liked this post.",
        )

    new_like = Like(
        user_id=curr_user.id,
        post_id=post_id,
    )
    db.add(new_like)
    await db.commit()
    background_tasks.add_task(
        emit_notification,
        event_type="like",
        actor_id=curr_user.id,
        target_user_id=post.user_id,
        target_id=post.id,
        target_type="post",
    )

    return LikeToggleResponse(liked=True, post_id=post_id)


@router.delete(
    "/{post_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlike_post(
    post_id: uuid.UUID,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a like from a post. Returns 404 if post or like not found.
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    existing = await db.scalar(
        select(Like).where(
            Like.user_id == curr_user.id,
            Like.post_id == post_id,
        )
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found.",
        )

    await db.delete(existing)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{post_id}/likes",
    response_model=List[UserSummaryResponse],
)
async def get_post_likes(
    post_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get users who liked a post with pagination.
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    stmt = (
        select(User)
        .join(Like, Like.user_id == User.id)
        .where(Like.post_id == post_id)
        .order_by(User.username.asc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.scalars(stmt)
    return result.all()
