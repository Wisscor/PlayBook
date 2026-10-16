import uuid

from sqlalchemy import (
    String,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Sport(Base):
    __tablename__ = "sports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
