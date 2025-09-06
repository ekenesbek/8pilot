#!/bin/bash

# 8pilot Backend Startup Script

echo "🚀 Starting 8pilot Backend..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "📦 Using Docker..."
    cd backend
    docker-compose -f docker-compose.simple.yml up --build
else
    echo "🐍 Using Python directly..."
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing dependencies..."
    pip install -r requirements.txt
    
    # Start the server
    echo "Starting server..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi
