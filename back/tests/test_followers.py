import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.models import Follower
from app.realtime import service, frames
from app.realtime import registry


def test_follow_user_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    # 1. target_user -> mock_user_2
    # 2. existing follow edge -> None
    mock_db.scalar.side_effect = [mock_user_2, None]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/users/{mock_user_2.id}/follow")
    assert res.status_code == 201
    data = res.json()
    assert data["following"] is True
    assert data["user_id"] == str(mock_user_2.id)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_follow_self_rejected(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    res = client.post(f"/users/{mock_user_1.id}/follow")
    assert res.status_code == 400
    assert "cannot follow yourself" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_follow_target_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    nonexistent_id = uuid.uuid4()
    res = client.post(f"/users/{nonexistent_id}/follow")
    assert res.status_code == 404
    assert "user not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_follow_already_following(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    # 1. target_user -> mock_user_2
    # 2. existing follow edge -> Follower instance
    mock_db.scalar.side_effect = [
        mock_user_2,
        Follower(follower_id=mock_user_1.id, following_id=mock_user_2.id),
    ]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/users/{mock_user_2.id}/follow")
    assert res.status_code == 409
    assert "already following" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_unfollow_user_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    follower_edge = Follower(follower_id=mock_user_1.id, following_id=mock_user_2.id)
    mock_db.scalar.return_value = follower_edge

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/users/{mock_user_2.id}/follow")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(follower_edge)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_unfollow_self_rejected(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    res = client.delete(f"/users/{mock_user_1.id}/follow")
    assert res.status_code == 400
    assert "cannot unfollow yourself" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_unfollow_not_following(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/users/{mock_user_2.id}/follow")
    assert res.status_code == 404
    assert "not following" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_get_followers_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = mock_user_2  # target user exists

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_user_1]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_2.id}/followers")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["id"] == str(mock_user_1.id)
    assert data[0]["username"] == mock_user_1.username

    app.dependency_overrides.clear()


def test_get_followers_target_not_found(mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.get(f"/users/{random_id}/followers")
    assert res.status_code == 404
    assert "user not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_get_following_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = mock_user_1  # target user exists

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_user_2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_1.id}/following")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["id"] == str(mock_user_2.id)
    assert data[0]["username"] == mock_user_2.username

    app.dependency_overrides.clear()


def test_get_following_target_not_found(mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.get(f"/users/{random_id}/following")
    assert res.status_code == 404
    assert "user not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mutual_follow_exists_checks_both_directions(mock_db):
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    mock_db.scalar.side_effect = [1, 1]

    result = await service.mutual_follow_exists(mock_db, user_a, user_b)

    assert result is True
    assert mock_db.scalar.call_count == 2


def test_create_realtime_conversation_requires_mutual_follow(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = mock_user_2

    execute_result = MagicMock()
    execute_result.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = execute_result
    mock_db.scalar.side_effect = [0, 0]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post("/realtime/conversations", json={"peer_id": str(mock_user_2.id)})

    assert res.status_code == 403
    assert "follow each other" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_registry_connections_for_returns_a_copy():
    user_id = uuid.uuid4()
    ws = MagicMock()
    registry._connections[user_id] = {ws}

    result = registry.connections_for(user_id)
    result.add(MagicMock())

    assert len(registry._connections[user_id]) == 1
    assert ws in registry._connections[user_id]


def test_conversation_new_payload_has_expected_shape(mock_user_1):
    payload = service.conversation_new_payload(
        uuid.uuid4(), mock_user_1.id, mock_user_1.username
    )

    assert payload["type"] == frames.CONVERSATION_NEW
    assert payload["id"]
    assert payload["peer_id"] == str(mock_user_1.id)
    assert payload["peer_username"] == mock_user_1.username
