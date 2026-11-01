from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest
from fastapi import BackgroundTasks

from app.core.error_codes import ErrorCode
from app.core.exceptions import ApiException
from app.models import MatchAnnouncement, PlayerRequest
from app.models.match_announcement import MatchAnnouncementStatus
from app.models.play_request import PlayerRequestStatusEnum
from app.routers import play_request
from app.schemas.play_request import PlayerRequestDecision


async def call_decision(db, me, request_id, status, monkeypatch):
    result = AsyncMock(return_value=None)
    monkeypatch.setattr(
        play_request,
        "_get_request",
        result,
    )
    return await play_request.decide_play_request.__wrapped__(
        request_id,
        PlayerRequestDecision(status=status),
        BackgroundTasks(),
        MagicMock(),
        db,
        me,
    )


def make_announcement(owner_id, slots=1):
    return MatchAnnouncement(
        id=uuid.uuid4(),
        organizer_id=owner_id,
        sport_id=uuid.uuid4(),
        title="Evening match",
        remaining_player_slots=slots,
        match_status=MatchAnnouncementStatus.upcoming,
    )


def make_request(announcement_id, sender_id):
    return PlayerRequest(
        id=uuid.uuid4(),
        announcement_id=announcement_id,
        sender_id=sender_id,
        status=PlayerRequestStatusEnum.pending,
    )


@pytest.mark.asyncio
async def test_decision_locks_request_and_announcement(
    mock_db, user, other_user, monkeypatch
):
    announcement = make_announcement(user.id)
    request = make_request(announcement.id, other_user.id)
    mock_db.scalar.side_effect = [request, announcement]

    await call_decision(
        mock_db,
        user,
        request.id,
        PlayerRequestStatusEnum.accepted,
        monkeypatch,
    )

    assert request.status == PlayerRequestStatusEnum.accepted
    assert announcement.remaining_player_slots == 0
    assert mock_db.commit.await_count == 1
    request_query = mock_db.scalar.await_args_list[0].args[0]
    announcement_query = mock_db.scalar.await_args_list[1].args[0]
    assert request_query._for_update_arg is not None
    assert announcement_query._for_update_arg is not None


@pytest.mark.asyncio
async def test_accepting_with_no_slots_is_rejected(
    mock_db, user, other_user, monkeypatch
):
    announcement = make_announcement(user.id, slots=0)
    request = make_request(announcement.id, other_user.id)
    mock_db.scalar.side_effect = [request, announcement]

    with pytest.raises(ApiException) as caught:
        await call_decision(
            mock_db,
            user,
            request.id,
            PlayerRequestStatusEnum.accepted,
            monkeypatch,
        )

    assert caught.value.code == ErrorCode.ANNOUNCEMENT_FULL
    assert request.status == PlayerRequestStatusEnum.pending
    mock_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_rejecting_request_does_not_consume_slot(
    mock_db, user, other_user, monkeypatch
):
    announcement = make_announcement(user.id, slots=2)
    request = make_request(announcement.id, other_user.id)
    mock_db.scalar.side_effect = [request, announcement]

    await call_decision(
        mock_db,
        user,
        request.id,
        PlayerRequestStatusEnum.declined,
        monkeypatch,
    )

    assert request.status == PlayerRequestStatusEnum.declined
    assert announcement.remaining_player_slots == 2
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_deciding_already_decided_request_returns_specific_error(
    mock_db, user, other_user, monkeypatch
):
    announcement = make_announcement(user.id)
    request = make_request(announcement.id, other_user.id)
    request.status = PlayerRequestStatusEnum.declined
    mock_db.scalar.side_effect = [request, announcement]

    with pytest.raises(ApiException) as caught:
        await call_decision(
            mock_db,
            user,
            request.id,
            PlayerRequestStatusEnum.accepted,
            monkeypatch,
        )

    assert caught.value.code == ErrorCode.REQUEST_ALREADY_DECIDED
    mock_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_missing_announcement_returns_not_found(
    mock_db, user, other_user, monkeypatch
):
    request = make_request(uuid.uuid4(), other_user.id)
    mock_db.scalar.side_effect = [request, None]

    with pytest.raises(ApiException) as caught:
        await call_decision(
            mock_db,
            user,
            request.id,
            PlayerRequestStatusEnum.accepted,
            monkeypatch,
        )

    assert caught.value.code == ErrorCode.ANNOUNCEMENT_NOT_FOUND
    mock_db.commit.assert_not_awaited()
