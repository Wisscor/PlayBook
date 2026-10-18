import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

from app.models.play_request import PlayerRequestStatusEnum as prsEnum
from .user import UserSummaryResponse


class PlayerRequestDecision(BaseModel):
    """Body of PATCH /play-requests/{id}. Only the announcement owner can send it,
    and only while the request is still `pending`."""

    status: Literal[prsEnum.accepted, prsEnum.declined]


class PlayerRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    announcement_id: uuid.UUID
    sender: UserSummaryResponse
    status: prsEnum
    created_at: datetime


class PlayerRequestFilter(BaseModel):
    """Query parameters of GET /play-requests."""

    role: Literal["sent", "received"]
    status: Optional[prsEnum] = None


class PlayerRequestPage(BaseModel):
    items: list[PlayerRequestResponse]
    next_offset: Optional[int] = None
