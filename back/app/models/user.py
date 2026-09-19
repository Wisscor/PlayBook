# ##########################
from datetime import datetime, timezone
import uuid

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    first_name: Mapped[str] = mapped_column(
        String(50),
    )
    last_name: Mapped[str] = mapped_column(
        String(50),
    )
    user_name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(20),
        default=None,
    )
    avatar: Mapped[str | None] = mapped_column(
        String(255),
        default=None,
    )
    bio: Mapped[str | None] = mapped_column(
        Text,
        default=None,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    sessions: Mapped[list["Session"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    # sessions: Mapped[list["Session"]] = relationship(
    #     back_populates="user",
    #     cascade="all, delete-orphan",
    # )


# get_all() -> list[obj]
# get_one() -> obj
# create() -> obj
# modify() -> obj
# replace() -> obj
# delete() -> bool
