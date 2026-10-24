import uuid
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Response,
    status,
    Request,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import apaginate

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
    MatchAnnouncementResponse,
    MatchAnnouncementUpdate,
)
from app.schemas.user import UserSummaryResponse
from app.core.limiter import limiter
from app.realtime.notify import emit_notifications

router = APIRouter(prefix="/match-announcements", tags=["Match Announcements"])


async def _get_or_404(
    db: AsyncSession, announcement_id: uuid.UUID
) -> MatchAnnouncement:
    """Load an announcement with its related data."""
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
    response.accepted_players = [
        UserSummaryResponse.model_validate(request.sender)
        for request in announcement.play_requests
        if request.status == PlayerRequestStatusEnum.accepted
    ]
    return response


def _require_owner(announcement: MatchAnnouncement, user: User) -> None:
    if announcement.organizer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not the owner")


def _notification_recipients(
    announcement: MatchAnnouncement,
) -> set[uuid.UUID]:
    return {
        play_request.sender_id
        for play_request in announcement.play_requests
        if play_request.status
        in {PlayerRequestStatusEnum.pending, PlayerRequestStatusEnum.accepted}
    }


@router.post(
    "",
    response_model=MatchAnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("30/minute")
async def create_announcement(
    body: MatchAnnouncementCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """Create a match announcement."""
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


@router.get("", response_model=Page[MatchAnnouncementResponse])
@limiter.limit("60/minute")
async def search_announcements(
    request: Request,
    filters: MatchAnnouncementFilter = Depends(),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """Search announcements with sorting and time filters."""
    M = MatchAnnouncement
    stmt = select(M).options(
        joinedload(M.owner),
        joinedload(M.sport),
        selectinload(M.play_requests).joinedload(PlayerRequest.sender),
    )
    # Filters
    if filters.sport_id:
        stmt = stmt.where(M.sport_id == filters.sport_id)
    if filters.match_status:
        stmt = stmt.where(M.match_status == filters.match_status)
    else:
        stmt = stmt.where(
            M.match_status.in_(
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

    # Sorting
    sort_column = {
        "start_time": M.start_time,
        "created_at": M.created_at,
        "remaining_player_slots": M.remaining_player_slots,
    }[filters.sort_by]

    ascending = filters.sort_order == "asc"
    stmt = stmt.order_by(
        sort_column.asc() if ascending else sort_column.desc(),
        M.id.asc() if ascending else M.id.desc(),
    )

    return await apaginate(
        db, stmt, transformer=lambda rows: [_to_response(r) for r in rows]
    )


@router.get("/{id}", response_model=MatchAnnouncementResponse)
@limiter.limit("60/minute")
async def get_announcement(
    id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_curr_user),
):
    """Retrieve a match announcement."""
    return _to_response(await _get_or_404(db, id))


@router.patch("/{id}", response_model=MatchAnnouncementResponse)
@limiter.limit("30/minute")
async def update_announcement(
    id: uuid.UUID,
    body: MatchAnnouncementUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """Update an announcement owned by the current user."""
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
        and announcement.match_status == MatchAnnouncementStatus.finished
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
        and announcement.match_status == MatchAnnouncementStatus.finished
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Announcement cannot be reopened",
        )

    changed = any(
        getattr(announcement, field) != value for field, value in data.items()
    )
    recipient_ids = (
        _notification_recipients(announcement) if changed else set()
    )
    for field, value in data.items():
        setattr(announcement, field, value)
    await db.commit()
    if recipient_ids:
        background_tasks.add_task(
            emit_notifications,
            event_type="match_updated",
            actor_id=me.id,
            target_user_ids=recipient_ids,
            target_id=announcement.id,
            match_time=announcement.start_time,
        )
    return _to_response(
        await _get_or_404(db, id)
    )  # reload: owner and sport after commit


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_announcement(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """Delete an announcement owned by the current user."""
    announcement = await _get_or_404(db, id)
    _require_owner(announcement, me)
    recipient_ids = _notification_recipients(announcement)
    match_time = announcement.start_time
    # its play requests are deleted with it
    await db.delete(announcement)  # AsyncSession.delete must be awaited
    await db.commit()
    if recipient_ids:
        background_tasks.add_task(
            emit_notifications,
            event_type="match_cancelled",
            actor_id=me.id,
            target_user_ids=recipient_ids,
            target_id=announcement.id,
            match_time=match_time,
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
