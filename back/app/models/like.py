import uuid
from app.database.base import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)


class Like(Base):
    """Pure junction table: composite PK enforces one like per user per post."""

    __tablename__ = "likes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), primary_key=True
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id"), primary_key=True
    )

    user: Mapped["User"] = relationship(back_populates="likes")
    post: Mapped["Post"] = relationship(back_populates="likes")
