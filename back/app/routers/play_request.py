import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import Select, select, tuple_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.deps import get_curr_user
from app.database.database import get_db
from app.models.match_announcement import MatchAnnouncement
from app.models.play_request import PlayRequest, PlayRequestStatusEnum
from app.models.user import User
from app.schemas.play_request import (
    PlayRequestDecision,
    PlayRequestFilter,
    PlayRequestPage,
    PlayRequestResponse,
)
from app.core.pagination import (
    decode_cursor,
    encode_cursor,
)
from app.realtime.notify import emit_notification

router = APIRouter(tags=["Play Requests"])


async def _get_request(db: AsyncSession, request_id: uuid.UUID) -> PlayRequest:
    """Reload a request with its sender.

    Needed after a commit: commit expires every attribute, and async code
    cannot lazy-load `sender` while building the response.
    """
    stmt = (
        select(PlayRequest)
        .options(joinedload(PlayRequest.sender))
        .where(PlayRequest.id == request_id)
        .execution_options(populate_existing=True)
    )
    return (await db.scalars(stmt)).one()


async def _paginate(
    db: AsyncSession, stmt: Select, limit: int, cursor: Optional[str]
) -> PlayRequestPage:
    """Newest first. `stmt` must select PlayRequest."""
    P = PlayRequest
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
    return PlayRequestPage(
        items=[PlayRequestResponse.model_validate(r) for r in rows],
        next_cursor=next_cursor,
    )


@router.post(
    "/match-announcements/{id}/play-requests",
    response_model=PlayRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_play_request(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    announcement = await db.get(MatchAnnouncement, id)
    if announcement is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Announcement not found"
        )
    if announcement.owner_id == me.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Cannot request your own announcement",
        )
    already_sent = await db.scalar(
        select(PlayRequest.id).where(
            PlayRequest.announcement_id == id, PlayRequest.sender_id == me.id
        )
    )
    if already_sent:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Request already sent"
        )

    play_request = PlayRequest(announcement_id=id, sender_id=me.id)
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
    background_tasks.add_task(
        emit_notification,
        event_type="play_request",
        actor_id=me.id,
        target_user_id=announcement.owner_id,
        target_id=announcement.id,
        target_type="match_announcement",
    )
    return await _get_request(db, request_id)


@router.get(
    "/match-announcements/{id}/play-requests", response_model=PlayRequestPage
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
    if announcement.owner_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not the owner")
    stmt = select(PlayRequest).where(PlayRequest.announcement_id == id)
    return await _paginate(db, stmt, limit, cursor)


@router.get("/play-requests", response_model=PlayRequestPage)
async def list_my_requests(
    filters: PlayRequestFilter = Depends(),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """role=sent: requests I sent. role=received: requests on my announcements."""
    stmt = select(PlayRequest)
    if filters.role == "sent":
        stmt = stmt.where(PlayRequest.sender_id == me.id)
    else:
        stmt = stmt.join(
            MatchAnnouncement,
            MatchAnnouncement.id == PlayRequest.announcement_id,
        ).where(MatchAnnouncement.owner_id == me.id)
    if filters.status:
        stmt = stmt.where(PlayRequest.status == filters.status)
    return await _paginate(db, stmt, limit, cursor)


@router.patch("/play-requests/{id}", response_model=PlayRequestResponse)
async def decide_play_request(
    id: uuid.UUID,
    body: PlayRequestDecision,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    play_request = await db.scalar(
        select(PlayRequest)
        .options(
            joinedload(PlayRequest.sender),
            joinedload(PlayRequest.announcement),
        )
        .where(PlayRequest.id == id)
    )
    if play_request is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Play request not found"
        )
    if play_request.announcement.owner_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not the owner")
    if play_request.status != PlayRequestStatusEnum.pending:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Request already answered"
        )
    play_request.status = PlayRequestStatusEnum(body.status)
    await db.commit()
    background_tasks.add_task(
        emit_notification,
        event_type=f"play_request_{body.status}",
        actor_id=me.id,
        target_user_id=play_request.sender_id,
        target_id=play_request.announcement_id,
        target_type="match_announcement",
    )
    return await _get_request(db, id)
