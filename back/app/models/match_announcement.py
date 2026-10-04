import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class AnnouncementTypeEnum(str, enum.Enum):
    player = "player"  # teammate needed
    opponent = "opponent"  # opponent needed


class MatchAnnouncement(Base):
    __tablename__ = "match_announcements"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sport_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sports.id"), nullable=False
    )
    type: Mapped[AnnouncementTypeEnum] = mapped_column(
        Enum(AnnouncementTypeEnum), nullable=False
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

    # Relationships
    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])  # noqa: F821
    sport: Mapped["Sport"] = relationship()
    play_requests: Mapped[list["PlayRequest"]] = relationship(
        back_populates="announcement",
        cascade="all, delete-orphan",
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "end_time > start_time", name="ck_announcement_time_range"
        ),
        # Search by sport and time window
        Index("ix_announcement_sport_start", "sport_id", "start_time"),
    )
