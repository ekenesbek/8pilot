"""
Chat API endpoints for AI interactions
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional
import time
import logging

from app.models.chat import (
    ChatRequest, ChatResponse, ChatSession, 
    ChatHistory, StreamingChatResponse
)
from app.services.chat_service import ChatService
from app.services.ai_service import AIService
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Service instances
chat_service = ChatService()
ai_service = AIService()

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    background_tasks: BackgroundTasks
):
    """Send a message and get AI response"""
    try:
        start_time = time.time()
        
        # Get or create chat session
        session = await chat_service.get_or_create_session(
            workflow_id=request.workflow_id,
            session_id=request.session_id
        )
        
        # Add user message to session
        await chat_service.add_message(session.session_id, "user", request.message)
        
        # Get AI response using provided or configured API keys
        api_key = None
        if request.provider == "openai" and request.openai_api_key:
            api_key = request.openai_api_key
        elif request.provider == "anthropic" and request.anthropic_api_key:
            api_key = request.anthropic_api_key
            
        ai_response = await ai_service.get_response(
            message=request.message,
            provider=request.provider,
            model=request.model,
            context=request.context,
            session_history=session.messages,
            api_key=api_key
        )
        
        # Add AI response to session
        await chat_service.add_message(session.session_id, "assistant", ai_response)
        
        response_time = time.time() - start_time
        
        # Update session activity
        background_tasks.add_task(
            chat_service.update_session_activity, 
            session.session_id
        )
        
        return ChatResponse(
            message=ai_response,
            session_id=session.session_id,
            workflow_id=session.workflow_id,
            provider=request.provider,
            response_time=response_time
        )
        
    except Exception as e:
        logger.error(f"Error in send_message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def stream_message(
    request: ChatRequest
):
    """Stream AI response in real-time"""
    try:
        # Get or create chat session
        session = await chat_service.get_or_create_session(
            workflow_id=request.workflow_id,
            session_id=request.session_id
        )
        
        # Add user message to session
        await chat_service.add_message(session.session_id, "user", request.message)
        
        async def generate_stream():
            """Generate streaming response"""
            try:
                # Get API key for streaming
                api_key = None
                if request.provider == "openai" and request.openai_api_key:
                    api_key = request.openai_api_key
                elif request.provider == "anthropic" and request.anthropic_api_key:
                    api_key = request.anthropic_api_key
                    
                async for chunk in ai_service.stream_response(
                    message=request.message,
                    provider=request.provider,
                    model=request.model,
                    context=request.context,
                    session_history=session.messages,
                    api_key=api_key
                ):
                    yield f"data: {chunk.json()}\n\n"
                
                # Final chunk
                final_chunk = StreamingChatResponse(
                    chunk="",
                    session_id=session.session_id,
                    is_complete=True
                )
                yield f"data: {final_chunk.json()}\n\n"
                
            except Exception as e:
                logger.error(f"Error in streaming: {e}", exc_info=True)
                error_chunk = StreamingChatResponse(
                    chunk=f"Error: {str(e)}",
                    session_id=session.session_id,
                    is_complete=True
                )
                yield f"data: {error_chunk.json()}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in stream_message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{workflow_id}", response_model=ChatHistory)
async def get_chat_history(workflow_id: str):
    """Get chat history for a specific workflow"""
    try:
        history = await chat_service.get_workflow_history(workflow_id)
        return history
    except Exception as e:
        logger.error(f"Error getting chat history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{workflow_id}/latest", response_model=ChatSession)
async def get_latest_session(workflow_id: str):
    """Get the latest chat session for a workflow"""
    try:
        session = await chat_service.get_latest_session(workflow_id)
        if not session:
            raise HTTPException(status_code=404, detail="No chat session found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a specific chat session"""
    try:
        await chat_service.delete_session(session_id)
        return {"message": "Session deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/workflows/{workflow_id}/history")
async def clear_workflow_history(workflow_id: str):
    """Clear all chat history for a workflow"""
    try:
        await chat_service.clear_workflow_history(workflow_id)
        return {"message": "Workflow history cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing workflow history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
