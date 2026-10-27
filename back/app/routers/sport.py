"""Sports and the sports a user plays (user_sports has no route file of its own)."""

import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
    Request,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_curr_user
from app.database.database import get_db
from app.models.sport import Sport
from app.models.user import User
from app.models.user_sport import UserSport
from app.schemas.sport import SportCreate, SportResponse
from app.core.limiter import limiter

router = APIRouter(tags=["Sports"])


@router.get("/sports", response_model=list[SportResponse])
@limiter.limit("60/minute")
async def list_sports(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """List all sports."""
    return (await db.scalars(select(Sport).order_by(Sport.name))).all()


@router.get("/users/{id}/sports", response_model=list[SportResponse])
@limiter.limit("60/minute")
async def list_user_sports(
    id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """List sports linked to a user."""
    if await db.get(User, id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    stmt = (
        select(Sport)
        .join(UserSport, UserSport.sport_id == Sport.id)
        .where(UserSport.user_id == id)
        .order_by(Sport.name)
    )
    return (await db.scalars(stmt)).all()


@router.post(
    "/users/me/sports/{sport_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit("30/minute")
async def add_my_sport(
    sport_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    curr_user: User = Depends(get_curr_user),
):
    """Add a sport to the current user's profile."""
    if await db.get(Sport, sport_id) is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Sport not found"
        )
    if await db.get(UserSport, (curr_user.id, sport_id)) is None:
        db.add(UserSport(user_id=curr_user.id, sport_id=sport_id))
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/users/me/sports/{sport_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit("30/minute")
async def remove_my_sport(
    sport_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    curr_user: User = Depends(get_curr_user),
):
    """Remove a sport from the current user's profile."""
    if await db.get(Sport, sport_id) is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Sport not found"
        )
    link = await db.get(UserSport, (curr_user.id, sport_id))
    if link is not None:
        await db.delete(link)
        await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
