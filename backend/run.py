#!/usr/bin/env python3
"""
Simple script to run the n8n-copilot backend
"""

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f"Starting n8n-copilot backend on {settings.host}:{settings.port}")
    print(f"Debug mode: {settings.debug}")
    print(f"API docs will be available at: http://{settings.host}:{settings.port}/docs")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
