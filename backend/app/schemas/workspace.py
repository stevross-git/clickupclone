from pydantic import BaseModel
from typing import Optional

class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: int
    owner_id: Optional[int] = None

    class Config:
        orm_mode = True
