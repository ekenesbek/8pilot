"""
n8n Workflow models
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class WorkflowNode(BaseModel):
    """n8n workflow node"""
    id: str
    name: str
    type: str
    typeVersion: int = 1
    position: List[int] = Field(..., min_items=2, max_items=2)
    parameters: Dict[str, Any] = {}
    credentials: Optional[Dict[str, Any]] = None
    
    @validator('position')
    def validate_position(cls, v):
        if len(v) != 2:
            raise ValueError('Position must have exactly 2 coordinates [x, y]')
        return v

class WorkflowConnection(BaseModel):
    """Connection between workflow nodes"""
    source: str
    target: str
    sourceOutput: str = "main"
    targetInput: str = "main"

class Workflow(BaseModel):
    """Complete n8n workflow"""
    id: Optional[str] = None
    name: str
    nodes: List[WorkflowNode] = []
    connections: Dict[str, List[Dict[str, str]]] = {}
    settings: Dict[str, Any] = {}
    staticData: Dict[str, Any] = {}
    tags: Optional[List[str]] = None
    active: bool = False
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class WorkflowUpdate(BaseModel):
    """Workflow update request"""
    name: Optional[str] = None
    nodes: Optional[List[WorkflowNode]] = None
    connections: Optional[Dict[str, List[Dict[str, str]]]] = None
    settings: Optional[Dict[str, Any]] = None
    staticData: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    active: Optional[bool] = None

class WorkflowExecution(BaseModel):
    """Workflow execution result"""
    execution_id: str
    workflow_id: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class WorkflowTemplate(BaseModel):
    """Workflow template"""
    template_id: str
    name: str
    description: str
    category: str
    tags: List[str] = []
    workflow: Workflow
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None

class WorkflowStats(BaseModel):
    """Workflow statistics"""
    workflow_id: str
    node_count: int
    connection_count: int
    execution_count: int
    last_execution: Optional[datetime] = None
    average_execution_time: Optional[float] = None
