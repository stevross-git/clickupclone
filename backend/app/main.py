# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, text
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import asyncio
import json
import logging
import os
import uuid
import aiofiles
from pathlib import Path

from app.models import models
from app.schemas import schemas
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, validate_password
from app.db.session import SessionLocal, engine

# Import all models
from app.models.models import (
    Base, User, Workspace, Project, TaskList, Task, Comment, 
    ActivityLog, TaskStatus, TaskPriority, TimeEntry, Goal,
    Notification, CustomField, Attachment, TaskDependency
)

# Create tables
Base.metadata.create_all(bind=engine)

# Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

app = FastAPI(title="ClickUp Clone API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
upload_dir = Path(settings.UPLOAD_FOLDER)
upload_dir.mkdir(exist_ok=True)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_FOLDER), name="uploads")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                self.active_connections[room].remove(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]

    async def broadcast_to_room(self, message: dict, room: str):
        if room in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.disconnect(conn, room)

manager = ConnectionManager()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependencies
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(
        or_(User.username == username, User.email == username)
    ).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def log_activity(db: Session, user_id: int, action: str, entity_type: str, entity_id: int, old_value=None, new_value=None):
    """Log user activity"""
    activity = ActivityLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        old_value=old_value,
        new_value=new_value
    )
    db.add(activity)
    db.commit()

async def create_notification(db: Session, user_id: int, title: str, message: str, entity_type: str = None, entity_id: int = None, action_url: str = None):
    """Create a notification for a user"""
    notification = Notification(
        title=title,
        message=message,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url
    )
    db.add(notification)
    db.commit()
    
    # Send real-time notification
    await manager.broadcast_to_room({
        "type": "notification",
        "data": {
            "id": notification.id,
            "title": title,
            "message": message,
            "created_at": notification.created_at.isoformat()
        }
    }, f"user_{user_id}")

# ========== AUTHENTICATION ENDPOINTS ==========

@app.post("/api/v1/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Validate password
    if not validate_password(user.password):
        raise HTTPException(
            status_code=400, 
            detail=f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
        )
    
    # Create user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/api/v1/auth/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(subject=user.username)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/auth/me", response_model=schemas.User)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

# ========== DASHBOARD ENDPOINTS ==========

@app.get("/api/v1/dashboard", response_model=schemas.DashboardData)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user's workspaces
    workspaces = db.query(Workspace).filter(
        or_(
            Workspace.owner_id == current_user.id,
            Workspace.members.any(User.id == current_user.id)
        )
    ).options(joinedload(Workspace.owner)).limit(10).all()
    
    # Get recent projects
    recent_projects = db.query(Project).filter(
        Project.members.any(User.id == current_user.id)
    ).options(
        joinedload(Project.workspace),
        joinedload(Project.owner)
    ).order_by(desc(Project.updated_at)).limit(10).all()
    
    # Get recent tasks
    recent_tasks = db.query(Task).filter(
        or_(
            Task.creator_id == current_user.id,
            Task.assignees.any(User.id == current_user.id)
        )
    ).options(
        joinedload(Task.creator),
        joinedload(Task.assignees)
    ).order_by(desc(Task.updated_at)).limit(10).all()
    
    # Get task summary
    total_tasks = db.query(Task).filter(
        or_(
            Task.creator_id == current_user.id,
            Task.assignees.any(User.id == current_user.id)
        ),
        Task.is_active == True
    ).count()
    
    completed_tasks = db.query(Task).filter(
        or_(
            Task.creator_id == current_user.id,
            Task.assignees.any(User.id == current_user.id)
        ),
        Task.status == TaskStatus.DONE,
        Task.is_active == True
    ).count()
    
    in_progress_tasks = db.query(Task).filter(
        or_(
            Task.creator_id == current_user.id,
            Task.assignees.any(User.id == current_user.id)
        ),
        Task.status == TaskStatus.IN_PROGRESS,
        Task.is_active == True
    ).count()
    
    overdue_tasks = db.query(Task).filter(
        or_(
            Task.creator_id == current_user.id,
            Task.assignees.any(User.id == current_user.id)
        ),
        Task.due_date < datetime.utcnow(),
        Task.status != TaskStatus.DONE,
        Task.is_active == True
    ).count()
    
    task_summary = schemas.TaskSummary(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        overdue_tasks=overdue_tasks
    )
    
    return schemas.DashboardData(
        workspaces=workspaces,
        recent_projects=recent_projects,
        recent_tasks=recent_tasks,
        task_summary=task_summary
    )

# ========== WORKSPACE ENDPOINTS ==========

@app.post("/api/v1/workspaces/", response_model=schemas.Workspace)
async def create_workspace(workspace: schemas.WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_workspace = Workspace(
        **workspace.dict(),
        owner_id=current_user.id
    )
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    
    # Add creator as member
    db_workspace.members.append(current_user)
    db.commit()
    
    await log_activity(db, current_user.id, "created", "workspace", db_workspace.id)
    
    return db_workspace

@app.get("/api/v1/workspaces/", response_model=List[schemas.Workspace])
def read_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Workspace).filter(
        or_(
            Workspace.owner_id == current_user.id,
            Workspace.members.any(User.id == current_user.id)
        )
    ).options(
        joinedload(Workspace.owner),
        joinedload(Workspace.members)
    ).all()

@app.get("/api/v1/workspaces/{workspace_id}", response_model=schemas.Workspace)
def read_workspace(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).options(
        joinedload(Workspace.owner),
        joinedload(Workspace.members)
    ).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Check if user is member
    if current_user not in workspace.members and workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    return workspace

# ========== PROJECT ENDPOINTS ==========

@app.post("/api/v1/projects/", response_model=schemas.Project)
async def create_project(project: schemas.ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check workspace access
    workspace = db.query(Workspace).filter(Workspace.id == project.workspace_id).first()
    if not workspace or (current_user not in workspace.members and workspace.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    db_project = Project(
        **project.dict(),
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Add creator as member
    db_project.members.append(current_user)
    db.commit()
    
    # Create default task lists
    default_lists = [
        {"name": "To Do", "position": 0, "color": "#6b7280"},
        {"name": "In Progress", "position": 1, "color": "#3b82f6"},
        {"name": "Review", "position": 2, "color": "#f59e0b"},
        {"name": "Done", "position": 3, "color": "#10b981"}
    ]
    
    for list_data in default_lists:
        task_list = TaskList(
            name=list_data["name"],
            project_id=db_project.id,
            position=list_data["position"],
            color=list_data["color"]
        )
        db.add(task_list)
    
    db.commit()
    
    await log_activity(db, current_user.id, "created", "project", db_project.id)
    
    return db_project

@app.get("/api/v1/projects/", response_model=List[schemas.Project])
def read_projects(workspace_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Project).filter(
        or_(
            Project.owner_id == current_user.id,
            Project.members.any(User.id == current_user.id)
        )
    ).options(
        joinedload(Project.workspace),
        joinedload(Project.owner),
        joinedload(Project.members)
    )
    
    if workspace_id:
        query = query.filter(Project.workspace_id == workspace_id)
    
    return query.all()

@app.get("/api/v1/projects/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).options(
        joinedload(Project.workspace),
        joinedload(Project.owner),
        joinedload(Project.members)
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    if current_user not in project.members and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return project

# ========== TASK LIST ENDPOINTS ==========

@app.post("/api/v1/task-lists/", response_model=schemas.TaskList)
async def create_task_list(task_list: schemas.TaskListCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == task_list.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    db_task_list = TaskList(**task_list.dict())
    db.add(db_task_list)
    db.commit()
    db.refresh(db_task_list)
    
    await log_activity(db, current_user.id, "created", "task_list", db_task_list.id)
    
    return db_task_list

@app.get("/api/v1/task-lists/", response_model=List[schemas.TaskList])
def read_task_lists(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return db.query(TaskList).filter(
        TaskList.project_id == project_id,
        TaskList.is_active == True
    ).order_by(TaskList.position).all()

# ========== TASK ENDPOINTS ==========

@app.post("/api/v1/tasks/", response_model=schemas.Task)
async def create_task(task: schemas.TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Create task
    task_data = task.dict()
    assignee_ids = task_data.pop("assignee_ids", [])
    
    db_task = Task(
        **task_data,
        creator_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Add assignees
    if assignee_ids:
        assignees = db.query(User).filter(User.id.in_(assignee_ids)).all()
        db_task.assignees.extend(assignees)
        db.commit()
    
    await log_activity(db, current_user.id, "created", "task", db_task.id)
    
    # Notify assignees
    for assignee in db_task.assignees:
        if assignee.id != current_user.id:
            await create_notification(
                db, assignee.id,
                "New task assigned",
                f"{current_user.full_name} assigned you to '{db_task.title}'",
                "task", db_task.id,
                f"/project/{project.id}?task={db_task.id}"
            )
    
    # Broadcast to project room
    await manager.broadcast_to_room({
        "type": "task_created",
        "data": {"task_id": db_task.id, "project_id": project.id}
    }, f"project_{project.id}")
    
    return db_task

@app.get("/api/v1/tasks/", response_model=List[schemas.Task])
def read_tasks(
    project_id: Optional[int] = None,
    task_list_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.is_active == True).options(
        joinedload(Task.creator),
        joinedload(Task.assignees),
        joinedload(Task.watchers)
    )
    
    if project_id:
        # Check project access
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project or (current_user not in project.members and project.owner_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not a member of this project")
        query = query.filter(Task.project_id == project_id)
    else:
        # Show only tasks user has access to
        query = query.filter(
            or_(
                Task.creator_id == current_user.id,
                Task.assignees.any(User.id == current_user.id),
                Task.watchers.any(User.id == current_user.id)
            )
        )
    
    if task_list_id:
        query = query.filter(Task.task_list_id == task_list_id)
    if assignee_id:
        query = query.filter(Task.assignees.any(User.id == assignee_id))
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    
    return query.order_by(Task.position, Task.created_at).all()

@app.get("/api/v1/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).options(
        joinedload(Task.creator),
        joinedload(Task.assignees),
        joinedload(Task.watchers),
        joinedload(Task.subtasks)
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check access
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return task

@app.put("/api/v1/tasks/{task_id}", response_model=schemas.Task)
async def update_task(task_id: int, task_update: schemas.TaskUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check access
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Store old values for activity log
    old_values = {
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "assignees": [a.id for a in task.assignees]
    }
    
    # Update task
    update_data = task_update.dict(exclude_unset=True)
    assignee_ids = update_data.pop("assignee_ids", None)
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Update assignees if provided
    if assignee_ids is not None:
        task.assignees.clear()
        if assignee_ids:
            assignees = db.query(User).filter(User.id.in_(assignee_ids)).all()
            task.assignees.extend(assignees)
    
    # Set completion time
    if task.status == TaskStatus.DONE and not task.completed_at:
        task.completed_at = datetime.utcnow()
    elif task.status != TaskStatus.DONE:
        task.completed_at = None
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    # Log activity
    new_values = {
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "assignees": [a.id for a in task.assignees]
    }
    await log_activity(db, current_user.id, "updated", "task", task.id, old_values, new_values)
    
    # Broadcast update
    await manager.broadcast_to_room({
        "type": "task_updated",
        "data": {"task_id": task.id, "project_id": task.project_id}
    }, f"project_{task.project_id}")
    
    return task

# ========== TIME TRACKING ENDPOINTS ==========

@app.post("/api/v1/time-entries/", response_model=schemas.TimeEntry)
async def create_time_entry(time_entry: schemas.TimeEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check task access
    task = db.query(Task).filter(Task.id == time_entry.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    db_time_entry = TimeEntry(
        **time_entry.dict(),
        user_id=current_user.id
    )
    db.add(db_time_entry)
    
    # Update task actual hours
    total_hours = db.query(func.sum(TimeEntry.hours)).filter(
        TimeEntry.task_id == time_entry.task_id
    ).scalar() or 0
    task.actual_hours = total_hours + time_entry.hours
    
    db.commit()
    db.refresh(db_time_entry)
    
    await log_activity(db, current_user.id, "created", "time_entry", db_time_entry.id)
    
    return db_time_entry

@app.get("/api/v1/time-entries/", response_model=List[schemas.TimeEntry])
def read_time_entries(
    task_id: Optional[int] = None,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TimeEntry)
    
    if task_id:
        # Check task access
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if not project or (current_user not in project.members and project.owner_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not a member of this project")
        
        query = query.filter(TimeEntry.task_id == task_id)
    else:
        # Show only user's own time entries
        query = query.filter(TimeEntry.user_id == current_user.id)
    
    if user_id:
        query = query.filter(TimeEntry.user_id == user_id)
    if start_date:
        query = query.filter(TimeEntry.date >= start_date)
    if end_date:
        query = query.filter(TimeEntry.date <= end_date)
    
    return query.order_by(desc(TimeEntry.date)).all()

# ========== COMMENT ENDPOINTS ==========

@app.post("/api/v1/comments/", response_model=schemas.Comment)
async def create_comment(comment: schemas.CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check task access
    task = db.query(Task).filter(Task.id == comment.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    db_comment = Comment(
        **comment.dict(),
        author_id=current_user.id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    await log_activity(db, current_user.id, "commented", "task", task.id)
    
    # Notify task watchers and assignees
    notified_users = set()
    for user in task.watchers + task.assignees + [task.creator]:
        if user.id != current_user.id and user.id not in notified_users:
            await create_notification(
                db, user.id,
                "New comment",
                f"{current_user.full_name} commented on '{task.title}'",
                "task", task.id,
                f"/project/{project.id}?task={task.id}"
            )
            notified_users.add(user.id)
    
    # Broadcast to project room
    await manager.broadcast_to_room({
        "type": "comment_created",
        "data": {"comment_id": db_comment.id, "task_id": task.id, "project_id": task.project_id}
    }, f"project_{task.project_id}")
    
    return db_comment

@app.get("/api/v1/comments/", response_model=List[schemas.Comment])
def read_comments(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check task access
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return db.query(Comment).filter(
        Comment.task_id == task_id,
        Comment.is_active == True
    ).options(
        joinedload(Comment.author),
        joinedload(Comment.replies)
    ).order_by(Comment.created_at).all()

# ========== FILE UPLOAD ENDPOINTS ==========

@app.post("/api/v1/tasks/{task_id}/attachments/", response_model=schemas.Attachment)
async def upload_file(
    task_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check task access
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Validate file
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if file_extension not in settings.ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Create attachment record
    attachment = Attachment(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=file.size,
        content_type=file.content_type,
        task_id=task_id,
        uploaded_by_id=current_user.id
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    await log_activity(db, current_user.id, "uploaded", "attachment", attachment.id)
    
    return attachment

@app.get("/api/v1/tasks/{task_id}/attachments/", response_model=List[schemas.Attachment])
def get_attachments(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check task access
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return db.query(Attachment).filter(Attachment.task_id == task_id).options(
        joinedload(Attachment.uploaded_by)
    ).order_by(desc(Attachment.created_at)).all()

# ========== CUSTOM FIELDS ENDPOINTS ==========

@app.post("/api/v1/custom-fields/", response_model=schemas.CustomField)
async def create_custom_field(custom_field: schemas.CustomFieldCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == custom_field.project_id).first()
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project owners can create custom fields")
    
    db_custom_field = CustomField(**custom_field.dict())
    db.add(db_custom_field)
    db.commit()
    db.refresh(db_custom_field)
    
    await log_activity(db, current_user.id, "created", "custom_field", db_custom_field.id)
    
    return db_custom_field

@app.get("/api/v1/custom-fields/", response_model=List[schemas.CustomField])
def read_custom_fields(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return db.query(CustomField).filter(
        CustomField.project_id == project_id
    ).order_by(CustomField.position).all()

# ========== GOALS ENDPOINTS ==========

@app.post("/api/v1/goals/", response_model=schemas.Goal)
async def create_goal(goal: schemas.GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check workspace access
    workspace = db.query(Workspace).filter(Workspace.id == goal.workspace_id).first()
    if not workspace or (current_user not in workspace.members and workspace.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    db_goal = Goal(
        **goal.dict(),
        owner_id=current_user.id
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    await log_activity(db, current_user.id, "created", "goal", db_goal.id)
    
    return db_goal

@app.get("/api/v1/goals/", response_model=List[schemas.Goal])
def read_goals(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check workspace access
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace or (current_user not in workspace.members and workspace.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    return db.query(Goal).filter(
        Goal.workspace_id == workspace_id,
        Goal.is_active == True
    ).options(joinedload(Goal.owner)).order_by(desc(Goal.created_at)).all()

# ========== NOTIFICATION ENDPOINTS ==========

@app.get("/api/v1/notifications/", response_model=List[schemas.Notification])
def read_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(50).all()

@app.put("/api/v1/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.status = "read"  # Changed from enum to string
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read"}

# ========== WEBSOCKET ENDPOINTS ==========

@app.websocket("/api/v1/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str, token: str, db: Session = Depends(get_db)):
    try:
        # Authenticate user
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            await websocket.close(code=1008)
            return
        
        await manager.connect(websocket, room)
        
        try:
            while True:
                # Send heartbeat every 30 seconds
                await asyncio.sleep(30)
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, room)
        except Exception as e:
            logging.error(f"WebSocket error: {e}")
            manager.disconnect(websocket, room)
            
    except Exception as e:
        logging.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=1008)

# ========== SEARCH ENDPOINTS ==========

@app.get("/api/v1/search/")
def search(
    q: str,
    type: Optional[str] = None,  # tasks, projects, comments
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = {"tasks": [], "projects": [], "comments": []}
    
    if not type or type == "tasks":
        # Search tasks
        task_query = db.query(Task).filter(
            or_(
                Task.title.ilike(f"%{q}%"),
                Task.description.ilike(f"%{q}%")
            ),
            Task.is_active == True
        ).options(
            joinedload(Task.creator),
            joinedload(Task.assignees)
        )
        
        if project_id:
            task_query = task_query.filter(Task.project_id == project_id)
        else:
            # Only show tasks user has access to
            task_query = task_query.filter(
                or_(
                    Task.creator_id == current_user.id,
                    Task.assignees.any(User.id == current_user.id),
                    Task.watchers.any(User.id == current_user.id)
                )
            )
        
        results["tasks"] = task_query.limit(10).all()
    
    if not type or type == "projects":
        # Search projects
        project_query = db.query(Project).filter(
            or_(
                Project.name.ilike(f"%{q}%"),
                Project.description.ilike(f"%{q}%")
            ),
            Project.is_active == True,
            or_(
                Project.owner_id == current_user.id,
                Project.members.any(User.id == current_user.id)
            )
        ).options(
            joinedload(Project.workspace),
            joinedload(Project.owner)
        )
        
        results["projects"] = project_query.limit(10).all()
    
    if not type or type == "comments":
        # Search comments
        comment_query = db.query(Comment).filter(
            Comment.content.ilike(f"%{q}%"),
            Comment.is_active == True
        ).join(Task).filter(
            or_(
                Task.creator_id == current_user.id,
                Task.assignees.any(User.id == current_user.id),
                Task.watchers.any(User.id == current_user.id)
            )
        ).options(
            joinedload(Comment.author),
            joinedload(Comment.task)
        )
        
        if project_id:
            comment_query = comment_query.filter(Task.project_id == project_id)
        
        results["comments"] = comment_query.limit(10).all()
    
    return results

# ========== TASK DEPENDENCIES ENDPOINTS ==========

@app.post("/api/v1/tasks/{task_id}/dependencies/")
async def add_task_dependency(
    task_id: int, 
    depends_on_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check if both tasks exist and user has access
    task = db.query(Task).filter(Task.id == task_id).first()
    depends_on_task = db.query(Task).filter(Task.id == depends_on_id).first()
    
    if not task or not depends_on_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check project access for both tasks
    for t in [task, depends_on_task]:
        project = db.query(Project).filter(Project.id == t.project_id).first()
        if not project or (current_user not in project.members and project.owner_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Check if dependency already exists
    existing = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id,
        TaskDependency.depends_on_id == depends_on_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Dependency already exists")
    
    # Check for circular dependencies
    def has_circular_dependency(start_task_id, target_task_id, visited=None):
        if visited is None:
            visited = set()
        
        if start_task_id in visited:
            return True
        
        if start_task_id == target_task_id:
            return True
        
        visited.add(start_task_id)
        
        dependencies = db.query(TaskDependency).filter(
            TaskDependency.depends_on_id == start_task_id
        ).all()
        
        for dep in dependencies:
            if has_circular_dependency(dep.task_id, target_task_id, visited.copy()):
                return True
        
        return False
    
    if has_circular_dependency(depends_on_id, task_id):
        raise HTTPException(status_code=400, detail="This would create a circular dependency")
    
    # Create dependency
    dependency = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
    db.add(dependency)
    db.commit()
    
    await log_activity(db, current_user.id, "added_dependency", "task", task_id)
    
    return {"message": "Dependency added successfully"}

@app.delete("/api/v1/tasks/{task_id}/dependencies/{depends_on_id}")
async def remove_task_dependency(
    task_id: int, 
    depends_on_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check task access
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Remove dependency
    dependency = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id,
        TaskDependency.depends_on_id == depends_on_id
    ).first()
    
    if not dependency:
        raise HTTPException(status_code=404, detail="Dependency not found")
    
    db.delete(dependency)
    db.commit()
    
    await log_activity(db, current_user.id, "removed_dependency", "task", task_id)
    
    return {"message": "Dependency removed successfully"}

@app.get("/api/v1/tasks/{task_id}/dependencies/")
def get_task_dependencies(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check task access
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Get dependencies (tasks this task depends on)
    dependencies = db.query(Task).join(
        TaskDependency, TaskDependency.depends_on_id == Task.id
    ).filter(TaskDependency.task_id == task_id).all()
    
    # Get blocking tasks (tasks that depend on this task)
    blocking = db.query(Task).join(
        TaskDependency, TaskDependency.task_id == Task.id
    ).filter(TaskDependency.depends_on_id == task_id).all()
    
    return {
        "dependencies": dependencies,
        "blocking": blocking
    }

# ========== HEALTH CHECK ENDPOINT ==========

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# ========== BULK OPERATIONS ENDPOINTS ==========

@app.post("/api/v1/tasks/bulk-update/")
async def bulk_update_tasks(
    task_updates: List[Dict[str, Any]], 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Bulk update multiple tasks"""
    updated_tasks = []
    
    for update_data in task_updates:
        task_id = update_data.get("id")
        if not task_id:
            continue
            
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            continue
        
        # Check access
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if not project or (current_user not in project.members and project.owner_id != current_user.id):
            continue
        
        # Update fields
        for field, value in update_data.items():
            if field != "id" and hasattr(task, field):
                setattr(task, field, value)
        
        task.updated_at = datetime.utcnow()
        updated_tasks.append(task)
    
    db.commit()
    
    # Broadcast updates
    for task in updated_tasks:
        await manager.broadcast_to_room({
            "type": "task_updated",
            "data": {"task_id": task.id, "project_id": task.project_id}
        }, f"project_{task.project_id}")
    
    await log_activity(db, current_user.id, "bulk_updated", "tasks", len(updated_tasks))
    
    return {"updated_count": len(updated_tasks)}

@app.post("/api/v1/tasks/bulk-delete/")
async def bulk_delete_tasks(
    task_ids: List[int], 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Bulk delete multiple tasks"""
    deleted_count = 0
    
    for task_id in task_ids:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            continue
        
        # Check access
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if not project or (current_user not in project.members and project.owner_id != current_user.id):
            continue
        
        # Soft delete
        task.is_active = False
        task.updated_at = datetime.utcnow()
        deleted_count += 1
        
        # Broadcast deletion
        await manager.broadcast_to_room({
            "type": "task_deleted",
            "data": {"task_id": task.id, "project_id": task.project_id}
        }, f"project_{task.project_id}")
    
    db.commit()
    
    await log_activity(db, current_user.id, "bulk_deleted", "tasks", deleted_count)
    
    return {"deleted_count": deleted_count}

# ========== ANALYTICS ENDPOINTS ==========

@app.get("/api/v1/analytics/project/{project_id}")
def get_project_analytics(
    project_id: int, 
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check project access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or (current_user not in project.members and project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Date range filter
    date_filter = []
    if start_date:
        date_filter.append(Task.created_at >= start_date)
    if end_date:
        date_filter.append(Task.created_at <= end_date)
    
    # Task statistics
    base_query = db.query(Task).filter(Task.project_id == project_id, Task.is_active == True)
    if date_filter:
        base_query = base_query.filter(and_(*date_filter))
    
    total_tasks = base_query.count()
    completed_tasks = base_query.filter(Task.status == TaskStatus.DONE).count()
    in_progress_tasks = base_query.filter(Task.status == TaskStatus.IN_PROGRESS).count()
    overdue_tasks = base_query.filter(
        Task.due_date < datetime.utcnow(),
        Task.status != TaskStatus.DONE
    ).count()
    
    # Task distribution by status
    status_distribution = db.query(
        Task.status, func.count(Task.id)
    ).filter(
        Task.project_id == project_id,
        Task.is_active == True
    ).group_by(Task.status).all()
    
    # Task distribution by priority
    priority_distribution = db.query(
        Task.priority, func.count(Task.id)
    ).filter(
        Task.project_id == project_id,
        Task.is_active == True
    ).group_by(Task.priority).all()
    
    # Time tracking statistics
    time_stats = db.query(
        func.sum(TimeEntry.hours).label('total_hours'),
        func.avg(TimeEntry.hours).label('avg_hours')
    ).join(Task).filter(
        Task.project_id == project_id
    ).first()
    
    # Completion rate over time (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    completion_timeline = db.query(
        func.date(Task.completed_at).label('date'),
        func.count(Task.id).label('count')
    ).filter(
        Task.project_id == project_id,
        Task.completed_at >= thirty_days_ago,
        Task.status == TaskStatus.DONE
    ).group_by(func.date(Task.completed_at)).all()
    
    return {
        "project_id": project_id,
        "summary": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "overdue_tasks": overdue_tasks,
            "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
        },
        "status_distribution": [{"status": s, "count": c} for s, c in status_distribution],
        "priority_distribution": [{"priority": p, "count": c} for p, c in priority_distribution],
        "time_tracking": {
            "total_hours": float(time_stats.total_hours) if time_stats.total_hours else 0,
            "average_hours": float(time_stats.avg_hours) if time_stats.avg_hours else 0
        },
        "completion_timeline": [{"date": str(date), "count": count} for date, count in completion_timeline]
    }

# ========== ERROR HANDLERS ==========

from fastapi.responses import JSONResponse

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Resource not found",
            "status_code": 404,
            "path": str(request.url.path)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logging.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "status_code": 500,
            "path": str(request.url.path)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)