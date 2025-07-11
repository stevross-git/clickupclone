from pydantic import BaseModel

class WorkspaceMemberBase(BaseModel):
    workspace_id: int
    user_id: int

class WorkspaceMember(WorkspaceMemberBase):
    id: int

    class Config:
        orm_mode = True
