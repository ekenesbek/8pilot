"""
Main API router for v1 endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import chat, workflow, settings, auth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])

@api_router.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "n8n-copilot Backend API",
        "version": "1.0.0",
        "status": "active"
    }
