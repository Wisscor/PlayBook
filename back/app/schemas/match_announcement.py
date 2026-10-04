import uuid
from typing import Optional

from datetime import datetime
from pydantic import (
    BaseModel,
    ConfigDict,
    AwareDatetime,
    model_validator,
)

from app.schemas.sport import SportResponse
from app.schemas.user import UserSummaryResponse
from app.models.match_announcement import AnnouncementTypeEnum


class MatchAnnouncementCreate(BaseModel):
    owner_id: uuid.UUID
    sport_id: uuid.UUID
    type: AnnouncementTypeEnum
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def check_update(self):
        if not self.start_time < self.end_time:
            raise ValueError("end_time must be after start_time")
        return self


class MatchAnnouncementUpdate(BaseModel):
    """Partial update. At least one field is required.

    If only one of start_time/end_time is sent, the service must compare it
    with the stored value of the other one (end_time > start_time).
    """

    sport_id: Optional[uuid.UUID]
    type: Optional[AnnouncementTypeEnum]
    start_time: Optional[datetime]
    end_time: Optional[datetime]

    @model_validator(mode="after")
    def check_update(self):
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
    owner: UserSummaryResponse
    sport: SportResponse
    type: AnnouncementTypeEnum
    start_time: datetime
    end_time: datetime
    created_at: datetime


class MatchAnnouncementFilter(BaseModel):
    """Query parameters of GET /match-announcements.
    Time window: start_time >= start_from and end_time <= end_to.
    """

    sport_id: Optional[uuid.UUID] = None
    type: Optional[AnnouncementTypeEnum] = None
    start_from: Optional[AwareDatetime] = None
    end_to: Optional[AwareDatetime] = None
    owner_id: Optional[uuid.UUID] = None


class MatchAnnouncementPage(BaseModel):
    items: list[MatchAnnouncementResponse]
    # ?cursor=next_cursor
    next_cursor: Optional[str] = None


# MatchAnnouncementFilter(sport_id, type, start_from, end_to, owner_id)
# MatchAnnouncementPage(list[matchs], nxt_cursor)
