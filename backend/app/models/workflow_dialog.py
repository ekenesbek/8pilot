"""
Workflow Dialog models for storing chat sessions and workflows in PostgreSQL
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid

Base = declarative_base()

# SQLAlchemy Database Models
class WorkflowDialogDB(Base):
    """Database model for workflow dialogs"""
    __tablename__ = "workflow_dialogs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(String(255), nullable=False, index=True)
    workflow_name = Column(String(500))
    workflow_data = Column(JSONB)  # Store the actual workflow JSON
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    meta_data = Column(JSONB, default=dict)
    
    # Relationship to chat sessions
    sessions = relationship("ChatSessionDB", back_populates="workflow_dialog", cascade="all, delete-orphan")

class ChatSessionDB(Base):
    """Database model for chat sessions"""
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(255), nullable=False, unique=True, index=True)
    workflow_dialog_id = Column(UUID(as_uuid=True), ForeignKey("workflow_dialogs.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)
    meta_data = Column(JSONB, default=dict)
    
    # Relationships
    workflow_dialog = relationship("WorkflowDialogDB", back_populates="sessions")
    messages = relationship("MessageDB", back_populates="session", cascade="all, delete-orphan")

class MessageDB(Base):
    """Database model for chat messages"""
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(String(255), nullable=False, unique=True, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    tokens_used = Column(Integer)
    provider = Column(String(50))
    meta_data = Column(JSONB, default=dict)
    
    # Relationship
    session = relationship("ChatSessionDB", back_populates="messages")

# Pydantic Models for API
class WorkflowDialogBase(BaseModel):
    """Base workflow dialog model"""
    workflow_id: str = Field(..., min_length=1, max_length=255)
    workflow_name: Optional[str] = Field(None, max_length=500)
    workflow_data: Optional[Dict[str, Any]] = None
    meta_data: Optional[Dict[str, Any]] = {}

class WorkflowDialogCreate(WorkflowDialogBase):
    """Create workflow dialog request"""
    pass

class WorkflowDialogUpdate(BaseModel):
    """Update workflow dialog request"""
    workflow_name: Optional[str] = Field(None, max_length=500)
    workflow_data: Optional[Dict[str, Any]] = None
    meta_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class WorkflowDialog(WorkflowDialogBase):
    """Workflow dialog response"""
    id: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    session_count: Optional[int] = 0
    message_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class MessageCreate(BaseModel):
    """Create message request"""
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1, max_length=10000)
    tokens_used: Optional[int] = None
    provider: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = {}

class Message(BaseModel):
    """Message response"""
    id: str
    message_id: str
    role: str
    content: str
    timestamp: datetime
    tokens_used: Optional[int] = None
    provider: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = {}
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatSessionCreate(BaseModel):
    """Create chat session request"""
    workflow_id: str
    meta_data: Optional[Dict[str, Any]] = {}

class ChatSession(BaseModel):
    """Chat session response"""
    id: str
    session_id: str
    workflow_dialog_id: str
    created_at: datetime
    last_activity: datetime
    meta_data: Optional[Dict[str, Any]] = {}
    message_count: Optional[int] = 0
    messages: Optional[List[Message]] = []
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class WorkflowDialogWithSessions(WorkflowDialog):
    """Workflow dialog with sessions"""
    sessions: List[ChatSession] = []

class ChatHistoryResponse(BaseModel):
    """Chat history response for a workflow"""
    workflow_id: str
    workflow_dialog: Optional[WorkflowDialog] = None
    sessions: List[ChatSession] = []
    total_sessions: int = 0
    total_messages: int = 0
    latest_activity: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ApplyWorkflowRequest(BaseModel):
    """Request to apply workflow to canvas"""
    workflow_data: Dict[str, Any]
    workflow_name: Optional[str] = None

class ApplyWorkflowResponse(BaseModel):
    """Response from applying workflow"""
    success: bool
    message: str
    applied_workflow_id: Optional[str] = None
