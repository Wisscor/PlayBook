import uuid
from typing import Optional, List
from datetime import datetime
from pathlib import Path
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Query,
    File,
    UploadFile,
    status,
    Request,
)
from sqlalchemy import select, func, or_
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
    Follower,
)
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostPage
from app.schemas.user import UserSummaryResponse
from app.schemas.post_media import PostMediaResponse, UploadedMedia
from app.core.deps import get_curr_user
from app.core.limiter import limiter

router = APIRouter(
    tags=["Posts"],
)

UPLOAD_DIR = Path("uploads")

# Media types (or MIME types) allowed
ALLOWED_MEDIA_TYPES = {
    # Images: max 10 MB (jpeg, png, webp)
    "image/jpeg": ("image", ".jpg", 10 * 1024 * 1024),
    "image/png": ("image", ".png", 10 * 1024 * 1024),
    "image/webp": ("image", ".webp", 10 * 1024 * 1024),
}


@router.post(
    "/media",
    status_code=status.HTTP_201_CREATED,
    response_model=UploadedMedia,
)
@limiter.limit("10/minute")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    _: User = Depends(get_curr_user),
):
    """
    Upload one image file up to 10 MB.
    """
    # Check the content type of the uploaded file
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type",
        )

    media_type_name, ext, max_size = ALLOWED_MEDIA_TYPES[content_type]
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    # Generate a unique filename to avoid filename collisions
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    size = 0
    try:
        # Open the file in binary write mode
        # and read in chunks to avoid loading the entire file into memory
        with open(filepath, "wb") as f:
            while chunk := await file.read(1024 * 64):
                size += len(chunk)
                if size > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="File too large",
                    )
                f.write(chunk)
    except Exception:
        if filepath.exists():
            filepath.unlink(missing_ok=True)
        raise

    return UploadedMedia(
        media_url=f"/uploads/{filename}",
        media_type="image",
    )


async def _enrich_posts(
    posts: List[Post],
    curr_user: Optional[User],
    db: AsyncSession,
) -> List[PostResponse]:
    """
    Helper to efficiently batch-load like_count, comment_count,
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
            author=user_summary,
            caption=p.caption,
            media=media_items,
            like_count=likes_map.get(p.id, 0),
            comment_count=comments_map.get(p.id, 0),
            is_liked_by_me=p.id in user_liked_set,
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
    Accepts caption, and an optional list of media items.
    """
    post = Post(
        user_id=curr_user.id,
        caption=body.caption,
    )
    db.add(post)
    # Flush to get the post.id before adding media
    await db.flush()

    # Add media items by position
    if body.media:
        for idx, item in enumerate(body.media):
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
        .options(selectinload(Post.user), selectinload(Post.media))
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
        .options(selectinload(Post.user), selectinload(Post.media))
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
