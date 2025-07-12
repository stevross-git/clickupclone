# backend/reset_db.py
"""
Database reset script - drops and recreates all tables
Use this when you have schema mismatches
"""

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.db.session import SessionLocal, engine
from app.models.models import Base, User, Workspace, Project, TaskList, Task
from app.core.security import get_password_hash
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    """Drop all tables and recreate them with sample data"""
    try:
        logger.info("🗑️ Dropping all existing tables...")
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        
        logger.info("✅ All tables dropped successfully")
        
        # Create all tables fresh
        logger.info("🏗️ Creating all tables...")
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ All tables created successfully")
        
        # Create sample data
        logger.info("📝 Creating sample data...")
        create_sample_data()
        
        logger.info("🎉 Database reset completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error resetting database: {e}")
        raise

def create_sample_data():
    """Create sample data for testing"""
    db = SessionLocal()
    
    try:
        # Create demo user
        demo_user = User(
            email="demo@example.com",
            username="demo",
            full_name="Demo User",
            hashed_password=get_password_hash("demo123"),
            timezone="UTC"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        logger.info("👤 Created demo user")
        
        # Create admin user
        admin_user = User(
            email="admin@example.com",
            username="admin",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            timezone="UTC"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        logger.info("👑 Created admin user")
        
        # Create demo workspace
        demo_workspace = Workspace(
            name="Demo Workspace",
            description="A demo workspace for testing the ClickUp clone",
            owner_id=demo_user.id
        )
        db.add(demo_workspace)
        db.commit()
        db.refresh(demo_workspace)
        
        # Add users as members of workspace
        demo_workspace.members.extend([demo_user, admin_user])
        db.commit()
        logger.info("🏢 Created demo workspace")
        
        # Create team workspace
        team_workspace = Workspace(
            name="Team Workspace",
            description="Collaborative workspace for team projects",
            owner_id=admin_user.id
        )
        db.add(team_workspace)
        db.commit()
        db.refresh(team_workspace)
        
        team_workspace.members.extend([demo_user, admin_user])
        db.commit()
        logger.info("👥 Created team workspace")
        
        # Create demo projects
        projects_data = [
            {
                "name": "Website Redesign",
                "description": "Complete redesign of the company website",
                "workspace_id": demo_workspace.id,
                "owner_id": demo_user.id,
                "color": "#7c3aed"
            },
            {
                "name": "Mobile App Development",
                "description": "Native mobile app for iOS and Android",
                "workspace_id": demo_workspace.id,
                "owner_id": admin_user.id,
                "color": "#2563eb"
            },
            {
                "name": "Marketing Campaign",
                "description": "Q1 2024 marketing campaign planning and execution",
                "workspace_id": team_workspace.id,
                "owner_id": admin_user.id,
                "color": "#059669"
            }
        ]
        
        created_projects = []
        for project_data in projects_data:
            project = Project(**project_data)
            db.add(project)
            db.commit()
            db.refresh(project)
            
            # Add both users as members of each project
            project.members.extend([demo_user, admin_user])
            db.commit()
            created_projects.append(project)
            
        logger.info(f"📁 Created {len(created_projects)} demo projects")
        
        # Create task lists for each project
        task_lists_template = [
            {"name": "Backlog", "position": 0, "color": "#6b7280"},
            {"name": "To Do", "position": 1, "color": "#3b82f6"},
            {"name": "In Progress", "position": 2, "color": "#f59e0b"},
            {"name": "Review", "position": 3, "color": "#8b5cf6"},
            {"name": "Done", "position": 4, "color": "#10b981"}
        ]
        
        project_lists = {}
        for project in created_projects:
            lists = []
            for list_data in task_lists_template:
                task_list = TaskList(
                    name=list_data["name"],
                    project_id=project.id,
                    position=list_data["position"],
                    color=list_data["color"]
                )
                db.add(task_list)
                lists.append(task_list)
            
            db.commit()
            project_lists[project.id] = lists
            
        logger.info("📝 Created task lists for all projects")
        
        # Create sample tasks
        sample_tasks = [
            # Website Redesign Project Tasks
            {
                "title": "Research competitor websites",
                "description": "Analyze 5 competitor websites for design inspiration and best practices",
                "status": "done",
                "priority": "medium",
                "project_index": 0,
                "list_index": 4,
                "assignee": demo_user
            },
            {
                "title": "Create wireframes",
                "description": "Design wireframes for all main pages including homepage, about, services, and contact",
                "status": "done",
                "priority": "high",
                "project_index": 0,
                "list_index": 4,
                "assignee": demo_user
            },
            {
                "title": "Design homepage mockup",
                "description": "Create high-fidelity mockup of the new homepage design",
                "status": "in_progress",
                "priority": "high",
                "project_index": 0,
                "list_index": 2,
                "assignee": demo_user
            },
            {
                "title": "Implement responsive navigation",
                "description": "Code the responsive navigation menu with mobile hamburger functionality",
                "status": "in_progress",
                "priority": "medium",
                "project_index": 0,
                "list_index": 2,
                "assignee": admin_user
            },
            {
                "title": "SEO optimization",
                "description": "Optimize meta tags, alt texts, and page structure for better SEO",
                "status": "todo",
                "priority": "medium",
                "project_index": 0,
                "list_index": 1,
                "assignee": admin_user
            },
            {
                "title": "Performance testing",
                "description": "Test website performance and optimize loading times",
                "status": "todo",
                "priority": "low",
                "project_index": 0,
                "list_index": 1,
                "assignee": None
            },
            
            # Mobile App Project Tasks
            {
                "title": "Define app requirements",
                "description": "Document all functional and non-functional requirements for the mobile app",
                "status": "done",
                "priority": "urgent",
                "project_index": 1,
                "list_index": 4,
                "assignee": admin_user
            },
            {
                "title": "Create user journey maps",
                "description": "Map out the complete user journey from onboarding to core features",
                "status": "review",
                "priority": "high",
                "project_index": 1,
                "list_index": 3,
                "assignee": demo_user
            },
            {
                "title": "Setup React Native environment",
                "description": "Configure development environment for React Native with necessary tools",
                "status": "in_progress",
                "priority": "high",
                "project_index": 1,
                "list_index": 2,
                "assignee": admin_user
            },
            {
                "title": "Design app icon and splash screen",
                "description": "Create app icon in multiple sizes and design splash screen",
                "status": "todo",
                "priority": "medium",
                "project_index": 1,
                "list_index": 1,
                "assignee": demo_user
            },
            {
                "title": "Implement push notifications",
                "description": "Add push notification functionality for user engagement",
                "status": "todo",
                "priority": "low",
                "project_index": 1,
                "list_index": 0,
                "assignee": None
            },
            
            # Marketing Campaign Tasks
            {
                "title": "Market research analysis",
                "description": "Conduct comprehensive market research and competitor analysis",
                "status": "done",
                "priority": "high",
                "project_index": 2,
                "list_index": 4,
                "assignee": admin_user
            },
            {
                "title": "Define target audience",
                "description": "Create detailed buyer personas and target audience segments",
                "status": "review",
                "priority": "high",
                "project_index": 2,
                "list_index": 3,
                "assignee": demo_user
            },
            {
                "title": "Create campaign content",
                "description": "Develop all marketing materials including copy, images, and videos",
                "status": "in_progress",
                "priority": "urgent",
                "project_index": 2,
                "list_index": 2,
                "assignee": demo_user
            },
            {
                "title": "Setup social media campaigns",
                "description": "Configure and launch campaigns on Facebook, Instagram, and LinkedIn",
                "status": "todo",
                "priority": "high",
                "project_index": 2,
                "list_index": 1,
                "assignee": admin_user
            },
            {
                "title": "Email marketing automation",
                "description": "Set up email sequences and automation workflows",
                "status": "todo",
                "priority": "medium",
                "project_index": 2,
                "list_index": 0,
                "assignee": None
            }
        ]
        
        for i, task_data in enumerate(sample_tasks):
            project = created_projects[task_data["project_index"]]
            task_list = project_lists[project.id][task_data["list_index"]]
            
            task = Task(
                title=task_data["title"],
                description=task_data["description"],
                status=task_data["status"],
                priority=task_data["priority"],
                project_id=project.id,
                task_list_id=task_list.id,
                creator_id=demo_user.id,
                position=i
            )
            
            # Add due dates for some tasks
            if task_data["status"] in ["todo", "in_progress"]:
                from datetime import datetime, timedelta
                import random
                days_ahead = random.randint(1, 30)
                task.due_date = datetime.utcnow() + timedelta(days=days_ahead)
            
            db.add(task)
            
            # Assign task if assignee specified
            if task_data["assignee"]:
                task.assignees.append(task_data["assignee"])
        
        db.commit()
        logger.info(f"✅ Created {len(sample_tasks)} sample tasks")
        
        logger.info("\n🎉 Sample data creation completed!")
        logger.info("\n📝 Demo credentials:")
        logger.info("   👤 Demo User:")
        logger.info("      Email: demo@example.com")
        logger.info("      Password: demo123")
        logger.info("   👑 Admin User:")
        logger.info("      Email: admin@example.com") 
        logger.info("      Password: admin123")
        
    except Exception as e:
        logger.error(f"❌ Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 This will completely reset your database and delete all existing data!")
    confirm = input("Are you sure you want to continue? (yes/no): ")
    
    if confirm.lower() in ['yes', 'y']:
        reset_database()
    else:
        print("❌ Database reset cancelled")