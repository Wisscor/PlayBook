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
    Request,
)
from sqlalchemy import select, func, or_, and_
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
from app.core.limiter import limiter

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
@limiter.limit("60/minute")
async def get_my_profile(
    request: Request,
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
@limiter.limit("30/minute")
async def update(
    data: UserUpdate,
    request: Request,
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
@limiter.limit("10/minute")
async def upload_avatar(
    request: Request,
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

        curr_user.avatar = f"uploads/{filename}"
        await db.commit()
        await db.refresh(curr_user)
    except Exception:
        filepath.unlink(missing_ok=True)
        raise

    if old_avatar and old_avatar.startswith("uploads/"):
        Path(old_avatar).unlink(missing_ok=True)

    return curr_user


@router.delete(path="/me", status_code=HTTPStatus.NO_CONTENT)
@limiter.limit("5/hour")
async def delete_user(
    request: Request,
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
@limiter.limit("60/minute")
async def search_users(
    request: Request,
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
@limiter.limit("60/minute")
async def get_user(
    user_id: uuid.UUID,
    request: Request,
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
@limiter.limit("60/minute")
async def list_user_posts(
    user_id: uuid.UUID,
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    curr_user: Optional[User] = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve posts authored by a user (newest first) with offset pagination.
    """
    if await db.get(User, user_id) is None:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail="User not found.",
        )

    stmt = (
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc(), Post.id.desc())
    )
    rows = list((await db.scalars(stmt.offset(offset).limit(limit + 1))).all())
    next_offset = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_offset = offset + limit

    enriched = await _enrich_posts(rows, curr_user, db)
    return PostPage(items=enriched, next_offset=next_offset)
