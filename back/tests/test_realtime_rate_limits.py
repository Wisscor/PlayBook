import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.realtime import frames
from app.realtime.limits import SlidingWindow
from app.realtime.ws import receive_loop


def test_receive_loop_closes_after_general_frame_limit(monkeypatch):
    monkeypatch.setattr(frames, "MAX_INBOUND_FRAMES_PER_WINDOW", 2)
    websocket = SimpleNamespace(
        receive_json=AsyncMock(
            side_effect=[
                {"type": "ping"},
                {"type": "ping"},
                {"type": "ping"},
            ]
        ),
        close=AsyncMock(),
        send_json=AsyncMock(),
    )
    handler = AsyncMock()
    ctx = SimpleNamespace(
        websocket=websocket,
        last_seen=0.0,
        inbound_frames=SlidingWindow(10),
    )

    with patch("app.realtime.ws.HANDLERS", {"ping": handler}):
        asyncio.run(receive_loop(ctx))

    assert handler.await_count == 2
    websocket.close.assert_awaited_once_with(code=frames.CLOSE_RATE_LIMIT)
    websocket.send_json.assert_not_awaited()


def test_malformed_json_counts_toward_general_frame_limit(monkeypatch):
    monkeypatch.setattr(frames, "MAX_INBOUND_FRAMES_PER_WINDOW", 1)
    websocket = SimpleNamespace(
        receive_json=AsyncMock(side_effect=[ValueError(), ValueError()]),
        close=AsyncMock(),
        send_json=AsyncMock(),
    )
    ctx = SimpleNamespace(
        websocket=websocket,
        last_seen=0.0,
        inbound_frames=SlidingWindow(10),
    )

    asyncio.run(receive_loop(ctx))

    websocket.send_json.assert_awaited_once_with(
        {"type": frames.ERROR, "reason": "invalid_json"}
    )
    websocket.close.assert_awaited_once_with(code=frames.CLOSE_RATE_LIMIT)