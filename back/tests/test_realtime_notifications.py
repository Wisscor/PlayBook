from datetime import datetime, timezone
from uuid import uuid4

from app.realtime import frames
from app.realtime.models import Notification
from app.realtime.services.notifications import notification_dict, notification_payload


def test_notification_responses_omit_internal_target_fields():
    notification = Notification(
        id=uuid4(),
        user_id=uuid4(),
        actor_id=uuid4(),
        event_type="like",
        target_id=uuid4(),
        target_type="post",
        read_at=None,
        created_at=datetime.now(timezone.utc),
    )

    response = notification_dict(notification, "alice")
    websocket_payload = notification_payload(notification, "alice")

    assert "target_id" not in response
    assert "target_type" not in response
    assert "target_id" not in websocket_payload
    assert "target_type" not in websocket_payload
    assert response["actor_username"] == "alice"
    assert websocket_payload["type"] == frames.NOTIFICATION
