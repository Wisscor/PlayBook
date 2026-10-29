import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..core.error_codes import ErrorCode
from ..core.exceptions import ApiException
from ..models.match_announcement import MatchAnnouncement
from ..models.play_request import PlayerRequest, PlayerRequestStatusEnum
from ..models.user import User
from ..schemas.match_announcement import MatchAnnouncementResponse
from ..schemas.user import UserSummaryResponse


async def get_announcement_or_raise(
    db: AsyncSession,
    announcement_id: uuid.UUID,
) -> MatchAnnouncement:
    """Load an announcement with its related response data."""
    statement = (
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
    announcement = await db.scalar(statement)
    if announcement is None:
        raise ApiException(code=ErrorCode.ANNOUNCEMENT_NOT_FOUND)
    return announcement


def announcement_to_response(
    announcement: MatchAnnouncement,
) -> MatchAnnouncementResponse:
    response = MatchAnnouncementResponse.model_validate(announcement)
    response.accepted_players = [
        UserSummaryResponse.model_validate(request.sender)
        for request in announcement.play_requests
        if request.status == PlayerRequestStatusEnum.accepted
    ]
    return response


def require_announcement_owner(
    announcement: MatchAnnouncement,
    user: User,
) -> None:
    if announcement.organizer_id != user.id:
        raise ApiException(code=ErrorCode.PERMISSION_DENIED)


def get_notification_recipients(
    announcement: MatchAnnouncement,
) -> set[uuid.UUID]:
    return {
        play_request.sender_id
        for play_request in announcement.play_requests
        if play_request.status
        in {PlayerRequestStatusEnum.pending, PlayerRequestStatusEnum.accepted}
    }
