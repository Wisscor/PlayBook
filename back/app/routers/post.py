import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Response,
    Query,
    status,
    Request,
)
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus

from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import apaginate

from ..database.database import get_db
from ..models import (
    User,
    Post,
    Follower,
)
from app.schemas.post import PostCreate, PostResponse
from app.schemas.user import UserSummaryResponse
from app.core.deps import get_curr_user
from app.core.limiter import limiter
from app.realtime.notify import emit_notifications
from app.core.exceptions import ApiException
from app.core.error_codes import ErrorCode
from app.services.post_service import enrich_posts

router = APIRouter(
    tags=["Posts"],
)


@router.post(
    "/posts",
    status_code=status.HTTP_201_CREATED,
    response_model=PostResponse,
)
@limiter.limit("30/minute")
async def create_post(
    body: PostCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a caption-only post."""
    post = Post(
        user_id=curr_user.id,
        caption=body.caption,
    )
    db.add(post)
    await db.flush()
    follower_ids = (
        await db.scalars(
            select(Follower.follower_id).where(
                Follower.following_id == curr_user.id
            )
        )
    ).all()
    await db.commit()

    if follower_ids:
        background_tasks.add_task(
            emit_notifications,
            event_type="post_created",
            actor_id=curr_user.id,
            target_user_ids=follower_ids,
            target_id=post.id,
        )

    # Re-queries post with relationships
    # selectinload() == SELECT ... WHERE parent_id IN (...)
    stmt = (
        select(Post).where(Post.id == post.id).options(selectinload(Post.user))
    )
    loaded_post = await db.scalar(stmt)
    if loaded_post is None:
        raise ApiException(code=ErrorCode.POST_NOT_FOUND)
    enriched = await enrich_posts([loaded_post], curr_user, db)
    return enriched[0]


@router.get(
    "/feed",
    status_code=status.HTTP_200_OK,
    response_model=Page[PostResponse],
)
@limiter.limit("60/minute")
async def get_feed(
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """List recent posts from followed users."""
    following_subquery = select(Follower.following_id).where(
        Follower.follower_id == curr_user.id
    )
    stmt = (
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.user_id.in_(following_subquery))
        .order_by(Post.created_at.desc(), Post.id.desc())
    )

    async def _transform(rows):
        return await enrich_posts(rows, curr_user, db)

    return await apaginate(db, stmt, transformer=_transform)


@router.get(
    "/posts",
    status_code=status.HTTP_200_OK,
    response_model=Page[PostResponse],
)
@limiter.limit("60/minute")
async def list_posts(
    request: Request,
    user_id: Optional[uuid.UUID] = Query(default=None),
    curr_user: Optional[User] = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """List posts with optional author filtering."""
    stmt = (
        select(Post)
        .options(selectinload(Post.user))
        .order_by(Post.created_at.desc(), Post.id.desc())
    )

    if user_id:
        stmt = stmt.where(Post.user_id == user_id)

    async def _transform(rows):
        return await enrich_posts(rows, curr_user, db)

    return await apaginate(db, stmt, transformer=_transform)


@router.get(
    "/posts/{post_id}",
    status_code=status.HTTP_200_OK,
    response_model=PostResponse,
)
@limiter.limit("60/minute")
async def get_post(
    post_id: uuid.UUID,
    request: Request,
    curr_user: Optional[User] = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve one post by ID."""
    stmt = (
        select(Post).where(Post.id == post_id).options(selectinload(Post.user))
    )
    post = await db.scalar(stmt)
    if not post:
        raise ApiException(code=ErrorCode.POST_NOT_FOUND)

    enriched = await enrich_posts([post], curr_user, db)
    return enriched[0]


@router.delete(
    "/posts/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("10/minute")
async def delete_post(
    post_id: uuid.UUID,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a post owned by the current user."""
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise ApiException(code=ErrorCode.POST_NOT_FOUND)

    if post.user_id != curr_user.id:
        raise ApiException(code=ErrorCode.PERMISSION_DENIED)

    await db.delete(post)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
