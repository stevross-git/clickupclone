# main.py
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import asyncio
import json
import logging

from models import Base, User, Workspace, Project, TaskList, Task, Comment, ActivityLog
from schemas import *

# Database setup
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/clickup_clone"
# For development, you can use SQLite:
# SQLALCHEMY_DATABASE_URL = "sqlite:///./clickup_clone.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Security
SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="ClickUp Clone API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_room(self, message: dict, room: str):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Remove dead connections
                    self.active_connections[room].remove(connection)

manager = ConnectionManager()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenPayload(sub=username)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == token_data.sub).first()
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@app.post("/auth/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        avatar_url=user.avatar_url
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# User endpoints
@app.get("/users/", response_model=List[User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Workspace endpoints
@app.post("/workspaces/", response_model=Workspace)
def create_workspace(workspace: WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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

@app.get("/workspaces/", response_model=List[Workspace])
def read_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user.workspaces

@app.get("/workspaces/{workspace_id}", response_model=Workspace)
def read_workspace(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Check if user is member
    if current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    return workspace

@app.put("/workspaces/{workspace_id}", response_model=Workspace)
def update_workspace(workspace_id: int, workspace_update: WorkspaceUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Check if user is owner or admin
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only workspace owner can update")
    
    for key, value in workspace_update.dict(exclude_unset=True).items():
        setattr(workspace, key, value)
    
    db.commit()
    db.refresh(workspace)
    return workspace

# Project endpoints
@app.post("/projects/", response_model=Project)
def create_project(project: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
    
    return db_project

@app.get("/projects/", response_model=List[Project])
def read_projects(workspace_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Project).join(Project.members).filter(User.id == current_user.id)
    
    if workspace_id:
        query = query.filter(Project.workspace_id == workspace_id)
    
    return query.all()

@app.get("/projects/{project_id}", response_model=Project)
def read_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return project

# Task List endpoints
@app.post("/task-lists/", response_model=TaskList)
def create_task_list(task_list: TaskListCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == task_list.project_id).first()
    if not project or current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    db_task_list = TaskList(**task_list.dict())
    db.add(db_task_list)
    db.commit()
    db.refresh(db_task_list)
    return db_task_list

@app.get("/task-lists/", response_model=List[TaskList])
def read_task_lists(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check project access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return db.query(TaskList).filter(TaskList.project_id == project_id, TaskList.is_active == True).order_by(TaskList.position).all()

# Task endpoints
@app.post("/tasks/", response_model=Task)
def create_task(task: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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

@app.get("/tasks/", response_model=List[Task])
def read_tasks(
    project_id: Optional[int] = None,
    task_list_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).join(Task.project).join(Project.members).filter(User.id == current_user.id)
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if task_list_id:
        query = query.filter(Task.task_list_id == task_list_id)
    if assignee_id:
        query = query.join(Task.assignees).filter(User.id == assignee_id)
    if status:
        query = query.filter(Task.status == status)
    
    return query.order_by(Task.position).all()

@app.get("/tasks/{task_id}", response_model=Task)
def read_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check project access
    if current_user not in task.project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    return task

@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check project access
    if current_user not in task.project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Update task fields
    update_data = task_update.dict(exclude_unset=True, exclude={'assignee_ids'})
    for key, value in update_data.items():
        setattr(task, key, value)
    
    # Update assignees if provided
    if task_update.assignee_ids is not None:
        assignees = db.query(User).filter(User.id.in_(task_update.assignee_ids)).all()
        task.assignees = assignees
    
    # Mark as completed if status changed to done
    if task_update.status == TaskStatus.DONE and task.completed_at is None:
        task.completed_at = datetime.utcnow()
    elif task_update.status != TaskStatus.DONE:
        task.completed_at = None
    
    db.commit()
    db.refresh(task)
    
    # Broadcast update
    await manager.broadcast_to_room({
        "type": "task_updated",
        "data": {"task_id": task.id, "project_id": task.project_id}
    }, f"project_{task.project_id}")
    
    return task

@app.post("/tasks/{task_id}/move")
def move_task(task_id: int, move_data: TaskMove, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check project access
    if current_user not in task.project.members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    
    # Update task list and position
    task.task_list_id = move_data.task_list_id
    task.position = move_data.position
    
    db.commit()
    
    # Broadcast move
    await manager.broadcast_to_room({
        "type": "task_moved",
        "data": {"task_id": task.id, "project_id": task.project_id, "new_list_id": move_data.task_list_id}
    }, f"project_{task.project_id}")
    
    return {"message": "Task moved successfully"}

# Comment endpoints
@app.post("/comments/", response_model=Comment)
def create_comment(comment: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check task access
    task = db.query(Task).filter(Task.id == comment.task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this task")
    
    db_comment = Comment(**comment.dict(), author_id=current_user.id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Broadcast comment
    await manager.broadcast_to_room({
        "type": "comment_added",
        "data": {"task_id": task.id, "comment_id": db_comment.id}
    }, f"project_{task.project_id}")
    
    return db_comment

@app.get("/comments/", response_model=List[Comment])
def read_comments(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check task access
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or current_user not in task.project.members:
        raise HTTPException(status_code=403, detail="Not authorized to view comments")
    
    return db.query(Comment).filter(Comment.task_id == task_id, Comment.is_active == True).order_by(Comment.created_at).all()

# Dashboard endpoint
@app.get("/dashboard", response_model=DashboardData)
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
    task_summary = TaskSummary(
        total_tasks=len(all_user_tasks),
        completed_tasks=len([t for t in all_user_tasks if t.status == TaskStatus.DONE]),
        in_progress_tasks=len([t for t in all_user_tasks if t.status == TaskStatus.IN_PROGRESS]),
        overdue_tasks=len([t for t in all_user_tasks if t.due_date and t.due_date < datetime.utcnow() and t.status != TaskStatus.DONE])
    )
    
    return DashboardData(
        workspaces=workspaces,
        recent_projects=recent_projects,
        recent_tasks=recent_tasks,
        task_summary=task_summary
    )

# WebSocket endpoint
@app.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    await manager.connect(websocket, f"project_{project_id}")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"project_{project_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)