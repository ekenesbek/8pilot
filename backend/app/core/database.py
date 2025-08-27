from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from .config import settings
import os

# Import all models to ensure they are registered with Base
# This will be done in main.py to avoid circular imports

# Database URL - use SQLite for development if no database_url is provided
if settings.database_url:
    SQLALCHEMY_DATABASE_URL = settings.database_url
else:
    # Default to SQLite for development
    SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"

# Create engine
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite specific configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.debug
    )
else:
    # PostgreSQL/other databases
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        echo=settings.debug,
        pool_pre_ping=True
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all tables in the database"""
    Base.metadata.drop_all(bind=engine)
