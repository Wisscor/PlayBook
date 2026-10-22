import uuid
from collections.abc import Sequence
from typing import Optional, List
from datetime import datetime
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Query,
    status,
    Request,
)
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus

from ..database.database import get_db
from ..models import (
    User,
    Post,
    Follower,
)
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostPage
from app.schemas.user import UserSummaryResponse
from app.core.deps import get_curr_user
from app.core.limiter import limiter

router = APIRouter(
    tags=["Posts"],
)


async def _enrich_posts(
    posts: Sequence[Post],
    curr_user: Optional[User],
    db: AsyncSession,
) -> List[PostResponse]:
    """Build post responses with their author."""
    if not posts:
        return []

    # Construct PostResponse objects
    responses = []
    for p in posts:
        user_summary = None
        if p.user:
            user_summary = UserSummaryResponse(
                id=p.user.id,
                username=p.user.username,
                firstname=p.user.firstname,
                lastname=p.user.lastname,
                avatar=p.user.avatar,
            )

        resp = PostResponse(
            id=p.id,
            user_id=p.user_id,
            author=user_summary,
            caption=p.caption,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        responses.append(resp)

    return responses


@router.post(
    "/posts",
    status_code=status.HTTP_201_CREATED,
    response_model=PostResponse,
)
@limiter.limit("30/minute")
async def create_post(
    body: PostCreate,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new post.
    Accepts a caption.
    """
    post = Post(
        user_id=curr_user.id,
        caption=body.caption,
    )
    db.add(post)
    await db.commit()

    # Re-queries post with relationships
    # selectinload() == SELECT ... WHERE parent_id IN (...)
    stmt = (
        select(Post).where(Post.id == post.id).options(selectinload(Post.user))
    )
    loaded_post = await db.scalar(stmt)
    if loaded_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )
    enriched = await _enrich_posts([loaded_post], curr_user, db)
    return enriched[0]


@router.get(
    "/feed",
    status_code=status.HTTP_200_OK,
    response_model=PostPage,
)
@router.get(
    "/posts/feed",
    status_code=status.HTTP_200_OK,
    response_model=PostPage,
    include_in_schema=False,
)
@limiter.limit("60/minute")
async def get_feed(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Posts from people I follow plus mine (newest first).
    """
    following_subquery = select(Follower.following_id).where(
        Follower.follower_id == curr_user.id
    )
    stmt = (
        select(Post)
        .options(selectinload(Post.user))
        .where(
            or_(
                Post.user_id.in_(following_subquery),
                Post.user_id == curr_user.id,
            )
        )
        .order_by(Post.created_at.desc(), Post.id.desc())
    )
    rows = list((await db.scalars(stmt.offset(offset).limit(limit + 1))).all())
    next_offset = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_offset = offset + limit

    enriched = await _enrich_posts(rows, curr_user, db)
    return PostPage(items=enriched, next_offset=next_offset)


@router.get(
    "/posts",
    status_code=status.HTTP_200_OK,
    response_model=List[PostResponse],
)
@limiter.limit("60/minute")
async def list_posts(
    request: Request,
    user_id: Optional[uuid.UUID] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    curr_user: Optional[User] = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Feed of posts with filtering by post_type ('post' or 'event_callout'),
    sport tag, and author user_id.
    """
    stmt = (
        select(Post)
        .options(selectinload(Post.user))
        .order_by(Post.created_at.desc())
    )

    if user_id:
        stmt = stmt.where(Post.user_id == user_id)

    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    posts = res.scalars().all()
    return await _enrich_posts(posts, curr_user, db)


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
    """
    Retrieve a single post by ID.
    """
    stmt = (
        select(Post).where(Post.id == post_id).options(selectinload(Post.user))
    )
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    enriched = await _enrich_posts([post], curr_user, db)
    return enriched[0]


@router.patch(
    "/posts/{post_id}",
    status_code=status.HTTP_200_OK,
    response_model=PostResponse,
)
@limiter.limit("30/minute")
async def update_post(
    post_id: uuid.UUID,
    data: PostUpdate,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update post caption.
    Only the author can update their post.
    """
    stmt = (
        select(Post).where(Post.id == post_id).options(selectinload(Post.user))
    )
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    if post.user_id != curr_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this post.",
        )

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(post, key, value)

    await db.commit()
    await db.refresh(post)

    enriched = await _enrich_posts([post], curr_user, db)
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
    """
    Delete a post.
    Only the author can delete their post.
    """
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    if post.user_id != curr_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this post.",
        )

    await db.delete(post)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
