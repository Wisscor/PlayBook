import uuid
from typing import Literal, Optional

from datetime import datetime
from pydantic import (
    BaseModel,
    ConfigDict,
    AwareDatetime,
    Field,
    model_validator,
)

from app.schemas.sport import SportResponse
from app.schemas.user import UserSummaryResponse
from app.models.match_announcement import MatchAnnouncementStatus


class MatchAnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    sport_id: uuid.UUID
    remaining_player_slots: int = Field(ge=1)
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_time_range(self):
        if not self.start_time < self.end_time:
            raise ValueError("end_time must be after start_time")
        return self


class MatchAnnouncementUpdate(BaseModel):
    """Partial update. At least one field is required.

    If only one of start_time/end_time is sent, the service must compare it
    with the stored value of the other one (end_time > start_time).
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sport_id: Optional[uuid.UUID] = None
    remaining_player_slots: Optional[int] = Field(default=None, ge=0)
    match_status: Optional[MatchAnnouncementStatus] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_update(self):
        # Check if at least one field is explicitly set for update
        if not self.model_fields_set:
            raise ValueError("at least one field is required")

        if (
            self.start_time
            and self.end_time
            and not self.start_time < self.end_time
        ):
            raise ValueError("end_time must be after start_time")
        return self


class MatchAnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    owner: UserSummaryResponse
    sport: SportResponse
    remaining_player_slots: int
    match_status: MatchAnnouncementStatus
    accepted_players: list[UserSummaryResponse] = Field(default_factory=list)
    start_time: datetime
    end_time: datetime
    created_at: datetime


class MatchAnnouncementFilter(BaseModel):
    """Query parameters of GET /match-announcements.
    Time window: start_time >= start_from and end_time <= end_to.
    """

    sport_id: Optional[uuid.UUID] = None
    match_status: Optional[MatchAnnouncementStatus] = None
    start_from: Optional[AwareDatetime] = None
    end_to: Optional[AwareDatetime] = None
    organizer_id: Optional[uuid.UUID] = None
    min_remaining_player_slots: Optional[int] = Field(default=None, ge=0)
    max_remaining_player_slots: Optional[int] = Field(default=None, ge=0)
    sort_by: Literal["start_time", "created_at", "remaining_player_slots"] = (
        "start_time"
    )
    sort_order: Literal["asc", "desc"] = "asc"


class MatchAnnouncementPage(BaseModel):
    items: list[MatchAnnouncementResponse]
    next_offset: Optional[int] = None
