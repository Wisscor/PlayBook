import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
import pytest

from unittest.mock import AsyncMock, MagicMock

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models import User, Post
from app.core.security import hash_password


@pytest.fixture
def test_password():
    return "password123"


@pytest.fixture
def mock_user_1(test_password):
    return User(
        id=uuid.uuid4(),
        firstname="John",
        lastname="Doe",
        username="john_doe",
        email="john@example.com",
        avatar="https://example.com/john.png",
        bio="Athlete and sports lover",
        hashed_password=hash_password(test_password),
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def mock_user_2(test_password):
    return User(
        id=uuid.uuid4(),
        firstname="Sarah",
        lastname="Connor",
        username="sarah_c",
        email="sarah@example.com",
        avatar="https://example.com/sarah.png",
        bio="Basketball coach",
        hashed_password=hash_password(test_password),
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    return db


@pytest.fixture
def mock_post(mock_user_1):
    return Post(
        id=uuid.uuid4(),
        user_id=mock_user_1.id,
        caption="Morning run in the park",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
