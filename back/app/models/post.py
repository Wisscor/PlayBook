import uuid
from datetime import datetime, timezone
from ..db.database import Base
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    like_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("likes.id", ondelete="CASCADE"),
        index=True,
    )
    caption: Mapped[str] = mapped_column(
        Text,
    )

    media_url: Mapped[str | None] = mapped_column(
        String(255),
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
