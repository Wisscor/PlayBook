import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Query,
    status,
)
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus

from ..database.database import get_db
from ..models import (
    User,
    Post,
    PostMedia,
    Like,
    Comment,
)
from ..models.post import PostTypeEnum
from ..schemas.post import PostCreate, PostUpdate, PostResponse
from ..schemas.user import UserSummaryResponse
from ..schemas.post_media import PostMediaResponse
from app.core.deps import get_curr_user

router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
)


async def _enrich_posts(
    posts: List[Post],
    curr_user: Optional[User],
    db: AsyncSession,
) -> List[PostResponse]:
    """
    Helper to efficiently batch-load likes_count, comments_count,
    and is_liked_by_me for a list of posts without N+1 queries.
    """
    if not posts:
        return []

    post_ids = [p.id for p in posts]

    # 1. Batch load likes count
    likes_res = await db.execute(
        select(Like.post_id, func.count(Like.user_id))
        .where(Like.post_id.in_(post_ids))
        .group_by(Like.post_id)
    )
    likes_map: dict = dict(likes_res.all())

    # 2. Batch load comments count
    comments_res = await db.execute(
        select(Comment.post_id, func.count(Comment.id))
        .where(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id)
    )
    comments_map = dict(comments_res.all())

    # 3. Batch check if liked by current user
    user_liked_set = set()
    if curr_user:
        user_likes_res = await db.execute(
            select(Like.post_id).where(
                Like.post_id.in_(post_ids),
                Like.user_id == curr_user.id,
            )
        )
        user_liked_set = set(user_likes_res.scalars().all())

    # 4. Construct PostResponse objects
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

        media_items = [
            PostMediaResponse(
                id=m.id,
                post_id=m.post_id,
                media_url=m.media_url,
                media_type=m.media_type,
                position=m.position,
            )
            for m in (p.media or [])
        ]

        resp = PostResponse(
            id=p.id,
            user_id=p.user_id,
            user=user_summary,
            caption=p.caption,
            post_type=p.post_type,
            sport=p.sport,
            location=p.location,
            event_date=p.event_date,
            media=media_items,
            likes_count=likes_map.get(p.id, 0),
            comments_count=comments_map.get(p.id, 0),
            is_liked_by_me=p.id in user_liked_set,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        responses.append(resp)

    return responses


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=PostResponse,
)
async def create_post(
    data: PostCreate,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new post or event callout.
    Accepts caption, post_type, optional sport/location/event_date,
    and an optional list of media items.
    """
    post = Post(
        user_id=curr_user.id,
        caption=data.caption,
        post_type=data.post_type,
        sport=data.sport,
        location=data.location,
        event_date=data.event_date,
    )
    db.add(post)
    # Flush to get the post.id before adding media
    await db.flush()

    # Add media items by position 
    if data.media:
        for idx, item in enumerate(data.media):
            media = PostMedia(
                post_id=post.id,
                media_url=item.media_url,
                media_type=item.media_type,
                position=item.position if item.position else idx,
            )
            db.add(media)

    # 
    await db.commit()

    # Re-queries post with relationships
    # selectinload() == SELECT ... WHERE parent_id IN (...)
    stmt = (
        select(Post)
        .where(Post.id == post.id)
        .options(selectinload(Post.user), selectinload(Post.media))
    )
    loaded_post = await db.scalar(stmt)
    enriched = await _enrich_posts([loaded_post], curr_user, db)
    return enriched[0]


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=List[PostResponse],
)
async def list_posts(
    post_type: Optional[PostTypeEnum] = Query(default=None),
    sport: Optional[str] = Query(default=None),
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
        .options(selectinload(Post.user), selectinload(Post.media))
        .order_by(Post.created_at.desc())
    )

    if post_type:
        stmt = stmt.where(Post.post_type == post_type)
    if sport:
        stmt = stmt.where(Post.sport.ilike(f"%{sport}%"))
    if user_id:
        stmt = stmt.where(Post.user_id == user_id)

    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    posts = res.scalars().all()
    db.
    return await _enrich_posts(posts, curr_user, db)


@router.get(
    "/{post_id}",
    status_code=status.HTTP_200_OK,
    response_model=PostResponse,
)
async def get_post(
    post_id: uuid.UUID,
    curr_user: Optional[User] = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a single post by ID.
    """
    stmt = (
        select(Post)
        .where(Post.id == post_id)
        .options(selectinload(Post.user), selectinload(Post.media))
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
    "/{post_id}",
    status_code=status.HTTP_200_OK,
    response_model=PostResponse,
)
async def update_post(
    post_id: uuid.UUID,
    data: PostUpdate,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update post caption, sport, location, or event_date.
    Only the author can update their post.
    """
    stmt = (
        select(Post)
        .where(Post.id == post_id)
        .options(selectinload(Post.user), selectinload(Post.media))
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
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_post(
    post_id: uuid.UUID,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a post.
    Only the author can delete their post. Cascades to media, comments, and likes.
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
