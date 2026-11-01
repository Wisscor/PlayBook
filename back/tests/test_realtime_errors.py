import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import WebSocketDisconnect
from sqlalchemy.exc import IntegrityError

from app.realtime import frames, handlers, notify, ws
from app.realtime.limits import SlidingWindow


def connection_context(socket):
    return handlers.ConnectionContext(
        websocket=socket,
        user=SimpleNamespace(id=uuid4()),
        last_seen=0,
        inbound_frames=SlidingWindow(10),
        sends=SlidingWindow(10),
        strikes=SlidingWindow(60),
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("error_class", [IntegrityError, RuntimeError])
async def test_failed_message_commit_is_logged_and_reported_then_ping_works(
    monkeypatch, mock_db, error_class
):
    private_text = "private message contents"
    error = (
        IntegrityError("INSERT INTO messages ...", {"body": private_text}, Exception())
        if error_class is IntegrityError
        else RuntimeError(private_text)
    )
    mock_db.scalar.return_value = True
    participant = MagicMock()
    participant.scalar_one_or_none.return_value = object()
    mock_db.execute.return_value = participant
    mock_db.commit.side_effect = error
    session = AsyncMock()
    session.__aenter__.return_value = mock_db
    monkeypatch.setattr(handlers, "session_maker", lambda: session)
    logger = MagicMock()
    monkeypatch.setattr(ws, "logger", logger, raising=False)
    socket = AsyncMock()
    socket.receive_text.side_effect = [
        json.dumps({
            "type": frames.MESSAGE_SEND,
            "conversation_id": str(uuid4()),
            "body": private_text,
        }),
        json.dumps({"type": frames.PING}),
        WebSocketDisconnect(),
    ]
    ctx = connection_context(socket)

    with pytest.raises(WebSocketDisconnect):
        await asyncio.wait_for(ws.receive_loop(ctx), timeout=1)

    mock_db.commit.assert_awaited_once()
    assert session.__aexit__.await_args.args[0] is error_class
    assert [call.args[0] for call in socket.send_json.await_args_list] == [
        {"type": frames.ERROR, "reason": "internal_error"},
        {"type": frames.PONG},
    ]
    logger.error.assert_called_once_with(
        "WebSocket handler failed",
        error_type=error_class.__name__,
        user_id=str(ctx.user.id),
        frame_type=frames.MESSAGE_SEND,
    )
    assert private_text not in repr(logger.error.call_args)
    socket.close.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize("failure", ["validation", "permission", "disconnect"])
async def test_expected_handler_errors_are_not_reported_as_internal_errors(
    monkeypatch, failure
):
    logger = MagicMock()
    monkeypatch.setattr(ws, "logger", logger, raising=False)
    socket = AsyncMock()
    socket.receive_text.side_effect = [
        json.dumps({"type": frames.MESSAGE_SEND}),
        WebSocketDisconnect(),
    ]
    if failure != "validation":
        error = PermissionError() if failure == "permission" else WebSocketDisconnect()
        monkeypatch.setitem(
            ws.HANDLERS, frames.MESSAGE_SEND, AsyncMock(side_effect=error)
        )

    with pytest.raises(WebSocketDisconnect):
        await asyncio.wait_for(ws.receive_loop(connection_context(socket)), timeout=1)

    if failure == "disconnect":
        socket.send_json.assert_not_awaited()
    else:
        socket.send_json.assert_awaited_once_with({
            "type": frames.ERROR,
            "reason": "invalid_frame" if failure == "validation" else "conversation_not_found",
        })
    logger.error.assert_not_called()


@pytest.mark.asyncio
async def test_notification_commit_failure_is_logged_without_raising(
    monkeypatch, mock_db
):
    mock_db.commit.side_effect = IntegrityError("INSERT ...", {}, Exception())
    session = AsyncMock()
    session.__aenter__.return_value = mock_db
    monkeypatch.setattr(notify, "session_maker", lambda: session)
    monkeypatch.setattr(
        notify.service, "unread_duplicate_exists", AsyncMock(return_value=False)
    )
    logger = MagicMock()
    monkeypatch.setattr(notify, "logger", logger, raising=False)
    actor_id, recipient_id, target_id = uuid4(), uuid4(), uuid4()

    await notify.emit_notification("follow", actor_id, recipient_id, target_id)

    mock_db.commit.assert_awaited_once()
    logger.error.assert_called_once_with(
        "Notification delivery failed",
        error_type="IntegrityError",
        event_type="follow",
        actor_id=str(actor_id),
        target_user_id=str(recipient_id),
        target_id=str(target_id),
    )
