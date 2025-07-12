# backend/migrate_database.py
"""
Database migration script to sync schema with updated models after merge conflict resolution.
Run this script to add missing columns and update your database schema.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from app.db.session import engine, SessionLocal
from app.models.models import Base, User, Workspace, Project, Task, Comment, Attachment, TimeEntry, Goal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def check_table_exists(table_name):
    """Check if a table exists"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def migrate_database():
    """Apply database migrations to sync with updated models"""
    
    logger.info("Starting database migration...")
    
    with engine.connect() as conn:
        # Start a transaction
        trans = conn.begin()
        
        try:
            # 1. Add missing columns to users table
            if check_table_exists('users'):
                if not check_column_exists('users', 'avatar'):
                    logger.info("Adding avatar column to users table...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar VARCHAR"))
                    
                if not check_column_exists('users', 'is_verified'):
                    logger.info("Adding is_verified column to users table...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
            
            # 2. Add missing columns to workspaces table
            if check_table_exists('workspaces'):
                if not check_column_exists('workspaces', 'avatar'):
                    logger.info("Adding avatar column to workspaces table...")
                    conn.execute(text("ALTER TABLE workspaces ADD COLUMN avatar VARCHAR"))
                    
                if not check_column_exists('workspaces', 'color'):
                    logger.info("Adding color column to workspaces table...")
                    conn.execute(text("ALTER TABLE workspaces ADD COLUMN color VARCHAR DEFAULT '#6366f1'"))
            
            # 3. Add missing columns to projects table
            if check_table_exists('projects'):
                if not check_column_exists('projects', 'is_archived'):
                    logger.info("Adding is_archived column to projects table...")
                    conn.execute(text("ALTER TABLE projects ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
                    
                if not check_column_exists('projects', 'start_date'):
                    logger.info("Adding start_date column to projects table...")
                    conn.execute(text("ALTER TABLE projects ADD COLUMN start_date TIMESTAMP WITH TIME ZONE"))
            
            # 4. Add missing columns to tasks table
            if check_table_exists('tasks'):
                if not check_column_exists('tasks', 'actual_hours'):
                    logger.info("Adding actual_hours column to tasks table...")
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN actual_hours FLOAT DEFAULT 0"))
                    
                if not check_column_exists('tasks', 'start_date'):
                    logger.info("Adding start_date column to tasks table...")
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN start_date TIMESTAMP WITH TIME ZONE"))
                    
                if not check_column_exists('tasks', 'completed_at'):
                    logger.info("Adding completed_at column to tasks table...")
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE"))
                    
                if not check_column_exists('tasks', 'is_archived'):
                    logger.info("Adding is_archived column to tasks table...")
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
                    
                if not check_column_exists('tasks', 'tags'):
                    logger.info("Adding tags column to tasks table...")
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN tags VARCHAR"))
            
            # 5. Update attachment table structure
            if check_table_exists('attachments'):
                if not check_column_exists('attachments', 'original_filename'):
                    logger.info("Adding original_filename column to attachments table...")
                    conn.execute(text("ALTER TABLE attachments ADD COLUMN original_filename VARCHAR"))
                    # Copy filename to original_filename for existing records
                    conn.execute(text("UPDATE attachments SET original_filename = filename WHERE original_filename IS NULL"))
                    conn.execute(text("ALTER TABLE attachments ALTER COLUMN original_filename SET NOT NULL"))
                    
                if not check_column_exists('attachments', 'file_size'):
                    logger.info("Adding file_size column to attachments table...")
                    conn.execute(text("ALTER TABLE attachments ADD COLUMN file_size INTEGER DEFAULT 0"))
                    
                if not check_column_exists('attachments', 'content_type'):
                    logger.info("Adding content_type column to attachments table...")
                    conn.execute(text("ALTER TABLE attachments ADD COLUMN content_type VARCHAR DEFAULT 'application/octet-stream'"))
                    
                if not check_column_exists('attachments', 'uploaded_by_id'):
                    logger.info("Adding uploaded_by_id column to attachments table...")
                    conn.execute(text("ALTER TABLE attachments ADD COLUMN uploaded_by_id INTEGER"))
                    conn.execute(text("ALTER TABLE attachments ADD CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES users(id)"))
            
            # 6. Update time_entries table structure
            if check_table_exists('time_entries'):
                if not check_column_exists('time_entries', 'description'):
                    logger.info("Adding description column to time_entries table...")
                    conn.execute(text("ALTER TABLE time_entries ADD COLUMN description VARCHAR"))
                    
                if not check_column_exists('time_entries', 'hours'):
                    logger.info("Adding hours column to time_entries table...")
                    conn.execute(text("ALTER TABLE time_entries ADD COLUMN hours FLOAT"))
                    
                if not check_column_exists('time_entries', 'date'):
                    logger.info("Adding date column to time_entries table...")
                    conn.execute(text("ALTER TABLE time_entries ADD COLUMN date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
                    
                if not check_column_exists('time_entries', 'is_billable'):
                    logger.info("Adding is_billable column to time_entries table...")
                    conn.execute(text("ALTER TABLE time_entries ADD COLUMN is_billable BOOLEAN DEFAULT TRUE"))
            
            # 7. Update comments table structure
            if check_table_exists('comments'):
                if not check_column_exists('comments', 'edited_at'):
                    logger.info("Adding edited_at column to comments table...")
                    conn.execute(text("ALTER TABLE comments ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE"))
            
            # 8. Update goals table structure
            if check_table_exists('goals'):
                if not check_column_exists('goals', 'target_value'):
                    logger.info("Adding target_value column to goals table...")
                    conn.execute(text("ALTER TABLE goals ADD COLUMN target_value FLOAT"))
                    
                if not check_column_exists('goals', 'current_value'):
                    logger.info("Adding current_value column to goals table...")
                    conn.execute(text("ALTER TABLE goals ADD COLUMN current_value FLOAT DEFAULT 0"))
                    
                if not check_column_exists('goals', 'unit'):
                    logger.info("Adding unit column to goals table...")
                    conn.execute(text("ALTER TABLE goals ADD COLUMN unit VARCHAR"))
            
            # 9. Create missing tables if they don't exist
            missing_tables = []
            required_tables = [
                'users', 'workspaces', 'projects', 'task_lists', 'tasks', 
                'comments', 'attachments', 'time_entries', 'goals',
                'activity_logs', 'notifications', 'custom_fields', 
                'task_custom_fields', 'task_dependencies'
            ]
            
            inspector = inspect(engine)
            existing_tables = inspector.get_table_names()
            
            for table in required_tables:
                if table not in existing_tables:
                    missing_tables.append(table)
            
            if missing_tables:
                logger.info(f"Creating missing tables: {missing_tables}")
                # Create all tables (this will only create missing ones)
                Base.metadata.create_all(engine)
            
            # Commit the transaction
            trans.commit()
            logger.info("Database migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            logger.error(f"Migration failed: {e}")
            raise

def reset_database():
    """Drop all tables and recreate them (USE WITH CAUTION - THIS WILL DELETE ALL DATA)"""
    logger.warning("WARNING: This will delete all data in the database!")
    confirm = input("Are you sure you want to reset the database? Type 'YES' to confirm: ")
    
    if confirm == 'YES':
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(engine)
        
        logger.info("Creating all tables...")
        Base.metadata.create_all(engine)
        
        logger.info("Database reset completed!")
    else:
        logger.info("Database reset cancelled.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration script")
    parser.add_argument('--reset', action='store_true', help='Reset database (WARNING: Deletes all data)')
    
    args = parser.parse_args()
    
    if args.reset:
        reset_database()
    else:
        migrate_database()