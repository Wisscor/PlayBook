import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # user = relationship("User", backref="sessions")
    # 'back_populates': establish a bidirectional relationship.
    # user: Mapped["User"] = relationship(back_populates="sessions")
    user: Mapped["User"] = relationship(
        "User",
        back_populates="sessions",
    )

    # Index for efficient querying by user_id and expires_at
    __table_args__ = (
        Index("ix_sessions_user_id_expires_at", "user_id", "expires_at"),
    )
