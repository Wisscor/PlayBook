import uuid
from datetime import datetime, timezone
from ..db.database import Base
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    comment_reply_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("comments.id"),
        default=None,
    )
    child_comments: Mapped[list["Comment"]] = relationship(
        "Comment",
        backref="parent_comment",
        cascade="all, delete-orphan",
    )
