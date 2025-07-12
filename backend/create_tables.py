# backend/create_tables.py
from app.models.models import Base
from app.db.session import engine

if __name__ == "__main__":
    print("Creating all database tables...")
    try:
        Base.metadata.create_all(engine)
        print("Success! All tables created.")
        print("You can now start your server with: uvicorn app.main:app --reload --port 8000")
    except Exception as e:
        print(f"Error creating tables: {e}")
