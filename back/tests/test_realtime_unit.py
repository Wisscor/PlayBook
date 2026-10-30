from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest

from app.core.config import settings
from app.realtime import frames
from app.realtime.limits import SlidingWindow
from app.realtime.models import Notification
from app.realtime.services import conversations, notifications
from app.realtime.ws_auth import authenticate_socket


def test_sliding_window_discards_hits_outside_span():
    window = SlidingWindow(span=10)

    assert window.hit(0) == 1
    assert window.hit(5) == 2
    assert window.hit(11) == 2
    assert window.hit(20) == 2


def test_notification_payload_serializes_optional_fields():
    notification = Notification(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        actor_id=uuid.uuid4(),
        event_type="match.created",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        match_time=datetime(2026, 1, 2, tzinfo=timezone.utc),
    )

    payload = notifications.notification_payload(notification, "alice")

    assert payload["type"] == frames.NOTIFICATION
    assert payload["actor_username"] == "alice"
    assert payload["match_time"].startswith("2026-01-02")
    assert payload["read_at"] is None


@pytest.mark.asyncio
async def test_mutual_follow_requires_both_edges(mock_db):
    mock_db.scalar.side_effect = [1, 0]

    assert not await conversations.mutual_follow_exists(
        mock_db, uuid.uuid4(), uuid.uuid4()
    )
    assert mock_db.scalar.await_count == 2


@pytest.mark.asyncio
async def test_authenticate_socket_rejects_missing_cookie():
    websocket = MagicMock()
    websocket.cookies = {}
    websocket.close = AsyncMock()
    db = AsyncMock()

    assert await authenticate_socket(websocket, db) is None
    websocket.close.assert_awaited_once_with(code=frames.CLOSE_AUTH_FAILED)
    db.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_authenticate_socket_rejects_invalid_cookie():
    websocket = MagicMock()
    websocket.cookies = {settings.session_cookie_name: "bad"}
    websocket.close = AsyncMock()
    db = AsyncMock()

    assert await authenticate_socket(websocket, db) is None
    websocket.close.assert_awaited_once_with(code=frames.CLOSE_AUTH_FAILED)


@pytest.mark.asyncio
async def test_create_notification_adds_and_commits(mock_db, user, other_user):
    notification = await notifications.create_notification(
        mock_db, user.id, other_user.id, "follow"
    )

    assert notification.user_id == user.id
    assert notification.actor_id == other_user.id
    mock_db.add.assert_called_once_with(notification)
    mock_db.commit.assert_awaited_once()
