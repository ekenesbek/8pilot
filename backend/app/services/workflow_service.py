"""
Workflow Service for managing n8n workflows and templates
"""

import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.workflow import (
    Workflow, WorkflowUpdate, WorkflowTemplate, 
    WorkflowStats, WorkflowExecution
)

logger = logging.getLogger(__name__)

class WorkflowService:
    """Service for managing workflows and templates"""
    
    def __init__(self):
        # In-memory storage (replace with database in production)
        self.workflows: Dict[str, Workflow] = {}
        self.templates: Dict[str, WorkflowTemplate] = {}
        self.executions: Dict[str, List[WorkflowExecution]] = {}
        
        # Initialize with some sample templates
        self._initialize_sample_templates()
    
    def _initialize_sample_templates(self):
        """Initialize with sample workflow templates"""
        
        # Email to Slack template
        email_slack_template = WorkflowTemplate(
            template_id="email-to-slack",
            name="Email to Slack",
            description="Forward emails to Slack channel",
            category="automation",
            tags=["email", "slack", "automation"],
            workflow=Workflow(
                name="Email to Slack",
                nodes=[
                    {
                        "id": "email-trigger",
                        "name": "Email Trigger",
                        "type": "n8n-nodes-base.emailReadImap",
                        "typeVersion": 1,
                        "position": [100, 100],
                        "parameters": {}
                    },
                    {
                        "id": "slack-node",
                        "name": "Slack",
                        "type": "n8n-nodes-base.slack",
                        "typeVersion": 1,
                        "position": [300, 100],
                        "parameters": {}
                    }
                ],
                connections={},
                settings={},
                staticData={}
            ),
            created_at=datetime.utcnow()
        )
        
        # Database sync template
        db_sync_template = WorkflowTemplate(
            template_id="data-sync",
            name="Database Sync",
            description="Sync data between databases",
            category="data",
            tags=["database", "sync", "data"],
            workflow=Workflow(
                name="Database Sync",
                nodes=[
                    {
                        "id": "schedule",
                        "name": "Schedule",
                        "type": "n8n-nodes-base.cron",
                        "typeVersion": 1,
                        "position": [100, 100],
                        "parameters": {}
                    },
                    {
                        "id": "source-db",
                        "name": "Source DB",
                        "type": "n8n-nodes-base.postgres",
                        "typeVersion": 1,
                        "position": [300, 100],
                        "parameters": {}
                    },
                    {
                        "id": "transform",
                        "name": "Transform",
                        "type": "n8n-nodes-base.set",
                        "typeVersion": 1,
                        "position": [500, 100],
                        "parameters": {}
                    },
                    {
                        "id": "target-db",
                        "name": "Target DB",
                        "type": "n8n-nodes-base.postgres",
                        "typeVersion": 1,
                        "position": [700, 100],
                        "parameters": {}
                    }
                ],
                connections={},
                settings={},
                staticData={}
            ),
            created_at=datetime.utcnow()
        )
        
        self.templates[email_slack_template.template_id] = email_slack_template
        self.templates[db_sync_template.template_id] = db_sync_template
    
    async def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Get workflow by ID"""
        return self.workflows.get(workflow_id)
    
    async def update_workflow(
        self, 
        workflow_id: str, 
        workflow_update: WorkflowUpdate
    ) -> Workflow:
        """Update workflow"""
        
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        workflow = self.workflows[workflow_id]
        
        # Apply updates
        if workflow_update.name is not None:
            workflow.name = workflow_update.name
        if workflow_update.nodes is not None:
            workflow.nodes = workflow_update.nodes
        if workflow_update.connections is not None:
            workflow.connections = workflow_update.connections
        if workflow_update.settings is not None:
            workflow.settings = workflow_update.settings
        if workflow_update.staticData is not None:
            workflow.staticData = workflow_update.staticData
        if workflow_update.tags is not None:
            workflow.tags = workflow_update.tags
        if workflow_update.active is not None:
            workflow.active = workflow_update.active
        
        workflow.updatedAt = datetime.utcnow()
        
        logger.info(f"Updated workflow {workflow_id}")
        return workflow
    
    async def update_workflow_metadata(
        self, 
        workflow_id: str, 
        metadata: Dict[str, Any]
    ):
        """Update workflow metadata"""
        
        if workflow_id not in self.workflows:
            return
        
        workflow = self.workflows[workflow_id]
        
        if not hasattr(workflow, 'metadata'):
            workflow.metadata = {}
        
        workflow.metadata.update(metadata)
        workflow.updatedAt = datetime.utcnow()
        
        logger.debug(f"Updated metadata for workflow {workflow_id}")
    
    async def get_workflow_stats(self, workflow_id: str) -> WorkflowStats:
        """Get workflow statistics"""
        
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            return WorkflowStats(
                workflow_id=workflow_id,
                node_count=0,
                connection_count=0,
                execution_count=0
            )
        
        node_count = len(workflow.nodes)
        connection_count = len(workflow.connections)
        execution_count = len(self.executions.get(workflow_id, []))
        
        # Calculate average execution time
        executions = self.executions.get(workflow_id, [])
        avg_execution_time = None
        if executions:
            completed_executions = [
                e for e in executions 
                if e.finished_at and e.status == "completed"
            ]
            if completed_executions:
                total_time = sum(
                    (e.finished_at - e.started_at).total_seconds() 
                    for e in completed_executions
                )
                avg_execution_time = total_time / len(completed_executions)
        
        return WorkflowStats(
            workflow_id=workflow_id,
            node_count=node_count,
            connection_count=connection_count,
            execution_count=execution_count,
            last_execution=executions[-1].started_at if executions else None,
            average_execution_time=avg_execution_time
        )
    
    async def get_workflow_executions(
        self, 
        workflow_id: str, 
        limit: int = 10, 
        offset: int = 0
    ) -> List[WorkflowExecution]:
        """Get workflow execution history"""
        
        executions = self.executions.get(workflow_id, [])
        return executions[offset:offset + limit]
    
    async def create_template(self, template: WorkflowTemplate) -> WorkflowTemplate:
        """Create a new workflow template"""
        
        if template.template_id in self.templates:
            raise ValueError(f"Template {template.template_id} already exists")
        
        # Generate template ID if not provided
        if not template.template_id:
            template.template_id = str(uuid.uuid4())
        
        template.created_at = datetime.utcnow()
        self.templates[template.template_id] = template
        
        logger.info(f"Created template {template.template_id}")
        return template
    
    async def get_templates(
        self, 
        category: Optional[str] = None,
        limit: int = 50, 
        offset: int = 0
    ) -> List[WorkflowTemplate]:
        """Get workflow templates"""
        
        templates = list(self.templates.values())
        
        # Filter by category if specified
        if category and category != "all":
            templates = [t for t in templates if t.category == category]
        
        # Sort by usage count and creation date
        templates.sort(key=lambda t: (t.usage_count, t.created_at), reverse=True)
        
        return templates[offset:offset + limit]
    
    async def get_template(self, template_id: str) -> Optional[WorkflowTemplate]:
        """Get specific workflow template"""
        return self.templates.get(template_id)
    
    async def use_template(self, template_id: str, workflow_id: str) -> Dict[str, Any]:
        """Use a workflow template"""
        
        template = self.templates.get(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        # Increment usage count
        template.usage_count += 1
        
        # Create new workflow from template
        new_workflow = Workflow(
            name=f"{template.name} (Copy)",
            nodes=template.workflow.nodes.copy(),
            connections=template.workflow.connections.copy(),
            settings=template.workflow.settings.copy(),
            staticData=template.workflow.staticData.copy(),
            tags=template.workflow.tags.copy() if template.workflow.tags else [],
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        # Store new workflow
        self.workflows[workflow_id] = new_workflow
        
        logger.info(f"Used template {template_id} to create workflow {workflow_id}")
        
        return {
            "template_id": template_id,
            "workflow_id": workflow_id,
            "workflow": new_workflow
        }
    
    async def delete_template(self, template_id: str):
        """Delete workflow template"""
        
        if template_id not in self.templates:
            return
        
        del self.templates[template_id]
        logger.info(f"Deleted template {template_id}")
    
    async def get_workflow_info(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed workflow information"""
        
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            return None
        
        stats = await self.get_workflow_stats(workflow_id)
        
        return {
            "workflow": workflow,
            "stats": stats,
            "recent_executions": await self.get_workflow_executions(workflow_id, 5)
        }
    
    async def get_workflow_canvas(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow canvas data for visualization"""
        
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            return None
        
        return {
            "nodes": workflow.nodes,
            "connections": workflow.connections,
            "canvas_size": self._calculate_canvas_size(workflow.nodes)
        }
    
    async def apply_changes(self, workflow_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        """Apply changes to workflow"""
        
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        workflow = self.workflows[workflow_id]
        
        # Apply changes
        if "nodes" in changes:
            workflow.nodes = changes["nodes"]
        if "connections" in changes:
            workflow.connections = changes["connections"]
        if "settings" in changes:
            workflow.settings.update(changes["settings"])
        
        workflow.updatedAt = datetime.utcnow()
        
        logger.info(f"Applied changes to workflow {workflow_id}")
        
        return {
            "workflow_id": workflow_id,
            "changes_applied": list(changes.keys()),
            "workflow": workflow
        }
    
    async def validate_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate workflow configuration"""
        
        errors = []
        warnings = []
        
        # Check required fields
        if "nodes" not in workflow_data:
            errors.append("Missing required field: nodes")
        if "connections" not in workflow_data:
            errors.append("Missing required field: connections")
        
        # Validate nodes if present
        if "nodes" in workflow_data and isinstance(workflow_data["nodes"], list):
            for i, node in enumerate(workflow_data["nodes"]):
                if not isinstance(node, dict):
                    errors.append(f"Node {i}: Invalid node format")
                    continue
                
                if "id" not in node:
                    errors.append(f"Node {i}: Missing required field: id")
                if "name" not in node:
                    errors.append(f"Node {i}: Missing required field: name")
                if "type" not in node:
                    errors.append(f"Node {i}: Missing required field: type")
                if "position" not in node:
                    errors.append(f"Node {i}: Missing required field: position")
                
                # Check position format
                if "position" in node and isinstance(node["position"], list):
                    if len(node["position"]) != 2:
                        errors.append(f"Node {i}: Position must have exactly 2 coordinates")
        
        # Validate connections if present
        if "connections" in workflow_data and isinstance(workflow_data["connections"], dict):
            for source_id, targets in workflow_data["connections"].items():
                if not isinstance(targets, list):
                    errors.append(f"Invalid connection format for source {source_id}")
                    continue
                
                for target in targets:
                    if not isinstance(target, dict):
                        errors.append(f"Invalid target format in connection from {source_id}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    async def get_workflow_preview(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow preview for sidepanel display"""
        
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            return None
        
        # Create preview with essential information
        preview = {
            "id": workflow_id,
            "name": workflow.name,
            "node_count": len(workflow.nodes),
            "connection_count": len(workflow.connections),
            "active": workflow.active,
            "created_at": workflow.createdAt,
            "updated_at": workflow.updatedAt,
            "tags": workflow.tags or []
        }
        
        return preview
    
    def _calculate_canvas_size(self, nodes: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calculate canvas size based on node positions"""
        
        if not nodes:
            return {"width": 800, "height": 600}
        
        min_x = min(node.get("position", [0, 0])[0] for node in nodes)
        max_x = max(node.get("position", [0, 0])[0] for node in nodes)
        min_y = min(node.get("position", [0, 0])[1] for node in nodes)
        max_y = max(node.get("position", [0, 0])[1] for node in nodes)
        
        return {
            "width": max(800, max_x - min_x + 400),
            "height": max(600, max_y - min_y + 300)
        }
