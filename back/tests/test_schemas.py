from datetime import datetime, timedelta, timezone
import uuid

import pytest
from pydantic import ValidationError

from app.models.match_announcement import MatchAnnouncementStatus
from app.models.play_request import PlayerRequestStatusEnum
from app.realtime.schemas import (
    ConversationCreate,
    MessageRead,
    MessageSend,
    NotificationReadRequest,
)
from app.schemas.match_announcement import (
    MatchAnnouncementCreate,
    MatchAnnouncementUpdate,
)
from app.schemas.play_request import PlayerRequestDecision, PlayerRequestFilter
from app.schemas.post import PostCreate, PostUpdate
from app.schemas.sport import SportCreate
from app.schemas.user import UserCreate, UserLogin, UserUpdate


def test_user_create_and_login_validate_email_and_password_length():
    payload = {
        "firstname": "Alice",
        "lastname": "Smith",
        "username": "alice",
        "email": "alice@example.com",
        "password": "password123",
    }
    assert UserCreate(**payload).email == "alice@example.com"
    assert UserLogin(email="alice@example.com", password="password123")

    with pytest.raises(ValidationError):
        UserCreate(**{**payload, "email": "invalid"})
    with pytest.raises(ValidationError):
        UserCreate(**{**payload, "password": "short"})


def test_user_update_rejects_invalid_lengths_and_accepts_partial_update():
    assert UserUpdate(bio="new bio").model_dump(exclude_unset=True) == {
        "bio": "new bio"
    }
    with pytest.raises(ValidationError):
        UserUpdate(firstname="ab")


def test_post_and_sport_constraints():
    assert PostCreate(caption="hello").caption == "hello"
    assert SportCreate(name="Tennis", max_players=2).max_players == 2
    with pytest.raises(ValidationError):
        PostCreate(caption="")
    with pytest.raises(ValidationError):
        SportCreate(name="", max_players=0)


def test_match_announcement_requires_ordered_times_and_nonempty_update():
    start = datetime.now(timezone.utc)
    valid = MatchAnnouncementCreate(
        title="Evening match",
        sport_id=uuid.uuid4(),
        remaining_player_slots=2,
        start_time=start,
        end_time=start + timedelta(hours=1),
    )
    assert valid.end_time > valid.start_time

    with pytest.raises(ValidationError):
        MatchAnnouncementCreate(
            title="bad",
            sport_id=uuid.uuid4(),
            remaining_player_slots=1,
            start_time=start,
            end_time=start,
        )
    with pytest.raises(ValidationError):
        MatchAnnouncementUpdate()


def test_play_request_and_realtime_schemas_enforce_allowed_values():
    assert PlayerRequestDecision(status=PlayerRequestStatusEnum.accepted)
    assert PlayerRequestFilter(role="sent")
    assert ConversationCreate(peer_id=uuid.uuid4())
    assert MessageRead(conversation_id=uuid.uuid4(), message_id=uuid.uuid4())
    assert (
        MessageSend(conversation_id=uuid.uuid4(), body="hello").body == "hello"
    )
    assert NotificationReadRequest(notification_ids=[uuid.uuid4()])

    with pytest.raises(ValidationError):
        PlayerRequestFilter(role="unknown")
    with pytest.raises(ValidationError):
        MessageSend(conversation_id=uuid.uuid4(), body="")
    with pytest.raises(ValidationError):
        NotificationReadRequest(notification_ids=[])
