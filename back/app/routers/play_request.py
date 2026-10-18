import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, select, tuple_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.deps import get_curr_user
from app.database.database import get_db
from app.models.match_announcement import (
    MatchAnnouncement,
    MatchAnnouncementStatus,
)
from app.models.play_request import PlayerRequest, PlayerRequestStatusEnum
from app.models.user import User
from app.schemas.play_request import (
    PlayerRequestDecision,
    PlayerRequestFilter,
    PlayerRequestPage,
    PlayerRequestResponse,
)
from app.core.pagination import (
    decode_cursor,
    encode_cursor,
)

router = APIRouter(tags=["Play Requests"])


async def _get_request(
    db: AsyncSession, request_id: uuid.UUID
) -> PlayerRequest:
    """Reload a request with its sender.

    Needed after a commit: commit expires every attribute, and async code
    cannot lazy-load `sender` while building the response.
    """
    stmt = (
        select(PlayerRequest)
        .options(joinedload(PlayerRequest.sender))
        .where(PlayerRequest.id == request_id)
        .execution_options(populate_existing=True)
    )
    return (await db.scalars(stmt)).one()


async def _paginate(
    db: AsyncSession, stmt: Select, limit: int, cursor: Optional[str]
) -> PlayerRequestPage:
    """Newest first. `stmt` must select PlayerRequest."""
    P = PlayerRequest
    stmt = stmt.options(joinedload(P.sender)).order_by(
        P.created_at.desc(), P.id.desc()
    )
    if cursor:
        ts, cursor_id = decode_cursor(cursor)
        stmt = stmt.where(tuple_(P.created_at, P.id) < tuple_(ts, cursor_id))
    rows = list((await db.scalars(stmt.limit(limit + 1))).all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = encode_cursor(rows[-1].created_at, rows[-1].id)
    return PlayerRequestPage(
        items=[PlayerRequestResponse.model_validate(r) for r in rows],
        next_cursor=next_cursor,
    )


@router.post(
    "/match-announcements/{id}/play-requests",
    response_model=PlayerRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_play_request(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    announcement = await db.get(MatchAnnouncement, id)
    if announcement is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Announcement not found"
        )
    if announcement.organizer_id == me.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Cannot request your own announcement",
        )
    if announcement.match_status not in {
        MatchAnnouncementStatus.upcoming,
        MatchAnnouncementStatus.live,
    }:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Announcement is not accepting requests",
        )
    if announcement.remaining_player_slots <= 0:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Announcement has no open player slots",
        )
    already_sent = await db.scalar(
        select(PlayerRequest.id).where(
            PlayerRequest.announcement_id == id,
            PlayerRequest.sender_id == me.id,
        )
    )
    if already_sent:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Request already sent"
        )

    play_request = PlayerRequest(announcement_id=id, sender_id=me.id)
    db.add(play_request)
    await db.flush()  # assigns the id
    request_id = play_request.id  # read it now: commit expires the object

    try:
        await db.commit()
    except IntegrityError:  # two parallel requests hit the UNIQUE constraint
        await db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Request already sent"
        )
    return await _get_request(db, request_id)


@router.get(
    "/match-announcements/{id}/play-requests", response_model=PlayerRequestPage
)
async def list_announcement_requests(
    id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    announcement = await db.get(MatchAnnouncement, id)
    if announcement is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Announcement not found"
        )
    if announcement.organizer_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not the owner")
    stmt = select(PlayerRequest).where(PlayerRequest.announcement_id == id)
    return await _paginate(db, stmt, limit, cursor)


@router.get("/play-requests", response_model=PlayerRequestPage)
async def list_my_requests(
    filters: PlayerRequestFilter = Depends(),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """role=sent: requests I sent. role=received: requests on my announcements."""
    stmt = select(PlayerRequest)
    if filters.role == "sent":
        stmt = stmt.where(PlayerRequest.sender_id == me.id)
    else:
        stmt = stmt.join(
            MatchAnnouncement,
            MatchAnnouncement.id == PlayerRequest.announcement_id,
        ).where(MatchAnnouncement.organizer_id == me.id)
    if filters.status:
        stmt = stmt.where(PlayerRequest.status == filters.status)
    return await _paginate(db, stmt, limit, cursor)


@router.patch("/play-requests/{id}", response_model=PlayerRequestResponse)
async def decide_play_request(
    id: uuid.UUID,
    body: PlayerRequestDecision,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    play_request = await db.scalar(
        select(PlayerRequest)
        .options(
            joinedload(PlayerRequest.sender),
            joinedload(PlayerRequest.announcement),
        )
        .with_for_update()
        .where(PlayerRequest.id == id)
    )
    if play_request is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Play request not found"
        )
    if play_request.announcement.organizer_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not the owner")
    if play_request.status != PlayerRequestStatusEnum.pending:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Request already answered"
        )
    announcement = play_request.announcement
    if announcement.match_status not in {
        MatchAnnouncementStatus.upcoming,
        MatchAnnouncementStatus.live,
    }:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Announcement is not accepting decisions",
        )
    if (
        body.status == PlayerRequestStatusEnum.accepted
        and announcement.remaining_player_slots <= 0
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Announcement has no open player slots",
        )
    play_request.status = PlayerRequestStatusEnum(body.status)
    if play_request.status == PlayerRequestStatusEnum.accepted:
        announcement.remaining_player_slots -= 1
    await db.commit()
    return await _get_request(db, id)
