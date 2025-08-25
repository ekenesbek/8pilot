"""
Sidepanel models for extension integration
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class SidepanelStatus(BaseModel):
    """Sidepanel status information"""
    status: str
    timestamp: str
    extension_version: str
    api_version: str
    ai_providers: Dict[str, Any]
    n8n_connection: Dict[str, Any]
    features: Dict[str, bool]

class CurrentWorkflow(BaseModel):
    """Current workflow information"""
    workflow_id: str
    workflow_name: str
    page_url: str
    is_n8n_page: bool
    detected_at: str

class TemplateSuggestion(BaseModel):
    """Workflow template suggestion"""
    template_id: str
    name: str
    description: str
    category: str
    relevance_score: int
    usage_count: int
    node_count: int

class AIContext(BaseModel):
    """AI context for workflow assistance"""
    current_time: str
    available_features: List[str]
    workflow: Optional[Dict[str, Any]] = None
    recent_executions: Optional[List[Dict[str, Any]]] = None

class WorkflowSuggestion(BaseModel):
    """AI-powered workflow suggestion"""
    description: str
    workflow_id: Optional[str] = None
    suggestions: str
    generated_at: str
    ai_provider: str

class ExtensionVersion(BaseModel):
    """Extension version information"""
    extension_version: str
    api_version: str
    compatibility: Dict[str, Any]
    features: Dict[str, bool]
    last_updated: str

class UpdateInfo(BaseModel):
    """Extension update information"""
    current_version: str
    latest_version: str
    update_available: bool
    update_url: Optional[str] = None
    changelog: List[str]
    last_check: str

class UsageAnalytics(BaseModel):
    """Usage analytics for sidepanel"""
    timestamp: str
    chat: Dict[str, Any]
    workflows: Dict[str, Any]
    templates: Dict[str, Any]
    total_usage_time: str
    most_used_features: List[str]

class WorkflowPreview(BaseModel):
    """Workflow preview for sidepanel display"""
    id: str
    name: str
    node_count: int
    connection_count: int
    active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tags: List[str] = []
