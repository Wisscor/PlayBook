from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock
import uuid

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.deps import get_curr_user
from app.core.error_codes import ErrorCode, ERROR_STATUS
from app.core.exception_handlers import register_exception_handlers
from app.core.exceptions import ApiException
from app.core.security import hash_password, verify_password
from app.models import Session


def test_password_hash_is_not_reversible_and_verifies():
    hashed = hash_password("password123")

    assert hashed != "password123"
    assert verify_password("password123", hashed)
    assert not verify_password("incorrect", hashed)


def test_error_codes_have_http_statuses():
    assert ERROR_STATUS[ErrorCode.AUTHENTICATION_REQUIRED] == 401
    assert ERROR_STATUS[ErrorCode.PERMISSION_DENIED] == 403
    assert ERROR_STATUS[ErrorCode.USER_NOT_FOUND] == 404
    assert ERROR_STATUS[ErrorCode.RESOURCE_CONFLICT] == 409
    assert ERROR_STATUS[ErrorCode.REQUEST_ALREADY_DECIDED] == 409
    assert ERROR_STATUS[ErrorCode.ANNOUNCEMENT_FULL] == 409


def test_api_exception_handler_returns_public_error_envelope():
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/failure")
    async def failure():
        raise ApiException(code=ErrorCode.USER_NOT_FOUND, field="user_id")

    response = TestClient(app).get("/failure")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "USER_NOT_FOUND"
    assert response.json()["error"]["field"] == "user_id"


@pytest.mark.asyncio
async def test_get_current_user_rejects_missing_session(mock_db):
    with pytest.raises(ApiException) as caught:
        await get_curr_user(None, mock_db)

    assert caught.value.code == ErrorCode.AUTHENTICATION_REQUIRED
    mock_db.scalar.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_current_user_removes_expired_session(
    mock_db, user, monkeypatch
):
    session = Session(
        id=uuid.uuid4(),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
    )
    mock_db.scalar.return_value = session
    close_user = AsyncMock()
    monkeypatch.setattr("app.core.deps.registry.close_user", close_user)

    with pytest.raises(ApiException) as caught:
        await get_curr_user(session.id, mock_db)

    assert caught.value.code == ErrorCode.AUTHENTICATION_REQUIRED
    mock_db.delete.assert_awaited_once_with(session)
    mock_db.commit.assert_awaited_once()
    close_user.assert_awaited_once_with(user.id)


@pytest.mark.asyncio
async def test_get_current_user_returns_user_for_valid_session(mock_db, user):
    session = Session(
        id=uuid.uuid4(),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    mock_db.scalar.side_effect = [session, user]

    assert await get_curr_user(session.id, mock_db) is user
