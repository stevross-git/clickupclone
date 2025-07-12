# backend/init_db.py
"""
Database initialization script
Run this to create the database tables and add sample data
"""

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.models import Base, User, Workspace, Project, TaskList, Task
from app.core.security import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Initialize database with tables and sample data"""
    try:
        # Create all tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Create sample data
        db = SessionLocal()
        
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "demo@example.com").first()
        if existing_user:
            logger.info("Demo user already exists, skipping sample data creation")
            db.close()
            return
        
        logger.info("Creating sample data...")
        
        # Create demo user
        demo_user = User(
            email="demo@example.com",
            username="demo",
            full_name="Demo User",
            hashed_password=get_password_hash("demo123")
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        # Create demo workspace
        demo_workspace = Workspace(
            name="Demo Workspace",
            description="A demo workspace for testing",
            owner_id=demo_user.id
        )
        db.add(demo_workspace)
        db.commit()
        db.refresh(demo_workspace)
        
        # Add user as member of workspace
        demo_workspace.members.append(demo_user)
        db.commit()
        
        # Create demo project
        demo_project = Project(
            name="Sample Project",
            description="A sample project for testing",
            workspace_id=demo_workspace.id,
            owner_id=demo_user.id,
            color="#7c3aed"
        )
        db.add(demo_project)
        db.commit()
        db.refresh(demo_project)
        
        # Add user as member of project
        demo_project.members.append(demo_user)
        db.commit()
        
        # Create task lists
        task_lists = [
            {"name": "To Do", "position": 0, "color": "#6b7280"},
            {"name": "In Progress", "position": 1, "color": "#3b82f6"},
            {"name": "Review", "position": 2, "color": "#f59e0b"},
            {"name": "Done", "position": 3, "color": "#10b981"}
        ]
        
        created_lists = []
        for list_data in task_lists:
            task_list = TaskList(
                name=list_data["name"],
                project_id=demo_project.id,
                position=list_data["position"],
                color=list_data["color"]
            )
            db.add(task_list)
            created_lists.append(task_list)
        
        db.commit()
        
        # Create sample tasks
        sample_tasks = [
            {
                "title": "Setup development environment",
                "description": "Install dependencies and configure the development environment",
                "status": "done",
                "priority": "high",
                "list_index": 3
            },
            {
                "title": "Design user interface mockups",
                "description": "Create wireframes and mockups for the main application screens",
                "status": "in_progress",
                "priority": "medium",
                "list_index": 1
            },
            {
                "title": "Implement user authentication",
                "description": "Add login/register functionality with JWT tokens",
                "status": "in_progress",
                "priority": "high",
                "list_index": 1
            },
            {
                "title": "Create project dashboard",
                "description": "Build the main dashboard with project overview and statistics",
                "status": "todo",
                "priority": "medium",
                "list_index": 0
            },
            {
                "title": "Add real-time notifications",
                "description": "Implement WebSocket-based real-time notifications",
                "status": "todo",
                "priority": "low",
                "list_index": 0
            },
            {
                "title": "Write unit tests",
                "description": "Add comprehensive test coverage for core functionality",
                "status": "review",
                "priority": "medium",
                "list_index": 2
            }
        ]
        
        for i, task_data in enumerate(sample_tasks):
            task = Task(
                title=task_data["title"],
                description=task_data["description"],
                status=task_data["status"],
                priority=task_data["priority"],
                project_id=demo_project.id,
                task_list_id=created_lists[task_data["list_index"]].id,
                creator_id=demo_user.id,
                position=i
            )
            db.add(task)
            
            # Assign task to demo user
            task.assignees.append(demo_user)
        
        db.commit()
        
        logger.info("Sample data created successfully!")
        logger.info("Demo credentials:")
        logger.info("  Email: demo@example.com")
        logger.info("  Password: demo123")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

if __name__ == "__main__":
    init_db()