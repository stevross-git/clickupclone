from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.models.project import Project
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.Project])
def list_projects(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    return db.query(Project).all()


@router.post("/", response_model=schemas.Project)
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    project = Project(**project_in.dict())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
