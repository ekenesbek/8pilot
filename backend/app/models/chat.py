"""
Chat and message models
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from datetime import datetime
import json

class Message(BaseModel):
    """Individual chat message"""
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1, max_length=10000)
    timestamp: Optional[datetime] = None
    message_id: Optional[str] = None
    
    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        return v or datetime.utcnow()

class ChatSession(BaseModel):
    """Chat session for a specific workflow"""
    session_id: str
    workflow_id: str
    workflow_name: Optional[str] = None
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = {}
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatRequest(BaseModel):
    """Request to send a message"""
    message: str = Field(..., min_length=1, max_length=4000)
    workflow_id: Optional[str] = None
    session_id: Optional[str] = None
    provider: Literal["openai", "anthropic"] = "openai"
    context: Optional[dict] = {}
    
    # AI API credentials passed from frontend (no registration required)
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # n8n API credentials passed from frontend
    n8n_api_url: Optional[str] = None
    n8n_api_key: Optional[str] = None

class ChatResponse(BaseModel):
    """Response from AI provider"""
    message: str
    session_id: str
    workflow_id: Optional[str] = None
    tokens_used: Optional[int] = None
    provider: str
    response_time: float
    metadata: Optional[dict] = {}

class ChatHistory(BaseModel):
    """Chat history for a workflow"""
    workflow_id: str
    sessions: List[ChatSession] = []
    total_messages: int = 0
    
    @property
    def latest_session(self) -> Optional[ChatSession]:
        """Get the most recent chat session"""
        if not self.sessions:
            return None
        return max(self.sessions, key=lambda s: s.last_activity)

class StreamingChatResponse(BaseModel):
    """Streaming response chunk"""
    chunk: str
    session_id: str
    is_complete: bool = False
    metadata: Optional[dict] = {}
