import uuid
from pathlib import Path
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    Response,
    Query,
    status,
    File,
    UploadFile,
    Request,
)
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus

from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import apaginate

from ..database.database import get_db
from ..models import (
    User,
    Post,
)
from ..schemas.user import (
    UserUpdate,
    UserProfileResponse,
    UserSummaryResponse,
)
from ..schemas.post import PostResponse
from app.services.post_service import enrich_posts
from app.core.deps import get_curr_user
from app.core.limiter import limiter
from app.core.config import settings
from app.core.exceptions import ApiException
from app.core.error_codes import ErrorCode
from app.services.avatar_service import remove_avatar, store_avatar
from app.services.user_service import (
    delete_user_account,
    get_user_by_id,
    load_user_profile,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

UPLOAD_DIR = Path("uploads")


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
    """Return the current user's profile and social counts."""
    return await load_user_profile(db, curr_user, curr_user)


@router.patch(
    path="/me",
    status_code=HTTPStatus.OK,
    response_model=UserProfileResponse,
)
@limiter.limit("30/minute")
async def update(
    data: UserUpdate,
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(curr_user, key, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ApiException(code=ErrorCode.RESOURCE_CONFLICT)
    await db.refresh(curr_user)
    return await load_user_profile(db, curr_user, curr_user)


@router.post(
    path="/me/avatar",
    status_code=HTTPStatus.OK,
    response_model=UserProfileResponse,
)
@limiter.limit("10/minute")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Replace the current user's avatar."""
    old_avatar = curr_user.avatar
    filepath = None

    try:
        new_avatar, filepath = await store_avatar(file, UPLOAD_DIR)
        curr_user.avatar = new_avatar
        await db.commit()
        await db.refresh(curr_user)
    except Exception:
        remove_avatar(filepath)
        raise

    if old_avatar and old_avatar.startswith("uploads/"):
        remove_avatar(old_avatar)

    return await load_user_profile(db, curr_user, curr_user)


@router.delete(path="/me", status_code=HTTPStatus.NO_CONTENT)
@limiter.limit("5/minute")
async def delete_user(
    request: Request,
    curr_user: User = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the current user's account."""
    await delete_user_account(db, curr_user)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return response


@router.get(
    path="",
    status_code=HTTPStatus.OK,
    response_model=Page[UserSummaryResponse],
)
@limiter.limit("60/minute")
async def search_users(
    request: Request,
    search: Optional[str] = Query(default=None, min_length=1),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """Search users by name or username."""
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
    return await apaginate(
        db,
        stmt,
        transformer=lambda rows: [
            UserSummaryResponse.model_validate(r) for r in rows
        ],
    )


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
    """Return a user's public profile and social counts."""
    target_user: Optional[User] = await get_user_by_id(db, user_id)
    if not target_user:
        raise ApiException(code=ErrorCode.USER_NOT_FOUND)
    return await load_user_profile(db, target_user, curr_user)


@router.get(
    path="/{user_id}/posts",
    status_code=HTTPStatus.OK,
    response_model=Page[PostResponse],
)
@limiter.limit("60/minute")
async def list_user_posts(
    user_id: uuid.UUID,
    request: Request,
    curr_user: Optional[User] = Depends(get_curr_user),
    db: AsyncSession = Depends(get_db),
):
    """List a user's posts with offset pagination."""
    if not await get_user_by_id(db, user_id):
        raise ApiException(code=ErrorCode.USER_NOT_FOUND)

    stmt = (
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc(), Post.id.desc())
    )

    return await apaginate(
        db,
        stmt,
        transformer=lambda rows: enrich_posts(rows, curr_user, db),
    )
