"""
Sidepanel API endpoints for extension integration
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
import logging

from app.services.sidepanel_service import SidepanelService
from app.services.workflow_service import WorkflowService

router = APIRouter()
logger = logging.getLogger(__name__)

# Service instances
sidepanel_service = SidepanelService()
workflow_service = WorkflowService()

@router.get("/status")
async def get_sidepanel_status():
    """Get sidepanel status and connection info"""
    try:
        status = await sidepanel_service.get_status()
        return status
    except Exception as e:
        logger.error(f"Error getting sidepanel status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflow/current")
async def get_current_workflow():
    """Get current workflow information from active tab"""
    try:
        workflow_info = await sidepanel_service.get_current_workflow()
        return workflow_info
    except Exception as e:
        logger.error(f"Error getting current workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflow/{workflow_id}/info")
async def get_workflow_info(workflow_id: str):
    """Get detailed workflow information"""
    try:
        workflow_info = await workflow_service.get_workflow_info(workflow_id)
        if not workflow_info:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return workflow_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflow/{workflow_id}/canvas")
async def get_workflow_canvas(workflow_id: str):
    """Get workflow canvas data for visualization"""
    try:
        canvas_data = await workflow_service.get_workflow_canvas(workflow_id)
        if not canvas_data:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return canvas_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow canvas: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflow/{workflow_id}/apply-changes")
async def apply_workflow_changes(
    workflow_id: str,
    changes: Dict[str, Any]
):
    """Apply changes to workflow"""
    try:
        result = await workflow_service.apply_changes(workflow_id, changes)
        return {
            "message": "Workflow changes applied successfully",
            "workflow_id": workflow_id,
            "result": result
        }
    except Exception as e:
        logger.error(f"Error applying workflow changes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates/suggestions")
async def get_template_suggestions(workflow_context: Optional[str] = None):
    """Get workflow template suggestions based on context"""
    try:
        suggestions = await sidepanel_service.get_template_suggestions(workflow_context)
        return suggestions
    except Exception as e:
        logger.error(f"Error getting template suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/context")
async def get_ai_context(workflow_id: Optional[str] = None):
    """Get AI context for current workflow"""
    try:
        context = await sidepanel_service.get_ai_context(workflow_id)
        return context
    except Exception as e:
        logger.error(f"Error getting AI context: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflow/auto-suggest")
async def get_workflow_suggestions(
    description: str,
    workflow_id: Optional[str] = None
):
    """Get AI-powered workflow suggestions"""
    try:
        suggestions = await sidepanel_service.get_workflow_suggestions(
            description, workflow_id
        )
        return suggestions
    except Exception as e:
        logger.error(f"Error getting workflow suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/extension/version")
async def get_extension_version():
    """Get extension version and compatibility info"""
    try:
        version_info = await sidepanel_service.get_extension_version()
        return version_info
    except Exception as e:
        logger.error(f"Error getting extension version: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extension/update-check")
async def check_for_updates():
    """Check for extension updates"""
    try:
        update_info = await sidepanel_service.check_for_updates()
        return update_info
    except Exception as e:
        logger.error(f"Error checking for updates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/usage")
async def get_usage_analytics():
    """Get usage analytics for the sidepanel"""
    try:
        analytics = await sidepanel_service.get_usage_analytics()
        return analytics
    except Exception as e:
        logger.error(f"Error getting usage analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflow/validate")
async def validate_workflow(workflow_data: Dict[str, Any]):
    """Validate workflow configuration"""
    try:
        validation_result = await workflow_service.validate_workflow(workflow_data)
        return validation_result
    except Exception as e:
        logger.error(f"Error validating workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflow/{workflow_id}/preview")
async def preview_workflow(workflow_id: str):
    """Get workflow preview for sidepanel display"""
    try:
        preview = await workflow_service.get_workflow_preview(workflow_id)
        if not preview:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return preview
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow preview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
