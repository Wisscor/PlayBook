import uuid
from ..database.database import Base
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, DateTime, ForeignKey, Uuid, Enum, String
import enum
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)


class PostTypeEnum(str, enum.Enum):
    post = "post"
    event_callout = "event_callout"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    post_type: Mapped[PostTypeEnum] = mapped_column(
        Enum(PostTypeEnum),
        default=PostTypeEnum.post,
        nullable=False,
    )

    caption: Mapped[str] = mapped_column(Text, nullable=False)

    sport: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, default=None
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, default=None
    )
    event_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="posts")
    media: Mapped[list["PostMedia"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostMedia.position",
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
    )
    likes: Mapped[list["Like"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
    )
