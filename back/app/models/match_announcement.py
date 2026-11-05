import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.play_request import PlayerRequest
    from app.models.sport import Sport
    from app.models.user import User


class MatchAnnouncementStatus(str, enum.Enum):
    upcoming = "upcoming"
    live = "live"
    finished = "finished"


class MatchAnnouncement(Base):
    __tablename__ = "match_announcements"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(
        nullable=False,
    )
    organizer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sport_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sports.id"), nullable=False
    )
    remaining_player_slots: Mapped[int] = mapped_column(
        nullable=False,
    )
    match_status: Mapped[MatchAnnouncementStatus] = mapped_column(
        Enum(MatchAnnouncementStatus),
        default=MatchAnnouncementStatus.upcoming,
        nullable=False,
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(timezone.utc)
    )

    owner: Mapped["User"] = relationship(
        foreign_keys=[organizer_id]
    )  # noqa: F821
    sport: Mapped["Sport"] = relationship()
    play_requests: Mapped[list["PlayerRequest"]] = relationship(
        back_populates="announcement",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "end_time > start_time", name="ck_announcement_time_range"
        ),
        CheckConstraint(
            "remaining_player_slots >= 0",
            name="ck_announcement_needed_players_non_negative",
        ),
        Index("ix_announcement_sport_start", "sport_id", "start_time"),
    )
