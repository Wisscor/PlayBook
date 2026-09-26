import uuid
from datetime import datetime, timezone
from ..database.database import Base
from sqlalchemy import (
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column


class Follower(Base):
    """Pure junction table: composite PK enforces one follow edge per pair."""

    __tablename__ = "followers"

    follower_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    following_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    follower: Mapped["User"] = relationship(
        foreign_keys=[follower_id],
        back_populates="following",
    )
    following: Mapped["User"] = relationship(
        foreign_keys=[following_id],
        back_populates="followers",
    )
