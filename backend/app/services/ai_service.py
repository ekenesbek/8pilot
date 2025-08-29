"""
AI Service for interacting with OpenAI and Anthropic APIs
"""

import httpx
import logging
import json
import time
from typing import List, Dict, Any, AsyncGenerator
from app.models.chat import Message, StreamingChatResponse
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    """Service for AI provider interactions"""
    
    def __init__(self):
        # API keys are loaded from backend configuration
        self.openai_api_key = settings.openai_api_key
        self.anthropic_api_key = settings.anthropic_api_key
        
    async def get_response(
        self, 
        message: str, 
        provider: str = "openai",
        context: Dict[str, Any] = None,
        session_history: List[Message] = None
    ) -> str:
        """Get AI response from specified provider"""
        
        if provider == "openai":
            if not self.openai_api_key:
                raise ValueError("OpenAI API key is not configured")
            return await self._call_openai(message, context, session_history, self.openai_api_key)
        elif provider == "anthropic":
            if not self.anthropic_api_key:
                raise ValueError("Anthropic API key is not configured")
            return await self._call_anthropic(message, context, session_history, self.anthropic_api_key)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def stream_response(
        self, 
        message: str, 
        provider: str = "openai",
        context: Dict[str, Any] = None,
        session_history: List[Message] = None
    ) -> AsyncGenerator[StreamingChatResponse, None]:
        """Stream AI response from specified provider"""
        
        if provider == "openai":
            if not self.openai_api_key:
                raise ValueError("OpenAI API key is not configured")
            async for chunk in self._stream_openai(message, context, session_history, self.openai_api_key):
                yield chunk
        elif provider == "anthropic":
            if not self.anthropic_api_key:
                raise ValueError("Anthropic API key is not configured")
            async for chunk in self._stream_anthropic(message, context, session_history, self.anthropic_api_key):
                yield chunk
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def _call_openai(
        self, 
        message: str, 
        context: Dict[str, Any] = None,
        session_history: List[Message] = None,
        api_key: str = None
    ) -> str:
        """Call OpenAI API"""
        
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": self._get_openai_system_prompt(context)
            }
        ]
        
        # Add conversation history
        if session_history:
            for msg in session_history[-10:]:  # Last 10 messages
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2048
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_data = response.json()
                raise Exception(f"OpenAI API error: {error_data.get('error', {}).get('message', 'Unknown error')}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def _stream_openai(
        self, 
        message: str, 
        context: Dict[str, Any] = None,
        session_history: List[Message] = None,
        api_key: str = None
    ) -> AsyncGenerator[StreamingChatResponse, None]:
        """Stream OpenAI API response"""
        
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        # Prepare messages (same as non-streaming)
        messages = [
            {
                "role": "system",
                "content": self._get_openai_system_prompt(context)
            }
        ]
        
        if session_history:
            for msg in session_history[-10:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2048,
                    "stream": True
                },
                timeout=60.0
            ) as response:
                
                if response.status_code != 200:
                    error_data = await response.aread()
                    raise Exception(f"OpenAI API error: {error_data}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        
                        try:
                            parsed = json.loads(data)
                            delta = parsed.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            
                            if content:
                                yield StreamingChatResponse(
                                    chunk=content,
                                    session_id="",  # Will be set by caller
                                    is_complete=False
                                )
                        except json.JSONDecodeError:
                            continue
    
    async def _call_anthropic(
        self, 
        message: str, 
        context: Dict[str, Any] = None,
        session_history: List[Message] = None,
        api_key: str = None
    ) -> str:
        """Call Anthropic API"""
        
        if not api_key:
            raise ValueError("Anthropic API key is required")
        
        # Prepare messages for Anthropic
        messages = []
        if session_history:
            for msg in session_history[-10:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        system_prompt = self._get_anthropic_system_prompt(context)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-3-sonnet-20240229",
                    "max_tokens": 2048,
                    "system": system_prompt,
                    "messages": messages
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_data = response.json()
                raise Exception(f"Anthropic API error: {error_data.get('error', {}).get('message', 'Unknown error')}")
            
            data = response.json()
            return data["content"][0]["text"]
    
    async def _stream_anthropic(
        self, 
        message: str, 
        context: Dict[str, Any] = None,
        session_history: List[Message] = None,
        api_key: str = None
    ) -> AsyncGenerator[StreamingChatResponse, None]:
        """Stream Anthropic API response"""
        
        if not api_key:
            raise ValueError("Anthropic API key is required")
        
        # Prepare messages (same as non-streaming)
        messages = []
        if session_history:
            for msg in session_history[-10:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        system_prompt = self._get_anthropic_system_prompt(context)
        
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-3-sonnet-20240229",
                    "max_tokens": 2048,
                    "system": system_prompt,
                    "messages": messages,
                    "stream": True
                },
                timeout=60.0
            ) as response:
                
                if response.status_code != 200:
                    error_data = await response.aread()
                    raise Exception(f"Anthropic API error: {error_data}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        
                        try:
                            parsed = json.loads(data)
                            if parsed.get("type") == "content_block_delta":
                                delta = parsed.get("delta", {})
                                content = delta.get("text", "")
                                
                                if content:
                                    yield StreamingChatResponse(
                                        chunk=content,
                                        session_id="",  # Will be set by caller
                                        is_complete=False
                                    )
                        except json.JSONDecodeError:
                            continue
    
    def _get_openai_system_prompt(self, context: Dict[str, Any] = None) -> str:
        """Get system prompt for OpenAI"""
        base_prompt = """You are an n8n expert. Help users create working n8n workflows.

For each request provide:
1. Brief explanation of the solution
2. Valid JSON workflow for n8n

JSON must contain:
- nodes: array with node parameters
- connections: links between nodes
- pinData: {} (empty object)

Each node must have:
- parameters: node settings
- name: unique name
- type: node type (e.g., "n8n-nodes-base.gmail")
- typeVersion: 1
- position: [x, y] coordinates
- id: unique ID

Create only working, tested configurations."""
        
        if context and context.get("workflow_context"):
            base_prompt += f"\n\nCurrent workflow context: {context['workflow_context']}"
        
        return base_prompt
    
    def _get_anthropic_system_prompt(self, context: Dict[str, Any] = None) -> str:
        """Get system prompt for Anthropic"""
        base_prompt = """You are n8n Co Pilot, an AI assistant specializing in n8n workflow automation. 
Help users build effective n8n workflows by providing guidance and generating workflow components.
Always provide practical, working solutions with clear explanations."""
        
        if context and context.get("workflow_context"):
            base_prompt += f"\n\nCurrent workflow context: {context['workflow_context']}"
        
        return base_prompt
