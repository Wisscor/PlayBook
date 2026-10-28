import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest
from starlette.websockets import WebSocketDisconnect

from app.realtime import frames, registry
from app.realtime.limits import SlidingWindow
from app.realtime.ws import _idle_watchdog, receive_loop


def test_receive_loop_closes_after_general_frame_limit(monkeypatch):
    monkeypatch.setattr(frames, "MAX_INBOUND_FRAMES_PER_WINDOW", 2)
    websocket = AsyncMock()
    websocket.receive_text.side_effect = [
        json.dumps({"type": "ping"}),
        json.dumps({"type": "ping"}),
        json.dumps({"type": "ping"}),
    ]
    handler = AsyncMock()
    user_id = uuid4()
    registry.register(user_id, websocket)
    ctx = SimpleNamespace(
        websocket=websocket,
        user=SimpleNamespace(id=user_id),
        last_seen=0.0,
        inbound_frames=SlidingWindow(10),
    )

    with patch("app.realtime.ws.HANDLERS", {"ping": handler}):
        asyncio.run(receive_loop(ctx))

    assert handler.await_count == 2
    websocket.close.assert_awaited_once_with(
        code=frames.CLOSE_RATE_LIMIT,
        reason="frame rate limit exceeded",
    )
    assert registry.timeout_remaining(user_id) == 0
    websocket.send_json.assert_not_awaited()


def test_malformed_json_counts_toward_general_frame_limit(monkeypatch):
    monkeypatch.setattr(frames, "MAX_INBOUND_FRAMES_PER_WINDOW", 1)
    websocket = AsyncMock()
    websocket.receive_text.side_effect = ["{", "{"]
    user_id = uuid4()
    registry.register(user_id, websocket)
    ctx = SimpleNamespace(
        websocket=websocket,
        user=SimpleNamespace(id=user_id),
        last_seen=0.0,
        inbound_frames=SlidingWindow(10),
    )

    asyncio.run(receive_loop(ctx))

    websocket.send_json.assert_awaited_once_with(
        {"type": frames.ERROR, "reason": "invalid_json"}
    )
    websocket.close.assert_awaited_once_with(
        code=frames.CLOSE_RATE_LIMIT,
        reason="frame rate limit exceeded",
    )


def test_frame_size_limit_counts_utf8_bytes(monkeypatch):
    websocket = AsyncMock()
    websocket.receive_text.side_effect = [
        "é" * (frames.MAX_FRAME_BYTES // 2 + 1),
        WebSocketDisconnect(),
    ]
    ctx = SimpleNamespace(
        websocket=websocket,
        user=SimpleNamespace(id=uuid4()),
        last_seen=0.0,
        inbound_frames=SlidingWindow(10),
    )

    with pytest.raises(WebSocketDisconnect):
        asyncio.run(receive_loop(ctx))

    websocket.send_json.assert_awaited_once_with(
        {"type": frames.ERROR, "reason": "frame_too_large"}
    )


def test_timeout_keeps_socket_open_and_expires(monkeypatch):
    clock = [100.0]
    monkeypatch.setattr(
        registry, "time", SimpleNamespace(monotonic=lambda: clock[0])
    )
    user_id = uuid4()
    websocket = AsyncMock()
    registry.register(user_id, websocket)

    asyncio.run(registry.timeout_user(user_id))

    assert registry.is_timed_out(user_id)
    assert registry.timeout_remaining(user_id) == frames.RATE_LIMIT_TIMEOUT_SECONDS
    websocket.close.assert_not_awaited()
    websocket.send_json.assert_awaited_once_with({
        "type": frames.ERROR, "reason": "timed_out", "retry_after": 30,
    })
    registry.unregister(user_id, websocket)

    clock[0] += frames.RATE_LIMIT_TIMEOUT_SECONDS
    assert not registry.is_timed_out(user_id)
    assert registry.timeout_remaining(user_id) == 0


def test_timed_out_message_events_never_open_database_session(monkeypatch):
    from app.realtime import handlers

    user_id = uuid4()
    monkeypatch.setattr(registry, "time", SimpleNamespace(monotonic=lambda: 100.0))
    monkeypatch.setattr(registry, "_timeouts", {user_id: 130.0})
    session_factory = Mock(side_effect=AssertionError("Database must not be opened"))
    send_message = AsyncMock()
    monkeypatch.setattr(handlers, "session_maker", session_factory)
    monkeypatch.setattr(handlers.service, "send_message", send_message)
    websocket = AsyncMock()
    message = json.dumps({
        "type": frames.MESSAGE_SEND,
        "conversation_id": str(uuid4()),
        "body": "hello",
    })
    websocket.receive_text.side_effect = [
        message, message, message, json.dumps({"type": frames.PING}),
        WebSocketDisconnect(),
    ]
    ctx = SimpleNamespace(
        user=SimpleNamespace(id=user_id), websocket=websocket,
        last_seen=0.0, inbound_frames=SlidingWindow(10),
        sends=SlidingWindow(10), strikes=SlidingWindow(60),
    )

    with pytest.raises(WebSocketDisconnect):
        asyncio.run(receive_loop(ctx))

    session_factory.assert_not_called()
    send_message.assert_not_awaited()
    assert websocket.send_json.await_count == 4
    assert all(call.args[0] == {
        "type": frames.ERROR, "reason": "timed_out", "retry_after": 30.0,
    } for call in websocket.send_json.await_args_list[:3])
    websocket.send_json.assert_any_await({"type": frames.PONG})
    websocket.close.assert_not_awaited()


def test_message_timeout_blocks_other_socket_and_allows_sending_after_expiry(monkeypatch):
    from app.realtime import handlers

    clock = [100.0]
    fake_time = SimpleNamespace(monotonic=lambda: clock[0])
    monkeypatch.setattr(registry, "time", fake_time)
    monkeypatch.setattr(handlers, "time", fake_time)
    user_id = uuid4()
    sockets = [AsyncMock(), AsyncMock()]
    ctx = SimpleNamespace(
        user=SimpleNamespace(id=user_id), websocket=sockets[0],
        sends=SlidingWindow(10), strikes=SlidingWindow(60),
    )
    for socket in sockets:
        registry.register(user_id, socket)
    for _ in range(10):
        ctx.sends.hit(100)
    for _ in range(4):
        ctx.strikes.hit(100)
    send = AsyncMock()
    monkeypatch.setattr(handlers, "session_maker", lambda: AsyncMock())
    monkeypatch.setattr(handlers.service, "send_message", send)
    monkeypatch.setattr(handlers.delivery, "deliver_message", AsyncMock(return_value=[]))
    frame = {"conversation_id": str(uuid4()), "body": "hello"}

    async def exercise():
        try:
            await handlers.handle_message_send(ctx, frame)
            ctx.websocket = sockets[1]
            clock[0] = 105
            await handlers.handle_message_send(ctx, frame)
            send.assert_not_awaited()
            assert registry.timeout_remaining(user_id) == 25
            await handlers.handle_ping(ctx, {"type": frames.PING})
            sockets[1].send_json.assert_any_await({"type": frames.PONG})
            await registry.send_to_user(user_id, {"type": frames.MESSAGE_NEW})
            for socket in sockets:
                socket.send_json.assert_any_await({"type": frames.MESSAGE_NEW})
                socket.close.assert_not_awaited()
            clock[0] = 130
            await handlers.handle_message_send(ctx, frame)
            send.assert_awaited_once()
        finally:
            for socket in sockets:
                registry.unregister(user_id, socket)

    asyncio.run(exercise())


def test_idle_watchdog_closes_at_one_minute_boundary(monkeypatch):
    from app.realtime import ws

    clock = [0.0]
    sleep_count = 0

    async def advance_clock(seconds):
        nonlocal sleep_count
        sleep_count += 1
        clock[0] += seconds

    monkeypatch.setattr(ws, "time", SimpleNamespace(monotonic=lambda: clock[0]))
    monkeypatch.setattr(ws.asyncio, "sleep", advance_clock)
    websocket = AsyncMock()
    ctx = SimpleNamespace(websocket=websocket, last_seen=0.0)

    asyncio.run(_idle_watchdog(ctx))

    assert clock[0] == 60.0
    assert sleep_count == 4
    websocket.close.assert_awaited_once_with(code=frames.CLOSE_IDLE_TIMEOUT)
