import uuid
from ..db.database import Base
from datetime import datetime, timezone
from sqlalchemy import (
    ForeignKey,
    Uuid,
    DateTime,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)


class PrivateChat(Base):
    __tablename__ = "private_chats"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user1_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    user2_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user1: Mapped["User"] = relationship(
        foreign_keys=[user1_id], back_populates="chats_as_user1"
    )
    user2: Mapped["User"] = relationship(
        foreign_keys=[user2_id], back_populates="chats_as_user2"
    )
    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat", cascade="all, delete-orphan"
    )
