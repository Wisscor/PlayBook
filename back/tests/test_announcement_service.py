from datetime import datetime, timedelta, timezone
import uuid

import pytest

from app.core.error_codes import ErrorCode
from app.core.exceptions import ApiException
from app.models import MatchAnnouncement, PlayerRequest, Sport
from app.models.match_announcement import MatchAnnouncementStatus
from app.models.play_request import PlayerRequestStatusEnum
from app.services.announcement_service import (
    announcement_to_response,
    get_notification_recipients,
    require_announcement_owner,
)


def make_announcement(owner_id):
    start = datetime.now(timezone.utc)
    return MatchAnnouncement(
        id=uuid.uuid4(),
        title="Evening match",
        organizer_id=owner_id,
        sport_id=uuid.uuid4(),
        remaining_player_slots=2,
        match_status=MatchAnnouncementStatus.upcoming,
        start_time=start,
        end_time=start + timedelta(hours=1),
        created_at=start,
    )


def test_require_announcement_owner_rejects_other_user(user, other_user):
    announcement = make_announcement(user.id)

    with pytest.raises(ApiException) as caught:
        require_announcement_owner(announcement, other_user)

    assert caught.value.code == ErrorCode.PERMISSION_DENIED


def test_notification_recipients_include_pending_and_accepted_only(
    user, other_user
):
    announcement = make_announcement(user.id)
    pending = PlayerRequest(
        id=uuid.uuid4(),
        announcement_id=announcement.id,
        sender_id=other_user.id,
        status=PlayerRequestStatusEnum.pending,
    )
    declined = PlayerRequest(
        id=uuid.uuid4(),
        announcement_id=announcement.id,
        sender_id=uuid.uuid4(),
        status=PlayerRequestStatusEnum.declined,
    )
    announcement.play_requests = [pending, declined]

    assert get_notification_recipients(announcement) == {other_user.id}


def test_announcement_to_response_contains_accepted_players(user, other_user):
    announcement = make_announcement(user.id)
    announcement.owner = user
    announcement.sport = Sport(
        id=announcement.sport_id,
        name="Tennis",
        max_players=2,
    )
    accepted = PlayerRequest(
        id=uuid.uuid4(),
        announcement_id=announcement.id,
        sender_id=other_user.id,
        status=PlayerRequestStatusEnum.accepted,
        sender=other_user,
    )
    announcement.play_requests = [accepted]

    response = announcement_to_response(announcement)

    assert response.id == announcement.id
    assert [player.id for player in response.accepted_players] == [
        other_user.id
    ]
