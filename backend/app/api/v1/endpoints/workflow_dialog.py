"""
Workflow Dialog API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.services.workflow_dialog_service import WorkflowDialogService
from app.models.workflow_dialog import (
    WorkflowDialog, WorkflowDialogCreate, WorkflowDialogUpdate,
    ChatSession, ChatSessionCreate, Message, MessageCreate,
    ChatHistoryResponse, ApplyWorkflowRequest, ApplyWorkflowResponse
)

router = APIRouter()

def get_service(db: Session = Depends(get_db)) -> WorkflowDialogService:
    """Get workflow dialog service"""
    return WorkflowDialogService(db)

# Workflow Dialog Endpoints
@router.post("/workflows", response_model=WorkflowDialog)
async def create_workflow_dialog(
    workflow_data: WorkflowDialogCreate,
    service: WorkflowDialogService = Depends(get_service)
):
    """Create a new workflow dialog"""
    return await service.create_workflow_dialog(workflow_data)

@router.get("/workflows/{workflow_id}", response_model=WorkflowDialog)
async def get_workflow_dialog(
    workflow_id: str,
    service: WorkflowDialogService = Depends(get_service)
):
    """Get workflow dialog by workflow ID"""
    dialog = await service.get_workflow_dialog(workflow_id)
    if not dialog:
        raise HTTPException(status_code=404, detail="Workflow dialog not found")
    return dialog

@router.put("/workflows/{workflow_id}", response_model=WorkflowDialog)
async def update_workflow_dialog(
    workflow_id: str,
    update_data: WorkflowDialogUpdate,
    service: WorkflowDialogService = Depends(get_service)
):
    """Update workflow dialog"""
    dialog = await service.update_workflow_dialog(workflow_id, update_data)
    if not dialog:
        raise HTTPException(status_code=404, detail="Workflow dialog not found")
    return dialog

@router.delete("/workflows/{workflow_id}")
async def delete_workflow_dialog(
    workflow_id: str,
    service: WorkflowDialogService = Depends(get_service)
):
    """Delete workflow dialog"""
    success = await service.delete_workflow_dialog(workflow_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow dialog not found")
    return {"message": "Workflow dialog deleted successfully"}

@router.post("/workflows/{workflow_id}/save")
async def save_workflow_to_dialog(
    workflow_id: str,
    workflow_data: dict,
    workflow_name: Optional[str] = None,
    service: WorkflowDialogService = Depends(get_service)
):
    """Save or update workflow data in dialog"""
    dialog = await service.save_workflow_to_dialog(
        workflow_id=workflow_id,
        workflow_data=workflow_data,
        workflow_name=workflow_name
    )
    return dialog

# Chat Session Endpoints
@router.post("/workflows/{workflow_id}/sessions", response_model=ChatSession)
async def create_chat_session(
    workflow_id: str,
    session_data: Optional[ChatSessionCreate] = None,
    service: WorkflowDialogService = Depends(get_service)
):
    """Create a new chat session for a workflow"""
    return await service.create_chat_session(workflow_id, session_data)

@router.get("/sessions/{session_id}", response_model=ChatSession)
async def get_chat_session(
    session_id: str,
    include_messages: bool = Query(True, description="Include messages in response"),
    service: WorkflowDialogService = Depends(get_service)
):
    """Get chat session by session ID"""
    session = await service.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    if include_messages:
        messages = await service.get_session_messages(session_id)
        session.messages = messages
    
    return session

@router.get("/workflows/{workflow_id}/sessions/latest", response_model=ChatSession)
async def get_latest_chat_session(
    workflow_id: str,
    include_messages: bool = Query(True, description="Include messages in response"),
    service: WorkflowDialogService = Depends(get_service)
):
    """Get the most recent chat session for a workflow"""
    session = await service.get_latest_chat_session(workflow_id)
    if not session:
        raise HTTPException(status_code=404, detail="No chat sessions found for workflow")
    
    if include_messages:
        messages = await service.get_session_messages(session.session_id)
        session.messages = messages
    
    return session

@router.put("/sessions/{session_id}/activity")
async def update_session_activity(
    session_id: str,
    service: WorkflowDialogService = Depends(get_service)
):
    """Update session last activity timestamp"""
    success = await service.update_session_activity(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"message": "Session activity updated"}

# Message Endpoints
@router.post("/sessions/{session_id}/messages", response_model=Message)
async def add_message(
    session_id: str,
    message_data: MessageCreate,
    service: WorkflowDialogService = Depends(get_service)
):
    """Add message to chat session"""
    return await service.add_message(session_id, message_data)

@router.get("/sessions/{session_id}/messages", response_model=List[Message])
async def get_session_messages(
    session_id: str,
    limit: Optional[int] = Query(None, description="Limit number of messages"),
    service: WorkflowDialogService = Depends(get_service)
):
    """Get messages for a chat session"""
    return await service.get_session_messages(session_id, limit)

# Chat History Endpoints
@router.get("/workflows/{workflow_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    workflow_id: str,
    include_messages: bool = Query(True, description="Include messages in sessions"),
    session_limit: Optional[int] = Query(None, description="Limit number of sessions"),
    service: WorkflowDialogService = Depends(get_service)
):
    """Get complete chat history for a workflow"""
    return await service.get_chat_history(
        workflow_id=workflow_id,
        include_messages=include_messages,
        session_limit=session_limit
    )

# Statistics Endpoints
@router.get("/workflows/{workflow_id}/stats")
async def get_workflow_stats(
    workflow_id: str,
    service: WorkflowDialogService = Depends(get_service)
):
    """Get statistics for a workflow"""
    return await service.get_workflow_stats(workflow_id)

# Maintenance Endpoints
@router.post("/maintenance/cleanup")
async def cleanup_old_sessions(
    max_age_hours: int = Query(168, description="Maximum age in hours (default: 1 week)"),
    service: WorkflowDialogService = Depends(get_service)
):
    """Clean up old chat sessions"""
    deleted_count = await service.cleanup_old_sessions(max_age_hours)
    return {"message": f"Cleaned up {deleted_count} old sessions"}

# Special endpoint for checking if URL has workflow ID and loading accordingly
@router.get("/workflows/check-url")
async def check_workflow_from_url(
    url: str = Query(..., description="URL to check for workflow ID"),
    service: WorkflowDialogService = Depends(get_service)
):
    """Check if URL contains workflow ID and return workflow info"""
    import re
    
    # Extract workflow ID from n8n URL patterns
    patterns = [
        r'/workflow/([a-zA-Z0-9-_]+)',  # Standard n8n workflow URL
        r'workflowId=([a-zA-Z0-9-_]+)',  # Query parameter
        r'/workflows/([a-zA-Z0-9-_]+)',  # Alternative format
    ]
    
    workflow_id = None
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            workflow_id = match.group(1)
            break
    
    if not workflow_id:
        return {
            "has_workflow_id": False,
            "workflow_id": None,
            "workflow_dialog": None
        }
    
    # Get workflow dialog if it exists
    workflow_dialog = await service.get_workflow_dialog(workflow_id)
    
    return {
        "has_workflow_id": True,
        "workflow_id": workflow_id,
        "workflow_dialog": workflow_dialog
    }

# Apply workflow endpoint (placeholder for future n8n integration)
@router.post("/workflows/{workflow_id}/apply", response_model=ApplyWorkflowResponse)
async def apply_workflow_to_canvas(
    workflow_id: str,
    request: ApplyWorkflowRequest,
    service: WorkflowDialogService = Depends(get_service)
):
    """Apply workflow to n8n canvas (placeholder)"""
    # This would integrate with n8n API to apply the workflow
    # For now, just return success response
    
    workflow_dialog = await service.get_workflow_dialog(workflow_id)
    if not workflow_dialog:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # TODO: Implement actual n8n integration
    # For now, just save the workflow data
    await service.save_workflow_to_dialog(
        workflow_id=workflow_id,
        workflow_data=request.workflow_data,
        workflow_name=request.workflow_name
    )
    
    return ApplyWorkflowResponse(
        success=True,
        message="Workflow applied successfully (saved to dialog)",
        applied_workflow_id=workflow_id
    )
