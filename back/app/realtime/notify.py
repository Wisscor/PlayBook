import logging
import uuid

from ..database.database import session_maker
from ..models.user import User
from . import registry, service

logger = logging.getLogger(__name__)


async def emit_notification(
    event_type: str,
    actor_id: uuid.UUID,
    target_user_id: uuid.UUID,
    target_id: uuid.UUID | None = None,
) -> None:
    try:
        if actor_id == target_user_id:
            return

        async with session_maker() as db:
            if await service.unread_duplicate_exists(
                db, target_user_id, actor_id, event_type, target_id
            ):
                return

            notif = await service.create_notification(
                db, target_user_id, actor_id, event_type, target_id
            )
            actor = await db.get(User, actor_id)
            payload = service.notification_payload(
                notif, actor.username if actor else "unknown"
            )
            if await registry.send_to_user(target_user_id, payload) > 0:
                await service.mark_delivered(db, [notif.id])
    except Exception:
        logger.exception(
            "emit_notification failed: event_type=%s actor=%s target=%s target_id=%s",
            event_type,
            actor_id,
            target_user_id,
            target_id,
        )
