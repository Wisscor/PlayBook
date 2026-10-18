import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.core.pagination import encode_cursor
from app.models.match_announcement import (
    MatchAnnouncement,
    MatchAnnouncementStatus,
)
from app.models.play_request import PlayerRequest, PlayerRequestStatusEnum
from app.models.sport import Sport


def _make_announcement(owner, sport):
    ann = MatchAnnouncement(
        id=uuid.uuid4(),
        title="Looking for players",
        organizer_id=owner.id,
        sport_id=sport.id,
        remaining_player_slots=3,
        match_status=MatchAnnouncementStatus.upcoming,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    ann.owner = owner
    ann.sport = sport
    ann.play_requests = []
    return ann


def _make_play_request(
    sender, announcement, status=PlayerRequestStatusEnum.pending
):
    pr = PlayerRequest(
        id=uuid.uuid4(),
        announcement_id=announcement.id,
        sender_id=sender.id,
        status=status,
        created_at=datetime.now(timezone.utc),
    )
    pr.sender = sender
    pr.announcement = announcement
    return pr


def test_send_play_request_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    # announcement owned by mock_user_2
    announcement = _make_announcement(mock_user_2, sport)
    # mock_user_1 sends request
    play_request = _make_play_request(mock_user_1, announcement)

    # 1. db.get(MatchAnnouncement) -> announcement
    # 2. db.scalar (check already_sent) -> None
    # 3. _get_request db.scalars(stmt).one() -> play_request
    mock_db.get.return_value = announcement
    mock_db.scalar.return_value = None
    mock_scalars = MagicMock()
    mock_scalars.one.return_value = play_request
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 201
    data = res.json()
    assert data["id"] == str(play_request.id)
    assert data["announcement_id"] == str(announcement.id)
    assert data["sender"]["id"] == str(mock_user_1.id)
    assert data["status"] == "pending"
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_send_play_request_announcement_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/match-announcements/{uuid.uuid4()}/play-requests")
    assert res.status_code == 404
    assert res.json()["detail"] == "Announcement not found"

    app.dependency_overrides.clear()


def test_send_play_request_own_announcement(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    # announcement owned by mock_user_1
    announcement = _make_announcement(mock_user_1, sport)

    mock_db.get.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 403
    assert res.json()["detail"] == "Cannot request your own announcement"

    app.dependency_overrides.clear()


def test_send_play_request_closed_announcement(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_2, sport)
    announcement.match_status = MatchAnnouncementStatus.canceled
    mock_db.get.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 409
    assert res.json()["detail"] == "Announcement is not accepting requests"

    app.dependency_overrides.clear()


def test_send_play_request_full_announcement(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_2, sport)
    announcement.remaining_player_slots = 0
    mock_db.get.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 409
    assert res.json()["detail"] == "Announcement has no open player slots"

    app.dependency_overrides.clear()


def test_send_play_request_already_sent(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_2, sport)

    mock_db.get.return_value = announcement
    mock_db.scalar.return_value = (
        uuid.uuid4()
    )  # already sent request id exists

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 409
    assert res.json()["detail"] == "Request already sent"

    app.dependency_overrides.clear()


def test_send_play_request_integrity_error(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_2, sport)

    mock_db.get.return_value = announcement
    mock_db.scalar.return_value = None
    mock_db.commit.side_effect = IntegrityError(None, None, Exception())

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 409
    assert res.json()["detail"] == "Request already sent"
    mock_db.rollback.assert_called_once()

    app.dependency_overrides.clear()


def test_list_announcement_requests_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    # announcement owned by mock_user_1
    announcement = _make_announcement(mock_user_1, sport)
    play_request = _make_play_request(mock_user_2, announcement)

    mock_db.get.return_value = announcement
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [play_request]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == str(play_request.id)

    app.dependency_overrides.clear()


def test_list_announcement_requests_not_owner(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    # announcement owned by mock_user_2
    announcement = _make_announcement(mock_user_2, sport)

    mock_db.get.return_value = announcement

    # logged in as mock_user_1
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/match-announcements/{announcement.id}/play-requests")
    assert res.status_code == 403
    assert res.json()["detail"] == "Not the owner"

    app.dependency_overrides.clear()


def test_list_announcement_requests_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/match-announcements/{uuid.uuid4()}/play-requests")
    assert res.status_code == 404
    assert res.json()["detail"] == "Announcement not found"

    app.dependency_overrides.clear()


def test_list_my_requests_sent(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_2, sport)
    play_request = _make_play_request(mock_user_1, announcement)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [play_request]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/play-requests?role=sent")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["sender"]["id"] == str(mock_user_1.id)

    app.dependency_overrides.clear()


def test_list_my_requests_received(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_1, sport)
    play_request = _make_play_request(mock_user_2, announcement)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [play_request]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/play-requests?role=received")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["sender"]["id"] == str(mock_user_2.id)

    app.dependency_overrides.clear()


def test_list_my_requests_pagination(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_2, sport)
    pr1 = _make_play_request(mock_user_1, announcement)
    pr2 = _make_play_request(mock_user_1, announcement)

    mock_scalars = MagicMock()
    # 2 items returned when limit=1 indicates a next page
    mock_scalars.all.return_value = [pr1, pr2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/play-requests?role=sent&limit=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["next_cursor"] is not None

    app.dependency_overrides.clear()


def test_list_my_requests_with_cursor(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    announcement = _make_announcement(mock_user_2, sport)
    pr1 = _make_play_request(mock_user_1, announcement)

    cursor = encode_cursor(pr1.created_at, pr1.id)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [pr1]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/play-requests?role=sent&cursor={cursor}")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1

    app.dependency_overrides.clear()


def test_decide_play_request_accept_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football")
    # announcement owned by mock_user_1
    announcement = _make_announcement(mock_user_1, sport)
    play_request = _make_play_request(
        mock_user_2, announcement, status=PlayerRequestStatusEnum.pending
    )

    mock_db.scalar.return_value = play_request
    mock_scalars = MagicMock()
    mock_scalars.one.return_value = play_request
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"status": "accepted"}
    res = client.patch(f"/play-requests/{play_request.id}", json=payload)
    assert res.status_code == 200
    assert play_request.status == PlayerRequestStatusEnum.accepted
    assert announcement.remaining_player_slots == 2
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_decide_play_request_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"status": "accepted"}
    res = client.patch(f"/play-requests/{uuid.uuid4()}", json=payload)
    assert res.status_code == 404
    assert res.json()["detail"] == "Play request not found"

    app.dependency_overrides.clear()


def test_decide_play_request_not_owner(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football")
    # announcement owned by mock_user_2
    announcement = _make_announcement(mock_user_2, sport)
    play_request = _make_play_request(mock_user_1, announcement)

    mock_db.scalar.return_value = play_request

    # logged in as mock_user_1 (sender, but not announcement owner)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"status": "accepted"}
    res = client.patch(f"/play-requests/{play_request.id}", json=payload)
    assert res.status_code == 403
    assert res.json()["detail"] == "Not the owner"

    app.dependency_overrides.clear()


def test_decide_play_request_already_answered(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football")
    announcement = _make_announcement(mock_user_1, sport)
    # already accepted
    play_request = _make_play_request(
        mock_user_2, announcement, status=PlayerRequestStatusEnum.accepted
    )

    mock_db.scalar.return_value = play_request

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"status": "declined"}
    res = client.patch(f"/play-requests/{play_request.id}", json=payload)
    assert res.status_code == 409
    assert res.json()["detail"] == "Request already answered"

    app.dependency_overrides.clear()
