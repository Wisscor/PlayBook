import uuid
from typing import List, Optional
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
    Query,
    Response,
    Request,
)
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.models import User, Post, Comment
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.core.deps import get_curr_user
from app.realtime.notify import emit_notification
from app.core.limiter import limiter

router = APIRouter(
    tags=["Comments"],
)


@router.post(
    "/posts/{post_id}/comments",
    status_code=status.HTTP_201_CREATED,
    response_model=CommentResponse,
)
@limiter.limit("30/minute")
async def create_comment(
    post_id: uuid.UUID,
    data: CommentCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a comment or reply to a post.
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    parent = None
    if data.comment_reply_to_id:
        parent = await db.scalar(
            select(Comment).where(Comment.id == data.comment_reply_to_id)
        )
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found.",
            )
        if parent.post_id != post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment does not belong to this post.",
            )

    new_comment = Comment(
        post_id=post_id,
        user_id=curr_user.id,
        content=data.content,
        comment_reply_to_id=data.comment_reply_to_id,
    )
    db.add(new_comment)
    await db.commit()
    background_tasks.add_task(
        emit_notification,
        event_type="reply" if parent else "comment",
        actor_id=curr_user.id,
        target_user_id=parent.user_id if parent else post.user_id,
        target_id=post.id,
    )

    stmt = (
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.id == new_comment.id)
    )
    loaded_comment = await db.scalar(stmt)
    return loaded_comment


@router.get(
    "/posts/{post_id}/comments",
    response_model=List[CommentResponse],
)
@limiter.limit("60/minute")
async def get_post_comments(
    post_id: uuid.UUID,
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all comments for a post, ordered chronologically.
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    stmt = (
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.scalars(stmt)
    return result.all()


@router.patch(
    "/comments/{comment_id}",
    response_model=CommentResponse,
)
@router.put(
    "/comments/{comment_id}",
    response_model=CommentResponse,
)
@limiter.limit("30/minute")
async def update_comment(
    comment_id: uuid.UUID,
    data: CommentUpdate,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a comment. Only the author can update their comment.
    """
    stmt = (
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.id == comment_id)
    )
    comment = await db.scalar(stmt)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    if comment.user_id != curr_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this comment.",
        )

    comment.content = data.content
    await db.commit()
    await db.refresh(comment)
    return comment


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("10/minute")
async def delete_comment(
    comment_id: uuid.UUID,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a comment.
    Allowed if user is author of the comment OR author of the post.
    """
    stmt = (
        select(Comment)
        .options(selectinload(Comment.post))
        .where(Comment.id == comment_id)
    )
    comment = await db.scalar(stmt)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    is_comment_author = comment.user_id == curr_user.id
    is_post_author = (
        comment.post is not None and comment.post.user_id == curr_user.id
    )

    if not (is_comment_author or is_post_author):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this comment.",
        )

    await db.delete(comment)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
