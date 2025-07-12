# backend/app/main.py
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
    UploadFile,
    File,
    APIRouter,
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text, or_
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import asyncio
import json
import logging
import os

from app.models import models
from app.schemas import schemas
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.db.session import SessionLocal, engine

# Import models for convenience
Base = models.Base
User = models.User
Workspace = models.Workspace
Project = models.Project
TaskList = models.TaskList
Task = models.Task
Comment = models.Comment
ActivityLog = models.ActivityLog
CustomField = models.CustomField
TaskCustomField = models.TaskCustomField
TimeEntry = models.TimeEntry
Attachment = models.Attachment
TaskStatus = models.TaskStatus
TaskPriority = models.TaskPriority
Goal = models.Goal

# Create tables
Base.metadata.create_all(bind=engine)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token"
)

app = FastAPI(title="ClickUp Clone API", version="1.0.0")

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
            self.active_connections[room].remove(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]

    async def broadcast_to_room(self, message: dict, room: str):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    self.disconnect(connection, room)

manager = ConnectionManager()

# Router for API endpoints
api_router = APIRouter()

# Create default account on startup
@app.on_event("startup")
def create_default_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "steve").first()
        if not user:
            hashed = get_password_hash("welcome123")
            user = User(
                email="steve@example.com",
                username="steve",
                full_name="Steve Johnson",
                hashed_password=hashed,
            )
            db.add(user)
            db.commit()
            
            # Create default workspace
            workspace = Workspace(
                name="Personal Workspace",
                description="Default workspace for projects",
                owner_id=user.id
            )
            db.add(workspace)
            db.commit()
            db.refresh(workspace)
            
            # Add user as member
            workspace.members.append(user)
            db.commit()
            
            # Create sample project
            project = Project(
                name="Sample Project",
                description="Getting started with project management",
                workspace_id=workspace.id,
                owner_id=user.id,
                color="#7c3aed"
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            
            # Add user as member
            project.members.append(user)
            db.commit()
            
            print("Default user created: steve@example.com / welcome123")
    finally:
        db.close()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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

# Auth endpoints
@api_router.post("/auth/token", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@api_router.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# User endpoints
@api_router.get("/users/me", response_model=schemas.User)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/users/me", response_model=schemas.User)
def update_user_me(
    user_update: schemas.UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@api_router.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@api_router.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Workspace endpoints
@api_router.post("/workspaces/", response_model=schemas.Workspace)
def create_workspace(workspace: schemas.WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
    
    return db_workspace

@api_router.get("/workspaces/", response_model=List[schemas.Workspace])
def read_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user.workspaces

@api_router.get("/workspaces/{workspace_id}", response_model=schemas.Workspace)
def read_workspace(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Check if user is member
    if current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    return workspace

# Project endpoints
@api_router.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check workspace access
    workspace = db.query(Workspace).filter(Workspace.id == project.workspace_id).first()
    if not workspace or current_user not in workspace.members:
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
        {"name": "To Do", "position": 0},
        {"name": "In Progress", "position": 1},
        {"name": "Done", "position": 2}
    ]
    
    for list_data in default_lists:
        task_list = TaskList(
            name=list_data["name"],
            project_id=db_project.id,
            position=list_data["position"]
        )
        db.add(task_list)
    
    db.commit()
    
    return db_project

@api_router.get("/projects/", response_model=List[schemas.Project])
def read_projects(workspace_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Project).join(Project.members).filter(User.id == current_user.id)
    
    if workspace_id:
        query = query.filter(Project.workspace_id == workspace_id)
    
    return query.all()

@api_router.get("/projects/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return project

@api_router.put("/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, project_update: schemas.ProjectUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    for key, value in project_update.dict(exclude_unset=True).items():
        setattr(project, key, value)
    
    db.commit()
    db.refresh(project)
    return project

@api_router.delete("/projects/{project_id}")
def delete_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project owner can delete")
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

# Task List endpoints
@api_router.post("/task-lists/", response_model=schemas.TaskList)
def create_task_list(task_list: schemas.TaskListCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == task_list.project_id).first()
    if not project or current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    db_task_list = TaskList(**task_list.dict())
    db.add(db_task_list)
    db.commit()
    db.refresh(db_task_list)
    return db_task_list

@api_router.get("/task-lists/", response_model=List[schemas.TaskList])
def read_task_lists(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return db.query(TaskList).filter(TaskList.project_id == project_id, TaskList.is_active == True).order_by(TaskList.position).all()

# Task endpoints
@api_router.post("/tasks/", response_model=schemas.Task)
async def create_task(task: schemas.TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Create task
    task_data = task.dict(exclude={'assignee_ids'})
    db_task = Task(**task_data, creator_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Add assignees
    if task.assignee_ids:
        assignees = db.query(User).filter(User.id.in_(task.assignee_ids)).all()
        db_task.assignees.extend(assignees)
        db.commit()
    
    # Broadcast to project room
    await manager.broadcast_to_room({
        "type": "task_created",
        "data": {"task_id": db_task.id, "project_id": project.id}
    }, f"project_{project.id}")
    
    return db_task

@api_router.get("/tasks/", response_model=List[schemas.Task])
def read_tasks(
    project_id: Optional[int] = None,
    task_list_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    include_archived: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).join(Task.project).join(Project.members).filter(User.id == current_user.id)

    if not include_archived:
        query = query.filter(Task.is_active == True)
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if task_list_id:
        query = query.filter(Task.task_list_id == task_list_id)
    if assignee_id:
        query = query.join(Task.assignees).filter(User.id == assignee_id)
    if status:
        query = query.filter(Task.status == status)
    
    return query.order_by(Task.position).all()

@api_router.get("/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check project access
    if current_user not in task.project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")

    return task

# Time entry endpoints
@api_router.post("/tasks/{task_id}/time-entries", response_model=schemas.TimeEntry)
def create_time_entry(task_id: int, entry: schemas.TimeEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=404, detail="Task not found")

    db_entry = TimeEntry(
        task_id=task_id,
        user_id=current_user.id,
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration=entry.duration,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@api_router.get("/tasks/{task_id}/time-entries", response_model=List[schemas.TimeEntry])
def read_time_entries(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.time_entries

# Attachment endpoints
@api_router.post("/tasks/{task_id}/attachments", response_model=schemas.Attachment)
async def upload_attachment(task_id: int, file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=404, detail="Task not found")

    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    file_location = os.path.join(settings.UPLOAD_FOLDER, file.filename)
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    attachment = Attachment(task_id=task_id, filename=file.filename, file_path=file_location)
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment

@api_router.get("/tasks/{task_id}/attachments", response_model=List[schemas.Attachment])
def get_attachments(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.attachments

# Custom field endpoints
@api_router.post("/custom-fields", response_model=schemas.CustomField)
def create_custom_field(field: schemas.CustomFieldCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_field = CustomField(**field.dict())
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field

@api_router.get("/custom-fields", response_model=List[schemas.CustomField])
def read_custom_fields(workspace_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(CustomField)
    if workspace_id:
        query = query.filter(CustomField.workspace_id == workspace_id)
    return query.all()

@api_router.post("/tasks/{task_id}/custom-fields/{field_id}", response_model=schemas.TaskCustomFieldValue)
def set_custom_field_value(task_id: int, field_id: int, value: Dict[str, Any], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=404, detail="Task not found")
    db_value = TaskCustomField(task_id=task_id, field_id=field_id, value=value.get("value"))
    db.add(db_value)
    db.commit()
    db.refresh(db_value)
    return db_value

@api_router.get("/tasks/{task_id}/custom-fields", response_model=List[schemas.TaskCustomFieldValue])
def get_custom_field_values(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.custom_field_values

# Goal endpoints
@api_router.post("/goals/", response_model=schemas.Goal)
def create_goal(goal: schemas.GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == goal.workspace_id).first()
    if not workspace or current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")

    db_goal = Goal(**goal.dict(), owner_id=current_user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@api_router.get("/goals/", response_model=List[schemas.Goal])
def read_goals(workspace_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Goal).join(Workspace).join(Workspace.members).filter(User.id == current_user.id)
    if workspace_id:
        query = query.filter(Goal.workspace_id == workspace_id)
    return query.all()

@api_router.get("/goals/{goal_id}", response_model=schemas.Goal)
def read_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal or current_user not in goal.workspace.members:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@api_router.put("/goals/{goal_id}", response_model=schemas.Goal)
def update_goal(goal_id: int, goal_update: schemas.GoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal or current_user not in goal.workspace.members:
        raise HTTPException(status_code=404, detail="Goal not found")
    for key, value in goal_update.dict(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return goal

@api_router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal or current_user not in goal.workspace.members:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"detail": "Goal deleted"}

# Dashboard endpoint
@api_router.get("/dashboard", response_model=schemas.DashboardData)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user's workspaces
    workspaces = current_user.workspaces
    
    # Get recent projects (last 5)
    recent_projects = db.query(Project).join(Project.members).filter(
        User.id == current_user.id
    ).order_by(Project.updated_at.desc()).limit(5).all()
    
    # Get recent tasks assigned to user
    recent_tasks = db.query(Task).join(Task.assignees).filter(
        User.id == current_user.id
    ).order_by(Task.updated_at.desc()).limit(10).all()
    
    # Calculate task summary
    all_user_tasks = db.query(Task).join(Task.assignees).filter(User.id == current_user.id).all()
    task_summary = schemas.TaskSummary(
        total_tasks=len(all_user_tasks),
        completed_tasks=len([t for t in all_user_tasks if t.status == TaskStatus.DONE]),
        in_progress_tasks=len([t for t in all_user_tasks if t.status == TaskStatus.IN_PROGRESS]),
        overdue_tasks=len([t for t in all_user_tasks if t.due_date and t.due_date < datetime.utcnow() and t.status != TaskStatus.DONE])
    )
    
    return schemas.DashboardData(
        workspaces=workspaces,
        recent_projects=recent_projects,
        recent_tasks=recent_tasks,
        task_summary=task_summary
    )

# WebSocket endpoint
@api_router.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    await manager.connect(websocket, f"project_{project_id}")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"project_{project_id}")

# Register API router with prefix
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

