from dataclasses import dataclass
from datetime import datetime
import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.error_codes import ErrorCode
from ..core.exceptions import ApiException
from ..models.match_announcement import (
    MatchAnnouncement,
    MatchAnnouncementStatus,
)
from ..models.play_request import PlayerRequest, PlayerRequestStatusEnum
from ..schemas.play_request import PlayerRequestDecision


@dataclass(frozen=True)
class PlayRequestNotification:
    """Notification data produced by a successful play-request mutation."""

    target_user_id: uuid.UUID
    target_id: uuid.UUID
    match_time: datetime | None


@dataclass(frozen=True)
class CreatedPlayRequest:
    """Result of creating a play request."""

    request_id: uuid.UUID
    notification: PlayRequestNotification


async def create_play_request_service(
    db: AsyncSession,
    announcement_id: uuid.UUID,
    sender_id: uuid.UUID,
) -> CreatedPlayRequest:
    """Validate and create a play request for an announcement."""
    announcement = await db.get(MatchAnnouncement, announcement_id)
    if announcement is None:
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_NOT_FOUND)
    if announcement.organizer_id == sender_id:
        raise ApiException(code=ErrorCode.PERMISSION_DENIED)
    if announcement.match_status not in {
        MatchAnnouncementStatus.upcoming,
        MatchAnnouncementStatus.live,
    }:
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_NOT_ACCEPTING_REQUESTS)
    if announcement.remaining_player_slots <= 0:
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_FULL)

    already_sent = await db.scalar(
        select(PlayerRequest.id).where(
            PlayerRequest.announcement_id == announcement_id,
            PlayerRequest.sender_id == sender_id,
        )
    )
    if already_sent:
        raise ApiException(code=ErrorCode.REQUEST_ALREADY_SENT)

    play_request = PlayerRequest(
        announcement_id=announcement_id,
        sender_id=sender_id,
    )
    db.add(play_request)
    try:
        await db.flush()
        request_id = play_request.id
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ApiException(code=ErrorCode.REQUEST_ALREADY_SENT)

    return CreatedPlayRequest(
        request_id=request_id,
        notification=PlayRequestNotification(
            target_user_id=announcement.organizer_id,
            target_id=announcement.id,
            match_time=announcement.start_time,
        ),
    )


async def decide_play_request_service(
    db: AsyncSession,
    request_id: uuid.UUID,
    decision: PlayerRequestDecision,
    organizer_id: uuid.UUID,
) -> PlayRequestNotification:
    """Validate and apply an organizer's decision on a play request."""
    play_request = await db.scalar(
        select(PlayerRequest)
        .where(PlayerRequest.id == request_id)
        .with_for_update()
    )

    if play_request is None:
        raise ApiException(code=ErrorCode.PLAY_REQUEST_NOT_FOUND)

    announcement = await db.scalar(
        select(MatchAnnouncement)
        .where(MatchAnnouncement.id == play_request.announcement_id)
        .with_for_update()
    )
    if announcement is None:
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_NOT_FOUND)

    if announcement.organizer_id != organizer_id:
        raise ApiException(code=ErrorCode.PERMISSION_DENIED)
    if play_request.status != PlayerRequestStatusEnum.pending:
        raise ApiException(code=ErrorCode.REQUEST_ALREADY_DECIDED)
    if announcement.match_status not in {
        MatchAnnouncementStatus.upcoming,
        MatchAnnouncementStatus.live,
    }:
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_NOT_ACCEPTING_REQUESTS)
    if (
        decision.status == PlayerRequestStatusEnum.accepted
        and announcement.remaining_player_slots <= 0
    ):
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_FULL)

    notification = PlayRequestNotification(
        target_user_id=play_request.sender_id,
        target_id=play_request.announcement_id,
        match_time=announcement.start_time,
    )
    play_request.status = PlayerRequestStatusEnum(decision.status)
    if play_request.status == PlayerRequestStatusEnum.accepted:
        announcement.remaining_player_slots -= 1

    await db.commit()
    return notification
