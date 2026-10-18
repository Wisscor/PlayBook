import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, tuple_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.deps import get_curr_user
from app.database.database import get_db
from app.models.match_announcement import MatchAnnouncement
from app.models.match_announcement import MatchAnnouncementStatus
from app.models.play_request import PlayerRequest, PlayerRequestStatusEnum
from app.models.sport import Sport
from app.models.user import User
from app.schemas.match_announcement import (
    MatchAnnouncementCreate,
    MatchAnnouncementFilter,
    MatchAnnouncementPage,
    MatchAnnouncementResponse,
    MatchAnnouncementUpdate,
)
from app.core.pagination import (
    decode_cursor,
    encode_cursor,
)

router = APIRouter(prefix="/match-announcements", tags=["Match Announcements"])


async def _get_or_404(
    db: AsyncSession, announcement_id: uuid.UUID
) -> MatchAnnouncement:
    """Load an announcement with its owner and sport.

    populate_existing makes it safe to call after a commit: commit expires
    every attribute, and async code cannot lazy-load `owner` or `sport`
    while the response is built.
    """
    stmt = (
        select(MatchAnnouncement)
        .options(
            joinedload(MatchAnnouncement.owner),
            joinedload(MatchAnnouncement.sport),
            selectinload(MatchAnnouncement.play_requests).joinedload(
                PlayerRequest.sender
            ),
        )
        .where(MatchAnnouncement.id == announcement_id)
        .execution_options(populate_existing=True)
    )
    announcement = await db.scalar(stmt)
    if announcement is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Announcement not found"
        )
    return announcement


def _to_response(announcement: MatchAnnouncement) -> MatchAnnouncementResponse:
    response = MatchAnnouncementResponse.model_validate(announcement)
    response.accepted_players= [
        request.sender
        for request in announcement.play_requests
        if request.status == PlayerRequestStatusEnum.accepted
    ]
    return response


def _require_owner(announcement: MatchAnnouncement, user: User) -> None:
    if announcement.organizer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not the owner")


@router.post(
    "",
    response_model=MatchAnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_announcement(
    body: MatchAnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    if await db.get(Sport, body.sport_id) is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Sport not found"
        )
    announcement = MatchAnnouncement(organizer_id=me.id, **body.model_dump())
    db.add(announcement)
    await db.flush()  # assigns the id
    announcement_id = announcement.id  # read it now: commit expires the object
    await db.commit()
    return _to_response(await _get_or_404(db, announcement_id))


@router.get("", response_model=MatchAnnouncementPage)
async def search_announcements(
    filters: MatchAnnouncementFilter = Depends(),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """Sorted by start_time (soonest first). Time window: the announcement must
    fit inside it (start_time >= start_from and end_time <= end_to)."""
    M = MatchAnnouncement
    stmt = (
        select(M)
        .options(
            joinedload(M.owner),
            joinedload(M.sport),
            selectinload(M.play_requests).joinedload(PlayerRequest.sender),
        )
        .order_by(M.start_time, M.id)
    )
    if filters.sport_id:
        stmt = stmt.where(M.sport_id == filters.sport_id)
    if filters.match_status:
        stmt = stmt.where(M.match_status == filters.match_status)
    else:
        stmt = stmt.where(
            M.match_status.ingit_(
                [
                    MatchAnnouncementStatus.upcoming,
                    MatchAnnouncementStatus.live,
                ]
            )
        )
    if filters.organizer_id:
        stmt = stmt.where(M.organizer_id == filters.organizer_id)
    if filters.start_from:
        stmt = stmt.where(M.start_time >= filters.start_from)
    if filters.end_to:
        stmt = stmt.where(M.end_time <= filters.end_to)
    if cursor:
        ts, cursor_id = decode_cursor(cursor)
        stmt = stmt.where(tuple_(M.start_time, M.id) > tuple_(ts, cursor_id))

    rows = list(
        (await db.scalars(stmt.limit(limit + 1))).all()
    )  # one extra row = "has next page"
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = encode_cursor(rows[-1].start_time, rows[-1].id)
    return MatchAnnouncementPage(
        items=[_to_response(row) for row in rows],
        next_cursor=next_cursor,
    )


@router.get("/{id}", response_model=MatchAnnouncementResponse)
async def get_announcement(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    return _to_response(await _get_or_404(db, id))


@router.patch("/{id}", response_model=MatchAnnouncementResponse)
async def update_announcement(
    id: uuid.UUID,
    body: MatchAnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    announcement = await _get_or_404(db, id)
    _require_owner(announcement, me)

    data = body.model_dump(exclude_unset=True)
    if any(value is None for value in data.values()):
        raise HTTPException(422, detail="Fields cannot be null")

    # end_time > start_time must hold on the resulting values, even when
    # only one of the two is sent.
    start = data.get("start_time", announcement.start_time)
    end = data.get("end_time", announcement.end_time)
    if end <= start:
        raise HTTPException(
            422,
            detail="end_time must be after start_time",
        )
    if "sport_id" in data and await db.get(Sport, data["sport_id"]) is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Sport not found"
        )

    if "remaining_player_slots" in data and data["remaining_player_slots"] < 0:
        raise HTTPException(422, detail="Player count cannot be negative")
    if (
        "match_status" in data
        and data["match_status"] != announcement.match_status
        and announcement.match_status
        in {MatchAnnouncementStatus.canceled, MatchAnnouncementStatus.finished}
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Announcement is already closed",
        )
    if (
        "match_status" in data
        and data["match_status"]
        in {
            MatchAnnouncementStatus.upcoming,
            MatchAnnouncementStatus.live,
        }
        and announcement.match_status
        in {MatchAnnouncementStatus.canceled, MatchAnnouncementStatus.finished}
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Announcement cannot be reopened",
        )

    for field, value in data.items():
        setattr(announcement, field, value)
    await db.commit()
    return _to_response(
        await _get_or_404(db, id)
    )  # reload: owner and sport after commit


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    announcement = await _get_or_404(db, id)
    _require_owner(announcement, me)
    # its play requests are deleted with it
    await db.delete(announcement)  # AsyncSession.delete must be awaited
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
