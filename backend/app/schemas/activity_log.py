from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ActivityLogBase(BaseModel):
    action: str
    task_id: int
    user_id: Optional[int] = None

class ActivityLog(ActivityLogBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
