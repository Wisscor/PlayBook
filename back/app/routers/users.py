import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Query,
    status,
    File,
    UploadFile,
)
from sqlalchemy import select, func, or_, and_, tuple_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus

from ..database.database import get_db
from ..models import (
    User,
    Follower,
    Post,
)
from ..schemas.user import (
    UserUpdate,
    UserResponse,
    UserProfileResponse,
    UserSummaryResponse,
)
from ..schemas.post import PostPage
from .post import _enrich_posts
from app.core.deps import get_curr_user
from app.core.pagination import encode_cursor, decode_cursor

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

UPLOAD_DIR = Path("uploads")
AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_AVATAR_SIZE = 5 * 1024 * 1024


@router.get(
    path="/me",
    status_code=HTTPStatus.OK,
    response_model=UserProfileResponse,
)
async def get_my_profile(
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current authenticated user's profile with social counts.
    """
    followers_count = (
        await db.scalar(
            select(func.count())
            .select_from(Follower)
            .where(Follower.following_id == curr_user.id)
        )
        or 0
    )

    following_count = (
        await db.scalar(
            select(func.count())
            .select_from(Follower)
            .where(Follower.follower_id == curr_user.id)
        )
        or 0
    )

    posts_count = (
        await db.scalar(
            select(func.count())
            .select_from(Post)
            .where(Post.user_id == curr_user.id)
        )
        or 0
    )

    profile = UserProfileResponse.model_validate(curr_user)
    profile.followers_count = followers_count
    profile.following_count = following_count
    profile.posts_count = posts_count
    profile.is_following = None
    return profile


@router.patch(
    path="/me",
    status_code=HTTPStatus.OK,
    response_model=UserResponse,
)
async def update(
    data: UserUpdate,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Partially update authenticated user's profile.
    """
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(curr_user, key, value)

    await db.commit()
    await db.refresh(curr_user)
    return curr_user


@router.post(
    path="/me/avatar",
    status_code=HTTPStatus.OK,
    response_model=UserResponse,
)
async def upload_avatar(
    file: UploadFile = File(...),
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Replace the current user's avatar with an image up to 5 MB."""
    content_type = (file.content_type or "").lower()
    extension = AVATAR_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Avatar must be a JPEG, PNG, or WebP image",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{extension}"
    filepath = UPLOAD_DIR / filename
    size = 0
    old_avatar = curr_user.avatar

    try:
        with filepath.open("wb") as destination:
            while chunk := await file.read(1024 * 64):
                size += len(chunk)
                if size > MAX_AVATAR_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="Avatar file too large; maximum size is 5 MB",
                    )
                destination.write(chunk)

        curr_user.avatar = f"/uploads/{filename}"
        await db.commit()
        await db.refresh(curr_user)
    except Exception:
        filepath.unlink(missing_ok=True)
        raise

    if old_avatar and old_avatar.startswith("/uploads/"):
        Path(old_avatar.removeprefix("/uploads/")).unlink(missing_ok=True)

    return curr_user


@router.delete(path="/me", status_code=HTTPStatus.NO_CONTENT)
async def delete_user(
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete authenticated user's account.
    """
    await db.delete(curr_user)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    path="",
    status_code=HTTPStatus.OK,
    response_model=List[UserSummaryResponse],
)
async def search_users(
    search: Optional[str] = Query(default=None, min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Search users by username, firstname, or lastname.
    """
    stmt = select(User)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                User.username.ilike(pattern),
                User.firstname.ilike(pattern),
                User.lastname.ilike(pattern),
            )
        )
    stmt = stmt.offset(offset).limit(limit)
    result = await db.scalars(stmt)
    return result.all()


@router.get(
    path="/{user_id}",
    status_code=HTTPStatus.OK,
    response_model=UserProfileResponse,
)
async def get_user(
    user_id: uuid.UUID,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve user public profile along with follower counts and follow status.
    """
    target_user = await db.scalar(select(User).where(User.id == user_id))
    if not target_user:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail="User not found.",
        )

    followers_count = (
        await db.scalar(
            select(func.count())
            .select_from(Follower)
            .where(Follower.following_id == user_id)
        )
        or 0
    )

    following_count = (
        await db.scalar(
            select(func.count())
            .select_from(Follower)
            .where(Follower.follower_id == user_id)
        )
        or 0
    )

    # posts_count = (
    #     await db.scalar(
    #         select(func.count())
    #         .select_from(Post)
    #         .where(Post.user_id == user_id)
    #     )
    #     or 0
    # )

    is_following_edge = await db.scalar(
        select(Follower).where(
            and_(
                Follower.follower_id == curr_user.id,
                Follower.following_id == user_id,
            )
        )
    )
    is_following = is_following_edge is not None

    profile = UserProfileResponse.model_validate(target_user)
    profile.followers_count = followers_count
    profile.following_count = following_count
    # profile.posts_count = posts_count
    profile.is_following = is_following
    return profile


@router.get(
    path="/{user_id}/posts",
    status_code=HTTPStatus.OK,
    response_model=PostPage,
)
async def list_user_posts(
    user_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = None,
    curr_user: Optional[User] = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve posts authored by a user (newest first) with keyset cursor pagination.
    """
    if await db.get(User, user_id) is None:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail="User not found.",
        )

    stmt = (
        select(Post)
        .options(selectinload(Post.user), selectinload(Post.media))
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc(), Post.id.desc())
    )
    if cursor:
        ts, cursor_id = decode_cursor(cursor)
        stmt = stmt.where(
            tuple_(Post.created_at, Post.id) < tuple_(ts, cursor_id)
        )

    rows = list((await db.scalars(stmt.limit(limit + 1))).all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = encode_cursor(rows[-1].created_at, rows[-1].id)

    enriched = await _enrich_posts(rows, curr_user, db)
    return PostPage(items=enriched, next_cursor=next_cursor)
