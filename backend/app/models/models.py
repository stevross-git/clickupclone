from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

# Association tables for many-to-many relationships
workspace_members = Table(
    'workspace_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('workspace_id', Integer, ForeignKey('workspaces.id'), primary_key=True),
    Column('role', String, default='member')  # owner, admin, member
)

project_members = Table(
    'project_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('project_id', Integer, ForeignKey('projects.id'), primary_key=True),
    Column('role', String, default='member')
)

task_assignees = Table(
    'task_assignees',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('task_id', Integer, ForeignKey('tasks.id'), primary_key=True)
)

class TaskStatus(enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"

class TaskPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owned_workspaces = relationship("Workspace", back_populates="owner")
    workspaces = relationship("Workspace", secondary=workspace_members, back_populates="members")
    projects = relationship("Project", secondary=project_members, back_populates="members")
    assigned_tasks = relationship("Task", secondary=task_assignees, back_populates="assignees")
    created_tasks = relationship("Task", foreign_keys="Task.creator_id", back_populates="creator")
    comments = relationship("Comment", back_populates="author")
    activity_logs = relationship("ActivityLog", back_populates="user")

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_workspaces")
    members = relationship("User", secondary=workspace_members, back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    color = Column(String, default="#3b82f6")  # Hex color for project
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    workspace = relationship("Workspace", back_populates="projects")
    owner = relationship("User")
    members = relationship("User", secondary=project_members, back_populates="projects")
    lists = relationship("TaskList", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class TaskList(Base):
    __tablename__ = "task_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    position = Column(Integer, default=0)  # For ordering lists
    color = Column(String, default="#6b7280")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="lists")
    tasks = relationship("Task", back_populates="task_list", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_list_id = Column(Integer, ForeignKey("task_lists.id"))
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_task_id = Column(Integer, ForeignKey("tasks.id"))  # For subtasks
    
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    
    position = Column(Integer, default=0)  # For ordering within list
    estimated_hours = Column(Integer)
    actual_hours = Column(Integer)
    
    due_date = Column(DateTime(timezone=True))
    start_date = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    task_list = relationship("TaskList", back_populates="tasks")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    assignees = relationship("User", secondary=task_assignees, back_populates="assigned_tasks")
    parent_task = relationship("Task", remote_side=[id])
    subtasks = relationship("Task", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    dependencies = relationship("TaskDependency", foreign_keys="TaskDependency.task_id", back_populates="task")
    blocking = relationship("TaskDependency", foreign_keys="TaskDependency.depends_on_id", back_populates="depends_on_task")

class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    depends_on_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    task = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on_task = relationship("Task", foreign_keys=[depends_on_id], back_populates="blocking")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("comments.id"))  # For replies
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent_comment = relationship("Comment", remote_side=[id])
    replies = relationship("Comment", cascade="all, delete-orphan")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)  # created, updated, deleted, commented, etc.
    entity_type = Column(String, nullable=False)  # task, project, workspace, etc.
    entity_id = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_value = Column(Text)  # JSON string of old values
    new_value = Column(Text)  # JSON string of new values
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entity_type = Column(String)  # task, project, etc.
    entity_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")