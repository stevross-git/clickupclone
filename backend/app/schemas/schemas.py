from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class User(UserInDB):
    pass

# Workspace Schemas
class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkspaceInDB(WorkspaceBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Workspace(WorkspaceInDB):
    owner: User
    members: List[User] = []

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3b82f6"

class ProjectCreate(ProjectBase):
    workspace_id: int

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class ProjectInDB(ProjectBase):
    id: int
    workspace_id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Project(ProjectInDB):
    owner: User
    members: List[User] = []

# TaskList Schemas
class TaskListBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#6b7280"
    position: int = 0

class TaskListCreate(TaskListBase):
    project_id: int

class TaskListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    position: Optional[int] = None

class TaskListInDB(TaskListBase):
    id: int
    project_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TaskList(TaskListInDB):
    pass

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    position: int = 0
    estimated_hours: Optional[int] = None
    actual_hours: Optional[int] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    project_id: int
    task_list_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    assignee_ids: List[int] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    position: Optional[int] = None
    estimated_hours: Optional[int] = None
    actual_hours: Optional[int] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    task_list_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = None

class TaskMove(BaseModel):
    task_list_id: int
    position: int

class TaskInDB(TaskBase):
    id: int
    project_id: int
    task_list_id: Optional[int] = None
    creator_id: int
    parent_task_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Task(TaskInDB):
    creator: User
    assignees: List[User] = []
    subtasks: List['Task'] = []

# Comment Schemas
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    task_id: int
    parent_comment_id: Optional[int] = None

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class CommentInDB(CommentBase):
    id: int
    task_id: int
    author_id: int
    parent_comment_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Comment(CommentInDB):
    author: User
    replies: List['Comment'] = []

# Activity Log Schemas
class ActivityLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: int
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None

class ActivityLog(ActivityLogBase):
    id: int
    user_id: int
    created_at: datetime
    user: User
    
    model_config = ConfigDict(from_attributes=True)

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# WebSocket Message Schemas
class WSMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    room: Optional[str] = None

# Dashboard/Analytics Schemas
class TaskSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int

class ProjectSummary(BaseModel):
    project: Project
    task_summary: TaskSummary

class DashboardData(BaseModel):
    workspaces: List[Workspace]
    recent_projects: List[Project]
    recent_tasks: List[Task]
    task_summary: TaskSummary

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None

# Bulk Operations
class BulkTaskUpdate(BaseModel):
    task_ids: List[int]
    updates: TaskUpdate

class BulkTaskMove(BaseModel):
    task_ids: List[int]
    target_list_id: int
    positions: List[int]

# Search and Filter Schemas
class TaskFilter(BaseModel):
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date_start: Optional[datetime] = None
    due_date_end: Optional[datetime] = None
    search: Optional[str] = None

class SearchResults(BaseModel):
    tasks: List[Task]
    projects: List[Project]
    users: List[User]