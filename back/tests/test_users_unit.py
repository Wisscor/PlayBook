from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest

from app.models import Follower
from app.services.user_service import (
    delete_user_account,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    load_user_profile,
)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "lookup", [get_user_by_email, get_user_by_username, get_user_by_id]
)
async def test_user_lookup_helpers_return_scalar_result(mock_db, user, lookup):
    result = MagicMock()
    result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = result

    value = (
        uuid.uuid4()
        if lookup is get_user_by_id
        else (user.email if lookup is get_user_by_email else user.username)
    )
    assert await lookup(mock_db, value) is user
    mock_db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_build_user_profile_counts_and_follow_state(
    mock_db, user, other_user
):
    mock_db.scalar.side_effect = [
        4,
        3,
        8,
        Follower(
            follower_id=other_user.id,
            following_id=user.id,
        ),
    ]

    profile = await load_user_profile(mock_db, user, other_user)

    assert profile.id == user.id
    assert profile.followers_count == 4
    assert profile.following_count == 3
    assert profile.posts_count == 8
    assert profile.is_following is True


@pytest.mark.asyncio
async def test_build_user_profile_does_not_query_follow_edge_for_self(
    mock_db, user
):
    mock_db.scalar.side_effect = [0, 0, 0]

    profile = await load_user_profile(mock_db, user, user)

    assert profile.is_following is None
    assert mock_db.scalar.await_count == 3


@pytest.mark.asyncio
async def test_delete_user_account_removes_data_and_closes_connections(
    mock_db, user, monkeypatch
):
    delete_conversations = AsyncMock()
    close_user = AsyncMock()
    monkeypatch.setattr(
        "app.services.user_service.delete_user_conversations",
        delete_conversations,
    )
    monkeypatch.setattr(
        "app.services.user_service.registry.close_user",
        close_user,
    )
    remove_avatar = MagicMock()
    monkeypatch.setattr(
        "app.services.user_service.remove_avatar",
        remove_avatar,
    )
    user.avatar = "uploads/avatar.png"

    await delete_user_account(mock_db, user)

    delete_conversations.assert_awaited_once_with(mock_db, user.id)
    mock_db.delete.assert_awaited_once_with(user)
    mock_db.commit.assert_awaited_once()
    close_user.assert_awaited_once_with(user.id)
    remove_avatar.assert_called_once_with("uploads/avatar.png")


@pytest.mark.asyncio
async def test_delete_user_account_keeps_external_avatar(
    mock_db, user, monkeypatch
):
    monkeypatch.setattr(
        "app.services.user_service.delete_user_conversations",
        AsyncMock(),
    )
    monkeypatch.setattr(
        "app.services.user_service.registry.close_user",
        AsyncMock(),
    )
    remove_avatar = MagicMock()
    monkeypatch.setattr(
        "app.services.user_service.remove_avatar",
        remove_avatar,
    )
    user.avatar = "https://cdn.example/avatar.png"

    await delete_user_account(mock_db, user)

    remove_avatar.assert_not_called()
