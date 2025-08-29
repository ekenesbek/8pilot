"""
User settings models
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime

class UserSettings(BaseModel):
    """User application settings"""
    user_id: Optional[str] = None
    active_provider: Literal["openai", "anthropic"] = "openai"
    
    # n8n Integration settings
    n8n_instances: list = []
    default_n8n_instance: Optional[str] = None
    
    # Chat settings
    auto_apply_workflows: bool = False
    save_chat_history: bool = True
    max_history: int = Field(25, ge=1, le=1000)
    
    # Theme settings
    theme: Literal["light", "dark", "auto"] = "auto"
    
    # Notification settings
    enable_notifications: bool = True
    notification_sound: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class N8nInstance(BaseModel):
    """n8n instance configuration"""
    instance_id: str
    name: str
    url: str
    api_key: str
    is_default: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v.rstrip('/')

class SettingsUpdate(BaseModel):
    """Settings update request"""
    active_provider: Optional[Literal["openai", "anthropic"]] = None
    auto_apply_workflows: Optional[bool] = None
    save_chat_history: Optional[bool] = None
    max_history: Optional[int] = None
    theme: Optional[Literal["light", "dark", "auto"]] = None
    enable_notifications: Optional[bool] = None
    notification_sound: Optional[bool] = None

class N8nInstanceCreate(BaseModel):
    """Create new n8n instance"""
    name: str = Field(..., min_length=1, max_length=100)
    url: str
    api_key: str = Field(..., min_length=1)
    is_default: bool = False

class N8nInstanceUpdate(BaseModel):
    """Update n8n instance"""
    name: Optional[str] = None
    url: Optional[str] = None
    api_key: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
