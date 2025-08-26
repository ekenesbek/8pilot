// sidepanel/sidepanel.js - Full integration with chatbot logic + Theme Support

// Theme management
class ThemeManager {
  constructor() {
    this.currentTheme = 'auto'; // 'light', 'dark', 'auto'
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.init();
  }

  init() {
    // Load saved theme preference
    this.loadThemePreference();
    
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.applySystemTheme();
      }
    });
    
    // Apply initial theme
    this.applyTheme();
    
    // Add theme toggle if needed (future feature)
    this.setupThemeToggle();
  }

  loadThemePreference() {
    const saved = localStorage.getItem('8pilot_theme');
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.currentTheme = saved;
    }
  }

  saveThemePreference() {
    localStorage.setItem('8pilot_theme', this.currentTheme);
  }

  applyTheme() {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    
    if (this.currentTheme === 'light') {
      body.classList.add('theme-light');
    } else if (this.currentTheme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      // Auto mode - let CSS media query handle it
      this.applySystemTheme();
    }
  }

  applySystemTheme() {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    
    // CSS media query will handle the theme in auto mode
    console.log('Using system theme:', this.mediaQuery.matches ? 'dark' : 'light');
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.saveThemePreference();
    this.applyTheme();
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: this.getEffectiveTheme() } 
    }));
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  setupThemeToggle() {
    // Create theme toggle button (hidden by default)
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.style.display = 'none'; // Hidden for now
    toggle.innerHTML = '🌓';
    toggle.title = 'Toggle theme';
    toggle.onclick = () => this.cycleTheme();
    document.body.appendChild(toggle);
  }

  cycleTheme() {
    const themes = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    this.setTheme(nextTheme);
  }
}

// Chat storage - workflow-specific
let currentWorkflowId = null;
let allWorkflowChats = {};
let chatMemory = [];
let settings = {
  openaiKey: '',
  anthropicKey: '',
  activeProvider: 'openai',
  n8nApiUrl: '',
  n8nApiKey: '',
  autoApplyWorkflows: false,
  saveChatHistory: true,
  maxHistory: 25
};

// Theme manager instance
let themeManager;

// Storage keys
const STORAGE_KEYS = {
  WORKFLOW_CHATS: '8pilot_workflow_chats',
  LAST_ACTIVE_WORKFLOW: '8pilot_last_workflow'
};

// Initialize the side panel
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Side panel initializing...');
  
  // Initialize theme manager first
  themeManager = new ThemeManager();
  
  // Load settings and chat storage
  await loadSettings();
  loadChatStorage();
  
  // Setup event listeners
  setupEventListeners();
  
  // Get current tab and workflow info
  await getCurrentTabInfo();
  
  // Initialize UI
  initializeUI();
  
  console.log('Side panel initialized successfully');
});

// Listen for theme changes
window.addEventListener('themeChanged', (event) => {
  console.log('Theme changed to:', event.detail.theme);
  
  // Update any theme-dependent elements
  updateThemeElements();
});

// Update elements that depend on theme
function updateThemeElements() {
  // Update syntax highlighting if needed
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    // Re-apply syntax highlighting with new theme
    block.classList.add('theme-updated');
  });
  
  // Update any canvas or chart elements if present
  updateChartThemes();
}

// Update chart themes (placeholder for future charts)
function updateChartThemes() {
  // This would update any chart.js or other visualization themes
  console.log('Updating chart themes for', themeManager.getEffectiveTheme());
}

// Get current workflow ID from URL
function getCurrentWorkflowId(url) {
  if (!url) return null;
  
  if (url.includes('/workflow/new')) {
    return 'new_workflow';
  }
  
  const workflowIdMatch = url.match(/workflow\/([^/?]+)/);
  return workflowIdMatch ? workflowIdMatch[1] : 'unknown_workflow';
}

// Check if it's an n8n page
function isN8nPage(url) {
  return url && (
    url.includes('n8n') || 
    url.includes('workflow') || 
    url.includes('execution') ||
    url.includes('localhost')
  );
}

// Get current tab information
async function getCurrentTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const url = tab.url;
      const isN8n = isN8nPage(url);
      
      // Update status
      updateStatus('page', isN8n ? 'active' : 'warning', 
        isN8n ? 'n8n page detected' : 'Not an n8n page');
      
      // Get workflow ID
      currentWorkflowId = getCurrentWorkflowId(url);
      updateWorkflowInfo();
      
      // Load chat for this workflow
      loadWorkflowChat(currentWorkflowId);
    }
  } catch (error) {
    console.error('Failed to get current tab:', error);
    updateStatus('page', 'error', 'Connection failed');
  }
}

// Load settings from chrome storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get([
      'openaiKey', 'anthropicKey', 'activeProvider',
      'n8nApiUrl', 'n8nApiKey', 'autoApplyWorkflows', 
      'saveChatHistory', 'maxHistory', 'backendUrl'
    ]);
    
    settings = { ...settings, ...stored };
    
    // Set default backend URL if not configured
    if (!settings.backendUrl) {
      settings.backendUrl = 'http://localhost:8000';
    }
    
    // Validate and update API status
    updateApiStatus();
      
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Update API status based on current settings
function updateApiStatus() {
  const hasApiKey = settings.activeProvider === 'openai' 
    ? settings.openaiKey 
    : settings.anthropicKey;
  
  if (hasApiKey) {
    // Basic validation of API key format
    const isValidFormat = hasApiKey.length > 20 && hasApiKey.startsWith('sk-');
    if (isValidFormat) {
      updateStatus('api', 'active', `${settings.activeProvider} configured`);
    } else {
      updateStatus('api', 'warning', `${settings.activeProvider} key format invalid`);
    }
  } else {
    updateStatus('api', 'error', `${settings.activeProvider} API key required`);
  }
}

// Load chat storage from localStorage
function loadChatStorage() {
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
function saveChatStorage() {
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
function loadWorkflowChat(workflowId) {
  if (!workflowId) return;
  
  currentWorkflowId = workflowId;
  
  if (allWorkflowChats[workflowId]) {
    chatMemory = allWorkflowChats[workflowId].messages || [];
    console.log(`Loaded ${chatMemory.length} messages for workflow:`, workflowId);
  } else {
    chatMemory = [];
    allWorkflowChats[workflowId] = {
      messages: [],
      workflowName: workflowId === 'new_workflow' ? 'New Workflow' : 'Unknown Workflow',
      lastActivity: Date.now(),
      createdAt: Date.now()
    };
    console.log('Created new chat for workflow:', workflowId);
  }
  
  refreshChatUI();
}

// Save current chat to storage
function saveCurrentChat() {
  if (!currentWorkflowId) return;
  
  allWorkflowChats[currentWorkflowId] = {
    ...allWorkflowChats[currentWorkflowId],
    messages: chatMemory,
    lastActivity: Date.now()
  };
  
  saveChatStorage();
}

// Setup all event listeners
function setupEventListeners() {
  // Header controls
  document.getElementById('refresh-btn').addEventListener('click', refreshSidePanel);
  document.getElementById('settings-btn').addEventListener('click', showSettings);

  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.closest('.nav-tab').dataset.tab;
      switchTab(tabName);
    });
  });

  // Chat functionality
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Settings functionality
  document.getElementById('close-settings-btn').addEventListener('click', hideSettings);
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('test-connection-btn').addEventListener('click', testN8nConnection);

  // Provider toggle
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchProvider(e.target.dataset.provider));
  });

  // Theme selection
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      if (themeManager) {
        themeManager.setTheme(e.target.value);
      }
    });
  }

  // Auto-resize textarea
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // History search
  document.getElementById('history-search').addEventListener('input', (e) => searchHistory(e.target.value));
  document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

  // Templates
  document.getElementById('create-template-btn').addEventListener('click', createTemplate);
  document.querySelectorAll('.category').forEach(cat => {
    cat.addEventListener('click', (e) => filterTemplates(e.target.dataset.category));
  });
}

// Initialize UI
function initializeUI() {
  updateSettingsUI();
  addWelcomeMessage();
  initializeTemplates();
  switchTab('chat'); // Start with chat tab
}

// Update status indicators
function updateStatus(type, status, text) {
  const indicator = document.getElementById(`${type}-status`);
  const textEl = document.getElementById(`${type}-status-text`);
  
  if (indicator && textEl) {
    indicator.className = `status-indicator ${status}`;
    textEl.textContent = text;
  }
  
  // Update API status specifically
  if (type === 'api') {
    const hasApiKey = settings.activeProvider === 'openai' 
      ? settings.openaiKey 
      : settings.anthropicKey;
    
    if (hasApiKey) {
      // Check if API key looks valid (basic validation)
      const isValidFormat = hasApiKey.length > 20 && hasApiKey.startsWith('sk-');
      if (isValidFormat) {
        updateStatus('api', 'active', `${settings.activeProvider} configured`);
      } else {
        updateStatus('api', 'warning', `${settings.activeProvider} key format invalid`);
      }
    } else {
      updateStatus('api', 'error', `${settings.activeProvider} API key required`);
    }
  }
}

// Update workflow information display
function updateWorkflowInfo() {
  const nameEl = document.getElementById('workflow-name');
  const idEl = document.getElementById('workflow-id');
  
  if (currentWorkflowId) {
    const workflowName = allWorkflowChats[currentWorkflowId]?.workflowName || 
      (currentWorkflowId === 'new_workflow' ? 'New Workflow' : `Workflow ${currentWorkflowId}`);
    
    nameEl.textContent = workflowName;
    idEl.textContent = currentWorkflowId;
  } else {
    nameEl.textContent = 'No workflow detected';
    idEl.textContent = '-';
  }
}

// Load workflow stats from n8n API (simplified - just update name if available)
async function loadWorkflowStats() {
  if (!settings.n8nApiUrl || !settings.n8nApiKey || !currentWorkflowId || 
      currentWorkflowId === 'unknown_workflow' || currentWorkflowId === 'new_workflow') {
    return;
  }
  
  try {
    const response = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${currentWorkflowId}`, {
      headers: { 'X-N8N-API-KEY': settings.n8nApiKey }
    });
    
    if (response.ok) {
      const workflow = await response.json();
      
      // Update workflow name if we got it from API
      if (workflow.name && allWorkflowChats[currentWorkflowId]) {
        allWorkflowChats[currentWorkflowId].workflowName = workflow.name;
        document.getElementById('workflow-name').textContent = workflow.name;
        saveChatStorage();
      }
    }
  } catch (error) {
    console.error('Failed to load workflow stats:', error);
  }
}

// Switch between tabs
function switchTab(tabName) {
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
    loadHistoryList();
  } else if (tabName === 'templates') {
    renderTemplates();
  }
}

// Add welcome message
function addWelcomeMessage() {
  const hasApiKey = settings.activeProvider === 'openai' 
    ? settings.openaiKey 
    : settings.anthropicKey;
    
  if (!hasApiKey) {
    addMessage('assistant', 
      `Welcome to 8pilot! Please configure your ${settings.activeProvider} API key in settings to get started.`, 
      false
    );
  } else if (!currentWorkflowId || currentWorkflowId === 'unknown_workflow') {
    addMessage('assistant', 
      'Welcome! I can help you build n8n workflows. Navigate to an n8n workflow page to get started.', 
      false
    );
  } else {
    const workflowName = allWorkflowChats[currentWorkflowId]?.workflowName || currentWorkflowId;
    addMessage('assistant', 
      `Hello! I'm here to help you build your n8n workflow "${workflowName}". What would you like to add or modify?`, 
      false
    );
  }
}

// Refresh chat UI with current workflow's messages
function refreshChatUI() {
  const messagesArea = document.getElementById('chat-messages');
  if (!messagesArea) return;
  
  // Clear current messages
  messagesArea.innerHTML = '';
  
  // Restore messages from memory
  chatMemory.forEach(message => {
    addMessageToUI(message.role === 'user' ? 'user' : 'assistant', message.content, false);
  });
  
  // Add welcome message if no history
  if (chatMemory.length === 0) {
    addWelcomeMessage();
  }
  
  // Scroll to bottom
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Send message with streaming
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Check API key for current provider
  const apiKey = settings.activeProvider === 'openai' 
    ? settings.openaiKey 
    : settings.anthropicKey;
    
  if (!apiKey) {
    addMessage('assistant', `Please configure your ${settings.activeProvider} API key in settings first.`);
    return;
  }
  
  // Clear input
  input.value = '';
  input.style.height = '60px';
  
  // Add user message
  addMessage('user', message);
  
  // Remove typing indicator (replaced by streaming)
  hideTypingIndicator();
  
  try {
    // Call AI API with streaming
    const response = await callAI(message);
    
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
        saveCurrentChat();
      }
      
      // Check for workflow JSON in the complete response
      processWorkflowResponse(response);
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
      errorMessage = `Invalid ${settings.activeProvider} API key. Please check your settings.`;
    } else if (error.message.includes('Backend API error')) {
      errorMessage = 'Backend service unavailable. Please check if the backend is running.';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else {
      errorMessage = `Error: ${error.message}`;
    }
    
    addMessage('assistant', errorMessage);
  }
}

// Call AI API with streaming
async function callAI(message) {
  const provider = settings.activeProvider;
  
  // Get API keys based on provider
  const openaiApiKey = provider === 'openai' ? settings.openaiKey : null;
  const anthropicApiKey = provider === 'anthropic' ? settings.anthropicKey : null;
  
  // Use our backend API with streaming
  try {
    const backendUrl = settings.backendUrl || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        workflow_id: currentWorkflowId || 'default',
        provider: provider,
        // Pass API keys with each request
        openai_api_key: openaiApiKey,
        anthropic_api_key: anthropicApiKey,
        // Pass n8n API credentials if available
        n8n_api_url: settings.n8nApiUrl,
        n8n_api_key: settings.n8nApiKey
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
      const streamingMessageDiv = createStreamingMessage();
      
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
                  updateStreamingMessage(streamingMessageDiv, fullResponse);
                }
              } catch (e) {
                // Skip invalid JSON chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        finalizeStreamingMessage(streamingMessageDiv);
      }
      
      return fullResponse;
    } else {
      // Fallback to non-streaming if streaming not supported
      const data = await response.json();
      return data.response || data.message || 'No response from backend';
    }
    
  } catch (error) {
    console.error('Backend API error:', error);
    
    // Fallback to direct API calls if backend is not available
    console.log('Falling back to direct API calls...');
    
    if (provider === 'openai') {
      return await callOpenAIDirect(message, settings.openaiKey);
    } else {
      return await callAnthropicDirect(message, settings.anthropicKey);
    }
  }
}

// Call OpenAI API with streaming (fallback)
async function callOpenAIDirect(message, apiKey) {
  const messages = [
    {
      role: 'system',
      content: `You are an n8n expert. Help users create working n8n workflows.

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

Simple structure example:
{
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [100, 100],
      "id": "node1"
    }
  ],
  "connections": {},
  "pinData": {}
}

Create only working, tested configurations.`
    },
    ...chatMemory.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',              
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  
  // Create message element for streaming
  const streamingMessageDiv = createStreamingMessage();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              updateStreamingMessage(streamingMessageDiv, fullResponse);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    finalizeStreamingMessage(streamingMessageDiv);
  }
  
  return fullResponse || 'No response received';
}

// Call Anthropic API with streaming (fallback)
async function callAnthropicDirect(message, apiKey) {
  const messages = [
    ...chatMemory.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      system: `You are 8pilot, an AI assistant specializing in n8n workflow automation. Help users build effective n8n workflows by providing guidance and generating workflow components.`,
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API request failed');
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  
  // Create message element for streaming
  const streamingMessageDiv = createStreamingMessage();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta?.text;
              if (delta) {
                fullResponse += delta;
                updateStreamingMessage(streamingMessageDiv, fullResponse);
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    finalizeStreamingMessage(streamingMessageDiv);
  }
  
  return fullResponse || 'No response received';
}

// Create streaming message element with simple animated dot
function createStreamingMessage() {
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
function updateStreamingMessage(messageDiv, content) {
  const contentDiv = messageDiv.querySelector('.message-content');
  
  // Remove animated dot and add content
  const dot = contentDiv.querySelector('.streaming-dot');
  if (dot) {
    dot.remove();
  }
  
  // Add formatted content
  contentDiv.innerHTML = formatMessage(content);
  
  // Auto-scroll to bottom
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Finalize streaming message with smooth transition
function finalizeStreamingMessage(messageDiv) {
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
function addMessage(role, content, saveToHistory = true) {
  addMessageToUI(role, content, saveToHistory);
  
  if (saveToHistory && settings.saveChatHistory) {
    // Add to current chat
    chatMemory.push({
      role: role,
      content: content,
      timestamp: Date.now()
    });
    
    // Update workflow chat
    if (currentWorkflowId && allWorkflowChats[currentWorkflowId]) {
      allWorkflowChats[currentWorkflowId].messages = chatMemory;
      allWorkflowChats[currentWorkflowId].lastActivity = Date.now();
      
      // Save to storage
      saveCurrentChat();
    }
  }
}

// Add message to UI
function addMessageToUI(role, content, saveToHistory = true) {
  const messagesContainer = document.getElementById('chat-messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${role}`;
  avatar.textContent = role === 'user' ? 'U' : 'AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Process content for code blocks, etc.
  contentDiv.innerHTML = formatMessage(content);
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Add fade-in animation
  messageDiv.classList.add('fade-in');
}

// Format message content
function formatMessage(content) {
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
function showTypingIndicator() {
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
function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// Process workflow response for JSON
function processWorkflowResponse(response) {
  // Extract JSON from response
  const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const workflowJson = JSON.parse(jsonMatch[1]);
      showWorkflowActions(workflowJson);
    } catch (error) {
      console.error('Failed to parse workflow JSON:', error);
    }
  }
}

// Show workflow action buttons
function showWorkflowActions(workflowJson) {
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
          applyWorkflow(workflowData);
          break;
        case 'copy-workflow':
          copyWorkflowJson(workflowData);
          break;
        case 'save-template':
          saveAsTemplate(workflowData);
          break;
      }
    });
  });
  
  messagesContainer.appendChild(actionsDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Apply workflow to n8n canvas
async function applyWorkflow(workflowJson) {
  if (!settings.n8nApiUrl || !settings.n8nApiKey) {
    addMessage('assistant', 'Please configure your n8n API settings first.');
    return;
  }

  if (!currentWorkflowId || currentWorkflowId === 'unknown_workflow') {
    addMessage('assistant', 'Please navigate to an n8n workflow page first.');
    return;
  }

  try {
    // Apply workflow via n8n API
    await applyToN8nCanvas(workflowJson);
    addMessage('assistant', 'Workflow components applied successfully! The page will refresh shortly.');
    
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
    addMessage('assistant', `Error applying workflow: ${error.message}`);
  }
}

// Apply workflow to n8n canvas via API
async function applyToN8nCanvas(workflowJson) {
  try {
    // Check if n8n API is configured
    if (!settings.n8nApiUrl || !settings.n8nApiKey) {
      throw new Error('n8n API not configured. Please set n8n API URL and API key in settings.');
    }

    console.log('n8n API URL:', settings.n8nApiUrl);
    console.log('n8n API Key configured:', !!settings.n8nApiKey);

    // Clean incoming workflow JSON first
    const cleanIncomingJson = cleanIncomingWorkflowJson(workflowJson);
    console.log('Original workflow JSON:', workflowJson);
    console.log('Cleaned incoming workflow JSON:', cleanIncomingJson);

    const workflowId = currentWorkflowId === 'new_workflow' 
      ? await createNewWorkflow() 
      : currentWorkflowId;

    console.log('Applying workflow to ID:', workflowId);

    // Get current workflow
    const getResponse = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': settings.n8nApiKey
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
    const updatedWorkflow = mergeWorkflow(currentWorkflow, cleanIncomingJson);
    console.log('Updated workflow:', updatedWorkflow);
    
    // Clean workflow for PUT request
    const cleanWorkflow = cleanWorkflowForPut(updatedWorkflow);
    console.log('Clean workflow for PUT:', cleanWorkflow);
    
    // Update workflow
    const updateResponse = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': settings.n8nApiKey
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
async function createNewWorkflow() {
  const response = await fetch(`${settings.n8nApiUrl}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': settings.n8nApiKey
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
function mergeWorkflow(currentWorkflow, newComponents) {
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
function cleanWorkflowForPut(workflow) {
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

// Copy workflow JSON to clipboard
function copyWorkflowJson(workflowJson) {
  const jsonString = JSON.stringify(workflowJson, null, 2);
  navigator.clipboard.writeText(jsonString).then(() => {
    showToast('JSON copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

// Save as template
function saveAsTemplate(workflowJson) {
  const templateName = prompt('Enter template name:');
  if (templateName) {
    addMessage('assistant', `Template "${templateName}" saved! (Feature coming soon)`);
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `${type}-message`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// History functions
function loadHistoryList() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  const workflows = Object.values(allWorkflowChats)
    .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
    .slice(0, settings.maxHistory);
  
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
      loadHistoryItem(workflow.workflowId);
    });
    
    historyList.appendChild(item);
  });
}

function loadHistoryItem(workflowId) {
  if (allWorkflowChats[workflowId]) {
    loadWorkflowChat(workflowId);
    switchTab('chat');
    updateWorkflowInfo();
  }
}

function searchHistory(query) {
  // TODO: Implement history search
  console.log('Searching history for:', query);
}

function clearHistory() {
  if (confirm('Clear all chat history? This cannot be undone.')) {
    allWorkflowChats = {};
    chatMemory = [];
    saveChatStorage();
    refreshChatUI();
    loadHistoryList();
    showToast('Chat history cleared', 'success');
  }
}

// Template functions
function initializeTemplates() {
  // Pre-populate with some basic templates
  window.templates = [
    {
      id: 'email-to-slack',
      name: 'Email to Slack',
      description: 'Forward emails to Slack channel',
      category: 'automation',
      nodes: 3,
      workflow: {
        nodes: [
          { name: 'Email Trigger', type: 'n8n-nodes-base.emailReadImap' },
          { name: 'Slack', type: 'n8n-nodes-base.slack' }
        ]
      }
    },
    {
      id: 'data-sync',
      name: 'Database Sync',
      description: 'Sync data between databases',
      category: 'data',
      nodes: 4,
      workflow: {
        nodes: [
          { name: 'Schedule', type: 'n8n-nodes-base.cron' },
          { name: 'Source DB', type: 'n8n-nodes-base.postgres' },
          { name: 'Transform', type: 'n8n-nodes-base.set' },
          { name: 'Target DB', type: 'n8n-nodes-base.postgres' }
        ]
      }
    }
  ];
}

function filterTemplates(category) {
  // Update active category
  document.querySelectorAll('.category').forEach(cat => {
    cat.classList.toggle('active', cat.dataset.category === category);
  });
  
  renderTemplates(category);
}

function renderTemplates(category = 'all') {
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = '';
  
  const filtered = category === 'all' 
    ? window.templates 
    : window.templates.filter(t => t.category === category);
  
  filtered.forEach(template => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.setAttribute('data-template-id', template.id);
    
    card.innerHTML = `
      <div class="template-card-header">
        <div>
          <div class="template-title">${template.name}</div>
          <div class="template-category">${template.category}</div>
        </div>
      </div>
      <div class="template-description">${template.description}</div>
      <div class="template-meta">
        <div class="template-nodes">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
          </svg>
          ${template.nodes} nodes
        </div>
      </div>
    `;
    
    // Add click event listener
    card.addEventListener('click', () => {
      useTemplate(template);
    });
    
    grid.appendChild(card);
  });
}

function useTemplate(template) {
  const message = `I'd like to use the "${template.name}" template: ${template.description}`;
  document.getElementById('chat-input').value = message;
  switchTab('chat');
}

function createTemplate() {
  addMessage('assistant', 'Template creation from current workflow coming soon!');
}

// Settings functions
function showSettings() {
  document.getElementById('settings-panel').classList.remove('hidden');
}

function hideSettings() {
  document.getElementById('settings-panel').classList.add('hidden');
}

function switchProvider(provider) {
  settings.activeProvider = provider;
  updateSettingsUI();
  
  // Update API status after switching provider
  updateApiStatus();
}

function updateSettingsUI() {
  // Provider toggle
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === settings.activeProvider);
  });
  
  // Show/hide provider configs
  document.getElementById('openai-config').classList.toggle('hidden', settings.activeProvider !== 'openai');
  document.getElementById('anthropic-config').classList.toggle('hidden', settings.activeProvider !== 'anthropic');
  
  // Fill in values
  document.getElementById('openai-key').value = settings.openaiKey || '';
  document.getElementById('anthropic-key').value = settings.anthropicKey || '';
  document.getElementById('n8n-url').value = settings.n8nApiUrl || '';
  document.getElementById('n8n-key').value = settings.n8nApiKey || '';
  document.getElementById('auto-apply-workflows').checked = settings.autoApplyWorkflows;
  document.getElementById('save-chat-history').checked = settings.saveChatHistory;
  document.getElementById('max-history').value = settings.maxHistory;
  
  // Theme setting
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect && themeManager) {
    themeSelect.value = themeManager.currentTheme;
  }
  
  // Update API status after updating UI
  updateApiStatus();
}

async function saveSettings() {
  // Get values from UI
  settings.openaiKey = document.getElementById('openai-key').value.trim();
  settings.anthropicKey = document.getElementById('anthropic-key').value.trim();
  settings.n8nApiUrl = document.getElementById('n8n-url').value.trim();
  settings.n8nApiKey = document.getElementById('n8n-key').value.trim();
  settings.autoApplyWorkflows = document.getElementById('auto-apply-workflows').checked;
  settings.saveChatHistory = document.getElementById('save-chat-history').checked;
  settings.maxHistory = parseInt(document.getElementById('max-history').value);
  
  try {
    await chrome.storage.sync.set(settings);
    
    // Update API status after saving
    updateApiStatus();
    
    showToast('Settings saved!', 'success');
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

async function testN8nConnection() {
  const url = document.getElementById('n8n-url').value.trim();
  const key = document.getElementById('n8n-key').value.trim();
  
  if (!url || !key) {
    showToast('Please enter both URL and API key', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${url}/api/v1/me`, {
      headers: { 'X-N8N-API-KEY': key }
    });
    
    if (response.ok) {
      showToast('n8n connection successful!', 'success');
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    showToast(`Connection failed: ${error.message}`, 'error');
  }
}

// Utility functions
async function refreshSidePanel() {
  await getCurrentTabInfo();
  await loadWorkflowStats();
  showToast('Refreshed!', 'success');
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Side panel received message:', request);
  
  if (request.action === 'tabUpdated') {
    getCurrentTabInfo();
  }
  
  if (request.action === 'prefillMessage') {
    document.getElementById('chat-input').value = request.message;
    switchTab('chat');
  }
  
  sendResponse({ status: 'received' });
});

// Clean incoming workflow JSON from AI - remove any extra fields
function cleanIncomingWorkflowJson(workflowJson) {
  // Extract only the essential workflow structure
  const cleaned = {
    nodes: [],
    connections: {}
  };

  // Clean nodes
  if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
    cleaned.nodes = workflowJson.nodes.map((node, index) => {
      const cleanNode = {
        id: String(node.id || `node_${Date.now()}_${index}`), // Ensure ID is string
        name: String(node.name || 'Node'),
        type: String(node.type || 'n8n-nodes-base.start'),
        typeVersion: Number(node.typeVersion || 1),
        position: Array.isArray(node.position) ? node.position : [0, 0],
        parameters: node.parameters || {}
      };
      return cleanNode;
    });
  }

  // Clean connections
  if (workflowJson.connections && typeof workflowJson.connections === 'object') {
    Object.keys(workflowJson.connections).forEach(sourceNodeId => {
      if (workflowJson.connections[sourceNodeId] && Array.isArray(workflowJson.connections[sourceNodeId])) {
        cleaned.connections[sourceNodeId] = workflowJson.connections[sourceNodeId].filter(conn => 
          conn && typeof conn === 'object' && conn.node && conn.type
        );
      }
    });
  }

  return cleaned;
}