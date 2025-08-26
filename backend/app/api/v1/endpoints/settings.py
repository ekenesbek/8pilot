"""
Settings API endpoints for user configuration
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import logging

from app.models.settings import (
    UserSettings, SettingsUpdate, N8nInstance, 
    N8nInstanceCreate, N8nInstanceUpdate
)
from app.services.settings_service import SettingsService
from app.services.n8n_service import N8nService

router = APIRouter()
logger = logging.getLogger(__name__)

# Service instances
# settings_service = SettingsService()  # Remove global initialization
# n8n_service = N8nService()  # Remove global initialization

@router.get("/", response_model=UserSettings)
async def get_user_settings():
    """Get current user settings"""
    try:
        settings = await SettingsService().get_user_settings()
        return settings
    except Exception as e:
        logger.error(f"Error getting user settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/", response_model=UserSettings)
async def update_user_settings(settings_update: SettingsUpdate):
    """Update user settings"""
    try:
        updated_settings = await SettingsService().update_settings(settings_update)
        return updated_settings
    except Exception as e:
        logger.error(f"Error updating user settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/n8n-instances", response_model=List[N8nInstance])
async def get_n8n_instances():
    """Get all configured n8n instances"""
    try:
        instances = await SettingsService().get_n8n_instances()
        return instances
    except Exception as e:
        logger.error(f"Error getting n8n instances: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/n8n-instances", response_model=N8nInstance)
async def create_n8n_instance(instance: N8nInstanceCreate):
    """Create new n8n instance configuration"""
    try:
        created_instance = await SettingsService().create_n8n_instance(instance)
        return created_instance
    except Exception as e:
        logger.error(f"Error creating n8n instance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/n8n-instances/{instance_id}", response_model=N8nInstance)
async def update_n8n_instance(
    instance_id: str, 
    instance_update: N8nInstanceUpdate
):
    """Update n8n instance configuration"""
    try:
        updated_instance = await SettingsService().update_n8n_instance(
            instance_id, instance_update
        )
        return updated_instance
    except Exception as e:
        logger.error(f"Error updating n8n instance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/n8n-instances/{instance_id}")
async def delete_n8n_instance(instance_id: str):
    """Delete n8n instance configuration"""
    try:
        await SettingsService().delete_n8n_instance(instance_id)
        return {"message": "n8n instance deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting n8n instance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/n8n-instances/{instance_id}/test")
async def test_n8n_connection(instance_id: str):
    """Test connection to n8n instance"""
    try:
        # Get instance configuration
        instance = await SettingsService().get_n8n_instance(instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="n8n instance not found")
        
        # Test connection
        test_result = await N8nService().test_connection(
            url=instance.url,
            api_key=instance.api_key
        )
        
        return {
            "message": "Connection test completed",
            "instance_id": instance_id,
            "success": test_result["success"],
            "details": test_result.get("details", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing n8n connection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/n8n-instances/{instance_id}/set-default")
async def set_default_n8n_instance(instance_id: str):
    """Set n8n instance as default"""
    try:
        await SettingsService().set_default_n8n_instance(instance_id)
        return {"message": "Default n8n instance updated successfully"}
    except Exception as e:
        logger.error(f"Error setting default n8n instance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-providers")
async def get_ai_providers():
    """Get available AI providers and their status"""
    try:
        providers = await SettingsService().get_ai_providers_status()
        return providers
    except Exception as e:
        logger.error(f"Error getting AI providers status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
async def reset_settings():
    """Reset settings to default values"""
    try:
        await SettingsService().reset_to_defaults()
        return {"message": "Settings reset to defaults successfully"}
    except Exception as e:
        logger.error(f"Error resetting settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export")
async def export_settings():
    """Export user settings"""
    try:
        settings_data = await SettingsService().export_settings()
        return {
            "message": "Settings exported successfully",
            "data": settings_data
        }
    except Exception as e:
        logger.error(f"Error exporting settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_settings(settings_data: dict):
    """Import user settings"""
    try:
        await SettingsService().import_settings(settings_data)
        return {"message": "Settings imported successfully"}
    except Exception as e:
        logger.error(f"Error importing settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
