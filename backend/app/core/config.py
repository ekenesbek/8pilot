"""
Configuration settings for n8n-copilot backend
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings"""
    
    # Basic app settings
    app_name: str = "n8n-copilot-backend"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS settings
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "chrome-extension://*",
        "moz-extension://*"
    ]
    allowed_hosts: List[str] = ["*"]
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Database
    database_url: Optional[str] = None
    redis_url: Optional[str] = "redis://localhost:6379"
    
    # AI Providers - API keys will be passed from frontend
    default_ai_provider: str = "openai"
    
    # n8n Integration - API keys will be passed from frontend
    # n8n_default_url: Optional[str] = None
    # n8n_default_api_key: Optional[str] = None
    
    # Chat settings
    max_chat_history: int = 100
    max_message_length: int = 4000
    chat_memory_ttl: int = 86400  # 24 hours in seconds
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        # Allow extra fields from .env file to be ignored
        extra = "ignore"

# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent
ENV_FILE = BACKEND_DIR / ".env"

# Load .env file manually if it exists (only for basic app settings)
if ENV_FILE.exists():
    print(f"Loading .env file from: {ENV_FILE}")
    from dotenv import load_dotenv
    load_dotenv(ENV_FILE)
else:
    print(f".env file not found at: {ENV_FILE}")
    # Try alternative path - one level up
    ALT_ENV_FILE = BACKEND_DIR.parent / ".env"
    if ALT_ENV_FILE.exists():
        print(f"Loading .env file from alternative path: {ALT_ENV_FILE}")
        from dotenv import load_dotenv
        load_dotenv(ALT_ENV_FILE)
    else:
        print(f".env file not found at alternative path: {ALT_ENV_FILE}")

# Create settings instance
settings = Settings()

# Override with environment variables if present (only basic app settings)
if os.getenv("DEBUG"):
    settings.debug = os.getenv("DEBUG").lower() == "true"

if os.getenv("PORT"):
    try:
        settings.port = int(os.getenv("PORT"))
    except ValueError:
        pass

if os.getenv("HOST"):
    settings.host = os.getenv("HOST")

# Note: API keys are no longer loaded from environment variables
# They will be passed from the frontend with each request

# Debug output
print(f"Debug mode: {settings.debug}")
print(f"Current working directory: {os.getcwd()}")
print(f"Backend directory: {BACKEND_DIR}")
print(f"ENV file path: {ENV_FILE}")
print(f"Alternative ENV file path: {BACKEND_DIR.parent / '.env'}")
print("Note: API keys are now passed from frontend, not loaded from .env")
