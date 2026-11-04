from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest
from fastapi import Request

from app.core.deps import get_curr_session
from app.core.error_codes import ErrorCode
from app.core.exceptions import ApiException
from app.models import Session
from app.services.session_service import create_session_service

CHROME_LINUX_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def make_request(
    user_agent: str | None, client_host: str | None = "127.0.0.1"
):
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/auth/login",
        "headers": (
            [(b"user-agent", user_agent.encode())]
            if user_agent is not None
            else []
        ),
        "client": (client_host, 12345) if client_host is not None else None,
        "query_string": b"",
        "server": ("testserver", 80),
        "scheme": "http",
    }
    return Request(scope)


@pytest.mark.asyncio
async def test_create_session_stores_ip_and_parsed_device_metadata():
    db = AsyncMock()
    db.add = MagicMock()
    user_id = uuid.uuid4()
    request = make_request(CHROME_LINUX_USER_AGENT, "197.53.45.23")

    session = await create_session_service(db, user_id, request)

    assert isinstance(session, Session)
    assert session.user_id == user_id
    assert session.ip_address == "197.53.45.23"
    assert session.user_agent == CHROME_LINUX_USER_AGENT
    assert session.platform == "Linux"
    assert session.browser == "Chrome"
    assert session.expires_at > datetime.now(timezone.utc)
    db.add.assert_called_once_with(session)
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_session_allows_missing_user_agent_and_client():
    db = AsyncMock()
    db.add = MagicMock()

    session = await create_session_service(
        db,
        uuid.uuid4(),
        make_request(None, None),
    )

    assert session.ip_address is None
    assert session.user_agent is None
    assert session.platform is None
    assert session.browser is None
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_current_session_requires_cookie():
    with pytest.raises(ApiException) as caught:
        await get_curr_session(None, AsyncMock())

    assert caught.value.code == ErrorCode.AUTHENTICATION_REQUIRED


@pytest.mark.asyncio
async def test_get_current_session_rejects_unknown_session():
    db = AsyncMock()
    db.scalar.return_value = None

    with pytest.raises(ApiException) as caught:
        await get_curr_session(uuid.uuid4(), db)

    assert caught.value.code == ErrorCode.AUTHENTICATION_REQUIRED
    db.scalar.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_current_session_deletes_expired_session():
    db = AsyncMock()
    expired_session = Session(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    db.scalar.return_value = expired_session

    with pytest.raises(ApiException) as caught:
        await get_curr_session(expired_session.id, db)

    assert caught.value.code == ErrorCode.AUTHENTICATION_REQUIRED
    db.delete.assert_awaited_once_with(expired_session)
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_current_session_returns_active_session():
    db = AsyncMock()
    active_session = Session(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=1),
    )
    db.scalar.return_value = active_session

    result = await get_curr_session(active_session.id, db)

    assert result is active_session
    db.delete.assert_not_awaited()
    db.commit.assert_not_awaited()
