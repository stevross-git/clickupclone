# backend/check_db.py
"""
Database check script - verifies database connection and schema
"""

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database():
    """Check database connection and schema"""
    try:
        logger.info("🔍 Checking database connection...")
        
        # Test basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connected to PostgreSQL: {version}")
        
        # Check if tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        logger.info(f"📊 Found {len(tables)} tables in database:")
        for table in sorted(tables):
            logger.info(f"   - {table}")
        
        # Check specific table schemas
        expected_tables = [
            'users', 'workspaces', 'projects', 'task_lists', 'tasks', 
            'comments', 'attachments', 'time_entries', 'notifications',
            'custom_fields', 'goals', 'activity_logs', 'task_dependencies'
        ]
        
        missing_tables = []
        for table in expected_tables:
            if table not in tables:
                missing_tables.append(table)
        
        if missing_tables:
            logger.warning(f"⚠️ Missing tables: {missing_tables}")
        else:
            logger.info("✅ All expected tables found")
        
        # Check users table schema specifically
        if 'users' in tables:
            columns = inspector.get_columns('users')
            logger.info("👤 Users table columns:")
            for col in columns:
                logger.info(f"   - {col['name']}: {col['type']}")
        
        # Test if we can query users table
        try:
            db = SessionLocal()
            result = db.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.fetchone()[0]
            logger.info(f"👥 Found {user_count} users in database")
            db.close()
        except Exception as e:
            logger.error(f"❌ Error querying users table: {e}")
        
        logger.info("✅ Database check completed")
        
    except Exception as e:
        logger.error(f"❌ Database check failed: {e}")
        logger.info("\n💡 Possible solutions:")
        logger.info("   1. Make sure PostgreSQL is running")
        logger.info("   2. Check your database connection settings")
        logger.info("   3. Run 'python reset_db.py' to recreate the database")
        raise

def check_connection_settings():
    """Check database connection settings"""
    logger.info("🔧 Database connection settings:")
    logger.info(f"   URL: {settings.DATABASE_URL}")
    
    # Parse database URL
    from urllib.parse import urlparse
    parsed = urlparse(settings.DATABASE_URL)
    logger.info(f"   Host: {parsed.hostname}")
    logger.info(f"   Port: {parsed.port}")
    logger.info(f"   Database: {parsed.path[1:]}")
    logger.info(f"   Username: {parsed.username}")

if __name__ == "__main__":
    check_connection_settings()
    check_database()