"""
n8n Service for integrating with n8n instances
"""

import httpx
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.models.workflow import Workflow, WorkflowExecution
from app.core.config import settings

logger = logging.getLogger(__name__)

class N8nService:
    """Service for n8n API integration"""
    
    def __init__(self):
        self.default_url = settings.n8n_default_url
        self.default_api_key = settings.n8n_default_api_key
    
    async def test_connection(
        self, 
        url: str, 
        api_key: str
    ) -> Dict[str, Any]:
        """Test connection to n8n instance"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{url}/api/v1/me",
                    headers={"X-N8N-API-KEY": api_key},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "success": True,
                        "details": {
                            "user": user_data.get("email", "Unknown"),
                            "instance": url,
                            "version": user_data.get("version", "Unknown")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "details": {
                            "error": f"HTTP {response.status_code}",
                            "response": response.text
                        }
                    }
                    
        except httpx.TimeoutException:
            return {
                "success": False,
                "details": {"error": "Connection timeout"}
            }
        except httpx.RequestError as e:
            return {
                "success": False,
                "details": {"error": f"Request failed: {str(e)}"}
            }
        except Exception as e:
            return {
                "success": False,
                "details": {"error": f"Unexpected error: {str(e)}"}
            }
    
    async def get_workflow(
        self, 
        workflow_id: str, 
        url: Optional[str] = None, 
        api_key: Optional[str] = None
    ) -> Optional[Workflow]:
        """Get workflow from n8n instance"""
        
        url = url or self.default_url
        api_key = api_key or self.default_api_key
        
        if not url or not api_key:
            raise ValueError("n8n URL and API key required")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{url}/api/v1/workflows/{workflow_id}",
                    headers={"X-N8N-API-KEY": api_key},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    workflow_data = response.json()
                    return self._convert_n8n_workflow(workflow_data)
                elif response.status_code == 404:
                    return None
                else:
                    response.raise_for_status()
                    
        except Exception as e:
            logger.error(f"Error getting workflow {workflow_id}: {e}")
            raise
    
    async def create_workflow(
        self, 
        workflow: Workflow,
        url: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create new workflow on n8n instance"""
        
        url = url or self.default_url
        api_key = api_key or self.default_api_key
        
        if not url or not api_key:
            raise ValueError("n8n URL and API key required")
        
        try:
            workflow_data = self._convert_to_n8n_format(workflow)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{url}/api/v1/workflows",
                    headers={
                        "X-N8N-API-KEY": api_key,
                        "Content-Type": "application/json"
                    },
                    json=workflow_data,
                    timeout=30.0
                )
                
                response.raise_for_status()
                result = response.json()
                
                return {
                    "workflow_id": result.get("id"),
                    "message": "Workflow created successfully",
                    "n8n_response": result
                }
                
        except Exception as e:
            logger.error(f"Error creating workflow: {e}")
            raise
    
    async def update_workflow(
        self, 
        workflow_id: str,
        workflow: Workflow,
        url: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update existing workflow on n8n instance"""
        
        url = url or self.default_url
        api_key = api_key or self.default_api_key
        
        if not url or not api_key:
            raise ValueError("n8n URL and API key required")
        
        try:
            workflow_data = self._convert_to_n8n_format(workflow)
            
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{url}/api/v1/workflows/{workflow_id}",
                    headers={
                        "X-N8N-API-KEY": api_key,
                        "Content-Type": "application/json"
                    },
                    json=workflow_data,
                    timeout=30.0
                )
                
                response.raise_for_status()
                result = response.json()
                
                return {
                    "workflow_id": workflow_id,
                    "message": "Workflow updated successfully",
                    "n8n_response": result
                }
                
        except Exception as e:
            logger.error(f"Error updating workflow {workflow_id}: {e}")
            raise
    
    async def apply_workflow(
        self, 
        workflow: Workflow,
        url: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Apply workflow to n8n instance (create or update)"""
        
        url = url or self.default_url
        api_key = api_key or self.default_api_key
        
        if not url or not api_key:
            raise ValueError("n8n URL and API key required")
        
        try:
            if workflow.id:
                # Update existing workflow
                return await self.update_workflow(workflow.id, workflow, url, api_key)
            else:
                # Create new workflow
                return await self.create_workflow(workflow, url, api_key)
                
        except Exception as e:
            logger.error(f"Error applying workflow: {e}")
            raise
    
    async def execute_workflow(
        self, 
        workflow_id: str,
        url: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> WorkflowExecution:
        """Execute workflow on n8n instance"""
        
        url = url or self.default_url
        api_key = api_key or self.default_api_key
        
        if not url or not api_key:
            raise ValueError("n8n URL and API key required")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{url}/api/v1/workflows/{workflow_id}/execute",
                    headers={"X-N8N-API-KEY": api_key},
                    timeout=60.0
                )
                
                response.raise_for_status()
                result = response.json()
                
                execution = WorkflowExecution(
                    execution_id=result.get("id", str(workflow_id)),
                    workflow_id=workflow_id,
                    status="started",
                    started_at=datetime.utcnow()
                )
                
                return execution
                
        except Exception as e:
            logger.error(f"Error executing workflow {workflow_id}: {e}")
            raise
    
    async def get_workflow_executions(
        self, 
        workflow_id: str,
        limit: int = 10,
        url: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> List[WorkflowExecution]:
        """Get workflow execution history from n8n"""
        
        url = url or self.default_url
        api_key = api_key or self.default_api_key
        
        if not url or not api_key:
            raise ValueError("n8n URL and API key required")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{url}/api/v1/executions",
                    headers={"X-N8N-API-KEY": api_key},
                    params={"workflowId": workflow_id, "limit": limit},
                    timeout=30.0
                )
                
                response.raise_for_status()
                executions_data = response.json()
                
                executions = []
                for exec_data in executions_data.get("data", []):
                    execution = WorkflowExecution(
                        execution_id=exec_data.get("id"),
                        workflow_id=workflow_id,
                        status=exec_data.get("status", "unknown"),
                        started_at=datetime.fromisoformat(exec_data.get("startedAt", "")),
                        finished_at=datetime.fromisoformat(exec_data.get("finishedAt", "")) if exec_data.get("finishedAt") else None,
                        result=exec_data.get("result"),
                        error=exec_data.get("error")
                    )
                    executions.append(execution)
                
                return executions
                
        except Exception as e:
            logger.error(f"Error getting executions for workflow {workflow_id}: {e}")
            raise
    
    async def get_workflow_stats(
        self, 
        workflow_id: str,
        url: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get workflow statistics from n8n"""
        
        url = url or self.default_url
        api_key = api_key or self.default_api_key
        
        if not url or not api_key:
            raise ValueError("n8n URL and API key required")
        
        try:
            workflow = await self.get_workflow(workflow_id, url, api_key)
            if not workflow:
                return {
                    "workflow_id": workflow_id,
                    "exists": False,
                    "stats": {}
                }
            
            executions = await self.get_workflow_executions(workflow_id, 100, url, api_key)
            
            stats = {
                "workflow_id": workflow_id,
                "exists": True,
                "node_count": len(workflow.nodes),
                "connection_count": len(workflow.connections),
                "execution_count": len(executions),
                "active": workflow.active,
                "last_execution": executions[0].started_at if executions else None,
                "success_rate": self._calculate_success_rate(executions)
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting workflow stats for {workflow_id}: {e}")
            raise
    
    def _convert_n8n_workflow(self, n8n_data: Dict[str, Any]) -> Workflow:
        """Convert n8n workflow format to our model"""
        
        return Workflow(
            id=n8n_data.get("id"),
            name=n8n_data.get("name", "Untitled"),
            nodes=n8n_data.get("nodes", []),
            connections=n8n_data.get("connections", {}),
            settings=n8n_data.get("settings", {}),
            staticData=n8n_data.get("staticData", {}),
            tags=n8n_data.get("tags", []),
            active=n8n_data.get("active", False),
            createdAt=datetime.fromisoformat(n8n_data.get("createdAt", "")) if n8n_data.get("createdAt") else None,
            updatedAt=datetime.fromisoformat(n8n_data.get("updatedAt", "")) if n8n_data.get("updatedAt") else None
        )
    
    def _convert_to_n8n_format(self, workflow: Workflow) -> Dict[str, Any]:
        """Convert our workflow model to n8n format"""
        
        return {
            "name": workflow.name,
            "nodes": workflow.nodes,
            "connections": workflow.connections,
            "settings": workflow.settings,
            "staticData": workflow.staticData,
            "tags": workflow.tags or [],
            "active": workflow.active
        }
    
    def _calculate_success_rate(self, executions: List[WorkflowExecution]) -> float:
        """Calculate workflow execution success rate"""
        
        if not executions:
            return 0.0
        
        successful = len([e for e in executions if e.status == "completed"])
        return (successful / len(executions)) * 100
