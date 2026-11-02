import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    status,
    Request,
)
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import apaginate

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
    PlayerRequestResponse,
)
from app.realtime.notify import emit_notification
from app.core.limiter import limiter
from app.core.exceptions import ApiException
from app.core.error_codes import ErrorCode
from app.services.play_request_service import (
    create_play_request_service,
    decide_play_request_service,
)

router = APIRouter(tags=["Play Requests"])


async def _get_request(
    db: AsyncSession, request_id: uuid.UUID
) -> PlayerRequest:
    """Reload a request with its sender."""
    stmt = (
        select(PlayerRequest)
        .options(joinedload(PlayerRequest.sender))
        .where(PlayerRequest.id == request_id)
        .execution_options(populate_existing=True)
    )
    return (await db.scalars(stmt)).one()


async def _paginate(
    db: AsyncSession, stmt: Select
) -> Page[PlayerRequestResponse]:
    """List requests newest first with pagination."""
    P = PlayerRequest
    stmt = stmt.options(joinedload(P.sender)).order_by(
        P.created_at.desc(), P.id.desc()
    )
    return await apaginate(
        db,
        stmt,
        transformer=lambda rows: [
            PlayerRequestResponse.model_validate(r) for r in rows
        ],
    )


@router.post(
    "/match-announcements/{id}/play-requests",
    response_model=PlayerRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("30/minute")
async def send_play_request(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """Send a play request for an announcement."""
    created_request = await create_play_request_service(db, id, me.id)
    background_tasks.add_task(
        emit_notification,
        event_type="play_request",
        actor_id=me.id,
        target_user_id=created_request.notification.target_user_id,
        target_id=created_request.notification.target_id,
        match_time=created_request.notification.match_time,
    )
    return await _get_request(db, created_request.request_id)


@router.get(
    "/match-announcements/{id}/play-requests",
    response_model=Page[PlayerRequestResponse],
)
@limiter.limit("60/minute")
async def list_announcement_requests(
    id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """List requests for an owned announcement."""
    announcement = await db.get(MatchAnnouncement, id)
    if announcement is None:
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_NOT_FOUND)
    if announcement.organizer_id != me.id:
        raise ApiException(code=ErrorCode.PERMISSION_DENIED)
    stmt = select(PlayerRequest).where(PlayerRequest.announcement_id == id)
    return await _paginate(db, stmt)


@router.get("/play-requests", response_model=Page[PlayerRequestResponse])
@limiter.limit("60/minute")
async def list_my_requests(
    request: Request,
    filters: PlayerRequestFilter = Depends(),
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """List sent or received play requests."""
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
    return await _paginate(db, stmt)


@router.patch("/play-requests/{id}", response_model=PlayerRequestResponse)
@limiter.limit("30/minute")
async def decide_play_request(
    id: uuid.UUID,
    body: PlayerRequestDecision,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(get_curr_user),
):
    """Accept or reject a pending play request."""
    notification = await decide_play_request_service(db, id, body, me.id)
    background_tasks.add_task(
        emit_notification,
        event_type=(
            "play_request_accepted"
            if body.status == PlayerRequestStatusEnum.accepted
            else "play_request_rejected"
        ),
        actor_id=me.id,
        target_user_id=notification.target_user_id,
        target_id=notification.target_id,
        match_time=notification.match_time,
    )
    return await _get_request(db, id)
