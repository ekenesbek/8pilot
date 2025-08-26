"""
Settings Service for managing user configuration
"""

import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.settings import (
    UserSettings, SettingsUpdate, N8nInstance, 
    N8nInstanceCreate, N8nInstanceUpdate
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class SettingsService:
    """Service for managing user settings"""
    
    def __init__(self):
        # In-memory storage (replace with database in production)
        # API keys are now passed from frontend, not loaded from .env
        self.user_settings = UserSettings(
            user_id="default_user",
            openai_api_key=None,  # Will be set from frontend
            anthropic_api_key=None,  # Will be set from frontend
            active_provider=settings.default_ai_provider,
            auto_apply_workflows=False,
            save_chat_history=True,
            max_history=25,
            theme="auto",
            enable_notifications=True,
            notification_sound=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.n8n_instances: Dict[str, N8nInstance] = {}
        
        # Initialize with default n8n instance if configured
        # API keys are now passed from frontend, not loaded from .env
        # if settings.n8n_default_url and settings.n8n_default_api_key:
        #     default_instance = N8nInstance(
        #         instance_id="default",
        #         name="Default n8n Instance",
        #         url=settings.n8n_default_url,
        #         api_key=settings.n8n_default_api_key,
        #         is_default=True,
        #         is_active=True,
        #         created_at=datetime.utcnow()
        #     )
        #     self.n8n_instances["default"] = default_instance
        #     self.user_settings.default_n8n_instance = "default"
    
    async def get_user_settings(self) -> UserSettings:
        """Get current user settings"""
        return self.user_settings
    
    async def update_settings(self, settings_update: SettingsUpdate) -> UserSettings:
        """Update user settings"""
        
        # Update only provided fields
        if settings_update.openai_api_key is not None:
            self.user_settings.openai_api_key = settings_update.openai_api_key
        
        if settings_update.anthropic_api_key is not None:
            self.user_settings.anthropic_api_key = settings_update.anthropic_api_key
        
        if settings_update.active_provider is not None:
            self.user_settings.active_provider = settings_update.active_provider
        
        if settings_update.auto_apply_workflows is not None:
            self.user_settings.auto_apply_workflows = settings_update.auto_apply_workflows
        
        if settings_update.save_chat_history is not None:
            self.user_settings.save_chat_history = settings_update.save_chat_history
        
        if settings_update.max_history is not None:
            self.user_settings.max_history = settings_update.max_history
        
        if settings_update.theme is not None:
            self.user_settings.theme = settings_update.theme
        
        if settings_update.enable_notifications is not None:
            self.user_settings.enable_notifications = settings_update.enable_notifications
        
        if settings_update.notification_sound is not None:
            self.user_settings.notification_sound = settings_update.notification_sound
        
        self.user_settings.updated_at = datetime.utcnow()
        
        logger.info("User settings updated")
        return self.user_settings
    
    async def get_n8n_instances(self) -> List[N8nInstance]:
        """Get all configured n8n instances"""
        return list(self.n8n_instances.values())
    
    async def get_n8n_instance(self, instance_id: str) -> Optional[N8nInstance]:
        """Get specific n8n instance"""
        return self.n8n_instances.get(instance_id)
    
    async def create_n8n_instance(self, instance: N8nInstanceCreate) -> N8nInstance:
        """Create new n8n instance configuration"""
        
        # Generate instance ID
        instance_id = str(uuid.uuid4())
        
        # Create new instance
        new_instance = N8nInstance(
            instance_id=instance_id,
            name=instance.name,
            url=instance.url,
            api_key=instance.api_key,
            is_default=instance.is_default,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        # If this is set as default, unset other defaults
        if instance.is_default:
            await self._unset_other_defaults(instance_id)
            self.user_settings.default_n8n_instance = instance_id
        
        # Store instance
        self.n8n_instances[instance_id] = new_instance
        
        logger.info(f"Created n8n instance {instance_id}: {instance.name}")
        return new_instance
    
    async def update_n8n_instance(
        self, 
        instance_id: str, 
        instance_update: N8nInstanceUpdate
    ) -> N8nInstance:
        """Update n8n instance configuration"""
        
        if instance_id not in self.n8n_instances:
            raise ValueError(f"n8n instance {instance_id} not found")
        
        instance = self.n8n_instances[instance_id]
        
        # Update fields
        if instance_update.name is not None:
            instance.name = instance_update.name
        
        if instance_update.url is not None:
            instance.url = instance_update.url
        
        if instance_update.api_key is not None:
            instance.api_key = instance_update.api_key
        
        if instance_update.is_default is not None:
            if instance_update.is_default:
                await self._unset_other_defaults(instance_id)
                self.user_settings.default_n8n_instance = instance_id
            instance.is_default = instance_update.is_default
        
        if instance_update.is_active is not None:
            instance.is_active = instance_update.is_active
        
        logger.info(f"Updated n8n instance {instance_id}")
        return instance
    
    async def delete_n8n_instance(self, instance_id: str):
        """Delete n8n instance configuration"""
        
        if instance_id not in self.n8n_instances:
            return
        
        instance = self.n8n_instances[instance_id]
        
        # If this was the default instance, clear the default
        if instance.is_default:
            self.user_settings.default_n8n_instance = None
        
        # Remove instance
        del self.n8n_instances[instance_id]
        
        logger.info(f"Deleted n8n instance {instance_id}")
    
    async def set_default_n8n_instance(self, instance_id: str):
        """Set n8n instance as default"""
        
        if instance_id not in self.n8n_instances:
            raise ValueError(f"n8n instance {instance_id} not found")
        
        # Unset other defaults
        await self._unset_other_defaults(instance_id)
        
        # Set new default
        self.n8n_instances[instance_id].is_default = True
        self.user_settings.default_n8n_instance = instance_id
        
        logger.info(f"Set n8n instance {instance_id} as default")
    
    async def get_ai_providers_status(self) -> Dict[str, Any]:
        """Get available AI providers and their status"""
        
        openai_status = {
            "provider": "openai",
            "configured": bool(self.user_settings.openai_api_key),
            "active": self.user_settings.active_provider == "openai"
        }
        
        anthropic_status = {
            "provider": "anthropic",
            "configured": bool(self.user_settings.anthropic_api_key),
            "active": self.user_settings.active_provider == "anthropic"
        }
        
        return {
            "providers": [openai_status, anthropic_status],
            "active_provider": self.user_settings.active_provider,
            "default_provider": settings.default_ai_provider
        }
    
    async def reset_to_defaults(self):
        """Reset settings to default values"""
        
        # Reset user settings
        self.user_settings = UserSettings(
            user_id="default_user",
            openai_api_key=settings.openai_api_key,
            anthropic_api_key=settings.anthropic_api_key,
            active_provider=settings.default_ai_provider,
            auto_apply_workflows=False,
            save_chat_history=True,
            max_history=25,
            theme="auto",
            enable_notifications=True,
            notification_sound=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Reset n8n instances
        self.n8n_instances.clear()
        
        # Re-add default instance if configured
        if settings.n8n_default_url and settings.n8n_default_api_key:
            default_instance = N8nInstance(
                instance_id="default",
                name="Default n8n Instance",
                url=settings.n8n_default_url,
                api_key=settings.n8n_default_api_key,
                is_default=True,
                is_active=True,
                created_at=datetime.utcnow()
            )
            self.n8n_instances["default"] = default_instance
            self.user_settings.default_n8n_instance = "default"
        
        logger.info("Settings reset to defaults")
    
    async def export_settings(self) -> Dict[str, Any]:
        """Export user settings"""
        
        return {
            "user_settings": self.user_settings.dict(),
            "n8n_instances": {
                instance_id: instance.dict() 
                for instance_id, instance in self.n8n_instances.items()
            },
            "exported_at": datetime.utcnow().isoformat()
        }
    
    async def import_settings(self, settings_data: dict):
        """Import user settings"""
        
        try:
            # Import user settings
            if "user_settings" in settings_data:
                user_settings_data = settings_data["user_settings"]
                for field, value in user_settings_data.items():
                    if hasattr(self.user_settings, field):
                        setattr(self.user_settings, field, value)
            
            # Import n8n instances
            if "n8n_instances" in settings_data:
                self.n8n_instances.clear()
                for instance_id, instance_data in settings_data["n8n_instances"].items():
                    instance = N8nInstance(**instance_data)
                    self.n8n_instances[instance_id] = instance
                    
                    # Set default instance
                    if instance.is_default:
                        self.user_settings.default_n8n_instance = instance_id
            
            self.user_settings.updated_at = datetime.utcnow()
            
            logger.info("Settings imported successfully")
            
        except Exception as e:
            logger.error(f"Error importing settings: {e}")
            raise ValueError(f"Failed to import settings: {str(e)}")
    
    async def _unset_other_defaults(self, exclude_instance_id: str):
        """Unset default flag from other n8n instances"""
        
        for instance_id, instance in self.n8n_instances.items():
            if instance_id != exclude_instance_id:
                instance.is_default = False
