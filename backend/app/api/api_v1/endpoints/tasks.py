from typing import List
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app import schemas
from app.models.task import Task
from app.models.activity_log import ActivityLog
from app.api import deps
from app.websockets.manager import manager

router = APIRouter()


@router.get("/", response_model=List[schemas.Task])
def get_tasks(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    return db.query(Task).all()


@router.post("/", response_model=schemas.Task)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    task = Task(**task_in.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    log = ActivityLog(action="create", task_id=task.id, user_id=current_user.id)
    db.add(log)
    db.commit()
    asyncio.create_task(manager.broadcast({"event": "task_created", "task": jsonable_encoder(task)}))
    return task


@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in task_in.dict().items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    log = ActivityLog(action="update", task_id=task.id, user_id=current_user.id)
    db.add(log)
    db.commit()
    asyncio.create_task(manager.broadcast({"event": "task_updated", "task": jsonable_encoder(task)}))
    return task


@router.delete("/{task_id}", response_model=schemas.Task)
def delete_task(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    log = ActivityLog(action="delete", task_id=task.id, user_id=current_user.id)
    db.add(log)
    db.commit()
    asyncio.create_task(manager.broadcast({"event": "task_deleted", "task_id": task.id}))
    return task
