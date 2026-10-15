import uuid
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.models import Like


def test_like_post_success(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    # 1. target post -> mock_post
    # 2. existing like -> None
    mock_db.scalar.side_effect = [mock_post, None]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/posts/{mock_post.id}/like")
    assert res.status_code == 201
    data = res.json()
    assert data["liked"] is True
    assert data["post_id"] == str(mock_post.id)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_like_post_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.post(f"/posts/{random_id}/like")
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_like_post_already_liked(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    # 1. target post -> mock_post
    # 2. existing like -> Like instance
    mock_db.scalar.side_effect = [
        mock_post,
        Like(user_id=mock_user_1.id, post_id=mock_post.id),
    ]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.post(f"/posts/{mock_post.id}/like")
    assert res.status_code == 409
    assert "already liked" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_unlike_post_success(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    existing_like = Like(user_id=mock_user_1.id, post_id=mock_post.id)
    # 1. target post -> mock_post
    # 2. existing like -> existing_like
    mock_db.scalar.side_effect = [mock_post, existing_like]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/posts/{mock_post.id}/like")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(existing_like)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_unlike_post_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.delete(f"/posts/{random_id}/like")
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_unlike_post_not_liked(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    # 1. target post -> mock_post
    # 2. existing like -> None
    mock_db.scalar.side_effect = [mock_post, None]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/posts/{mock_post.id}/like")
    assert res.status_code == 404
    assert "like not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_get_post_likes_success(mock_user_1, mock_user_2, mock_post, mock_db):
    client = TestClient(app)

    # 1. target post -> mock_post
    mock_db.scalar.return_value = mock_post

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_user_1, mock_user_2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/posts/{mock_post.id}/likes")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["id"] == str(mock_user_1.id)
    assert data[0]["username"] == mock_user_1.username
    assert data[1]["id"] == str(mock_user_2.id)
    assert data[1]["username"] == mock_user_2.username

    app.dependency_overrides.clear()


def test_get_post_likes_post_not_found(mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.get(f"/posts/{random_id}/likes")
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_get_post_likes_pagination(mock_post, mock_db):
    client = TestClient(app)

    mock_db.scalar.return_value = mock_post
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/posts/{mock_post.id}/likes?limit=10&offset=5")
    assert res.status_code == 200
    assert res.json() == []

    app.dependency_overrides.clear()

