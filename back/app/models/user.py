import uuid
from datetime import datetime, timezone
from ..database import Base
from sqlalchemy import Column, String, Text, DateTime, UUID


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    username = Column(
        String(50),
        unique=True,
        nullable=False,
    )
    email = Column(
        String(255),
        unique=True,
        nullable=False,
    )
    bio = Column(Text, nullable=True)
    hashed_password = Column(
        String(255),
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
