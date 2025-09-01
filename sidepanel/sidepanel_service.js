// Workflow Dialog Service API Client
class WorkflowDialogAPI {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.apiPrefix = '/api/v1/workflow-dialog';
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseUrl}${this.apiPrefix}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API call failed: ${response.status} ${error}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Workflow Dialog Methods
  async createWorkflowDialog(workflowId, workflowName = null, workflowData = null) {
    return this.apiCall('/workflows', {
      method: 'POST',
      body: JSON.stringify({
        workflow_id: workflowId,
        workflow_name: workflowName,
        workflow_data: workflowData
      })
    });
  }

  async getWorkflowDialog(workflowId) {
    try {
      return await this.apiCall(`/workflows/${workflowId}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null; // Workflow dialog doesn't exist
      }
      throw error;
    }
  }

  async updateWorkflowDialog(workflowId, updateData) {
    return this.apiCall(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async saveWorkflowToDialog(workflowId, workflowData, workflowName = null) {
    return this.apiCall(`/workflows/${workflowId}/save`, {
      method: 'POST',
      body: JSON.stringify({
        workflow_data: workflowData,
        workflow_name: workflowName
      })
    });
  }

  // Chat Session Methods
  async createChatSession(workflowId, metaData = {}) {
    return this.apiCall(`/workflows/${workflowId}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        workflow_id: workflowId,
        meta_data: metaData
      })
    });
  }

  async getChatSession(sessionId, includeMessages = true) {
    return this.apiCall(`/sessions/${sessionId}?include_messages=${includeMessages}`);
  }

  async getLatestChatSession(workflowId, includeMessages = true) {
    try {
      return await this.apiCall(`/workflows/${workflowId}/sessions/latest?include_messages=${includeMessages}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null; // No sessions found
      }
      throw error;
    }
  }

  async updateSessionActivity(sessionId) {
    return this.apiCall(`/sessions/${sessionId}/activity`, {
      method: 'PUT'
    });
  }

  // Message Methods
  async addMessage(sessionId, role, content, tokensUsed = null, provider = null, metaData = {}) {
    return this.apiCall(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        role: role,
        content: content,
        tokens_used: tokensUsed,
        provider: provider,
        meta_data: metaData
      })
    });
  }

  async getSessionMessages(sessionId, limit = null) {
    const limitParam = limit ? `?limit=${limit}` : '';
    return this.apiCall(`/sessions/${sessionId}/messages${limitParam}`);
  }

  // Chat History Methods
  async getChatHistory(workflowId, includeMessages = true, sessionLimit = null) {
    const params = new URLSearchParams({
      include_messages: includeMessages.toString()
    });
    if (sessionLimit) {
      params.append('session_limit', sessionLimit.toString());
    }
    return this.apiCall(`/workflows/${workflowId}/history?${params}`);
  }

  // URL Detection
  async checkWorkflowFromUrl(url) {
    const params = new URLSearchParams({ url: url });
    return this.apiCall(`/workflows/check-url?${params}`);
  }

  // Statistics
  async getWorkflowStats(workflowId) {
    return this.apiCall(`/workflows/${workflowId}/stats`);
  }

  // Apply Workflow
  async applyWorkflowToCanvas(workflowId, workflowData, workflowName = null) {
    return this.apiCall(`/workflows/${workflowId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        workflow_data: workflowData,
        workflow_name: workflowName
      })
    });
  }

  // Cleanup
  async cleanupOldSessions(maxAgeHours = 168) {
    return this.apiCall(`/maintenance/cleanup`, {
      method: 'POST',
      body: JSON.stringify({
        max_age_hours: maxAgeHours
      })
    });
  }
}

// Create global instance
window.workflowAPI = new WorkflowDialogAPI();
