import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from app.realtime import frames
from app.realtime.models import Notification
from app.realtime.services.notifications import (
    notification_dict,
    notification_payload,
    unread_duplicate_exists,
)
from app.realtime.notify import emit_notifications


def test_notification_responses_omit_internal_target_fields():
    notification = Notification(
        id=uuid4(),
        user_id=uuid4(),
        actor_id=uuid4(),
        event_type="follow",
        target_id=uuid4(),
        match_time=None,
        read_at=None,
        created_at=datetime.now(timezone.utc),
    )

    response = notification_dict(notification, "alice")
    websocket_payload = notification_payload(notification, "alice")

    assert "target_id" not in response
    assert "target_type" not in response
    assert "target_id" not in websocket_payload
    assert notification.target_id is not None
    assert response["actor_username"] == "alice"
    assert response["match_time"] is None
    assert websocket_payload["type"] == frames.NOTIFICATION


def test_match_notification_includes_match_time():
    match_time = datetime(2026, 10, 22, 18, 30, tzinfo=timezone.utc)
    notification = Notification(
        id=uuid4(),
        user_id=uuid4(),
        actor_id=uuid4(),
        event_type="match_cancelled",
        target_id=uuid4(),
        match_time=match_time,
        read_at=None,
        created_at=datetime.now(timezone.utc),
    )

    assert notification_dict(notification, "organizer")["match_time"] == (
        match_time.isoformat()
    )


def test_emit_notifications_fans_out_to_unique_users(monkeypatch):
    from app.realtime import notify

    emit_one = AsyncMock()
    monkeypatch.setattr(notify, "emit_notification", emit_one)
    actor_id = uuid4()
    user_ids = [uuid4(), uuid4()]
    match_time = datetime.now(timezone.utc)

    asyncio.run(
        emit_notifications(
            event_type="match_cancelled",
            actor_id=actor_id,
            target_user_ids=[*user_ids, user_ids[0]],
            target_id=uuid4(),
            match_time=match_time,
        )
    )

    assert emit_one.await_count == 2
    assert {call.kwargs["target_user_id"] for call in emit_one.await_args_list} == set(
        user_ids
    )


def test_unread_duplicate_check_is_scoped_to_target():
    db = AsyncMock()
    query_result = MagicMock()
    query_result.first.return_value = None
    db.execute.return_value = query_result
    user_id = uuid4()
    actor_id = uuid4()
    post_id = uuid4()

    assert not asyncio.run(
        unread_duplicate_exists(db, user_id, actor_id, "follow", post_id)
    )

    statement = db.execute.await_args.args[0]
    compiled = statement.compile()
    sql = str(compiled)
    assert "notifications.target_id" in sql
    assert post_id in compiled.params.values()
