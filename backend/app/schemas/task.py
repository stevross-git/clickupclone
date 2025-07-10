from pydantic import BaseModel
from typing import List
from datetime import date

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: str
    due_date: date | None = None

class Task(TaskBase):
    id: int

class TaskLink(BaseModel):
    id: int
    title: str

class TaskWithDependencies(Task):
    successors: List[TaskLink] = []
    predecessors: List[TaskLink] = []
