import uuid
from ..db.database import Base
from datetime import datetime, timezone
from sqlalchemy import (
    ForeignKey,
    Uuid,
    Integer,
    DateTime,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    comment_reply_to_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("comments.id")
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    post: Mapped["Post"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")
    # A self-referential relationship
    replies: Mapped[list["Comment"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    parent: Mapped["Comment | None"] = relationship(
        back_populates="replies", remote_side=[id]
    )



# One comment can have MANY replies. (One-to-Many)
# Each reply can only belong to ONE parent comment. (Many-to-One)
