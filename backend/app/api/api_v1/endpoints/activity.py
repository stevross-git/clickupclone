from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.models.activity_log import ActivityLog
from app.models.task import Task
from app.models.project import Project
from app.api import deps

router = APIRouter()

@router.get('/', response_model=List[schemas.ActivityLog])
def list_logs(
    task_id: Optional[int] = None,
    workspace_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    query = db.query(ActivityLog)
    if task_id:
        query = query.filter(ActivityLog.task_id == task_id)
    if workspace_id:
        query = query.join(Task).join(Project).filter(Project.workspace_id == workspace_id)
    return query.order_by(ActivityLog.created_at.desc()).all()
