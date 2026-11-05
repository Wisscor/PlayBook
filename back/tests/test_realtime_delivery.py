from collections import defaultdict
from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.realtime import connection, delivery, frames, registry
from app.realtime.service import SentMessage


@pytest.mark.asyncio
@pytest.mark.parametrize("peer_online", [True, False])
@pytest.mark.parametrize("is_first", [True, False])
async def test_first_message_updates_new_contact_presence(
    monkeypatch, peer_online, is_first
):
    monkeypatch.setattr(registry, "_connections", defaultdict(set))
    monkeypatch.setattr(connection, "session_maker", lambda: AsyncMock())
    monkeypatch.setattr(
        connection.service, "get_contact_ids", AsyncMock(return_value=set())
    )
    sender_id, peer_id = uuid4(), uuid4()
    sender_socket, peer_socket = AsyncMock(), AsyncMock()
    registry.register(sender_id, sender_socket, uuid4())
    await connection._send_online_contacts_snapshot(sender_socket, sender_id)
    if peer_online:
        registry.register(peer_id, peer_socket, uuid4())
        await connection._send_online_contacts_snapshot(peer_socket, peer_id)

    message = SentMessage(
        id=uuid4(),
        conversation_id=uuid4(),
        sender_id=sender_id,
        body="hello",
        created_at=datetime.now(timezone.utc),
        is_first=is_first,
        participants=[(sender_id, "alice"), (peer_id, "bob")],
    )
    unreached = await delivery.deliver_message(message)

    assert unreached == ([] if peer_online else [peer_id])
    for socket, contact_id, contact_online in (
        (sender_socket, peer_id, peer_online),
        (peer_socket, sender_id, True),
    ):
        if socket is peer_socket and not peer_online:
            socket.send_json.assert_not_awaited()
            continue
        received = [call.args[0] for call in socket.send_json.await_args_list]
        assert received[0] == {"type": frames.PRESENCE_SNAPSHOT, "online": []}
        presence = [frame for frame in received if frame["type"] == frames.PRESENCE]
        if is_first:
            expected = {
                "type": frames.PRESENCE,
                "user_id": str(contact_id),
                "online": contact_online,
            }
            assert presence == [expected]
            assert received.index(expected) > next(
                i for i, frame in enumerate(received)
                if frame["type"] == frames.CONVERSATION_NEW
            )
        else:
            assert presence == []
        assert received[-1]["type"] == frames.MESSAGE_NEW
