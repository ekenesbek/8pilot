# Workflow Dialog Service Implementation

## Overview

This implementation adds a comprehensive workflow dialog service to the n8n-copilot backend that stores all chat dialogs related to specific workflow IDs in PostgreSQL. The frontend (sidepanel.js) has been updated to use this service instead of local storage.

## Features Implemented

### ✅ Backend Components

1. **Database Models** (`app/models/workflow_dialog.py`)
   - `WorkflowDialogDB`: Stores workflow metadata and data
   - `ChatSessionDB`: Stores chat sessions for each workflow
   - `MessageDB`: Stores individual chat messages
   - Pydantic models for API requests/responses

2. **Database Configuration** (`app/database.py`)
   - SQLAlchemy setup with PostgreSQL
   - Connection management
   - Table creation utilities

3. **Workflow Dialog Service** (`app/services/workflow_dialog_service.py`)
   - Complete CRUD operations for workflows, sessions, and messages
   - Workflow data saving and retrieval
   - Chat history management
   - Statistics and cleanup functions

4. **API Endpoints** (`app/api/v1/endpoints/workflow_dialog.py`)
   - RESTful API for all workflow dialog operations
   - URL workflow ID detection
   - Workflow application endpoints
   - Maintenance and statistics endpoints

### ✅ Frontend Components

1. **API Client** (`sidepanel/sidepanel_service.js`)
   - Complete API wrapper for backend communication
   - Error handling and fallback mechanisms

2. **Updated Sidepanel** (`sidepanel/sidepanel.js`)
   - Removed local storage dependency for chat history
   - Added workflow ID detection from URLs
   - Automatic workflow saving to backend
   - Real-time message saving to API
   - Apply to Canvas buttons for all workflows in chat history

3. **Enhanced UI** (`sidepanel/sidepanel.html`)
   - Added backend URL configuration setting
   - Integrated API service script

## Key Features

### 🔍 URL Workflow Detection
- Automatically detects workflow IDs from n8n URLs
- Supports multiple URL patterns: `/workflow/{id}`, `workflowId={id}`, etc.
- Falls back to local regex if API detection fails

### 💾 Persistent Storage
- All chat data stored in PostgreSQL
- Workflow metadata and actual workflow JSON stored
- Message history with provider and token usage tracking
- Session management for organizing conversations

### 🔄 Workflow Management
- Automatic saving of current workflow from n8n canvas
- Loading of workflow data from dialog service
- Apply to Canvas buttons for all workflows in chat history
- Workflow versioning through dialog updates

### 🚀 Performance Features
- Asynchronous API calls
- Efficient database queries with proper indexing
- Message caching for UI responsiveness
- Cleanup utilities for old sessions

## API Endpoints

### Workflow Dialogs
- `POST /api/v1/workflow-dialog/workflows` - Create workflow dialog
- `GET /api/v1/workflow-dialog/workflows/{workflow_id}` - Get workflow dialog
- `PUT /api/v1/workflow-dialog/workflows/{workflow_id}` - Update workflow dialog
- `POST /api/v1/workflow-dialog/workflows/{workflow_id}/save` - Save workflow data

### Chat Sessions
- `POST /api/v1/workflow-dialog/workflows/{workflow_id}/sessions` - Create session
- `GET /api/v1/workflow-dialog/sessions/{session_id}` - Get session
- `GET /api/v1/workflow-dialog/workflows/{workflow_id}/sessions/latest` - Get latest session

### Messages
- `POST /api/v1/workflow-dialog/sessions/{session_id}/messages` - Add message
- `GET /api/v1/workflow-dialog/sessions/{session_id}/messages` - Get messages

### Utilities
- `GET /api/v1/workflow-dialog/workflows/check-url` - Detect workflow ID from URL
- `GET /api/v1/workflow-dialog/workflows/{workflow_id}/history` - Get chat history
- `POST /api/v1/workflow-dialog/workflows/{workflow_id}/apply` - Apply workflow to canvas

## Database Schema

```sql
-- Workflow dialogs table
CREATE TABLE workflow_dialogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL,
    workflow_name VARCHAR(500),
    workflow_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    meta_data JSONB DEFAULT '{}'
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    workflow_dialog_id UUID REFERENCES workflow_dialogs(id),
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    meta_data JSONB DEFAULT '{}'
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) UNIQUE NOT NULL,
    session_id UUID REFERENCES chat_sessions(id),
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    tokens_used INTEGER,
    provider VARCHAR(50),
    meta_data JSONB DEFAULT '{}'
);
```

## Setup Instructions

### 1. Database Setup
```bash
# Ensure PostgreSQL is running and create database
createdb n8n_copilot

# Run the initialization script
cd backend
python init_db.py
```

### 2. Backend Configuration
Update `backend/app/core/config.py` or set environment variables:
```bash
DATABASE_URL=postgresql://n8n_user:n8n_password@localhost:5432/n8n_copilot
```

### 3. Start Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Configuration
In the sidepanel settings, configure:
- Backend API URL: `http://localhost:8000`
- Your AI provider keys
- n8n instance URL and API key

## Migration from Local Storage

The system automatically migrates from local storage:
1. Local chat history is no longer used
2. New workflow dialogs are created on first access
3. Messages are saved to the API in real-time
4. Old local storage data is ignored

## Benefits

### 🔐 Data Persistence
- Chat history survives browser restarts
- Shared across devices with same backend
- Backup and restore capabilities

### 🎯 Workflow-Centric
- All conversations tied to specific workflows
- Easy to find relevant discussions for any workflow
- Workflow data versioning and history

### 📊 Analytics Ready
- Token usage tracking
- Provider usage statistics
- Conversation patterns analysis

### 🔧 Maintainable
- Clean separation of concerns
- RESTful API design
- Comprehensive error handling
- Proper database normalization

## Future Enhancements

- [ ] Full-text search across chat history
- [ ] Workflow comparison and diff tools
- [ ] Export/import functionality
- [ ] Advanced analytics dashboard
- [ ] Multi-user support with authentication
- [ ] Real-time collaboration features

## Troubleshooting

### Backend Connection Issues
1. Check if backend is running on correct port
2. Verify database connection in backend logs
3. Ensure CORS settings allow extension origin

### Workflow Detection Issues
1. Check URL patterns in browser console
2. Verify n8n API credentials in settings
3. Check network tab for API call failures

### Message Saving Issues
1. Verify backend API endpoint accessibility
2. Check session creation in browser console
3. Ensure PostgreSQL is accepting connections
