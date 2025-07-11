from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: Optional[int] = 0
    due_date: Optional[date] = None
    project_id: int
    assignee_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class Task(TaskBase):
    id: int

class TaskLink(BaseModel):
    id: int
    title: str

class TaskWithDependencies(Task):
    successors: List[TaskLink] = []
    predecessors: List[TaskLink] = []
