import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserSport(Base):
    """Pure junction table: composite PK means a user lists a sport only once."""

    __tablename__ = "user_sports"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    sport_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sports.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )

    sport: Mapped["Sport"] = relationship()
