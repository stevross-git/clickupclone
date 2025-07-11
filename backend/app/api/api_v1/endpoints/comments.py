from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.models.comment import Comment
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.Comment])
def list_comments(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    return db.query(Comment).filter(Comment.task_id == task_id).all()


@router.post("/", response_model=schemas.Comment)
def create_comment(
    comment_in: schemas.CommentCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    comment = Comment(**comment_in.dict(), user_id=current_user.id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
