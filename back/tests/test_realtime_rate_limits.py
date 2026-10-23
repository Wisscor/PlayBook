import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
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
        reason="rate limited – you are timed out",
    )
    assert registry.timeout_remaining(user_id) > 0
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
        reason="rate limited – you are timed out",
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


def test_timeout_expires_after_configured_duration(monkeypatch):
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
    websocket.close.assert_awaited_once_with(
        code=frames.CLOSE_RATE_LIMIT,
        reason="rate limited – you are timed out",
    )

    clock[0] += frames.RATE_LIMIT_TIMEOUT_SECONDS
    assert not registry.is_timed_out(user_id)
    assert registry.timeout_remaining(user_id) == 0


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