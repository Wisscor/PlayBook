from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest

from app.main import app
from app.models import User
from app.core.security import hash_password


@pytest.fixture(autouse=True)
def reset_fastapi_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.add_all = MagicMock()
    return db


@pytest.fixture
def user():
    return User(
        id=uuid.uuid4(),
        firstname="Alice",
        lastname="Smith",
        username="alice_smith",
        email="alice@example.com",
        bio="Runner",
        hashed_password=hash_password("password123"),
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def other_user():
    return User(
        id=uuid.uuid4(),
        firstname="Bob",
        lastname="Jones",
        username="bob_jones",
        email="bob@example.com",
        bio="Swimmer",
        hashed_password=hash_password("password123"),
        created_at=datetime.now(timezone.utc),
    )
