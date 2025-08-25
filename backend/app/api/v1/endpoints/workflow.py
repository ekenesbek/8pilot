"""
Workflow API endpoints for n8n integration
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
import logging

from app.models.workflow import (
    Workflow, WorkflowUpdate, WorkflowTemplate, 
    WorkflowStats, WorkflowExecution
)
from app.services.workflow_service import WorkflowService
from app.services.n8n_service import N8nService

router = APIRouter()
logger = logging.getLogger(__name__)

# Service instances
workflow_service = WorkflowService()
n8n_service = N8nService()

@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str):
    """Get workflow by ID"""
    try:
        workflow = await workflow_service.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return workflow
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{workflow_id}", response_model=Workflow)
async def update_workflow(
    workflow_id: str, 
    workflow_update: WorkflowUpdate
):
    """Update workflow"""
    try:
        updated_workflow = await workflow_service.update_workflow(
            workflow_id, workflow_update
        )
        return updated_workflow
    except Exception as e:
        logger.error(f"Error updating workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{workflow_id}/apply")
async def apply_workflow_to_n8n(
    workflow_id: str,
    background_tasks: BackgroundTasks
):
    """Apply workflow changes to n8n instance"""
    try:
        # Get workflow
        workflow = await workflow_service.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Apply to n8n
        result = await n8n_service.apply_workflow(workflow)
        
        # Update workflow in our system
        background_tasks.add_task(
            workflow_service.update_workflow_metadata,
            workflow_id,
            {"last_applied": "now"}
        )
        
        return {
            "message": "Workflow applied successfully",
            "workflow_id": workflow_id,
            "n8n_result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str):
    """Execute workflow on n8n instance"""
    try:
        execution = await n8n_service.execute_workflow(workflow_id)
        return execution
    except Exception as e:
        logger.error(f"Error executing workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workflow_id}/stats", response_model=WorkflowStats)
async def get_workflow_stats(workflow_id: str):
    """Get workflow statistics"""
    try:
        stats = await workflow_service.get_workflow_stats(workflow_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting workflow stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workflow_id}/executions", response_model=List[WorkflowExecution])
async def get_workflow_executions(
    workflow_id: str,
    limit: int = 10,
    offset: int = 0
):
    """Get workflow execution history"""
    try:
        executions = await workflow_service.get_workflow_executions(
            workflow_id, limit, offset
        )
        return executions
    except Exception as e:
        logger.error(f"Error getting workflow executions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates", response_model=WorkflowTemplate)
async def create_workflow_template(template: WorkflowTemplate):
    """Create a new workflow template"""
    try:
        created_template = await workflow_service.create_template(template)
        return created_template
    except Exception as e:
        logger.error(f"Error creating template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates", response_model=List[WorkflowTemplate])
async def get_workflow_templates(
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get workflow templates"""
    try:
        templates = await workflow_service.get_templates(
            category=category,
            limit=limit,
            offset=offset
        )
        return templates
    except Exception as e:
        logger.error(f"Error getting templates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates/{template_id}", response_model=WorkflowTemplate)
async def get_workflow_template(template_id: str):
    """Get specific workflow template"""
    try:
        template = await workflow_service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates/{template_id}/use")
async def use_workflow_template(
    template_id: str,
    workflow_id: str
):
    """Use a workflow template"""
    try:
        result = await workflow_service.use_template(template_id, workflow_id)
        return {
            "message": "Template applied successfully",
            "template_id": template_id,
            "workflow_id": workflow_id,
            "result": result
        }
    except Exception as e:
        logger.error(f"Error using template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/templates/{template_id}")
async def delete_workflow_template(template_id: str):
    """Delete workflow template"""
    try:
        await workflow_service.delete_template(template_id)
        return {"message": "Template deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
