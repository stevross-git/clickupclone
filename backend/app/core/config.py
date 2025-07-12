# backend/app/core/config.py
import os
from typing import List, Union
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClickUp Clone"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/clickup_clone"
    )
    
    # Redis for caching and WebSocket
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]
    
    # Email settings
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "")
    EMAILS_FROM_NAME: str = PROJECT_NAME
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_FOLDER: str = "uploads"
    ALLOWED_FILE_EXTENSIONS: List[str] = [
        "jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", 
        "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip"
    ]
    
    # WebSocket settings
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_RECONNECT_INTERVAL: int = 5
    
    # Celery settings for background tasks
    CELERY_BROKER_URL: str = REDIS_URL
    CELERY_RESULT_BACKEND: str = REDIS_URL
    
    # Security settings
    PASSWORD_MIN_LENGTH: int = 8
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_DURATION: int = 15 * 60  # 15 minutes
    
    # Feature flags
    ENABLE_TIME_TRACKING: bool = True
    ENABLE_GOALS: bool = True
    ENABLE_CUSTOM_FIELDS: bool = True
    ENABLE_FILE_UPLOADS: bool = True
    ENABLE_NOTIFICATIONS: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()