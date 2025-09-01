"""
Workflow Dialog Service for managing workflow-based chat sessions
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func
from fastapi import HTTPException

from app.database import get_db
from app.models.workflow_dialog import (
    WorkflowDialogDB, ChatSessionDB, MessageDB,
    WorkflowDialog, WorkflowDialogCreate, WorkflowDialogUpdate,
    ChatSession, ChatSessionCreate, Message, MessageCreate,
    ChatHistoryResponse, WorkflowDialogWithSessions
)

logger = logging.getLogger(__name__)

class WorkflowDialogService:
    """Service for managing workflow dialogs and chat sessions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Workflow Dialog Methods
    async def create_workflow_dialog(
        self, 
        workflow_data: WorkflowDialogCreate
    ) -> WorkflowDialog:
        """Create a new workflow dialog"""
        
        # Check if workflow dialog already exists
        existing = self.db.query(WorkflowDialogDB).filter(
            WorkflowDialogDB.workflow_id == workflow_data.workflow_id,
            WorkflowDialogDB.is_active == True
        ).first()
        
        if existing:
            # Return existing workflow dialog
            return await self._convert_workflow_dialog_db_to_model(existing)
        
        # Create new workflow dialog
        db_dialog = WorkflowDialogDB(
            workflow_id=workflow_data.workflow_id,
            workflow_name=workflow_data.workflow_name,
            workflow_data=workflow_data.workflow_data,
            meta_data=workflow_data.meta_data or {}
        )
        
        self.db.add(db_dialog)
        self.db.commit()
        self.db.refresh(db_dialog)
        
        logger.info(f"Created workflow dialog for workflow {workflow_data.workflow_id}")
        return await self._convert_workflow_dialog_db_to_model(db_dialog)
    
    async def get_workflow_dialog(
        self, 
        workflow_id: str
    ) -> Optional[WorkflowDialog]:
        """Get workflow dialog by workflow ID"""
        
        db_dialog = self.db.query(WorkflowDialogDB).filter(
            WorkflowDialogDB.workflow_id == workflow_id,
            WorkflowDialogDB.is_active == True
        ).first()
        
        if not db_dialog:
            return None
        
        return await self._convert_workflow_dialog_db_to_model(db_dialog)
    
    async def get_workflow_dialog_by_id(
        self, 
        dialog_id: str
    ) -> Optional[WorkflowDialog]:
        """Get workflow dialog by internal ID"""
        
        db_dialog = self.db.query(WorkflowDialogDB).filter(
            WorkflowDialogDB.id == dialog_id,
            WorkflowDialogDB.is_active == True
        ).first()
        
        if not db_dialog:
            return None
        
        return await self._convert_workflow_dialog_db_to_model(db_dialog)
    
    async def update_workflow_dialog(
        self, 
        workflow_id: str, 
        update_data: WorkflowDialogUpdate
    ) -> Optional[WorkflowDialog]:
        """Update workflow dialog"""
        
        db_dialog = self.db.query(WorkflowDialogDB).filter(
            WorkflowDialogDB.workflow_id == workflow_id,
            WorkflowDialogDB.is_active == True
        ).first()
        
        if not db_dialog:
            return None
        
        # Update fields
        if update_data.workflow_name is not None:
            db_dialog.workflow_name = update_data.workflow_name
        if update_data.workflow_data is not None:
            db_dialog.workflow_data = update_data.workflow_data
        if update_data.meta_data is not None:
            db_dialog.meta_data = update_data.meta_data
        if update_data.is_active is not None:
            db_dialog.is_active = update_data.is_active
        
        db_dialog.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_dialog)
        
        logger.info(f"Updated workflow dialog for workflow {workflow_id}")
        return await self._convert_workflow_dialog_db_to_model(db_dialog)
    
    async def delete_workflow_dialog(self, workflow_id: str) -> bool:
        """Soft delete workflow dialog"""
        
        db_dialog = self.db.query(WorkflowDialogDB).filter(
            WorkflowDialogDB.workflow_id == workflow_id,
            WorkflowDialogDB.is_active == True
        ).first()
        
        if not db_dialog:
            return False
        
        db_dialog.is_active = False
        db_dialog.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"Deleted workflow dialog for workflow {workflow_id}")
        return True
    
    # Chat Session Methods
    async def create_chat_session(
        self, 
        workflow_id: str, 
        session_data: Optional[ChatSessionCreate] = None
    ) -> ChatSession:
        """Create a new chat session for a workflow"""
        
        # Get or create workflow dialog
        workflow_dialog = await self.get_workflow_dialog(workflow_id)
        if not workflow_dialog:
            # Create workflow dialog if it doesn't exist
            workflow_dialog = await self.create_workflow_dialog(
                WorkflowDialogCreate(workflow_id=workflow_id)
            )
        
        # Get the database object
        db_dialog = self.db.query(WorkflowDialogDB).filter(
            WorkflowDialogDB.workflow_id == workflow_id,
            WorkflowDialogDB.is_active == True
        ).first()
        
        # Create new session
        session_id = str(uuid.uuid4())
        db_session = ChatSessionDB(
            session_id=session_id,
            workflow_dialog_id=db_dialog.id,
            meta_data=session_data.meta_data if session_data else {}
        )
        
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        
        logger.info(f"Created chat session {session_id} for workflow {workflow_id}")
        return await self._convert_session_db_to_model(db_session)
    
    async def get_chat_session(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by session ID"""
        
        db_session = self.db.query(ChatSessionDB).filter(
            ChatSessionDB.session_id == session_id
        ).first()
        
        if not db_session:
            return None
        
        return await self._convert_session_db_to_model(db_session)
    
    async def get_latest_chat_session(
        self, 
        workflow_id: str
    ) -> Optional[ChatSession]:
        """Get the most recent chat session for a workflow"""
        
        db_session = self.db.query(ChatSessionDB)\
            .join(WorkflowDialogDB)\
            .filter(
                WorkflowDialogDB.workflow_id == workflow_id,
                WorkflowDialogDB.is_active == True
            )\
            .order_by(desc(ChatSessionDB.last_activity))\
            .first()
        
        if not db_session:
            return None
        
        return await self._convert_session_db_to_model(db_session)
    
    async def update_session_activity(self, session_id: str) -> bool:
        """Update session last activity timestamp"""
        
        db_session = self.db.query(ChatSessionDB).filter(
            ChatSessionDB.session_id == session_id
        ).first()
        
        if not db_session:
            return False
        
        db_session.last_activity = datetime.utcnow()
        self.db.commit()
        
        return True
    
    # Message Methods
    async def add_message(
        self, 
        session_id: str, 
        message_data: MessageCreate
    ) -> Message:
        """Add message to chat session"""
        
        db_session = self.db.query(ChatSessionDB).filter(
            ChatSessionDB.session_id == session_id
        ).first()
        
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Create message
        message_id = str(uuid.uuid4())
        db_message = MessageDB(
            message_id=message_id,
            session_id=db_session.id,
            role=message_data.role,
            content=message_data.content,
            tokens_used=message_data.tokens_used,
            provider=message_data.provider,
            meta_data=message_data.meta_data or {}
        )
        
        self.db.add(db_message)
        
        # Update session activity
        db_session.last_activity = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_message)
        
        logger.debug(f"Added {message_data.role} message to session {session_id}")
        return await self._convert_message_db_to_model(db_message)
    
    async def get_session_messages(
        self, 
        session_id: str, 
        limit: Optional[int] = None
    ) -> List[Message]:
        """Get messages for a chat session"""
        
        query = self.db.query(MessageDB)\
            .join(ChatSessionDB)\
            .filter(ChatSessionDB.session_id == session_id)\
            .order_by(MessageDB.timestamp)
        
        if limit:
            query = query.limit(limit)
        
        db_messages = query.all()
        
        return [await self._convert_message_db_to_model(msg) for msg in db_messages]
    
    # Chat History Methods
    async def get_chat_history(
        self, 
        workflow_id: str, 
        include_messages: bool = True,
        session_limit: Optional[int] = None
    ) -> ChatHistoryResponse:
        """Get complete chat history for a workflow"""
        
        # Get workflow dialog
        workflow_dialog = await self.get_workflow_dialog(workflow_id)
        
        if not workflow_dialog:
            return ChatHistoryResponse(
                workflow_id=workflow_id,
                sessions=[],
                total_sessions=0,
                total_messages=0
            )
        
        # Get sessions with messages if requested
        query = self.db.query(ChatSessionDB)\
            .join(WorkflowDialogDB)\
            .filter(
                WorkflowDialogDB.workflow_id == workflow_id,
                WorkflowDialogDB.is_active == True
            )\
            .order_by(desc(ChatSessionDB.last_activity))
        
        if session_limit:
            query = query.limit(session_limit)
        
        db_sessions = query.all()
        
        sessions = []
        total_messages = 0
        latest_activity = None
        
        for db_session in db_sessions:
            session = await self._convert_session_db_to_model(db_session, include_messages)
            sessions.append(session)
            
            if session.message_count:
                total_messages += session.message_count
            
            if not latest_activity or session.last_activity > latest_activity:
                latest_activity = session.last_activity
        
        return ChatHistoryResponse(
            workflow_id=workflow_id,
            workflow_dialog=workflow_dialog,
            sessions=sessions,
            total_sessions=len(sessions),
            total_messages=total_messages,
            latest_activity=latest_activity
        )
    
    async def save_workflow_to_dialog(
        self, 
        workflow_id: str, 
        workflow_data: Dict[str, Any],
        workflow_name: Optional[str] = None
    ) -> WorkflowDialog:
        """Save or update workflow data in dialog"""
        
        existing_dialog = await self.get_workflow_dialog(workflow_id)
        
        if existing_dialog:
            # Update existing
            update_data = WorkflowDialogUpdate(
                workflow_data=workflow_data,
                workflow_name=workflow_name
            )
            return await self.update_workflow_dialog(workflow_id, update_data)
        else:
            # Create new
            create_data = WorkflowDialogCreate(
                workflow_id=workflow_id,
                workflow_name=workflow_name,
                workflow_data=workflow_data
            )
            return await self.create_workflow_dialog(create_data)
    
    # Cleanup Methods
    async def cleanup_old_sessions(self, max_age_hours: int = 168) -> int:
        """Clean up old chat sessions (default: 1 week)"""
        
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        # Get sessions to delete
        old_sessions = self.db.query(ChatSessionDB).filter(
            ChatSessionDB.last_activity < cutoff_time
        ).all()
        
        deleted_count = len(old_sessions)
        
        # Delete sessions (messages will be cascade deleted)
        for session in old_sessions:
            self.db.delete(session)
        
        self.db.commit()
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} old chat sessions")
        
        return deleted_count
    
    # Statistics
    async def get_workflow_stats(self, workflow_id: str) -> Dict[str, Any]:
        """Get statistics for a workflow"""
        
        # Get basic counts
        dialog = self.db.query(WorkflowDialogDB).filter(
            WorkflowDialogDB.workflow_id == workflow_id,
            WorkflowDialogDB.is_active == True
        ).first()
        
        if not dialog:
            return {
                "workflow_id": workflow_id,
                "total_sessions": 0,
                "total_messages": 0,
                "latest_activity": None
            }
        
        # Count sessions and messages
        session_count = self.db.query(ChatSessionDB).filter(
            ChatSessionDB.workflow_dialog_id == dialog.id
        ).count()
        
        message_count = self.db.query(MessageDB)\
            .join(ChatSessionDB)\
            .filter(ChatSessionDB.workflow_dialog_id == dialog.id)\
            .count()
        
        # Get latest activity
        latest_session = self.db.query(ChatSessionDB)\
            .filter(ChatSessionDB.workflow_dialog_id == dialog.id)\
            .order_by(desc(ChatSessionDB.last_activity))\
            .first()
        
        latest_activity = latest_session.last_activity if latest_session else None
        
        return {
            "workflow_id": workflow_id,
            "total_sessions": session_count,
            "total_messages": message_count,
            "latest_activity": latest_activity
        }
    
    # Private helper methods
    async def _convert_workflow_dialog_db_to_model(
        self, 
        db_dialog: WorkflowDialogDB
    ) -> WorkflowDialog:
        """Convert database model to pydantic model"""
        
        # Count sessions and messages
        session_count = self.db.query(ChatSessionDB).filter(
            ChatSessionDB.workflow_dialog_id == db_dialog.id
        ).count()
        
        message_count = self.db.query(MessageDB)\
            .join(ChatSessionDB)\
            .filter(ChatSessionDB.workflow_dialog_id == db_dialog.id)\
            .count()
        
        return WorkflowDialog(
            id=str(db_dialog.id),
            workflow_id=db_dialog.workflow_id,
            workflow_name=db_dialog.workflow_name,
            workflow_data=db_dialog.workflow_data,
            meta_data=db_dialog.meta_data,
            created_at=db_dialog.created_at,
            updated_at=db_dialog.updated_at,
            is_active=db_dialog.is_active,
            session_count=session_count,
            message_count=message_count
        )
    
    async def _convert_session_db_to_model(
        self, 
        db_session: ChatSessionDB,
        include_messages: bool = False
    ) -> ChatSession:
        """Convert database session to pydantic model"""
        
        # Count messages
        message_count = self.db.query(MessageDB).filter(
            MessageDB.session_id == db_session.id
        ).count()
        
        # Get messages if requested
        messages = []
        if include_messages:
            db_messages = self.db.query(MessageDB)\
                .filter(MessageDB.session_id == db_session.id)\
                .order_by(MessageDB.timestamp)\
                .all()
            
            messages = [await self._convert_message_db_to_model(msg) for msg in db_messages]
        
        return ChatSession(
            id=str(db_session.id),
            session_id=db_session.session_id,
            workflow_dialog_id=str(db_session.workflow_dialog_id),
            created_at=db_session.created_at,
            last_activity=db_session.last_activity,
            meta_data=db_session.meta_data,
            message_count=message_count,
            messages=messages
        )
    
    async def _convert_message_db_to_model(self, db_message: MessageDB) -> Message:
        """Convert database message to pydantic model"""
        
        return Message(
            id=str(db_message.id),
            message_id=db_message.message_id,
            role=db_message.role,
            content=db_message.content,
            timestamp=db_message.timestamp,
            tokens_used=db_message.tokens_used,
            provider=db_message.provider,
            meta_data=db_message.meta_data
        )


# Service factory function
def get_workflow_dialog_service(db: Session = None) -> WorkflowDialogService:
    """Get workflow dialog service instance"""
    if db is None:
        from app.database import SessionLocal
        db = SessionLocal()
    return WorkflowDialogService(db)
