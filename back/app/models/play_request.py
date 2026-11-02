import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.match_announcement import MatchAnnouncement
    from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PlayerRequestStatusEnum(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class PlayerRequest(Base):
    """A user's request to join a match announcement. The receiver is the
    announcement's owner, so there is no receiver column.

    Backend rules (cannot be expressed as a simple constraint):
    - the sender cannot be the announcement owner
    - status changes only from `pending` to `accepted` or `declined`
    """

    __tablename__ = "play_requests"
    __table_args__ = (
        UniqueConstraint(
            "announcement_id", "sender_id", name="uq_play_request_once"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    announcement_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("match_announcements.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[PlayerRequestStatusEnum] = mapped_column(
        Enum(PlayerRequestStatusEnum),
        default=PlayerRequestStatusEnum.pending,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    announcement: Mapped["MatchAnnouncement"] = relationship(
        back_populates="play_requests"
    )
    sender: Mapped["User"] = relationship(
        foreign_keys=[sender_id]
    )  # noqa: F821
