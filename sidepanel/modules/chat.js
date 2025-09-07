// sidepanel/modules/chat.js - Chat Management Module

// Import ChatStorageService
import { ChatStorageService } from '../../frontend/services/chatStorageService.js';
import { WorkflowExtractor } from '../../frontend/services/workflowExtractor.js';

// Chat storage - workflow-specific
let currentWorkflowId = null;
let allWorkflowChats = {};
let chatMemory = [];
let chatStorage = null;
let workflowExtractor = null;

// Storage keys
const STORAGE_KEYS = {
  WORKFLOW_CHATS: '8pilot_workflow_chats',
  LAST_ACTIVE_WORKFLOW: '8pilot_last_workflow'
};

// Chat Manager Class
class ChatManager {
  constructor() {
    this.init();
  }

  init() {
    // Initialize services
    chatStorage = new ChatStorageService();
    workflowExtractor = new WorkflowExtractor();
    
    this.loadChatStorage();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Chat functionality
    const sendBtn = document.getElementById('send-btn');
    const loadingBtn = document.getElementById('loading-btn');
    const chatInput = document.getElementById('chat-input');
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    if (loadingBtn) {
      loadingBtn.addEventListener('click', () => this.stopGeneration());
    }
    
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize textarea
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
      });
    }
  }

  // Load chat storage from localStorage
  loadChatStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOW_CHATS);
      if (stored) {
        allWorkflowChats = JSON.parse(stored);
        console.log('Loaded chat storage:', Object.keys(allWorkflowChats).length, 'workflows');
      }
    } catch (error) {
      console.error('Error loading chat storage:', error);
      allWorkflowChats = {};
    }
  }

  // Save chat storage to localStorage
  saveChatStorage() {
    try {
      // Clean up old chats (keep only last 50 workflows)
      const workflowIds = Object.keys(allWorkflowChats);
      if (workflowIds.length > 50) {
        const sortedByTime = workflowIds
          .map(id => ({ id, lastActivity: allWorkflowChats[id].lastActivity || 0 }))
          .sort((a, b) => b.lastActivity - a.lastActivity)
          .slice(0, 50);
        
        const newChats = {};
        sortedByTime.forEach(({ id }) => {
          newChats[id] = allWorkflowChats[id];
        });
        allWorkflowChats = newChats;
      }
      
      localStorage.setItem(STORAGE_KEYS.WORKFLOW_CHATS, JSON.stringify(allWorkflowChats));
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_WORKFLOW, currentWorkflowId);
    } catch (error) {
      console.error('Error saving chat storage:', error);
    }
  }

  // Load chat for current workflow
  loadWorkflowChat(workflowId) {
    if (!workflowId) return;
    
    currentWorkflowId = workflowId;
    chatStorage.setCurrentWorkflowId(workflowId);
    
    // Load from ChatStorageService
    const chat = chatStorage.getChat(workflowId);
    if (chat && chat.messages.length > 0) {
      chatMemory = chat.messages || [];
      console.log(`Loaded ${chatMemory.length} messages for workflow:`, workflowId);
      
      // Show notification about loaded chat
      const workflowName = chat.workflowName || workflowId;
      this.showToast(`Loaded chat for: ${workflowName}`, 'info');
    } else {
      chatMemory = [];
      console.log('Created new chat for workflow:', workflowId);
      
      // Show notification about new chat
      const workflowName = workflowId === 'new_workflow' ? 'New Workflow' : `Workflow ${workflowId}`;
      this.showToast(`Started new chat for: ${workflowName}`, 'success');
    }
    
    this.refreshChatUI();
  }

  // Save current chat to storage
  saveCurrentChat() {
    if (!currentWorkflowId) return;
    
    // Save to ChatStorageService
    if (chatStorage) {
      // Update messages in chat storage
      const chat = chatStorage.getChat(currentWorkflowId);
      chat.messages = chatMemory;
      chat.lastActivity = Date.now();
      
      // Save to localStorage
      chatStorage.saveToStorage();
    }
    
    // Also maintain legacy storage for compatibility
    allWorkflowChats[currentWorkflowId] = {
      ...allWorkflowChats[currentWorkflowId],
      messages: chatMemory,
      lastActivity: Date.now()
    };
    
    this.saveChatStorage();
    
    // Update workflows list if it's currently visible
    const workflowsTab = document.getElementById('workflows-tab');
    if (workflowsTab && !workflowsTab.classList.contains('hidden')) {
      this.renderWorkflowsList();
    }
  }

  // Refresh chat UI with current workflow's messages
  refreshChatUI() {
    const messagesArea = document.getElementById('chat-messages');
    if (!messagesArea) return;
    
    // Clear current messages
    messagesArea.innerHTML = '';
    
    // Add workflow header
    this.addWorkflowHeader(currentWorkflowId);
    
    // Restore messages from memory
    chatMemory.forEach(message => {
      this.addMessageToUI(message.role === 'user' ? 'user' : 'assistant', message.content, false);
    });
    
    // Don't add welcome message - keep chat clean
    // if (chatMemory.length === 0) {
    //   this.addWelcomeMessage();
    // }
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  // Add workflow header
  addWorkflowHeader(workflowId) {
    const messagesArea = document.getElementById('chat-messages');
    if (!messagesArea || !workflowId) return;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'workflow-header';
    headerDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      background: rgba(79, 209, 199, 0.1);
      border: 1px solid rgba(79, 209, 199, 0.3);
      border-radius: 6px;
      font-size: 12px;
      color: #4fd1c7;
    `;

    const workflowName = this.getWorkflowDisplayName(workflowId);
    headerDiv.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Chat for: ${workflowName}</span>
    `;

    messagesArea.appendChild(headerDiv);
  }

  // Get workflow display name
  getWorkflowDisplayName(workflowId) {
    if (!workflowId) return 'Unknown Workflow';
    
    if (workflowId.startsWith('new_')) {
      return 'New Workflow';
    }
    
    if (workflowId === 'default' || workflowId === 'unknown') {
      return 'Current Workflow';
    }
    
    return `Workflow ${workflowId}`;
  }

  // Send message with streaming
  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Reset generation stopped flag
    window.isGenerationStopped = false;
    
    // Start loading state
    this.startLoading();
    
    // Clear input
    input.value = '';
    input.style.height = '60px';
    
    // Add user message
    this.addMessage('user', message);
    
    // Check if user is requesting workflow creation but n8n is not connected
    const isWorkflowRequest = /создай|создать|сделай|сделать|workflow|автоматизаци|процесс|integration|веб-хук|webhook|n8n/i.test(message);
    
    if (isWorkflowRequest && !window.n8nConnectionState?.isConnected) {
      // Show n8n setup prompt
      setTimeout(() => {
        this.addMessage('assistant', 
          '🔧 Для создания рабочих процессов необходимо подключение к n8n. Хотите настроить подключение сейчас? Нажмите на кнопку "Настроить автоматически" в появившемся баннере выше.', 
          'n8n-prompt'
        );
        
        // Show banner if it was dismissed
        if (window.n8nConnectionState) {
          window.n8nConnectionState.bannerDismissed = false;
          localStorage.removeItem('n8n-banner-dismissed');
          if (window.updateN8nUI) {
            window.updateN8nUI();
          }
        }
      }, 500);
      return;
    }
    
    // Remove typing indicator (replaced by streaming)
    this.hideTypingIndicator();
    
    try {
      // Call AI API with streaming
      const response = await this.callAI(message);
      
      // Save the complete response to chat memory
      if (response && response.trim()) {
        // Update chat memory with the final response
        chatMemory.push({
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        });
        
        // Save to storage
        if (currentWorkflowId && allWorkflowChats[currentWorkflowId]) {
          allWorkflowChats[currentWorkflowId].messages = chatMemory;
          allWorkflowChats[currentWorkflowId].lastActivity = Date.now();
          this.saveCurrentChat();
        }
        
        // Check for workflow JSON in the complete response
        this.processWorkflowResponse(response);
      }
      
    } catch (error) {
      console.error('AI API error:', error);
      
      // Remove any streaming message on error
      const streamingMsg = document.getElementById('streaming-message');
      if (streamingMsg) {
        streamingMsg.remove();
      }
      
      // Provide more specific error messages
      let errorMessage = 'Failed to get AI response';
      if (error.message.includes('API key')) {
        errorMessage = `Invalid ${window.settings?.activeProvider || 'AI'} API key. Please check your settings.`;
      } else if (error.message.includes('Backend API error')) {
        errorMessage = 'Backend service unavailable. Please check if the backend is running.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      this.addMessage('assistant', errorMessage);
    }
    
    // Stop loading state
    this.stopLoading();
  }

  // Call AI API with streaming
  async callAI(message) {
    const provider = window.settings?.activeProvider || 'openai';
    
    // Use our backend API with streaming
    try {
      const backendUrl = window.settings?.backendUrl || window.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          workflow_id: currentWorkflowId || 'default',
          provider: provider,
          // Pass n8n API credentials if available
          n8n_api_url: window.settings?.n8nApiUrl,
          n8n_api_key: window.settings?.n8nApiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        // Create streaming message element
        const streamingMessageDiv = this.createStreamingMessage();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.chunk) {
                    fullResponse += parsed.chunk;
                    this.updateStreamingMessage(streamingMessageDiv, fullResponse);
                  }
                } catch (e) {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          this.finalizeStreamingMessage(streamingMessageDiv);
        }
        
        return fullResponse;
      } else {
        // Fallback to non-streaming if streaming not supported
        const data = await response.json();
        return data.response || data.message || 'No response from backend';
      }
      
    } catch (error) {
      console.error('Backend API error:', error);
      throw new Error('Backend API is unavailable. Please check backend service.');
    }
  }

  // Create streaming message element with simple animated dot
  createStreamingMessage() {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message assistant streaming';
    messageDiv.id = 'streaming-message';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar assistant';
    avatar.textContent = 'AI';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Add simple animated dot
    const dot = document.createElement('span');
    dot.className = 'streaming-dot';
    
    contentDiv.appendChild(dot);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
  }

  // Update streaming message content
  updateStreamingMessage(messageDiv, content) {
    const contentDiv = messageDiv.querySelector('.message-content');
    
    // Remove animated dot and add content
    const dot = contentDiv.querySelector('.streaming-dot');
    if (dot) {
      dot.remove();
    }
    
    // Add formatted content
    contentDiv.innerHTML = this.formatMessage(content);
    
    // Auto-scroll to bottom
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Finalize streaming message with smooth transition
  finalizeStreamingMessage(messageDiv) {
    const contentDiv = messageDiv.querySelector('.message-content');
    
    // Add finalized class for smooth transition
    messageDiv.classList.add('finalized');
    
    // Smooth transition to final state
    setTimeout(() => {
      // Remove streaming classes and attributes
      messageDiv.classList.remove('streaming');
      messageDiv.removeAttribute('id');
      
      // Add completion effect
      messageDiv.style.transition = 'all 0.5s ease';
      messageDiv.style.transform = 'translateY(0)';
      messageDiv.style.opacity = '1';
      
      // Remove transition after animation
      setTimeout(() => {
        messageDiv.style.transition = '';
        messageDiv.style.transform = '';
        messageDiv.style.opacity = '';
      }, 500);
    }, 200); // Wait for typing indicator to fade out
  }

  // Add message to chat
  addMessage(role, content, messageType = 'normal', saveToHistory = true) {
    this.addMessageToUI(role, content, messageType, saveToHistory);
    
    if (saveToHistory) {
      // Add to current chat memory
      const message = {
        role: role,
        content: content,
        type: messageType,
        timestamp: Date.now()
      };
      
      chatMemory.push(message);
      
      // Save to ChatStorageService
      if (currentWorkflowId && chatStorage) {
        chatStorage.addMessage(currentWorkflowId, role, content, messageType);
      }
      
      // Update workflow chat (legacy)
      if (currentWorkflowId && allWorkflowChats[currentWorkflowId]) {
        allWorkflowChats[currentWorkflowId].messages = chatMemory;
        allWorkflowChats[currentWorkflowId].lastActivity = Date.now();
        
        // Save to storage
        this.saveCurrentChat();
      }
    }
  }

  // Add message to UI
  addMessageToUI(role, content, messageType = 'normal', saveToHistory = true) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    // Add message type class for special styling
    if (messageType && messageType !== 'normal') {
      messageDiv.classList.add(`message-${messageType}`);
    }
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${role}`;
    avatar.textContent = role === 'user' ? 'U' : 'AI';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Process content for code blocks, etc.
    contentDiv.innerHTML = this.formatMessage(content);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add fade-in animation
    messageDiv.classList.add('fade-in');
  }

  // Format message content
  formatMessage(content) {
    // Basic markdown-like formatting
    let formatted = content
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    return formatted;
  }

  // Show typing indicator
  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'chat-message assistant';
    
    typingDiv.innerHTML = `
      <div class="message-avatar assistant">AI</div>
      <div class="message-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Process workflow response for JSON
  processWorkflowResponse(response) {
    // Extract JSON from response
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const workflowJson = JSON.parse(jsonMatch[1]);
        this.showWorkflowActions(workflowJson);
      } catch (error) {
        console.error('Failed to parse workflow JSON:', error);
      }
    }
  }

  // Show workflow action buttons
  showWorkflowActions(workflowJson) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'chat-message assistant';
    
    actionsDiv.innerHTML = `
      <div class="message-avatar assistant">AI</div>
      <div class="message-content">
        <p>I've extracted workflow components. Would you like to apply them?</p>
        <div class="message-actions">
          <button class="message-action-btn primary" data-action="apply-workflow">
            Apply to Canvas
          </button>
          <button class="message-action-btn" data-action="copy-workflow">
            Copy JSON
          </button>
          <button class="message-action-btn" data-action="save-template">
            Save as Template
          </button>
        </div>
      </div>
    `;
    
    // Store workflow JSON for later use
    actionsDiv.setAttribute('data-workflow-json', JSON.stringify(workflowJson));
    
    // Add event listeners to buttons
    const buttons = actionsDiv.querySelectorAll('.message-action-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const workflowData = JSON.parse(actionsDiv.getAttribute('data-workflow-json'));
        
        switch(action) {
          case 'apply-workflow':
            this.applyWorkflow(workflowData);
            break;
          case 'copy-workflow':
            this.copyWorkflowJson(workflowData);
            break;
          case 'save-template':
            this.saveAsTemplate(workflowData);
            break;
        }
      });
    });
    
    messagesContainer.appendChild(actionsDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Apply workflow to n8n canvas
  async applyWorkflow(workflowJson) {
    // Check if n8n is connected
    if (!window.n8nConnectionState?.isConnected || !window.settings?.n8nApiUrl || !window.settings?.n8nApiKey) {
      // Show n8n setup message with link
      this.addMessage('assistant', 
        '🔗 Для применения workflow к canvas необходимо подключение к n8n. ' +
        'Пожалуйста, настройте подключение, нажав на кнопку "Настроить автоматически" в баннере выше, ' +
        'или перейдите в настройки для ручной настройки.', 
        'warning'
      );
      
      // Show banner if it was dismissed
      if (window.n8nConnectionState) {
        window.n8nConnectionState.bannerDismissed = false;
        localStorage.removeItem('n8n-banner-dismissed');
        if (window.updateN8nUI) {
          window.updateN8nUI();
        }
      }
      
      return;
    }

    if (!currentWorkflowId || currentWorkflowId === 'unknown_workflow') {
      this.addMessage('assistant', 'Please navigate to an n8n workflow page first.');
      return;
    }

    try {
      // Apply workflow via n8n API
      await this.applyToN8nCanvas(workflowJson);
      this.addMessage('assistant', 'Workflow components applied successfully! The page will refresh shortly.', 'success');
      
      // Refresh the page after a delay
      setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error('Failed to apply workflow:', error);
      this.addMessage('assistant', `Error applying workflow: ${error.message}`, 'error');
    }
  }

  // Apply workflow to n8n canvas via API
  async applyToN8nCanvas(workflowJson) {
    try {
      // Check if n8n API is configured
      if (!window.settings?.n8nApiUrl || !window.settings?.n8nApiKey) {
        throw new Error('n8n API not configured. Please set n8n API URL and API key in settings.');
      }

      console.log('n8n API URL:', window.settings.n8nApiUrl);
      console.log('n8n API Key configured:', !!window.settings.n8nApiKey);

      // Clean incoming workflow JSON first
      const cleanIncomingJson = this.cleanIncomingWorkflowJson(workflowJson);
      console.log('Original workflow JSON:', workflowJson);
      console.log('Cleaned incoming workflow JSON:', cleanIncomingJson);

      const workflowId = currentWorkflowId === 'new_workflow' 
        ? await this.createNewWorkflow() 
        : currentWorkflowId;

      console.log('Applying workflow to ID:', workflowId);

      // Get current workflow
      const getResponse = await fetch(`${window.settings.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': window.settings.n8nApiKey
        }
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        console.error('Failed to fetch current workflow:', getResponse.status, errorText);
        throw new Error(`Failed to fetch current workflow: ${getResponse.status} ${errorText}`);
      }

      const currentWorkflow = await getResponse.json();
      console.log('Current workflow:', currentWorkflow);
      
      // Merge with new components
      const updatedWorkflow = this.mergeWorkflow(currentWorkflow, cleanIncomingJson);
      console.log('Updated workflow:', updatedWorkflow);
      
      // Clean workflow for PUT request
      const cleanWorkflow = this.cleanWorkflowForPut(updatedWorkflow);
      console.log('Clean workflow for PUT:', cleanWorkflow);
      
      // Update workflow
      const updateResponse = await fetch(`${window.settings.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': window.settings.n8nApiKey
        },
        body: JSON.stringify(cleanWorkflow)
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update workflow:', updateResponse.status, errorText);
        throw new Error(`Failed to update workflow: ${updateResponse.status} ${errorText}`);
      }

      const result = await updateResponse.json();
      console.log('Workflow updated successfully:', result);
      
    } catch (error) {
      console.error('Error in applyToN8nCanvas:', error);
      throw error;
    }
  }

  // Create new workflow
  async createNewWorkflow() {
    const response = await fetch(`${window.settings.n8nApiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': window.settings.n8nApiKey
      },
      body: JSON.stringify({
        name: 'New Workflow',
        nodes: [],
        connections: {},
        settings: {},
        staticData: {}
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create new workflow');
    }

    const newWorkflow = await response.json();
    return newWorkflow.id;
  }

  // Merge workflow with new components
  mergeWorkflow(currentWorkflow, newComponents) {
    const result = { ...currentWorkflow };
    
    if (!result.nodes) result.nodes = [];
    if (!result.connections) result.connections = {};
    
    if (newComponents.nodes && Array.isArray(newComponents.nodes)) {
      // Calculate offset for new nodes
      let maxX = 0, maxY = 0;
      result.nodes.forEach(node => {
        if (node.position && Array.isArray(node.position)) {
          maxX = Math.max(maxX, node.position[0] || 0);
          maxY = Math.max(maxY, node.position[1] || 0);
        }
      });
      
      const offsetX = maxX > 0 ? maxX + 200 : 100;
      const offsetY = maxY > 0 ? maxY + 50 : 100;
      
      // Add new nodes with clean structure
      let nodeCounter = result.nodes.length;
      newComponents.nodes.forEach((node, index) => {
        const newNode = {
          id: String(node.id), // Ensure ID is string
          name: String(node.name),
          type: String(node.type),
          typeVersion: Number(node.typeVersion || 1),
          position: [offsetX + (index * 200), offsetY],
          parameters: node.parameters || {}
        };
        
        result.nodes.push(newNode);
      });
    }
    
    if (newComponents.connections && typeof newComponents.connections === 'object') {
      // Add new connections
      Object.keys(newComponents.connections).forEach(sourceNodeId => {
        if (!result.connections[sourceNodeId]) {
          result.connections[sourceNodeId] = [];
        }
        
        const connections = newComponents.connections[sourceNodeId];
        if (Array.isArray(connections)) {
          connections.forEach(connection => {
            if (connection && connection.node && connection.type) {
              result.connections[sourceNodeId].push({
                node: String(connection.node), // Ensure node ID is string
                type: String(connection.type), // Ensure type is string
                index: Number(connection.index || 0) // Ensure index is number
              });
            }
          });
        }
      });
    }
    
    console.log('Merged workflow result:', result);
    return result;
  }

  // Clean workflow for PUT request - only send fields that n8n API accepts
  cleanWorkflowForPut(workflow) {
    // n8n API only accepts specific fields, remove all others
    const cleaned = {
      name: String(workflow.name || 'Untitled Workflow'),
      nodes: [],
      connections: {},
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    };

    // Clean nodes - only keep essential fields and ensure proper types
    cleaned.nodes = (workflow.nodes || []).map(node => {
      const cleanNode = {
        id: String(node.id), // Ensure ID is string
        name: String(node.name || 'Node'),
        type: String(node.type || 'n8n-nodes-base.start'),
        typeVersion: Number(node.typeVersion || 1),
        position: Array.isArray(node.position) ? node.position : [0, 0],
        parameters: node.parameters || {}
      };
      
      // Only add additional fields if they exist and are not undefined
      if (node.continueOnFail !== undefined) cleanNode.continueOnFail = Boolean(node.continueOnFail);
      if (node.disabled !== undefined) cleanNode.disabled = Boolean(node.disabled);
      if (node.notes !== undefined) cleanNode.notes = String(node.notes);
      
      return cleanNode;
    });

    // Clean connections - ensure proper format and types
    if (workflow.connections && typeof workflow.connections === 'object') {
      Object.keys(workflow.connections).forEach(key => {
        if (!Array.isArray(workflow.connections[key])) {
          cleaned.connections[key] = [];
        } else {
          cleaned.connections[key] = workflow.connections[key].map(conn => ({
            node: String(conn.node),
            type: String(conn.type),
            index: Number(conn.index || 0)
          }));
        }
      });
    }

    console.log('Cleaned workflow for PUT (n8n API compatible):', cleaned);
    return cleaned;
  }

  // Clean incoming workflow JSON
  cleanIncomingWorkflowJson(workflowJson) {
    // Basic cleaning - ensure required fields exist
    const cleaned = { ...workflowJson };
    
    if (!cleaned.nodes) cleaned.nodes = [];
    if (!cleaned.connections) cleaned.connections = {};
    
    // Ensure nodes have required fields
    cleaned.nodes = cleaned.nodes.map(node => ({
      id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: node.name || 'Node',
      type: node.type || 'n8n-nodes-base.start',
      typeVersion: node.typeVersion || 1,
      position: Array.isArray(node.position) ? node.position : [0, 0],
      parameters: node.parameters || {},
      ...node
    }));
    
    return cleaned;
  }

  // Copy workflow JSON to clipboard
  copyWorkflowJson(workflowJson) {
    const jsonString = JSON.stringify(workflowJson, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      this.showToast('JSON copied to clipboard!', 'success');
    }).catch(() => {
      this.showToast('Failed to copy to clipboard', 'error');
    });
  }

  // Save as template
  saveAsTemplate(workflowJson) {
    const templateName = prompt('Enter template name:');
    if (templateName) {
      this.addMessage('assistant', `Template "${templateName}" saved! (Feature coming soon)`);
    }
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `${type}-message`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }

  // Add welcome message
  addWelcomeMessage() {
    // API keys are now managed on the backend
    if (!currentWorkflowId || currentWorkflowId === 'unknown_workflow') {
      this.addMessage('assistant', 
        'Welcome! I can help you build n8n workflows. Navigate to an n8n workflow page to get started.', 
        false
      );
    } else {
      const workflowName = allWorkflowChats[currentWorkflowId]?.workflowName || currentWorkflowId;
      this.addMessage('assistant', 
        `Hello! I'm here to help you build your n8n workflow "${workflowName}". What would you like to add or modify?`, 
        false
      );
    }
  }

  // Render workflows list
  renderWorkflowsList() {
    const workflowsList = document.getElementById('workflows-list');
    if (!workflowsList) return;
    
    workflowsList.innerHTML = '';
    
    const workflowIds = Object.keys(allWorkflowChats);
    
    if (workflowIds.length === 0) {
      workflowsList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-tertiary);">
          <p>No workflow chats yet</p>
          <p style="font-size: 12px; margin-top: 8px;">Navigate to an n8n workflow to start chatting</p>
        </div>
      `;
      return;
    }
    
    // Sort workflows by last activity (most recent first)
    const sortedWorkflows = workflowIds
      .map(id => ({ id, ...allWorkflowChats[id] }))
      .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    
    sortedWorkflows.forEach(workflow => {
      const workflowItem = document.createElement('div');
      workflowItem.className = `workflow-item ${workflow.id === currentWorkflowId ? 'active' : ''}`;
      
      const workflowName = workflow.workflowName || 
        (workflow.id === 'new_workflow' ? 'New Workflow' : `Workflow ${workflow.id}`);
      
      const messageCount = workflow.messages ? workflow.messages.length : 0;
      const lastActivity = workflow.lastActivity ? new Date(workflow.lastActivity).toLocaleDateString() : 'Unknown';
      
      workflowItem.innerHTML = `
        <div class="workflow-item-info">
          <div class="workflow-item-name">${workflowName}</div>
          <div class="workflow-item-id">${workflow.id} • ${messageCount} messages • ${lastActivity}</div>
        </div>
        <div class="workflow-item-actions">
          <button class="workflow-item-btn load" data-workflow-id="${workflow.id}">Load</button>
          <button class="workflow-item-btn delete" data-workflow-id="${workflow.id}">Delete</button>
        </div>
      `;
      
      // Add event listeners
      const loadBtn = workflowItem.querySelector('.workflow-item-btn.load');
      const deleteBtn = workflowItem.querySelector('.workflow-item-btn.delete');
      
      loadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadWorkflowChat(workflow.id);
        this.switchTab('chat');
        this.showToast(`Loaded chat for: ${workflowName}`, 'success');
      });
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete chat for workflow "${workflowName}"? This action cannot be undone.`)) {
          delete allWorkflowChats[workflow.id];
          this.saveChatStorage();
          this.renderWorkflowsList();
          this.showToast(`Deleted chat for: ${workflowName}`, 'success');
          
          // If this was the current workflow, clear it
          if (workflow.id === currentWorkflowId) {
            currentWorkflowId = null;
            chatMemory = [];
            this.refreshChatUI();
            if (window.updateWorkflowInfo) {
              window.updateWorkflowInfo();
            }
          }
        }
      });
      
      workflowsList.appendChild(workflowItem);
    });
  }

  // Switch between tabs
  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Load content if needed
    if (tabName === 'history') {
      this.loadHistoryList();
    } else if (tabName === 'workflows') {
      this.renderWorkflowsList();
    } else if (tabName === 'templates') {
      if (window.renderTemplates) {
        window.renderTemplates();
      }
    }
    
    // Update workflow info when switching to chat tab
    if (tabName === 'chat') {
      if (window.updateWorkflowInfo) {
        window.updateWorkflowInfo();
      }
    }
  }

  // Load history list
  loadHistoryList() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    const workflows = Object.values(allWorkflowChats)
      .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
      .slice(0, window.settings?.maxHistory || 25);
    
    if (workflows.length === 0) {
      historyList.innerHTML = '<div class="loading-indicator">No chat history</div>';
      return;
    }
    
    workflows.forEach(workflow => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.setAttribute('data-workflow-id', workflow.workflowId);
      
      const lastMessage = workflow.messages[workflow.messages.length - 1];
      const preview = lastMessage ? lastMessage.content.substring(0, 100) + '...' : 'No messages';
      
      item.innerHTML = `
        <div class="history-item-title">${workflow.workflowName}</div>
        <div class="history-item-preview">${preview}</div>
        <div class="history-item-meta">
          <span>${workflow.messages.length} messages</span>
          <span>${new Date(workflow.lastActivity).toLocaleDateString()}</span>
        </div>
      `;
      
      // Add click event listener
      item.addEventListener('click', () => {
        this.loadHistoryItem(workflow.workflowId);
      });
      
      historyList.appendChild(item);
    });
  }

  loadHistoryItem(workflowId) {
    if (allWorkflowChats[workflowId]) {
      this.loadWorkflowChat(workflowId);
      this.switchTab('chat');
      if (window.updateWorkflowInfo) {
        window.updateWorkflowInfo();
      }
    }
  }

  // Search history
  searchHistory(query) {
    // TODO: Implement history search
    console.log('Searching history for:', query);
  }

  // Clear history
  clearHistory() {
    if (confirm('Clear all chat history? This cannot be undone.')) {
      allWorkflowChats = {};
      chatMemory = [];
      this.saveChatStorage();
      this.refreshChatUI();
      this.loadHistoryList();
      this.showToast('Chat history cleared', 'success');
    }
  }

  // Get current workflow ID
  getCurrentWorkflowId() {
    return currentWorkflowId;
  }

  // Set current workflow ID
  setCurrentWorkflowId(workflowId) {
    currentWorkflowId = workflowId;
  }

  // Get chat memory
  getChatMemory() {
    return chatMemory;
  }

  // Get all workflow chats
  getAllWorkflowChats() {
    return allWorkflowChats;
  }

  // Loading state management
  startLoading() {
    const sendBtn = document.getElementById('send-btn');
    const loadingBtn = document.getElementById('loading-btn');
    
    if (sendBtn && loadingBtn) {
      sendBtn.style.display = 'none';
      loadingBtn.style.display = 'flex';
    }
  }

  stopLoading() {
    const sendBtn = document.getElementById('send-btn');
    const loadingBtn = document.getElementById('loading-btn');
    
    if (sendBtn && loadingBtn) {
      sendBtn.style.display = 'flex';
      loadingBtn.style.display = 'none';
    }
  }

  stopGeneration() {
    // Set flag to stop generation
    window.isGenerationStopped = true;
    
    // Stop any ongoing generation
    if (window.currentGenerationAbortController) {
      window.currentGenerationAbortController.abort();
      window.currentGenerationAbortController = null;
    }
    
    // Stop loading state
    this.stopLoading();
  }
}

// Export for use in other modules
window.ChatManager = ChatManager;
window.currentWorkflowId = currentWorkflowId;
window.allWorkflowChats = allWorkflowChats;
window.chatMemory = chatMemory;
