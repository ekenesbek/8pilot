"""
Sidepanel Service for extension integration features
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.services.workflow_service import WorkflowService
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class SidepanelService:
    """Service for sidepanel-specific functionality"""
    
    def __init__(self):
        self.workflow_service = WorkflowService()
        self.ai_service = AIService()
        
        # Extension version info
        self.extension_version = "1.0.0"
        self.api_version = "1.0.0"
    
    async def get_status(self) -> Dict[str, Any]:
        """Get sidepanel status and connection info"""
        
        try:
            # Get AI providers status
            ai_status = await self._get_ai_status()
            
            # Get n8n connection status
            n8n_status = await self._get_n8n_status()
            
            return {
                "status": "active",
                "timestamp": datetime.utcnow().isoformat(),
                "extension_version": self.extension_version,
                "api_version": self.api_version,
                "ai_providers": ai_status,
                "n8n_connection": n8n_status,
                "features": {
                    "chat": True,
                    "workflow_management": True,
                    "templates": True,
                    "ai_assistance": True,
                    "n8n_integration": True
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting sidepanel status: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_current_workflow(self) -> Dict[str, Any]:
        """Get current workflow information from active tab"""
        
        # This would typically integrate with browser extension to get current tab info
        # For now, return mock data
        return {
            "workflow_id": "current_workflow",
            "workflow_name": "Current Workflow",
            "page_url": "https://n8n.example.com/workflow/123",
            "is_n8n_page": True,
            "detected_at": datetime.utcnow().isoformat()
        }
    
    async def get_template_suggestions(
        self, 
        workflow_context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get workflow template suggestions based on context"""
        
        try:
            # Get all templates
            templates = await self.workflow_service.get_templates(limit=20)
            
            suggestions = []
            for template in templates:
                relevance_score = 0
                
                # Calculate relevance based on context
                if workflow_context:
                    context_lower = workflow_context.lower()
                    
                    # Check name relevance
                    if any(word in template.name.lower() for word in context_lower.split()):
                        relevance_score += 3
                    
                    # Check description relevance
                    if any(word in template.description.lower() for word in context_lower.split()):
                        relevance_score += 2
                    
                    # Check category relevance
                    if any(word in template.category.lower() for word in context_lower.split()):
                        relevance_score += 1
                    
                    # Check tags relevance
                    for tag in template.tags:
                        if any(word in tag.lower() for word in context_lower.split()):
                            relevance_score += 1
                
                # Add usage count to score
                relevance_score += min(template.usage_count, 10)
                
                suggestions.append({
                    "template_id": template.template_id,
                    "name": template.name,
                    "description": template.description,
                    "category": template.category,
                    "relevance_score": relevance_score,
                    "usage_count": template.usage_count,
                    "node_count": len(template.workflow.nodes)
                })
            
            # Sort by relevance score
            suggestions.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            return suggestions[:10]  # Return top 10 suggestions
            
        except Exception as e:
            logger.error(f"Error getting template suggestions: {e}")
            return []
    
    async def get_ai_context(self, workflow_id: Optional[str] = None) -> Dict[str, Any]:
        """Get AI context for current workflow"""
        
        try:
            context = {
                "current_time": datetime.utcnow().isoformat(),
                "available_features": [
                    "workflow_creation",
                    "node_configuration",
                    "error_troubleshooting",
                    "best_practices",
                    "optimization_suggestions"
                ]
            }
            
            if workflow_id:
                # Get workflow-specific context
                workflow_info = await self.workflow_service.get_workflow_info(workflow_id)
                if workflow_info:
                    context["workflow"] = {
                        "id": workflow_id,
                        "name": workflow_info["workflow"].name,
                        "node_count": workflow_info["stats"].node_count,
                        "connection_count": workflow_info["stats"].connection_count,
                        "active": workflow_info["workflow"].active
                    }
                    
                    # Add recent execution context
                    if workflow_info["recent_executions"]:
                        context["recent_executions"] = [
                            {
                                "status": exec.status,
                                "started_at": exec.started_at.isoformat(),
                                "error": exec.error
                            }
                            for exec in workflow_info["recent_executions"][:3]
                        ]
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting AI context: {e}")
            return {"error": str(e)}
    
    async def get_workflow_suggestions(
        self, 
        description: str, 
        workflow_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get AI-powered workflow suggestions"""
        
        try:
            # Get AI context
            context = await self.get_ai_context(workflow_id)
            
            # Prepare prompt for AI
            prompt = f"""
            Based on this description: "{description}"
            
            Context: {context}
            
            Please provide workflow suggestions including:
            1. Recommended nodes and their configuration
            2. Connection patterns
            3. Best practices
            4. Potential optimizations
            """
            
            # Get AI response
            ai_response = await self.ai_service.get_response(
                message=prompt,
                provider="openai",  # Use default provider
                context=context
            )
            
            return {
                "description": description,
                "workflow_id": workflow_id,
                "suggestions": ai_response,
                "generated_at": datetime.utcnow().isoformat(),
                "ai_provider": "openai"
            }
            
        except Exception as e:
            logger.error(f"Error getting workflow suggestions: {e}")
            return {
                "error": str(e),
                "description": description,
                "workflow_id": workflow_id
            }
    
    async def get_extension_version(self) -> Dict[str, Any]:
        """Get extension version and compatibility info"""
        
        return {
            "extension_version": self.extension_version,
            "api_version": self.api_version,
            "compatibility": {
                "n8n_min_version": "0.200.0",
                "browser_min_version": "88.0",
                "chrome_extension": True,
                "firefox_extension": True
            },
            "features": {
                "ai_chat": True,
                "workflow_templates": True,
                "n8n_integration": True,
                "real_time_streaming": True,
                "theme_support": True
            },
            "last_updated": "2024-01-01"
        }
    
    async def check_for_updates(self) -> Dict[str, Any]:
        """Check for extension updates"""
        
        # This would typically check against a remote API
        # For now, return mock data
        return {
            "current_version": self.extension_version,
            "latest_version": "1.0.1",
            "update_available": False,
            "update_url": None,
            "changelog": [],
            "last_check": datetime.utcnow().isoformat()
        }
    
    async def get_usage_analytics(self) -> Dict[str, Any]:
        """Get usage analytics for the sidepanel"""
        
        try:
            # Get basic stats
            chat_stats = await self._get_chat_stats()
            workflow_stats = await self._get_workflow_stats()
            template_stats = await self._get_template_stats()
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "chat": chat_stats,
                "workflows": workflow_stats,
                "templates": template_stats,
                "total_usage_time": "24h",  # Mock data
                "most_used_features": [
                    "ai_chat",
                    "workflow_templates",
                    "n8n_integration"
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting usage analytics: {e}")
            return {"error": str(e)}
    
    async def _get_ai_status(self) -> Dict[str, Any]:
        """Get AI providers status"""
        
        try:
            # Check OpenAI
            openai_status = "configured" if self.ai_service.openai_api_key else "not_configured"
            
            # Check Anthropic
            anthropic_status = "configured" if self.ai_service.anthropic_api_key else "not_configured"
            
            return {
                "openai": openai_status,
                "anthropic": anthropic_status,
                "active_provider": "openai"  # Default
            }
            
        except Exception as e:
            logger.error(f"Error getting AI status: {e}")
            return {"error": str(e)}
    
    async def _get_n8n_status(self) -> Dict[str, Any]:
        """Get n8n connection status"""
        
        try:
            # This would check actual n8n connection
            # For now, return mock data
            return {
                "status": "connected",
                "instance_count": 1,
                "default_instance": "default",
                "last_connection_check": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting n8n status: {e}")
            return {"error": str(e)}
    
    async def _get_chat_stats(self) -> Dict[str, Any]:
        """Get chat statistics"""
        
        # Mock data - would come from chat service
        return {
            "total_messages": 150,
            "total_sessions": 25,
            "active_sessions": 3,
            "ai_responses": 75
        }
    
    async def _get_workflow_stats(self) -> Dict[str, Any]:
        """Get workflow statistics"""
        
        # Mock data - would come from workflow service
        return {
            "total_workflows": 12,
            "active_workflows": 8,
            "total_nodes": 156,
            "total_connections": 89
        }
    
    async def _get_template_stats(self) -> Dict[str, Any]:
        """Get template statistics"""
        
        # Mock data - would come from workflow service
        return {
            "total_templates": 15,
            "categories": ["automation", "data", "api", "custom"],
            "most_used": "email-to-slack",
            "total_usage": 45
        }
