# backend/fix_existing_tables.py
"""
Fix existing database tables by dropping them completely and recreating.
This handles the issue where create_all() doesn't modify existing table schemas.
"""

from sqlalchemy import text, inspect
from app.db.session import engine
from app.models.models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def drop_all_tables_force():
    """Drop all tables using raw SQL to handle any constraint issues"""
    
    logger.info("🔄 Dropping all existing tables...")
    
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # Get all table names
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            logger.info(f"Found existing tables: {tables}")
            
            if tables:
                # Disable foreign key checks temporarily and drop tables
                logger.info("Dropping tables with CASCADE...")
                
                # Drop each table with CASCADE to handle foreign keys
                for table in tables:
                    try:
                        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                        logger.info(f"✅ Dropped table: {table}")
                    except Exception as e:
                        logger.warning(f"⚠️ Could not drop {table}: {e}")
                
                # Also drop any sequences
                result = conn.execute(text("""
                    SELECT sequence_name FROM information_schema.sequences 
                    WHERE sequence_schema = 'public'
                """))
                
                sequences = [row[0] for row in result]
                for sequence in sequences:
                    try:
                        conn.execute(text(f"DROP SEQUENCE IF EXISTS {sequence} CASCADE"))
                        logger.info(f"✅ Dropped sequence: {sequence}")
                    except Exception as e:
                        logger.warning(f"⚠️ Could not drop sequence {sequence}: {e}")
            else:
                logger.info("No existing tables found")
            
            trans.commit()
            logger.info("✅ All tables dropped successfully!")
            
        except Exception as e:
            trans.rollback()
            logger.error(f"❌ Error dropping tables: {e}")
            raise

def create_all_tables():
    """Create all tables fresh"""
    
    logger.info("🏗️ Creating all tables from models...")
    
    try:
        Base.metadata.create_all(engine)
        logger.info("✅ All tables created successfully!")
        
        # Verify tables were created
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"📋 Created tables: {tables}")
        
        # Check users table specifically
        if 'users' in tables:
            columns = [col['name'] for col in inspector.get_columns('users')]
            logger.info(f"👤 Users table columns: {columns}")
            
            if 'avatar' in columns:
                logger.info("✅ users.avatar column exists!")
            else:
                logger.error("❌ users.avatar column still missing!")
                
    except Exception as e:
        logger.error(f"❌ Error creating tables: {e}")
        raise

def main():
    """Main function to fix the database"""
    
    logger.info("🚀 Starting database fix...")
    
    # Step 1: Drop all existing tables
    drop_all_tables_force()
    
    # Step 2: Create all tables fresh
    create_all_tables()
    
    logger.info("🎉 Database fix completed!")
    logger.info("✨ You can now start your server with: uvicorn app.main:app --reload --port 8000")

if __name__ == "__main__":
    main()
