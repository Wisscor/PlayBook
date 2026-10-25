import pytest
from pydantic import ValidationError

from app.realtime.schemas import MessageSend


def test_message_body_accepts_500_characters():
    message = MessageSend(conversation_id="00000000-0000-0000-0000-000000000001", body="a" * 500)

    assert len(message.body) == 500


def test_message_body_rejects_more_than_500_characters():
    with pytest.raises(ValidationError):
        MessageSend(conversation_id="00000000-0000-0000-0000-000000000001", body="a" * 501)