from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest
from fastapi import BackgroundTasks
from sqlalchemy.exc import IntegrityError

from app.core.error_codes import ErrorCode
from app.core.exceptions import ApiException
from app.models.match_announcement import MatchAnnouncement, MatchAnnouncementStatus
from app.routers import followers, play_request, users
from app.routers.post import router as post_router
from app.schemas.user import UserUpdate


def integrity_error():
    return IntegrityError("INSERT ...", {}, Exception())


def test_post_update_route_is_not_registered():
    assert not any(
        route.path == "/posts/{post_id}"
        and "PATCH" in getattr(route, "methods", set())
        for route in post_router.routes
    )


@pytest.mark.asyncio
async def test_profile_unique_violation_returns_conflict(mock_db, user, other_user):
    mock_db.commit.side_effect = integrity_error()

    with pytest.raises(ApiException) as caught:
        await users.update.__wrapped__(
            UserUpdate(email=other_user.email),
            MagicMock(),
            user,
            mock_db,
        )

    assert caught.value.code == ErrorCode.RESOURCE_CONFLICT
    mock_db.rollback.assert_awaited_once()


@pytest.mark.asyncio
async def test_play_request_flush_unique_violation_returns_conflict(
    mock_db, user, other_user
):
    announcement = MatchAnnouncement(
        id=uuid.uuid4(),
        organizer_id=user.id,
        sport_id=uuid.uuid4(),
        title="Evening match",
        remaining_player_slots=1,
        match_status=MatchAnnouncementStatus.upcoming,
    )
    mock_db.get.return_value = announcement
    mock_db.scalar.return_value = None
    mock_db.flush.side_effect = integrity_error()

    with pytest.raises(ApiException) as caught:
        await play_request.send_play_request.__wrapped__(
            announcement.id,
            BackgroundTasks(),
            MagicMock(),
            db=mock_db,
            me=other_user,
        )

    assert caught.value.code == ErrorCode.REQUEST_ALREADY_SENT
    mock_db.rollback.assert_awaited_once()
    mock_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_follow_commit_unique_violation_returns_conflict(
    mock_db, user, other_user, monkeypatch
):
    monkeypatch.setattr(
        followers,
        "get_user_by_id",
        AsyncMock(return_value=other_user),
    )
    mock_db.scalar.return_value = None
    mock_db.commit.side_effect = integrity_error()

    with pytest.raises(ApiException) as caught:
        await followers.follow_user.__wrapped__(
            other_user.id,
            BackgroundTasks(),
            MagicMock(),
            user,
            mock_db,
        )

    assert caught.value.code == ErrorCode.ALREADY_FOLLOWING
    mock_db.rollback.assert_awaited_once()
