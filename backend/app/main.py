"""
8pilot Backend - FastAPI Application
Main entry point for the backend service
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.logging import setup_logging
from app.core.database import create_tables

# Import all models to ensure they are registered with Base before creating tables
from app.models.user import User

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "600"
            return response
        
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to all responses
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting 8pilot backend...")
    # Skip database tables creation for in-memory mode
    # create_tables()
    logger.info("Using in-memory storage mode")
    yield
    # Shutdown
    logger.info("Shutting down 8pilot backend...")

def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title="8pilot Backend",
        description="AI-powered workflow assistant backend for n8n",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan
    )
    
    # Add custom CORS middleware
    app.add_middleware(CustomCORSMiddleware)
    
    # Add trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts
    )
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Global exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    
    # Include API router
    app.include_router(api_router, prefix="/api/v1")
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "service": "8pilot-backend"}
    
    return app

# Create app instance
app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
