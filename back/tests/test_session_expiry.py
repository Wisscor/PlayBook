from collections import defaultdict
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.core.deps import get_curr_user
from app.core.error_codes import ErrorCode
from app.core.exceptions import ApiException
from app.realtime import frames, registry


@pytest.mark.asyncio
@pytest.mark.parametrize("expired", [True, False])
async def test_http_session_expiry_closes_user_sockets_only_when_expired(monkeypatch, expired):
    monkeypatch.setattr(registry, "_connections", defaultdict(set))
    user_id, other_user_id, session_id = uuid4(), uuid4(), uuid4()
    user = SimpleNamespace(id=user_id)
    session = SimpleNamespace(
        id=session_id,
        user_id=user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=-1 if expired else 1),
    )
    session_result, user_result = MagicMock(), MagicMock()
    session_result.scalar_one_or_none.return_value = session
    user_result.scalar_one_or_none.return_value = user
    db = AsyncMock()
    db.execute.side_effect = [session_result, user_result]
    sockets = [AsyncMock(), AsyncMock()]
    other_socket = AsyncMock()
    for socket in sockets:
        registry.register(user_id, socket)
    registry.register(other_user_id, other_socket)

    if expired:
        with pytest.raises(ApiException) as error:
            await get_curr_user(session_id=session_id, db=db)
        assert error.value.code == ErrorCode.AUTHENTICATION_REQUIRED
        db.delete.assert_awaited_once_with(session)
        db.commit.assert_awaited_once()
        assert db.execute.await_count == 1
        assert not registry.connections_for(user_id)
        for socket in sockets:
            socket.close.assert_awaited_once_with(
                code=frames.CLOSE_SESSION_ENDED, reason="session ended",
            )
    else:
        assert await get_curr_user(session_id=session_id, db=db) is user
        db.delete.assert_not_awaited()
        db.commit.assert_not_awaited()
        assert registry.connections_for(user_id) == set(sockets)
        for socket in sockets:
            socket.close.assert_not_awaited()

    assert registry.connections_for(other_user_id) == {other_socket}
    other_socket.close.assert_not_awaited()
