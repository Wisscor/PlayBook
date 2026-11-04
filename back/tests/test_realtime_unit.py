from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest

from app.core.config import settings
from app.realtime import frames, registry
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
async def test_authenticate_socket_returns_user_and_session_id(mock_db, user):
    session = MagicMock(
        id=uuid.uuid4(),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    websocket = MagicMock()
    websocket.cookies = {settings.session_cookie_name: str(session.id)}
    session_result = MagicMock()
    session_result.scalar_one_or_none.return_value = session
    user_result = MagicMock()
    user_result.scalar_one_or_none.return_value = user
    mock_db.execute.side_effect = [session_result, user_result]

    assert await authenticate_socket(websocket, mock_db) == (user, session.id)


@pytest.mark.asyncio
@pytest.mark.parametrize("all_sessions", [False, True])
async def test_revocation_closes_only_the_selected_sockets(all_sessions):
    user_id, other_user_id = uuid.uuid4(), uuid.uuid4()
    session_id, other_session_id = uuid.uuid4(), uuid.uuid4()
    sockets = [MagicMock(close=AsyncMock()) for _ in range(4)]
    registrations = [
        (user_id, sockets[0], session_id),
        (user_id, sockets[1], session_id),
        (user_id, sockets[2], other_session_id),
        (other_user_id, sockets[3], uuid.uuid4()),
    ]
    for registration in registrations:
        registry.register(*registration)
    try:
        if all_sessions:
            await registry.close_user(user_id)
        else:
            await registry.close_user(user_id, session_id=session_id)

        closed = sockets[:3] if all_sessions else sockets[:2]
        for socket in closed:
            socket.close.assert_awaited_once_with(
                code=frames.CLOSE_SESSION_ENDED, reason="session ended"
            )
        for socket in sockets[len(closed):]:
            socket.close.assert_not_awaited()
        assert registry.connections_for(user_id) == (
            set() if all_sessions else {sockets[2]}
        )
        assert registry.connections_for(other_user_id) == {sockets[3]}
    finally:
        for owner, socket, _ in registrations:
            registry.unregister(owner, socket)


@pytest.mark.asyncio
async def test_create_notification_adds_and_commits(mock_db, user, other_user):
    notification = await notifications.create_notification(
        mock_db, user.id, other_user.id, "follow"
    )

    assert notification.user_id == user.id
    assert notification.actor_id == other_user.id
    mock_db.add.assert_called_once_with(notification)
    mock_db.commit.assert_awaited_once()
