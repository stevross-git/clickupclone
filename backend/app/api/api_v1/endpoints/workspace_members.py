from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.api import deps

router = APIRouter()

@router.get('/{workspace_id}/members', response_model=List[schemas.User])
def list_members(
    workspace_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail='Workspace not found')
    return [m.user for m in ws.members]

@router.post('/{workspace_id}/members', response_model=schemas.WorkspaceMember)
def add_member(
    workspace_id: int,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail='Workspace not found')
    membership = WorkspaceMember(workspace_id=workspace_id, user_id=user_id)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership
