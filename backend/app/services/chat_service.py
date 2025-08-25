"""
Chat Service for managing chat sessions and history
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.chat import ChatSession, Message, ChatHistory
from app.core.config import settings

logger = logging.getLogger(__name__)

class ChatService:
    """Service for managing chat sessions and history"""
    
    def __init__(self):
        # In-memory storage (replace with database in production)
        self.sessions: Dict[str, ChatSession] = {}
        self.workflow_sessions: Dict[str, List[str]] = {}
        
    async def get_or_create_session(
        self, 
        workflow_id: str, 
        session_id: Optional[str] = None
    ) -> ChatSession:
        """Get existing session or create new one"""
        
        if session_id and session_id in self.sessions:
            session = self.sessions[session_id]
            # Update last activity
            session.last_activity = datetime.utcnow()
            return session
        
        # Create new session
        new_session_id = str(uuid.uuid4())
        session = ChatSession(
            session_id=new_session_id,
            workflow_id=workflow_id,
            workflow_name=f"Workflow {workflow_id}",
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow()
        )
        
        # Store session
        self.sessions[new_session_id] = session
        
        # Add to workflow sessions
        if workflow_id not in self.workflow_sessions:
            self.workflow_sessions[workflow_id] = []
        self.workflow_sessions[workflow_id].append(new_session_id)
        
        logger.info(f"Created new chat session {new_session_id} for workflow {workflow_id}")
        return session
    
    async def add_message(
        self, 
        session_id: str, 
        role: str, 
        content: str
    ) -> Message:
        """Add message to chat session"""
        
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        message = Message(
            role=role,
            content=content,
            timestamp=datetime.utcnow(),
            message_id=str(uuid.uuid4())
        )
        
        session.messages.append(message)
        session.last_activity = datetime.utcnow()
        
        logger.debug(f"Added {role} message to session {session_id}")
        return message
    
    async def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by ID"""
        return self.sessions.get(session_id)
    
    async def get_latest_session(self, workflow_id: str) -> Optional[ChatSession]:
        """Get the most recent chat session for a workflow"""
        
        if workflow_id not in self.workflow_sessions:
            return None
        
        session_ids = self.workflow_sessions[workflow_id]
        if not session_ids:
            return None
        
        # Get the most recent session
        latest_session_id = max(
            session_ids, 
            key=lambda sid: self.sessions[sid].last_activity
        )
        
        return self.sessions[latest_session_id]
    
    async def get_workflow_history(self, workflow_id: str) -> ChatHistory:
        """Get chat history for a specific workflow"""
        
        if workflow_id not in self.workflow_sessions:
            return ChatHistory(workflow_id=workflow_id)
        
        session_ids = self.workflow_sessions[workflow_id]
        sessions = [self.sessions[sid] for sid in session_ids if sid in self.sessions]
        
        # Sort by last activity
        sessions.sort(key=lambda s: s.last_activity, reverse=True)
        
        # Calculate total messages
        total_messages = sum(len(s.messages) for s in sessions)
        
        return ChatHistory(
            workflow_id=workflow_id,
            sessions=sessions,
            total_messages=total_messages
        )
    
    async def update_session_activity(self, session_id: str):
        """Update session last activity timestamp"""
        
        if session_id in self.sessions:
            self.sessions[session_id].last_activity = datetime.utcnow()
    
    async def delete_session(self, session_id: str):
        """Delete a chat session"""
        
        if session_id not in self.sessions:
            return
        
        session = self.sessions[session_id]
        workflow_id = session.workflow_id
        
        # Remove from workflow sessions
        if workflow_id in self.workflow_sessions:
            self.workflow_sessions[workflow_id] = [
                sid for sid in self.workflow_sessions[workflow_id] 
                if sid != session_id
            ]
        
        # Remove session
        del self.sessions[session_id]
        
        logger.info(f"Deleted chat session {session_id}")
    
    async def clear_workflow_history(self, workflow_id: str):
        """Clear all chat history for a workflow"""
        
        if workflow_id not in self.workflow_sessions:
            return
        
        session_ids = self.workflow_sessions[workflow_id].copy()
        
        for session_id in session_ids:
            await self.delete_session(session_id)
        
        # Remove workflow entry
        del self.workflow_sessions[workflow_id]
        
        logger.info(f"Cleared all chat history for workflow {workflow_id}")
    
    async def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Clean up old chat sessions"""
        
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        sessions_to_delete = []
        
        for session_id, session in self.sessions.items():
            if session.last_activity < cutoff_time:
                sessions_to_delete.append(session_id)
        
        for session_id in sessions_to_delete:
            await self.delete_session(session_id)
        
        if sessions_to_delete:
            logger.info(f"Cleaned up {len(sessions_to_delete)} old chat sessions")
    
    async def get_session_stats(self) -> Dict[str, Any]:
        """Get chat service statistics"""
        
        total_sessions = len(self.sessions)
        total_workflows = len(self.workflow_sessions)
        total_messages = sum(len(s.messages) for s in self.sessions.values())
        
        return {
            "total_sessions": total_sessions,
            "total_workflows": total_workflows,
            "total_messages": total_messages,
            "active_sessions": len([
                s for s in self.sessions.values() 
                if s.last_activity > datetime.utcnow() - timedelta(hours=1)
            ])
        }
