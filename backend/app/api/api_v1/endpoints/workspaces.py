from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.models.workspace import Workspace
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.Workspace])
def list_workspaces(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    return db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()


@router.post("/", response_model=schemas.Workspace)
def create_workspace(
    workspace_in: schemas.WorkspaceCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    ws = Workspace(name=workspace_in.name, owner_id=current_user.id)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws
