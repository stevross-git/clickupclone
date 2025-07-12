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
    timezone: Optional[str] = None

class UserInDB(UserBase):
    id: int
    avatar_url: Optional[str] = None
    timezone: str = "UTC"
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
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
    settings: Optional[Dict[str, Any]] = None

class WorkspaceInDB(WorkspaceBase):
    id: int
    owner_id: int
    avatar_url: Optional[str] = None
    is_active: bool
    settings: Dict[str, Any] = {}
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
    is_private: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None

class ProjectInDB(ProjectBase):
    id: int
    workspace_id: int
    owner_id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_private: bool
    settings: Dict[str, Any] = {}
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
    color: Optional[str] = "#6b7280"

class TaskListCreate(TaskListBase):
    project_id: int

class TaskListUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None
    color: Optional[str] = None

class TaskListInDB(TaskListBase):
    id: int
    project_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TaskList(TaskListInDB):
    pass

# Custom Field Schemas
class CustomFieldBase(BaseModel):
    name: str
    field_type: str
    options: Optional[List[str]] = []
    is_required: Optional[bool] = False
    position: Optional[int] = 0

class CustomFieldCreate(CustomFieldBase):
    project_id: int

class CustomFieldUpdate(BaseModel):
    name: Optional[str] = None
    field_type: Optional[str] = None
    options: Optional[List[str]] = None
    is_required: Optional[bool] = None
    position: Optional[int] = None

class CustomField(CustomFieldBase):
    id: int
    project_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    position: Optional[int] = 0
    estimated_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    tags: Optional[List[str]] = []
    custom_field_values: Optional[Dict[str, Any]] = {}

class TaskCreate(TaskBase):
    project_id: int
    task_list_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = []

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
    tags: Optional[List[str]] = None
    custom_field_values: Optional[Dict[str, Any]] = None

class TaskInDB(TaskBase):
    id: int
    project_id: int
    task_list_id: Optional[int] = None
    creator_id: int
    parent_task_id: Optional[int] = None
    actual_hours: Optional[float] = None
    completed_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Task(TaskInDB):
    creator: User
    assignees: List[User] = []
    watchers: List[User] = []
    subtasks: List["Task"] = []

# Time Entry Schemas
class TimeEntryBase(BaseModel):
    description: Optional[str] = None
    hours: float
    date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_billable: Optional[bool] = True

class TimeEntryCreate(TimeEntryBase):
    task_id: int

class TimeEntryUpdate(BaseModel):
    description: Optional[str] = None
    hours: Optional[float] = None
    date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_billable: Optional[bool] = None

class TimeEntry(TimeEntryBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Comment Schemas
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    task_id: int
    parent_comment_id: Optional[int] = None

class CommentUpdate(BaseModel):
    content: str

class Comment(CommentBase):
    id: int
    task_id: int
    author_id: int
    parent_comment_id: Optional[int] = None
    is_active: bool
    edited_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: User
    replies: List["Comment"] = []
    
    model_config = ConfigDict(from_attributes=True)

# Attachment Schemas
class AttachmentBase(BaseModel):
    filename: str
    original_filename: str
    file_size: int
    content_type: str

class Attachment(AttachmentBase):
    id: int
    file_path: str
    task_id: int
    uploaded_by_id: int
    created_at: datetime
    uploaded_by: User
    
    model_config = ConfigDict(from_attributes=True)

# Goal Schemas
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    due_date: Optional[datetime] = None

class GoalCreate(GoalBase):
    workspace_id: int

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    due_date: Optional[datetime] = None

class Goal(GoalBase):
    id: int
    workspace_id: int
    owner_id: int
    current_value: float = 0
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: User
    
    model_config = ConfigDict(from_attributes=True)

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str

class NotificationCreate(NotificationBase):
    user_id: int
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    action_url: Optional[str] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    status: str  # Changed from NotificationStatus enum to str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    action_url: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Dashboard Schemas
class TaskSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int

class DashboardData(BaseModel):
    workspaces: List[Workspace]
    recent_projects: List[Project]
    recent_tasks: List[Task]
    task_summary: TaskSummary

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# WebSocket Schemas
class WSMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    room: Optional[str] = None

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

