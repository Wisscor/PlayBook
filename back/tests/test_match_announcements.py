import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.models.match_announcement import (
    MatchAnnouncement,
    MatchAnnouncementStatus,
)
from app.models.play_request import PlayerRequest, PlayerRequestStatusEnum
from app.models.sport import Sport


def _make_announcement(
    owner,
    sport,
    needed_players=3,
    announcement_status=MatchAnnouncementStatus.upcoming,
    start_time=None,
    end_time=None,
):
    now = datetime.now(timezone.utc)
    st = start_time or (now + timedelta(hours=1))
    et = end_time or (now + timedelta(hours=3))
    ann = MatchAnnouncement(
        id=uuid.uuid4(),
        title="Looking for players",
        organizer_id=owner.id,
        sport_id=sport.id,
        remaining_player_slots=needed_players,
        match_status=announcement_status,
        start_time=st,
        end_time=et,
        created_at=now,
    )
    ann.owner = owner
    ann.sport = sport
    ann.play_requests = []
    return ann


def test_create_announcement_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Football", max_players=11)
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=2)

    announcement = _make_announcement(
        mock_user_1, sport, start_time=start, end_time=end
    )

    mock_db.get.return_value = sport
    mock_db.scalar.return_value = announcement
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "title": "Weekend football",
        "sport_id": str(sport.id),
        "remaining_player_slots": 3,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }
    res = client.post("/match-announcements", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] == str(announcement.id)
    assert data["title"] == "Looking for players"
    assert data["match_status"] == "upcoming"
    assert (
        data["remaining_player_slots"] == announcement.remaining_player_slots
    )
    assert data["owner"]["id"] == str(mock_user_1.id)
    assert data["sport"]["id"] == str(sport.id)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_create_announcement_sport_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=2)
    payload = {
        "title": "Weekend football",
        "sport_id": str(uuid.uuid4()),
        "remaining_player_slots": 3,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }
    res = client.post("/match-announcements", json=payload)
    assert res.status_code == 404
    assert res.json()["detail"] == "Sport not found"

    app.dependency_overrides.clear()


def test_create_announcement_invalid_time_range(mock_user_1, mock_db):
    client = TestClient(app)

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start - timedelta(hours=1)  # end before start
    payload = {
        "title": "Weekend football",
        "sport_id": str(uuid.uuid4()),
        "remaining_player_slots": 3,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }
    res = client.post("/match-announcements", json=payload)
    assert res.status_code == 422

    app.dependency_overrides.clear()


def test_search_announcements_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    ann1 = _make_announcement(mock_user_1, sport)
    ann2 = _make_announcement(mock_user_1, sport)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [ann1, ann2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/match-announcements?sport_id={sport.id}")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2
    assert data["next_offset"] is None

    app.dependency_overrides.clear()


def test_search_announcements_pagination(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    ann1 = _make_announcement(mock_user_1, sport)
    ann2 = _make_announcement(mock_user_1, sport)

    # limit=1 with 2 items returned simulates extra item for next page
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [ann1, ann2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/match-announcements?limit=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["next_offset"] == 1

    app.dependency_overrides.clear()


def test_search_announcements_with_offset(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    ann1 = _make_announcement(mock_user_1, sport)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [ann1]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/match-announcements?offset=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1

    app.dependency_overrides.clear()


def test_search_announcements_invalid_slot_range(mock_user_1, mock_db):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(
        "/match-announcements?min_remaining_player_slots=5&"
        "max_remaining_player_slots=2"
    )

    assert res.status_code == 422
    app.dependency_overrides.clear()


def test_get_announcement_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    announcement = _make_announcement(mock_user_1, sport)
    accepted_player = PlayerRequest(
        id=uuid.uuid4(),
        announcement_id=announcement.id,
        sender_id=uuid.uuid4(),
        status=PlayerRequestStatusEnum.accepted,
        created_at=datetime.now(timezone.utc),
    )
    accepted_player.sender = mock_user_1
    announcement.play_requests = [accepted_player]

    mock_db.scalar.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/match-announcements/{announcement.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(announcement.id)
    assert data["owner"]["id"] == str(mock_user_1.id)
    assert data["accepted_players"][0]["id"] == str(mock_user_1.id)

    app.dependency_overrides.clear()


def test_get_announcement_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/match-announcements/{uuid.uuid4()}")
    assert res.status_code == 404
    assert res.json()["detail"] == "Announcement not found"

    app.dependency_overrides.clear()


def test_update_announcement_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    announcement = _make_announcement(mock_user_1, sport)

    # _get_or_404 is called twice: before update and after commit
    mock_db.scalar.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"title": "Updated title"}
    res = client.patch(f"/match-announcements/{announcement.id}", json=payload)
    assert res.status_code == 200
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_update_announcement_forbidden_non_owner(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    # announcement owned by mock_user_2
    announcement = _make_announcement(mock_user_2, sport)

    mock_db.scalar.return_value = announcement

    # logged in as mock_user_1
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"match_status": "canceled"}
    res = client.patch(f"/match-announcements/{announcement.id}", json=payload)
    assert res.status_code == 403
    assert res.json()["detail"] == "Not the owner"

    app.dependency_overrides.clear()


def test_update_announcement_sport_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    announcement = _make_announcement(mock_user_1, sport)

    mock_db.scalar.return_value = announcement
    mock_db.get.return_value = None  # Sport not found

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"sport_id": str(uuid.uuid4())}
    res = client.patch(f"/match-announcements/{announcement.id}", json=payload)
    assert res.status_code == 404
    assert res.json()["detail"] == "Sport not found"

    app.dependency_overrides.clear()


def test_update_announcement_invalid_time_range(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    now = datetime.now(timezone.utc)
    announcement = _make_announcement(
        mock_user_1,
        sport,
        start_time=now + timedelta(hours=2),
        end_time=now + timedelta(hours=4),
    )

    mock_db.scalar.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    # Try setting end_time earlier than start_time
    payload = {"end_time": (now + timedelta(hours=1)).isoformat()}
    res = client.patch(f"/match-announcements/{announcement.id}", json=payload)
    assert res.status_code == 422
    assert "end_time must be after start_time" in res.json()["detail"]

    app.dependency_overrides.clear()


def test_delete_announcement_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    announcement = _make_announcement(mock_user_1, sport)

    mock_db.scalar.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/match-announcements/{announcement.id}")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(announcement)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_delete_announcement_forbidden_non_owner(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball")
    announcement = _make_announcement(mock_user_2, sport)

    mock_db.scalar.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/match-announcements/{announcement.id}")
    assert res.status_code == 403
    assert res.json()["detail"] == "Not the owner"

    app.dependency_overrides.clear()


def test_cancel_announcement_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport = Sport(id=uuid.uuid4(), name="Basketball", max_players=11)
    announcement = _make_announcement(mock_user_1, sport)
    mock_db.scalar.return_value = announcement

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.patch(
        f"/match-announcements/{announcement.id}",
        json={"match_status": "canceled"},
    )
    assert res.status_code == 200
    assert announcement.match_status == MatchAnnouncementStatus.canceled

    app.dependency_overrides.clear()
