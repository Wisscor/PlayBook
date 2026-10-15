import uuid
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.models.sport import Sport
from app.models.user_sport import UserSport
from app.models.user import User


def test_list_sports_success(mock_user_1, mock_db):
    client = TestClient(app)

    sport1 = Sport(id=uuid.uuid4(), name="Basketball")
    sport2 = Sport(id=uuid.uuid4(), name="Football")

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [sport1, sport2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/sports")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["id"] == str(sport1.id)
    assert data[0]["name"] == "Basketball"
    assert data[1]["id"] == str(sport2.id)
    assert data[1]["name"] == "Football"

    app.dependency_overrides.clear()


def test_list_user_sports_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    sport = Sport(id=uuid.uuid4(), name="Football")
    mock_db.get.return_value = mock_user_2

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [sport]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_2.id}/sports")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["id"] == str(sport.id)
    assert data[0]["name"] == "Football"

    app.dependency_overrides.clear()


def test_list_user_sports_user_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{uuid.uuid4()}/sports")
    assert res.status_code == 404
    assert res.json()["detail"] == "User not found"

    app.dependency_overrides.clear()


def test_add_my_sport_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport_id = uuid.uuid4()
    sport = Sport(id=sport_id, name="Basketball")

    # 1. db.get(Sport, sport_id) -> sport
    # 2. db.get(UserSport, (me.id, sport_id)) -> None
    mock_db.get.side_effect = [sport, None]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.put(f"/users/me/sports/{sport_id}")
    assert res.status_code == 204
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_add_my_sport_already_exists_idempotent(mock_user_1, mock_db):
    client = TestClient(app)
    sport_id = uuid.uuid4()
    sport = Sport(id=sport_id, name="Basketball")
    existing_link = UserSport(user_id=mock_user_1.id, sport_id=sport_id)

    # 1. db.get(Sport, sport_id) -> sport
    # 2. db.get(UserSport, (me.id, sport_id)) -> existing_link
    mock_db.get.side_effect = [sport, existing_link]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.put(f"/users/me/sports/{sport_id}")
    assert res.status_code == 204
    mock_db.add.assert_not_called()

    app.dependency_overrides.clear()


def test_add_my_sport_integrity_error_handled(mock_user_1, mock_db):
    client = TestClient(app)
    sport_id = uuid.uuid4()
    sport = Sport(id=sport_id, name="Basketball")

    mock_db.get.side_effect = [sport, None]
    mock_db.commit.side_effect = IntegrityError(None, None, Exception())

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.put(f"/users/me/sports/{sport_id}")
    assert res.status_code == 204
    mock_db.rollback.assert_called_once()

    app.dependency_overrides.clear()


def test_add_my_sport_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.put(f"/users/me/sports/{uuid.uuid4()}")
    assert res.status_code == 404
    assert res.json()["detail"] == "Sport not found"

    app.dependency_overrides.clear()


def test_remove_my_sport_success(mock_user_1, mock_db):
    client = TestClient(app)
    sport_id = uuid.uuid4()
    sport = Sport(id=sport_id, name="Basketball")
    link = UserSport(user_id=mock_user_1.id, sport_id=sport_id)

    mock_db.get.side_effect = [sport, link]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/users/me/sports/{sport_id}")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(link)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_remove_my_sport_not_assigned(mock_user_1, mock_db):
    client = TestClient(app)
    sport_id = uuid.uuid4()
    sport = Sport(id=sport_id, name="Basketball")

    # Sport exists, but user doesn't have it
    mock_db.get.side_effect = [sport, None]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/users/me/sports/{sport_id}")
    assert res.status_code == 204
    mock_db.delete.assert_not_called()

    app.dependency_overrides.clear()


def test_remove_my_sport_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/users/me/sports/{uuid.uuid4()}")
    assert res.status_code == 404
    assert res.json()["detail"] == "Sport not found"

    app.dependency_overrides.clear()
