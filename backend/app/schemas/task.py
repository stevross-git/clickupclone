from pydantic import BaseModel
from typing import List

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: str

class Task(TaskBase):
    id: int

class TaskLink(BaseModel):
    id: int
    title: str

class TaskWithDependencies(Task):
    successors: List[TaskLink] = []
    predecessors: List[TaskLink] = []
