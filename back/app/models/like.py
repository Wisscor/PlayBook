import uuid
from datetime import datetime, timezone
from ..database.database import Base
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


# CREATE TABLE likes (
#         post_id UUID NOT NULL,
#         user_id UUID NOT NULL,
#         PRIMARY KEY (post_id, user_id),
#         FOREIGN KEY(post_id) REFERENCES posts (id) ON DELETE CASCADE,
#         FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
# )
