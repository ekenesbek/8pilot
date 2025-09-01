"""
Database configuration and session management
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from app.core.config import settings

# Database URL - prioritize environment variable, then settings, then default
DATABASE_URL = os.getenv("DATABASE_URL") or settings.database_url or "postgresql://n8n_user:n8n_password@localhost:5432/n8n_copilot"

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=settings.debug,  # Log SQL queries in debug mode
    pool_pre_ping=True,   # Verify connections before use
    pool_recycle=300,     # Recycle connections every 5 minutes
)

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables"""
    from app.models.workflow_dialog import Base as WorkflowDialogBase
    WorkflowDialogBase.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all tables (use with caution!)"""
    from app.models.workflow_dialog import Base as WorkflowDialogBase
    WorkflowDialogBase.metadata.drop_all(bind=engine)

def init_db():
    """Initialize database with tables"""
    # Mask password in URL for logging
    import re
    masked_url = re.sub(r'(:)([^:@]+)(@)', r'\1***\3', DATABASE_URL)
    print(f"Connecting to database: {masked_url}")
    create_tables()
    print("Database tables created successfully!")
