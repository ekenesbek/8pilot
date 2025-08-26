#!/usr/bin/env python3
"""
Database initialization script for 8pilot backend
Creates tables and optionally creates a default admin user
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import all models to ensure they are registered with Base
from app.models.user import User, UserCreate
from app.core.database import create_tables, SessionLocal
from app.services.user_service import UserService

def create_default_admin():
    """Create a default admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        user_service = UserService(db)
        
        # Check if admin user already exists
        admin_user = user_service.get_user_by_email("admin@8pilot.com")
        if admin_user:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin_data = UserCreate(
            email="admin@8pilot.com",
            password="admin123"  # Change this in production!
        )
        
        user = user_service.create_user(admin_data)
        
        print(f"Admin user created successfully: {user.email}")
        print("Default credentials:")
        print("  Email: admin@8pilot.com")
        print("  Password: admin123")
        print("\n⚠️  IMPORTANT: Change the default password in production!")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main function"""
    print("Initializing 8pilot database...")
    
    try:
        # Create tables
        create_tables()
        print("✅ Database tables created successfully")
        
        # Create default admin user
        print("\nCreating default admin user...")
        create_default_admin()
        
        print("\n🎉 Database initialization completed!")
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
