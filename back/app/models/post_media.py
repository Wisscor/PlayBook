import uuid
from ..db.database import Base
from datetime import datetime, timezone
from sqlalchemy import (
    String,
    ForeignKey,
    Uuid,
    Integer,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)


class PostMedia(Base):
    __tablename__ = "post_media"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id"), nullable=False
    )
    media_url: Mapped[str] = mapped_column(String(500), nullable=False)
    media_type: Mapped[str] = mapped_column(String(20), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    # Relationships
    post: Mapped["Post"] = relationship(back_populates="media")