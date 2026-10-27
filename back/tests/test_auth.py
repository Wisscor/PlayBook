import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.core.config import settings
from app.models import Session
from app.realtime import registry


def test_signup_success(mock_db):
    client = TestClient(app)

    async def mock_refresh(user):
        user.id = uuid.uuid4()
        user.created_at = datetime.now(timezone.utc)

    mock_db.refresh.side_effect = mock_refresh
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "firstname": "Alice",
        "lastname": "Smith",
        "username": "alice_smith",
        "email": "alice@example.com",
        "password": "password123",
        "bio": "Triathlete and marathon runner",
    }
    res = client.post("/auth/signup", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "alice_smith"
    assert data["email"] == "alice@example.com"
    assert "password" not in data
    assert "hashed_password" not in data
    assert "id" in data

    app.dependency_overrides.clear()


def test_signup_duplicate_username_or_email(mock_db):
    client = TestClient(app)
    mock_db.commit.side_effect = IntegrityError(
        "duplicate key", params=None, orig=None
    )
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "firstname": "Alice",
        "lastname": "Smith",
        "username": "alice_smith",
        "email": "alice@example.com",
        "password": "password123",
    }
    res = client.post("/auth/signup", json=payload)
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_signup_validation_error():
    client = TestClient(app)
    # Password too short (< 8 chars) and invalid email
    payload = {
        "firstname": "Al",  # min_length 3
        "lastname": "Sm",
        "username": "al",
        "email": "not-an-email",
        "password": "short",
    }
    res = client.post("/auth/signup", json=payload)
    assert res.status_code == 422


def test_login_success(mock_user_1, test_password, mock_db):
    client = TestClient(app)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user_1
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "email": mock_user_1.email,
        "password": test_password,
    }
    res = client.post("/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == mock_user_1.username
    assert data["email"] == mock_user_1.email

    # Verify session cookie was set
    assert settings.session_cookie_name in res.cookies

    app.dependency_overrides.clear()


def test_login_invalid_password(mock_user_1, mock_db):
    client = TestClient(app)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user_1
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "email": mock_user_1.email,
        "password": "wrong_password_123",
    }
    res = client.post("/auth/login", json=payload)
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_login_user_not_found(mock_db):
    client = TestClient(app)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "email": "nobody@example.com",
        "password": "any_password",
    }
    res = client.post("/auth/login", json=payload)
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_logout_success(mock_user_1, mock_db, monkeypatch):
    client = TestClient(app)
    session_id = uuid.uuid4()
    session_obj = Session(
        id=session_id,
        user_id=mock_user_1.id,
        expires_at=datetime.now(timezone.utc),
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = session_obj
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    close_user = AsyncMock()
    monkeypatch.setattr(registry, "close_user", close_user)

    client.cookies.set(settings.session_cookie_name, str(session_id))
    res = client.post("/auth/logout")
    assert res.status_code == 200
    assert res.json()["message"] == "Logout successful"
    close_user.assert_awaited_once_with(mock_user_1.id)

    app.dependency_overrides.clear()


def test_logout_unauthenticated():
    client = TestClient(app)
    res = client.post("/auth/logout")
    assert res.status_code == 401
    assert "not authenticated" in res.json()["detail"].lower()


def test_logout_invalid_uuid():
    client = TestClient(app)
    client.cookies.set(settings.session_cookie_name, "invalid-uuid-format")
    res = client.post("/auth/logout")
    assert res.status_code == 400
    assert "invalid session id format" in res.json()["detail"].lower()


def test_logout_session_not_found(mock_db):
    client = TestClient(app)
    session_id = uuid.uuid4()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db

    client.cookies.set(settings.session_cookie_name, str(session_id))
    res = client.post("/auth/logout")
    assert res.status_code == 401
    assert "invalid session" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_read_current_user_me(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    res = client.get("/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(mock_user_1.id)
    assert data["username"] == mock_user_1.username
    assert data["email"] == mock_user_1.email

    app.dependency_overrides.clear()
