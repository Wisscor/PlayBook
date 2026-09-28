import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.models import Follower


def test_get_my_profile(mock_user_1, mock_db):
    client = TestClient(app)

    # 1. followers_count scalar -> 5
    # 2. following_count scalar -> 3
    mock_db.scalar.side_effect = [5, 3]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/users/me")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(mock_user_1.id)
    assert data["username"] == mock_user_1.username
    assert data["followers_count"] == 5
    assert data["following_count"] == 3
    assert data["is_following"] is None

    app.dependency_overrides.clear()


def test_update_my_profile(mock_user_1, mock_db):
    client = TestClient(app)

    async def mock_refresh(user):
        pass

    mock_db.refresh.side_effect = mock_refresh
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "firstname": "Johnny",
        "bio": "Updated athletic bio",
    }
    res = client.patch("/users/me", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["firstname"] == "Johnny"
    assert data["bio"] == "Updated athletic bio"
    assert mock_user_1.firstname == "Johnny"
    assert mock_user_1.bio == "Updated athletic bio"

    app.dependency_overrides.clear()


def test_delete_my_profile(mock_user_1, mock_db):
    client = TestClient(app)

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete("/users/me")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(mock_user_1)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_get_user_by_id_found_is_following_true(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    # 1. target_user -> mock_user_2
    # 2. followers_count -> 10
    # 3. following_count -> 8
    # 4. is_following_edge -> Follower instance
    mock_db.scalar.side_effect = [
        mock_user_2,
        10,
        8,
        Follower(follower_id=mock_user_1.id, following_id=mock_user_2.id),
    ]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_2.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(mock_user_2.id)
    assert data["username"] == mock_user_2.username
    assert data["followers_count"] == 10
    assert data["following_count"] == 8
    assert data["is_following"] is True

    app.dependency_overrides.clear()


def test_get_user_by_id_found_is_following_false(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    # 1. target_user -> mock_user_2
    # 2. followers_count -> 0
    # 3. following_count -> 2
    # 4. is_following_edge -> None
    mock_db.scalar.side_effect = [
        mock_user_2,
        0,
        2,
        None,
    ]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_2.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(mock_user_2.id)
    assert data["is_following"] is False

    app.dependency_overrides.clear()


def test_get_user_by_id_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.get(f"/users/{random_id}")
    assert res.status_code == 404
    assert "user not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_get_user_invalid_uuid(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    res = client.get("/users/not-a-valid-uuid")
    assert res.status_code == 422

    app.dependency_overrides.clear()


def test_search_users_matching(mock_user_2, mock_db):
    client = TestClient(app)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_user_2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/users?search=sarah")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["username"] == mock_user_2.username
    assert data[0]["firstname"] == mock_user_2.firstname

    app.dependency_overrides.clear()


def test_search_users_empty(mock_db):
    client = TestClient(app)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/users?search=no_one")
    assert res.status_code == 200
    assert res.json() == []

    app.dependency_overrides.clear()


def test_search_users_pagination(mock_db):
    client = TestClient(app)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/users?limit=10&offset=5")
    assert res.status_code == 200
    assert res.json() == []

    app.dependency_overrides.clear()
