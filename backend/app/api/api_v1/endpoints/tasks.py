from fastapi import APIRouter, Depends
from typing import List

from app.schemas.task import Task
from app.api import deps

router = APIRouter()

FAKE_TASKS = [
    Task(id=1, title="First Task", description="Test", status="open"),
    Task(id=2, title="Second Task", description="Another", status="done"),
]

@router.get("/", response_model=List[Task])
def get_tasks(current_user=Depends(deps.get_current_active_user)):
    return FAKE_TASKS
