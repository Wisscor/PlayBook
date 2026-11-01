import uuid
from collections.abc import Iterable
from datetime import datetime

import structlog

from ..database.database import session_maker
from ..models.user import User
from . import registry, service

logger = structlog.get_logger(__name__)

async def emit_notification(
    event_type: str,
    actor_id: uuid.UUID,
    target_user_id: uuid.UUID,
    target_id: uuid.UUID | None = None,
    match_time: datetime | None = None,
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
                db, target_user_id, actor_id, event_type, target_id, match_time
            )
            actor = await db.get(User, actor_id)
            payload = service.notification_payload(
                notif, actor.username if actor else "unknown"
            )
            if await registry.send_to_user(target_user_id, payload) > 0:
                await service.mark_delivered(db, [notif.id])
    except Exception as exc:
        logger.error(
            "Notification delivery failed",
            error_type=type(exc).__name__,
            event_type=event_type,
            actor_id=str(actor_id),
            target_user_id=str(target_user_id),
            target_id=str(target_id) if target_id is not None else None,
        )


async def emit_notifications(
    event_type: str,
    actor_id: uuid.UUID,
    target_user_ids: Iterable[uuid.UUID],
    target_id: uuid.UUID | None = None,
    match_time: datetime | None = None,
) -> None:
    for target_user_id in set(target_user_ids):
        await emit_notification(
            event_type=event_type,
            actor_id=actor_id,
            target_user_id=target_user_id,
            target_id=target_id,
            match_time=match_time,
        )
