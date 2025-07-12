# backend/app/models/models.py
from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, Float, ForeignKey, Table, func, UniqueConstraint, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum as PyEnum
import uuid
from datetime import datetime

Base = declarative_base()

class TaskStatus(PyEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class TaskPriority(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# Association Tables
user_workspace_association = Table(
    'user_workspace_association',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('workspace_id', Integer, ForeignKey('workspaces.id'))
)

user_project_association = Table(
    'user_project_association',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('project_id', Integer, ForeignKey('projects.id'))
)

task_assignee_association = Table(
    'task_assignee_association',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

task_watcher_association = Table(
    'task_watcher_association',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    avatar = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owned_workspaces = relationship("Workspace", back_populates="owner")
    workspaces = relationship("Workspace", secondary=user_workspace_association, back_populates="members")
    owned_projects = relationship("Project", back_populates="owner")
    projects = relationship("Project", secondary=user_project_association, back_populates="members")
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.creator_id")
    assigned_tasks = relationship("Task", secondary=task_assignee_association, back_populates="assignees")
    watched_tasks = relationship("Task", secondary=task_watcher_association, back_populates="watchers")
    comments = relationship("Comment", back_populates="author")
    time_entries = relationship("TimeEntry", back_populates="user")

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    avatar = Column(String)
    color = Column(String, default="#6366f1")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_workspaces")
    members = relationship("User", secondary=user_workspace_association, back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String, default="#3b82f6")
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    start_date = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    workspace = relationship("Workspace", back_populates="projects")
    owner = relationship("User", back_populates="owned_projects")
    members = relationship("User", secondary=user_project_association, back_populates="projects")
    task_lists = relationship("TaskList", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class TaskList(Base):
    __tablename__ = "task_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String, default="#6b7280")
    position = Column(Integer, nullable=False, default=0)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="task_lists")
    tasks = relationship("Task", back_populates="task_list", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, nullable=False, default=TaskStatus.TODO.value)
    priority = Column(String, nullable=False, default=TaskPriority.MEDIUM.value)
    position = Column(Integer, nullable=False, default=0)
    estimated_hours = Column(Float)
    actual_hours = Column(Float, default=0)
    due_date = Column(DateTime(timezone=True))
    start_date = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_list_id = Column(Integer, ForeignKey("task_lists.id"))
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_task_id = Column(Integer, ForeignKey("tasks.id"))
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    tags = Column(String)  # JSON string of tags
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    task_list = relationship("TaskList", back_populates="tasks")
    creator = relationship("User", back_populates="created_tasks", foreign_keys=[creator_id])
    assignees = relationship("User", secondary=task_assignee_association, back_populates="assigned_tasks")
    watchers = relationship("User", secondary=task_watcher_association, back_populates="watched_tasks")
    parent_task = relationship("Task", remote_side=[id], back_populates="subtasks")
    subtasks = relationship("Task", back_populates="parent_task", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="task", cascade="all, delete-orphan")
    custom_field_values = relationship("TaskCustomField", back_populates="task", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_task_project_status', 'project_id', 'status'),
        Index('idx_task_assignee', 'creator_id'),
        Index('idx_task_due_date', 'due_date'),
    )

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("comments.id"))
    is_active = Column(Boolean, default=True)
    edited_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent_comment = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent_comment", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="attachments")
    uploaded_by = relationship("User")

class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    hours = Column(Float, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    is_billable = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="time_entries")
    user = relationship("User", back_populates="time_entries")

class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_value = Column(Float)
    current_value = Column(Float, default=0)
    unit = Column(String)  # tasks, hours, revenue, etc.
    due_date = Column(DateTime(timezone=True))
    progress = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    workspace = relationship("Workspace")
    owner = relationship("User")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # created, updated, deleted, commented
    entity_type = Column(String, nullable=False)  # task, project, workspace
    entity_id = Column(Integer, nullable=False)
    old_values = Column(Text)  # JSON string
    new_values = Column(Text)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # task_assigned, comment_added, etc.
    entity_type = Column(String)  # task, project, etc.
    entity_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    recipient = relationship("User")

class CustomField(Base):
    __tablename__ = "custom_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    field_type = Column(String, nullable=False, default="text")  # text, number, date, select
    options = Column(Text)  # JSON string for select options
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    is_required = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    values = relationship("TaskCustomField", back_populates="field", cascade="all, delete-orphan")

class TaskCustomField(Base):
    __tablename__ = "task_custom_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("custom_fields.id"), nullable=False)
    value = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    task = relationship("Task", back_populates="custom_field_values")
    field = relationship("CustomField", back_populates="values")

class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    
    id = Column(Integer, primary_key=True, index=True)
    predecessor_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    successor_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    dependency_type = Column(String, default="finish_to_start")  # finish_to_start, start_to_start, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('predecessor_id', 'successor_id', name='unique_task_dependency'),
    )