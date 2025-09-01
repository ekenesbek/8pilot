#!/usr/bin/env python3
"""
Database initialization script for n8n-copilot workflow dialog service
"""

import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import init_db, engine
from sqlalchemy import text

def main():
    """Initialize the database with tables"""
    print("Initializing n8n-copilot database...")
    
    try:
        # Test database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Database connection successful")
        
        # Create tables
        init_db()
        print("✓ Database tables created successfully")
        
        print("\nDatabase initialization complete!")
        print("The following tables were created:")
        print("- workflow_dialogs: Stores workflow metadata and data")
        print("- chat_sessions: Stores chat sessions for each workflow")
        print("- messages: Stores individual chat messages")
        
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        print("\nPlease ensure:")
        print("1. PostgreSQL is running")
        print("2. Database 'n8n_copilot' exists")
        print("3. User 'n8n_user' has access")
        print("4. Connection string is correct in config.py")
        sys.exit(1)

if __name__ == "__main__":
    main()
