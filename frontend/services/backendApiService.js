// Backend API service for communicating with Python backend
export class BackendApiService {
  constructor() {
    this.baseUrl = 'http://localhost:8000/api/v1';
    this.defaultProvider = 'openai';
  }

  async sendMessage(message, workflowId, sessionId = null, provider = null, apiKeyData = {}) {
    try {
      const requestData = {
        message: message,
        workflow_id: workflowId,
        session_id: sessionId,
        provider: provider || this.defaultProvider,
        context: {
          workflow_context: `Workflow ID: ${workflowId}`,
          timestamp: new Date().toISOString()
        },
        ...apiKeyData // Spread API key data (openai_api_key or anthropic_api_key)
      };

      console.log('Sending message to backend:', requestData);

      const response = await fetch(`${this.baseUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      return data;

    } catch (error) {
      console.error('Error sending message to backend:', error);
      throw error;
    }
  }

  async streamMessage(message, workflowId, sessionId = null, provider = null, apiKeyData = {}, onChunk = null) {
    try {
      const requestData = {
        message: message,
        workflow_id: workflowId,
        session_id: sessionId,
        provider: provider || this.defaultProvider,
        context: {
          workflow_context: `Workflow ID: ${workflowId}`,
          timestamp: new Date().toISOString()
        },
        ...apiKeyData // Spread API key data (openai_api_key or anthropic_api_key)
      };

      console.log('Streaming message to backend:', requestData);

      const response = await fetch(`${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${errorData.detail || 'Unknown error'}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (onChunk) {
                onChunk(data);
              }
            } catch (e) {
              console.warn('Failed to parse chunk:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error streaming message to backend:', error);
      throw error;
    }
  }

  async getChatHistory(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/sessions/${workflowId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async getLatestSession(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/sessions/${workflowId}/latest`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No session found
        }
        const errorData = await response.json();
        throw new Error(`Backend API error: ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error getting latest session:', error);
      throw error;
    }
  }

  async clearWorkflowHistory(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/workflows/${workflowId}/history`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error clearing workflow history:', error);
      throw error;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}