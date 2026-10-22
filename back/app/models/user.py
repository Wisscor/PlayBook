from datetime import datetime, timezone
import uuid

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    firstname: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
    )
    lastname: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        default=None,
        nullable=True,
    )
    avatar: Mapped[str] = mapped_column(
        String(255),
        default=None,
        nullable=True,
    )
    bio: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    sessions: Mapped[list["Session"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    posts: Mapped[list["Post"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    following: Mapped[list["Follower"]] = relationship(
        "Follower",
        foreign_keys="Follower.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan",
    )
    followers: Mapped[list["Follower"]] = relationship(
        "Follower",
        foreign_keys="Follower.following_id",
        back_populates="following",
        cascade="all, delete-orphan",
    )
