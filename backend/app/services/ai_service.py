"""
AI Service for interacting with OpenAI and Anthropic APIs
"""

import httpx
import json
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    """Service for handling AI API calls to OpenAI and Anthropic"""
    
    def __init__(self):
        self.openai_base_url = "https://api.openai.com/v1"
        self.anthropic_base_url = "https://api.anthropic.com/v1"
        
        # Model configurations
        self.model_configs = {
            # OpenAI models
            "gpt-4o": {
                "provider": "openai",
                "max_tokens": 4096,
                "temperature": 0.7
            },
            "gpt-5": {
                "provider": "openai", 
                "max_tokens": 4096,
                "temperature": 0.7
            },
            "gpt-4.1": {
                "provider": "openai",
                "max_tokens": 4096,
                "temperature": 0.7
            },
            # Anthropic models
            "claude-3-7-sonnet-20250219": {
                "provider": "anthropic",
                "max_tokens": 4096,
                "temperature": 0.7
            },
            "claude-sonnet-4-20250514": {
                "provider": "anthropic",
                "max_tokens": 4096,
                "temperature": 0.7
            },
            "claude-3-5-haiku-20241022": {
                "provider": "anthropic",
                "max_tokens": 4096,
                "temperature": 0.7
            }
        }
        
        # Default models
        self.default_models = {
            "openai": "gpt-4o",
            "anthropic": "claude-3-7-sonnet-20250219"
        }
    
    def get_model_config(self, model: str) -> Dict[str, Any]:
        """Get configuration for a specific model"""
        return self.model_configs.get(model, {
            "provider": "openai",
            "max_tokens": 4096,
            "temperature": 0.7
        })
    
    def get_default_model(self, provider: str) -> str:
        """Get default model for a provider"""
        return self.default_models.get(provider, "gpt-4o")
    
    async def get_response(
        self,
        message: str,
        provider: str,
        model: Optional[str] = None,
        context: Optional[Dict] = None,
        session_history: Optional[List[Dict]] = None,
        api_key: Optional[str] = None
    ) -> str:
        """Get AI response from the specified provider"""
        
        # Use default model if not specified
        if not model:
            model = self.get_default_model(provider)
        
        # Get model configuration
        model_config = self.get_model_config(model)
        
        # Validate that model matches provider
        if model_config["provider"] != provider:
            logger.warning(f"Model {model} doesn't match provider {provider}, using default")
            model = self.get_default_model(provider)
            model_config = self.get_model_config(model)
        
        try:
            if provider == "openai":
                return await self._get_openai_response(
                    message, model, context, session_history, api_key, model_config
                )
            elif provider == "anthropic":
                return await self._get_anthropic_response(
                    message, model, context, session_history, api_key, model_config
                )
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error getting AI response: {e}", exc_info=True)
            raise
    
    async def stream_response(
        self,
        message: str,
        provider: str,
        model: Optional[str] = None,
        context: Optional[Dict] = None,
        session_history: Optional[List[Dict]] = None,
        api_key: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream AI response from the specified provider"""
        
        # Use default model if not specified
        if not model:
            model = self.get_default_model(provider)
        
        # Get model configuration
        model_config = self.get_model_config(model)
        
        # Validate that model matches provider
        if model_config["provider"] != provider:
            logger.warning(f"Model {model} doesn't match provider {provider}, using default")
            model = self.get_default_model(provider)
            model_config = self.get_model_config(model)
        
        try:
            if provider == "openai":
                async for chunk in self._stream_openai_response(
                    message, model, context, session_history, api_key, model_config
                ):
                    yield chunk
            elif provider == "anthropic":
                async for chunk in self._stream_anthropic_response(
                    message, model, context, session_history, api_key, model_config
                ):
                    yield chunk
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error streaming AI response: {e}", exc_info=True)
            raise
    
    async def _get_openai_response(
        self,
        message: str,
        model: str,
        context: Optional[Dict],
        session_history: Optional[List[Dict]],
        api_key: Optional[str],
        model_config: Dict[str, Any]
    ) -> str:
        """Get response from OpenAI API"""
        
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        # Prepare messages
        messages = self._prepare_messages(message, context, session_history)
        
        # Prepare request data
        data = {
            "model": model,
            "messages": messages,
            "max_tokens": model_config["max_tokens"],
            "temperature": model_config["temperature"],
            "stream": False
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.openai_base_url}/chat/completions",
                json=data,
                headers=headers,
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"OpenAI API error: {response.status_code} - {error_detail}")
                raise Exception(f"OpenAI API error: {response.status_code}")
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _get_anthropic_response(
        self,
        message: str,
        model: str,
        context: Optional[Dict],
        session_history: Optional[List[Dict]],
        api_key: Optional[str],
        model_config: Dict[str, Any]
    ) -> str:
        """Get response from Anthropic API"""
        
        if not api_key:
            raise ValueError("Anthropic API key is required")
        
        # Prepare messages for Anthropic
        messages = self._prepare_anthropic_messages(message, context, session_history)
        
        # Prepare request data
        data = {
            "model": model,
            "messages": messages,
            "max_tokens": model_config["max_tokens"],
            "temperature": model_config["temperature"]
        }
        
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.anthropic_base_url}/messages",
                json=data,
                headers=headers,
                timeout=60.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Anthropic API error: {response.status_code} - {error_detail}")
                raise Exception(f"Anthropic API error: {response.status_code}")
            
            result = response.json()
            return result["content"][0]["text"]
    
    async def _stream_openai_response(
        self,
        message: str,
        model: str,
        context: Optional[Dict],
        session_history: Optional[List[Dict]],
        api_key: Optional[str],
        model_config: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream response from OpenAI API"""
        
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        # Prepare messages
        messages = self._prepare_messages(message, context, session_history)
        
        # Prepare request data
        data = {
            "model": model,
            "messages": messages,
            "max_tokens": model_config["max_tokens"],
            "temperature": model_config["temperature"],
            "stream": True
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.openai_base_url}/chat/completions",
                json=data,
                headers=headers,
                timeout=60.0
            ) as response:
                
                if response.status_code != 200:
                    error_detail = await response.aread()
                    logger.error(f"OpenAI streaming API error: {response.status_code} - {error_detail}")
                    raise Exception(f"OpenAI API error: {response.status_code}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        if data.strip() == "[DONE]":
                            break
                        
                        try:
                            chunk_data = json.loads(data)
                            if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                                delta = chunk_data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield {
                                        "chunk": delta["content"],
                                        "is_complete": False
                                    }
                        except json.JSONDecodeError:
                            continue
    
    async def _stream_anthropic_response(
        self,
        message: str,
        model: str,
        context: Optional[Dict],
        session_history: Optional[List[Dict]],
        api_key: Optional[str],
        model_config: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream response from Anthropic API"""
        
        if not api_key:
            raise ValueError("Anthropic API key is required")
        
        # Prepare messages for Anthropic
        messages = self._prepare_anthropic_messages(message, context, session_history)
        
        # Prepare request data
        data = {
            "model": model,
            "messages": messages,
            "max_tokens": model_config["max_tokens"],
            "temperature": model_config["temperature"],
            "stream": True
        }
        
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.anthropic_base_url}/messages",
                json=data,
                headers=headers,
                timeout=60.0
            ) as response:
                
                if response.status_code != 200:
                    error_detail = await response.aread()
                    logger.error(f"Anthropic streaming API error: {response.status_code} - {error_detail}")
                    raise Exception(f"Anthropic API error: {response.status_code}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        
                        try:
                            chunk_data = json.loads(data)
                            if chunk_data.get("type") == "content_block_delta":
                                delta = chunk_data.get("delta", {})
                                if "text" in delta:
                                    yield {
                                        "chunk": delta["text"],
                                        "is_complete": False
                                    }
                            elif chunk_data.get("type") == "message_stop":
                                break
                        except json.JSONDecodeError:
                            continue
    
    def _prepare_messages(
        self,
        message: str,
        context: Optional[Dict],
        session_history: Optional[List[Dict]]
    ) -> List[Dict[str, str]]:
        """Prepare messages for OpenAI API"""
        messages = []
        
        # Add system message if context provided
        if context and context.get("system_prompt"):
            messages.append({
                "role": "system",
                "content": context["system_prompt"]
            })
        
        # Add session history
        if session_history:
            for msg in session_history[-10:]:  # Limit to last 10 messages
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        return messages
    
    def _prepare_anthropic_messages(
        self,
        message: str,
        context: Optional[Dict],
        session_history: Optional[List[Dict]]
    ) -> List[Dict[str, str]]:
        """Prepare messages for Anthropic API"""
        messages = []
        
        # Add session history (Anthropic format)
        if session_history:
            for msg in session_history[-10:]:  # Limit to last 10 messages
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        return messages

