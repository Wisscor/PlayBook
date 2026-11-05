import asyncio
import json
from collections import defaultdict
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import WebSocketDisconnect

from app.realtime import connection, frames, registry, ws


@pytest.mark.parametrize("exit_reason", ["client_disconnect", "frame_limit", "idle"])
def test_socket_runs_one_lifecycle_and_cleans_up_tasks(monkeypatch, exit_reason):
    monkeypatch.setattr(registry, "_connections", defaultdict(set))
    monkeypatch.setattr(frames, "MAX_INBOUND_FRAMES_PER_WINDOW", 2)
    monkeypatch.setattr(ws, "_origin_is_allowed", lambda origin: True)
    monkeypatch.setattr(ws, "session_maker", lambda: AsyncMock())
    user = SimpleNamespace(id=uuid4(), username="alice")
    contacts = {uuid4()}
    monkeypatch.setattr(ws, "authenticate_socket", AsyncMock(return_value=(user, uuid4())))
    on_connect = AsyncMock(return_value={uuid4()})
    monkeypatch.setattr(connection, "session_maker", lambda: AsyncMock())
    monkeypatch.setattr(connection.service, "get_contact_ids", AsyncMock(return_value=contacts))
    on_disconnect = AsyncMock(wraps=ws.connection.on_disconnect)
    announce_presence = AsyncMock()
    monkeypatch.setattr(ws.connection, "on_connect", on_connect)
    monkeypatch.setattr(ws.connection, "on_disconnect", on_disconnect)
    monkeypatch.setattr(ws.connection, "announce_presence", announce_presence)
    socket = AsyncMock()
    socket.headers = {"origin": "http://localhost:3000"}
    receive_stopped = []
    watchdog_stopped = []

    async def wait_for_disconnect():
        try:
            await asyncio.Event().wait()
        finally:
            receive_stopped.append(True)

    async def watchdog(ctx):
        try:
            if exit_reason == "idle":
                await ctx.websocket.close(code=frames.CLOSE_IDLE_TIMEOUT)
            else:
                await asyncio.Event().wait()
        finally:
            watchdog_stopped.append(True)

    monkeypatch.setattr(ws, "_idle_watchdog", watchdog)
    if exit_reason == "idle":
        socket.receive_text.side_effect = wait_for_disconnect
    elif exit_reason == "frame_limit":
        socket.receive_text.side_effect = [json.dumps({"type": frames.PING})] * 3
    else:
        socket.receive_text.side_effect = WebSocketDisconnect()

    async def exercise():
        await asyncio.wait_for(ws.websocket_endpoint(socket), timeout=1)
        # All endpoint-created tasks must be finished before cleanup returns.
        assert not [task for task in asyncio.all_tasks() if task is not asyncio.current_task()]

    asyncio.run(exercise())

    on_connect.assert_awaited_once_with(socket, user, True)
    on_disconnect.assert_awaited_once_with(user, socket)
    announce_presence.assert_awaited_once_with(contacts, user.id, False)
    assert not registry.connections_for(user.id)
    assert watchdog_stopped == [True]
    if exit_reason == "idle":
        assert receive_stopped == [True]
        socket.close.assert_awaited_once_with(code=frames.CLOSE_IDLE_TIMEOUT)
    elif exit_reason == "frame_limit":
        socket.close.assert_awaited_once_with(
            code=frames.CLOSE_RATE_LIMIT, reason="frame rate limit exceeded",
        )
    else:
        socket.close.assert_not_awaited()


@pytest.mark.parametrize("state", ["last_socket", "other_tab_open", "reconnect_during_query"])
def test_disconnect_refreshes_contacts_and_checks_if_still_offline(monkeypatch, state):
    monkeypatch.setattr(registry, "_connections", defaultdict(set))
    user = SimpleNamespace(id=uuid4())
    socket, replacement, contact_socket = AsyncMock(), AsyncMock(), AsyncMock()
    contact_id = uuid4()
    registry.register(user.id, socket, uuid4())
    registry.register(contact_id, contact_socket, uuid4())
    if state == "other_tab_open":
        registry.register(user.id, replacement, uuid4())

    async def current_contacts(db, user_id):
        if state == "reconnect_during_query":
            registry.register(user.id, replacement, uuid4())
        return {contact_id}

    lookup = AsyncMock(side_effect=current_contacts)
    session_factory = AsyncMock()
    monkeypatch.setattr(connection, "session_maker", lambda: session_factory)
    monkeypatch.setattr(connection.service, "get_contact_ids", lookup)

    asyncio.run(connection.on_disconnect(user, socket))

    assert socket not in registry.connections_for(user.id)
    if state == "other_tab_open":
        lookup.assert_not_awaited()
        session_factory.__aenter__.assert_not_awaited()
    else:
        lookup.assert_awaited_once_with(session_factory.__aenter__.return_value, user.id)

    if state == "last_socket":
        contact_socket.send_json.assert_awaited_once_with({
            "type": frames.PRESENCE, "user_id": str(user.id), "online": False,
        })
    else:
        contact_socket.send_json.assert_not_awaited()
        assert registry.connections_for(user.id) == {replacement}


@pytest.mark.parametrize("elapsed", [5.0, 20.0, 31.0])
def test_reconnect_reports_remaining_timeout_without_closing(monkeypatch, elapsed):
    clock = [100.0]
    monkeypatch.setattr(registry, "time", SimpleNamespace(monotonic=lambda: clock[0]))
    monkeypatch.setattr(registry, "_connections", defaultdict(set))
    monkeypatch.setattr(registry, "_timeouts", {})
    monkeypatch.setattr(ws, "_origin_is_allowed", lambda origin: True)
    monkeypatch.setattr(ws, "session_maker", lambda: AsyncMock())
    user = SimpleNamespace(id=uuid4(), username="alice")
    monkeypatch.setattr(ws, "authenticate_socket", AsyncMock(return_value=(user, uuid4())))
    monkeypatch.setattr(connection, "on_connect", AsyncMock())
    monkeypatch.setattr(connection, "on_disconnect", AsyncMock())

    async def exercise():
        await registry.timeout_user(user.id)
        clock[0] += elapsed
        socket = AsyncMock()
        socket.headers = {"origin": "http://localhost:3000"}
        socket.receive_text.side_effect = WebSocketDisconnect()
        await asyncio.wait_for(ws.websocket_endpoint(socket), timeout=1)
        ready = socket.send_json.await_args_list[0].args[0]
        assert ready["type"] == frames.READY
        assert ready["retry_after"] == max(0, 30 - elapsed)
        socket.close.assert_not_awaited()

    asyncio.run(exercise())
