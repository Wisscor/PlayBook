import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.core.error_codes import ErrorCode
from app.database.database import get_db
from app.main import app


@pytest.fixture
def signup_client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)


def signup_payload():
    return {
        "firstname": "Alice",
        "lastname": "Smith",
        "username": "alice_smith",
        "email": "alice@example.com",
        "password": "password123",
    }


def lookup_results(*users):
    results = []
    for user in users:
        result = MagicMock()
        result.scalar_one_or_none.return_value = user
        results.append(result)
    return results


@pytest.mark.parametrize("field", ["email", "username"])
def test_signup_reports_awaited_duplicate_checks(signup_client, mock_db, field):
    existing = object()
    mock_db.execute.side_effect = lookup_results(
        *([existing] if field == "email" else [None, existing])
    )

    response = signup_client.post("/auth/signup", json=signup_payload())

    assert response.status_code == 409
    error = response.json()["error"]
    assert error["code"] == (
        ErrorCode.EMAIL_ALREADY_EXISTS.value if field == "email"
        else ErrorCode.USERNAME_ALREADY_EXISTS.value
    )
    assert error["field"] == field
    mock_db.commit.assert_not_awaited()


def test_signup_preserves_database_conflict_handling(signup_client, mock_db):
    mock_db.execute.side_effect = lookup_results(None, None)
    mock_db.commit.side_effect = IntegrityError("duplicate key", params=None, orig=None)

    response = signup_client.post("/auth/signup", json=signup_payload())

    assert response.status_code == 409
    assert response.json()["error"]["code"] == ErrorCode.RESOURCE_CONFLICT.value
    mock_db.rollback.assert_awaited_once()


def test_signup_still_creates_new_users(signup_client, mock_db):
    mock_db.execute.side_effect = lookup_results(None, None)

    async def refresh(user):
        user.id = uuid.uuid4()
        user.created_at = datetime.now(timezone.utc)
        user.bio = ""

    mock_db.refresh.side_effect = refresh

    response = signup_client.post("/auth/signup", json=signup_payload())

    assert response.status_code == 200
    assert response.json()["username"] == "alice_smith"
    assert mock_db.execute.await_count == 2
    mock_db.commit.assert_awaited_once()
