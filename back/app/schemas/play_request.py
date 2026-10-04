import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

from app.models.play_request import (
    PlayRequestStatusEnum as prsEnum,
    PlayRequest,
)
from .user import UserSummaryResponse


class PlayRequestDecision(BaseModel):
    """Body of PATCH /play-requests/{id}. Only the announcement owner can send it,

    and only while the request is still `pending`."""

    status: Literal[prsEnum.accepted, prsEnum.declined]


class UserSportCreate(BaseModel):
    announcement_id: uuid.UUID
    sender_id: uuid.UUID


class PlayRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    announcement_id: uuid.UUID
    sender: UserSummaryResponse
    status: prsEnum
    created_at: datetime


class PlayRequestListFilter(BaseModel):
    """Query parameters for GET /play-requests"""

    """Query parameters of GET /play-requests."""
    role: Literal["sent", "received"]
    status: Optional[prsEnum] = None


class PlayRequestPage(BaseModel):
    items: list[PlayRequestResponse]
    next_cursor: Optional[str] = None
