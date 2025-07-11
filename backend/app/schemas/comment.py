from pydantic import BaseModel
from typing import Optional

class CommentBase(BaseModel):
    content: str
    task_id: int

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        orm_mode = True
