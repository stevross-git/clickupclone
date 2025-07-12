# backend/app/schemas/schemas.py
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.models import TaskStatus, TaskPriority

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserInDB(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
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
    color: Optional[str] = "#3b82f6"

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
    workspace: Workspace
    owner: User
    members: List[User] = []

# TaskList Schemas
class TaskListBase(BaseModel):
    name: str
    position: Optional[int] = 0

class TaskListCreate(TaskListBase):
    project_id: int

class TaskListUpdate(BaseModel):
    name: Optional[str] = None
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
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    position: Optional[int] = 0
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    project_id: int
    task_list_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    position: Optional[int] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    task_list_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None

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
# Custom Field Schemas
class CustomFieldBase(BaseModel):
    name: str
    field_type: str = "text"
    options: Optional[str] = None
    workspace_id: Optional[int] = None
    is_required: bool = False

class CustomFieldCreate(CustomFieldBase):
    pass

class CustomFieldInDB(CustomFieldBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CustomField(CustomFieldInDB):
    pass

class TaskCustomFieldValue(BaseModel):
    id: int
    task_id: int
    field: CustomField
    value: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Time Entry Schemas
class TimeEntryBase(BaseModel):
    start_time: datetime
    end_time: datetime
    duration: float

class TimeEntryCreate(TimeEntryBase):
    task_id: int

class TimeEntryInDB(TimeEntryBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TimeEntry(TimeEntryInDB):
    pass

# Attachment Schemas
class AttachmentBase(BaseModel):
    filename: str
    file_path: str

class Attachment(AttachmentBase):
    id: int
    task_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Goal Schemas
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    workspace_id: int
    due_date: Optional[datetime] = None
    progress: Optional[float] = 0.0
    is_completed: Optional[bool] = False

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    workspace_id: Optional[int] = None
    due_date: Optional[datetime] = None
    progress: Optional[float] = None
    is_completed: Optional[bool] = None

class GoalInDB(GoalBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Goal(GoalInDB):
    owner: User

