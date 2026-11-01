from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid

import pytest

from app.models import Post
from app.services.post_service import enrich_posts


@pytest.mark.asyncio
async def test_enrich_posts_builds_author_summary(user):
    now = datetime.now(timezone.utc)
    post = Post(
        id=uuid.uuid4(),
        user_id=user.id,
        caption="Morning run",
        created_at=now,
        updated_at=now,
        user=user,
    )

    responses = await enrich_posts([post], None, MagicMock())

    assert len(responses) == 1
    assert responses[0].id == post.id
    assert responses[0].caption == post.caption
    assert responses[0].author.username == user.username


@pytest.mark.asyncio
async def test_enrich_posts_returns_empty_list_for_empty_input():
    assert await enrich_posts([], None, MagicMock()) == []
