from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID


class LikeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(..., description="The unique identifier of the like")
    post_id: UUID = Field(..., description="The ID of the post being liked")
    user_id: UUID = Field(..., description="The ID of the user who liked the post")
    created_at: datetime = Field(..., description="The timestamp when the like was created")