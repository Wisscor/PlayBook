import uuid
from typing import Optional, List
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Query,
    status,
)
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from http import HTTPStatus

from ..database.database import get_db
from ..models import (
    User,
    Follower,
    # Post,
)
from ..schemas.user import (
    UserUpdate,
    UserResponse,
    UserProfileResponse,
    UserSummaryResponse,
)
from app.core.deps import get_curr_user, get_curr_user

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


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

    # posts_count = await db.scalar(
    #     select(func.count()).select_from(Post).where(Post.user_id == curr_user.id)
    # ) or 0

    profile = UserProfileResponse.model_validate(curr_user)
    profile.followers_count = followers_count
    profile.following_count = following_count
    # profile.posts_count = posts_count
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
        select(Follower).where(and_(
            Follower.follower_id == curr_user.id,
            Follower.following_id == user_id,
        ))
    )
    is_following = is_following_edge is not None

    profile = UserProfileResponse.model_validate(target_user)
    profile.followers_count = followers_count
    profile.following_count = following_count
    # profile.posts_count = posts_count
    profile.is_following = is_following
    return profile

# stmt = select(users_table).where(
#         and_(users_table.c.name == "wendy", users_table.c.enrolled == True)
#     )
