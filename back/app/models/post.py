import uuid
from ..db.database import Base
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Text, DateTime, ForeignKey, Uuid, Enum
import enum
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)


class PostTypeEnum(str, enum.Enum):
    post = "post"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    post_type_id: Mapped[PostTypeEnum] = mapped_column(
        Enum(PostTypeEnum),
        nullable=False,
    )

    caption: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    # Relationships
    user: Mapped["User"] = relationship(back_populates="posts")
    media: Mapped[list["PostMedia"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
    )
    likes: Mapped[list["Like"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
    )