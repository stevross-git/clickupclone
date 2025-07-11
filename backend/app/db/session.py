from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .base import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# create tables at startup
Base.metadata.create_all(bind=engine)
