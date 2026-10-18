from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, update

from ...models.user import User
from .. import frames
from ..models import Notification


async def create_notification(
    db,
    user_id: UUID,
    actor_id: UUID,
    event_type: str,
    target_id: UUID | None = None,
    target_type: str | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        actor_id=actor_id,
        event_type=event_type,
        target_id=target_id,
        target_type=target_type,
    )
    db.add(notif)
    await db.commit()
    return notif


async def unread_duplicate_exists(
    db, user_id, actor_id, event_type, target_id, target_type
) -> bool:
    result = await db.execute(
        select(Notification.id)
        .where(
            Notification.user_id == user_id,
            Notification.actor_id == actor_id,
            Notification.event_type == event_type,
            Notification.target_id == target_id,
            Notification.target_type == target_type,
            Notification.read_at.is_(None),
        )
        .limit(1)
    )
    return result.first() is not None


async def get_undelivered_notifications(
    db, user_id
) -> list[tuple[Notification, str]]:
    rows = await db.execute(
        select(Notification, User.username)
        .join(User, User.id == Notification.actor_id)
        .where(
            Notification.user_id == user_id,
            Notification.delivered_at.is_(None),
        )
        .order_by(Notification.created_at.asc())
    )
    return rows.all()


async def list_notifications(
    db, user_id, unread_only: bool, limit: int
) -> list[dict]:
    stmt = (
        select(Notification, User.username)
        .join(User, User.id == Notification.actor_id)
        .where(Notification.user_id == user_id)
    )
    if unread_only:
        stmt = stmt.where(Notification.read_at.is_(None))
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    rows = await db.execute(stmt)
    return [notification_dict(notification, username) for notification, username in rows.all()]


async def mark_delivered(db, notification_ids: list[UUID]):
    await db.execute(
        update(Notification)
        .where(Notification.id.in_(notification_ids))
        .values(delivered_at=datetime.now(timezone.utc))
    )
    await db.commit()


async def mark_read(db, user_id: UUID, notification_ids: list[UUID]):
    await db.execute(
        update(Notification)
        .where(
            Notification.id.in_(notification_ids),
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    await db.commit()


async def get_unread_count(db, user_id: UUID) -> int:
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
    )
    return result.scalar()


def notification_dict(notif: Notification, actor_username: str) -> dict:
    return {
        "id": str(notif.id),
        "event_type": notif.event_type,
        "actor_id": str(notif.actor_id),
        "actor_username": actor_username,
        "read_at": notif.read_at.isoformat() if notif.read_at else None,
        "created_at": notif.created_at.isoformat(),
    }


def notification_payload(notif: Notification, actor_username: str) -> dict:
    return {"type": frames.NOTIFICATION, **notification_dict(notif, actor_username)}
