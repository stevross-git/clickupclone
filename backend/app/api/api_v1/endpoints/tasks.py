from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import date

from app.schemas.task import Task, TaskBase
from app.api import deps

router = APIRouter()

FAKE_TASKS = [
    Task(id=1, title="First Task", description="Test", status="open", due_date=date.today()),
    Task(id=2, title="Second Task", description="Another", status="done", due_date=None),
]
_next_id = 3

@router.get("/", response_model=List[Task])
def get_tasks(current_user=Depends(deps.get_current_active_user)):
    return FAKE_TASKS


@router.post("/", response_model=Task)
def create_task(
    task_in: TaskBase, current_user=Depends(deps.get_current_active_user)
):
    global _next_id
    new_task = Task(id=_next_id, **task_in.dict())
    _next_id += 1
    FAKE_TASKS.append(new_task)
    return new_task


@router.put("/{task_id}", response_model=Task)
def update_task(
    task_id: int, task_in: TaskBase, current_user=Depends(deps.get_current_active_user)
):
    for idx, t in enumerate(FAKE_TASKS):
        if t.id == task_id:
            updated = Task(id=task_id, **task_in.dict())
            FAKE_TASKS[idx] = updated
            return updated
    raise HTTPException(status_code=404, detail="Task not found")


@router.delete("/{task_id}", response_model=Task)
def delete_task(task_id: int, current_user=Depends(deps.get_current_active_user)):
    for idx, t in enumerate(FAKE_TASKS):
        if t.id == task_id:
            return FAKE_TASKS.pop(idx)
    raise HTTPException(status_code=404, detail="Task not found")
