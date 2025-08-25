// sidepanel.js - Integrated with chatbot functionality

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
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.applySystemTheme();
      }
    });
    
    // Apply initial theme
    this.applyTheme();
  }

  loadThemePreference() {
    const saved = localStorage.getItem('n8n_copilot_theme');
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.currentTheme = saved;
    }
  }

  saveThemePreference() {
    localStorage.setItem('n8n_copilot_theme', this.currentTheme);
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
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return this.currentTheme;
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
  WORKFLOW_CHATS: 'n8n_copilot_workflow_chats',
  LAST_ACTIVE_WORKFLOW: 'n8n_copilot_last_workflow'
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
      'saveChatHistory', 'maxHistory'
    ]);
    
    settings = { ...settings, ...stored };
    
    // Update API status
    const hasApiKey = settings.activeProvider === 'openai' 
      ? settings.openaiKey 
      : settings.anthropicKey;
    
    updateStatus('api', hasApiKey ? 'active' : 'error', 
      hasApiKey ? `${settings.activeProvider} configured` : 'API key required');
      
  } catch (error) {
    console.error('Failed to load settings:', error);
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
      const tabName = e.currentTarget.getAttribute('data-tab');
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
  document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);

  // Provider toggle
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchProvider(e.currentTarget.dataset.provider));
  });

  // History search
  document.getElementById('history-search').addEventListener('input', (e) => searchHistory(e.target.value));
  document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

  // Auto-resize textarea
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // Workflow menu button
  document.getElementById('workflow-menu-btn').addEventListener('click', showWorkflowMenu);
}

// Initialize UI
function initializeUI() {
  updateSettingsUI();
  addWelcomeMessage();
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
}

// Update workflow information display
function updateWorkflowInfo() {
  const nameEl = document.getElementById('workflow-name');
  const statsEl = document.getElementById('workflow-stats');
  const idEl = document.getElementById('workflow-id');
  
  if (currentWorkflowId) {
    const workflowName = allWorkflowChats[currentWorkflowId]?.workflowName || 
      (currentWorkflowId === 'new_workflow' ? 'New Workflow' : `Workflow ${currentWorkflowId}`);
    
    nameEl.textContent = workflowName;
    idEl.textContent = currentWorkflowId;
    
    // Try to get actual stats from n8n API
    loadWorkflowStats();
  } else {
    nameEl.textContent = 'No workflow detected';
    statsEl.innerHTML = '<span class="stat">0 nodes</span><span class="stat">0 connections</span>';
    idEl.textContent = '-';
  }
}

// Load workflow stats from n8n API
async function loadWorkflowStats() {
  const statsEl = document.getElementById('workflow-stats');
  
  if (!settings.n8nApiUrl || !settings.n8nApiKey || !currentWorkflowId || 
      currentWorkflowId === 'unknown_workflow' || currentWorkflowId === 'new_workflow') {
    statsEl.innerHTML = '<span class="stat">- nodes</span><span class="stat">- connections</span>';
    return;
  }
  
  try {
    const response = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${currentWorkflowId}`, {
      headers: { 'X-N8N-API-KEY': settings.n8nApiKey }
    });
    
    if (response.ok) {
      const workflow = await response.json();
      const nodeCount = workflow.nodes?.length || 0;
      const connectionCount = Object.keys(workflow.connections || {}).length;
      
      statsEl.innerHTML = 
        `<span class="stat">${nodeCount} nodes</span>` +
        `<span class="stat">${connectionCount} connections</span>`;
      
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

// Show workflow context menu
function showWorkflowMenu(event) {
  // Check if a menu already exists and remove it
  const existingMenu = document.querySelector('.context-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }
  
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  
  menu.innerHTML = `
    <div class="context-menu-item" id="copy-workflow-id">Copy Workflow ID</div>
    <div class="context-menu-item" id="clear-workflow-chat">Clear Chat History</div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" id="refresh-workflow">Refresh Workflow Info</div>
  `;
  
  // Position the menu
  const rect = event.currentTarget.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
  menu.style.right = `${window.innerWidth - rect.right - window.scrollX}px`;
  
  document.body.appendChild(menu);
  
  // Add event listeners
  document.getElementById('copy-workflow-id').addEventListener('click', () => {
    if (currentWorkflowId) {
      navigator.clipboard.writeText(currentWorkflowId);
      showToast('Workflow ID copied to clipboard');
    }
    menu.remove();
  });
  
  document.getElementById('clear-workflow-chat').addEventListener('click', () => {
    clearCurrentWorkflowChat();
    menu.remove();
  });
  
  document.getElementById('refresh-workflow').addEventListener('click', () => {
    refreshWorkflowInfo();
    menu.remove();
  });
  
  // Close menu when clicking elsewhere
  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target) && e.target !== event.currentTarget) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  });
}

// Refresh workflow information
async function refreshWorkflowInfo() {
  await loadWorkflowStats();
  showToast('Workflow info refreshed');
}

// Clear current workflow's chat history
function clearCurrentWorkflowChat() {
  if (!currentWorkflowId) return;
  
  if (confirm(`Clear chat history for "${allWorkflowChats[currentWorkflowId]?.workflowName || currentWorkflowId}"?`)) {
    chatMemory = [];
    allWorkflowChats[currentWorkflowId].messages = [];
    saveCurrentChat();
    refreshChatUI();
    showToast('Chat history cleared');
  }
}

// Switch between tabs
function switchTab(tabName) {
  // Update active tab
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });
  
  // Show/hide content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
  
  // Load content if needed
  if (tabName === 'history') {
    loadHistoryList();
  } else if (tabName === 'templates') {
    loadTemplates();
  }
}

// Add welcome message
function addWelcomeMessage() {
  const hasApiKey = settings.activeProvider === 'openai' 
    ? settings.openaiKey 
    : settings.anthropicKey;
    
  if (!hasApiKey) {
    addMessage('assistant', 
      'Welcome to n8n Co Pilot! Please configure your AI provider in settings to get started.', 
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

// Send message
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Check API key
  const apiKey = settings.activeProvider === 'openai' 
    ? settings.openaiKey 
    : settings.anthropicKey;
    
  if (!apiKey) {
    addMessage('assistant', 'Please configure your AI provider API key in settings first.');
    return;
  }
  
  // Clear input
  input.value = '';
  input.style.height = '60px';
  
  // Add user message
  addMessage('user', message);
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    // Call AI API based on provider
    let response;
    if (settings.activeProvider === 'openai') {
      response = await callOpenAI(message);
    } else {
      response = await callAnthropic(message);
    }
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add AI response
    addMessage('assistant', response);
    
    // Process response for workflow JSON
    processWorkflowResponse(response);
    
  } catch (error) {
    console.error('AI API error:', error);
    hideTypingIndicator();
    addMessage('assistant', `Error: ${error.message || 'Failed to get AI response'}`);
  }
}

// Call OpenAI API
async function callOpenAI(message) {
  // Include system message to guide the AI with enhanced n8n-specific instructions
  const messages = [
    {
      role: 'system',
      content: `You are n8n Co Pilot, an AI assistant specializing in n8n workflow automation.
Your goal is to help users build effective n8n workflows by providing guidance and generating workflow components.

When a user asks for a specific workflow or node, respond with both:
1. A natural language explanation of the solution
2. A JSON code block that can be directly added to their n8n workflow

For JSON workflow snippets, use the following format:
\`\`\`json
{
  "nodes": [
    {
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "parameters": { ... },
      "position": [x, y]
    }
  ],
  "connections": { ... }
}
\`\`\`

Ensure the JSON is valid and follows n8n's schema. Only include nodes and connections that are explicitly requested.`
    },
    ...chatMemory.map(msg => ({ role: msg.role, content: msg.content }))
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  const data = await response.json();
  
  if (data.error) {
    console.error('OpenAI API error:', data.error);
    throw new Error(data.error.message);
  }
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  } else {
    throw new Error('Unexpected API response format');
  }
}

// Call Anthropic API
async function callAnthropic(message) {
  const messages = chatMemory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  const systemPrompt = `You are n8n Co Pilot, an AI assistant specializing in n8n workflow automation. Help users build effective n8n workflows by providing guidance and generating workflow components.`;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [...messages, { role: 'user', content: message }]
    })
  });
  
  const data = await response.json();
  
  if (data.error) {
    console.error('Anthropic API error:', data.error);
    throw new Error(data.error.message);
  }
  
  if (data.content && data.content[0] && data.content[0].text) {
    return data.content[0].text;
  } else {
    throw new Error('Unexpected API response format');
  }
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
      <div class="streaming-dot"></div>
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

// Extract JSON from AI response
function extractJsonFromResponse(text) {
  const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
  const matches = [...text.matchAll(jsonRegex)];
  
  if (matches.length > 0) {
    try {
      const jsonString = matches[0][1];
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return null;
    }
  }
  
  return null;
}

// Process workflow response for JSON
function processWorkflowResponse(response) {
  // Extract JSON from response
  const extractedJson = extractJsonFromResponse(response);
  if (extractedJson) {
    showWorkflowActions(extractedJson);
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
// Apply workflow to n8n canvas via API
async function applyToN8nCanvas(workflowJson) {
  try {
    // Check if n8n API is configured
    if (!settings.n8nApiUrl || !settings.n8nApiKey) {
      throw new Error('n8n API not configured. Please set n8n API URL and API key in settings.');
    }

    // Clean incoming workflow JSON first
    const cleanIncomingJson = cleanIncomingWorkflowJson(workflowJson);

    let workflowId;
    
    if (currentWorkflowId === 'new_workflow') {
      // Create a new workflow and navigate to it
      workflowId = await createNewWorkflow();
      
      // We need to wait a bit for the navigation to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Since we're navigating to a new page, we'll apply the workflow 
      // via a content script message after navigation
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "applyWorkflowAfterNavigation",
            workflowJson: cleanIncomingJson
          });
        }
      });
      
      return; // Exit early since we're handling this via content script
    } else {
      workflowId = currentWorkflowId;
    }

    // Get current workflow
    const getResponse = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': settings.n8nApiKey
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch current workflow: ${getResponse.status}`);
    }

    const currentWorkflow = await getResponse.json();
    
    // Merge with new components
    const updatedWorkflow = mergeWorkflow(currentWorkflow, cleanIncomingJson);
    
    // Clean workflow for PUT request
    const cleanWorkflow = cleanWorkflowForPut(updatedWorkflow);
    
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
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }
    
    // Refresh the page to show the updated workflow
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
    
  } catch (error) {
    console.error('Error in applyToN8nCanvas:', error);
    throw error;
  }
}

// Create new workflow
// Create new workflow and navigate to it
async function createNewWorkflow() {
  try {
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
    
    // Navigate to the new workflow page
    if (newWorkflow.data && newWorkflow.data.id) {
      const workflowId = newWorkflow.data.id;
      
      // Get the base URL from the current n8n API URL
      const baseUrl = new URL(settings.n8nApiUrl).origin;
      const workflowUrl = `${baseUrl}/workflow/${workflowId}`;
      
      // Navigate the current tab to the new workflow
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.update(tabs[0].id, { url: workflowUrl });
          
          // Update our current workflow ID
          currentWorkflowId = workflowId;
          
          // Create a new entry in the workflow chats
          allWorkflowChats[workflowId] = {
            messages: [...chatMemory], // Copy the current chat
            workflowName: 'New Workflow',
            lastActivity: Date.now(),
            createdAt: Date.now()
          };
          
          saveChatStorage();
          
          // Show toast inside the side panel
          showToast('Created new workflow and redirecting...');
        }
      });
      
      return workflowId;
    } else {
      console.error('Invalid response when creating workflow:', newWorkflow);
      throw new Error('Invalid response when creating workflow');
    }
  } catch (error) {
    console.error('Error creating new workflow:', error);
    throw error;
  }
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
      // Generate a unique node ID if none exists
      const nodeId = node.id || `node_${Date.now()}_${index}`;
      
      const newNode = {
        id: String(nodeId), 
        name: String(node.name || `Node ${nodeCounter + index + 1}`),
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
              node: String(connection.node),
              type: String(connection.type),
              index: Number(connection.index || 0)
            });
          }
        });
      }
    });
  }
  
  return result;
}

// Clean workflow for PUT request
function cleanWorkflowForPut(workflow) {
  const cleaned = {
    name: String(workflow.name || 'Untitled Workflow'),
    nodes: [],
    connections: {},
    settings: workflow.settings || {},
    staticData: workflow.staticData || {}
  };

  // Clean nodes
  cleaned.nodes = (workflow.nodes || []).map(node => {
    const cleanNode = {
      id: String(node.id),
      name: String(node.name || 'Node'),
      type: String(node.type || 'n8n-nodes-base.start'),
      typeVersion: Number(node.typeVersion || 1),
      position: Array.isArray(node.position) ? node.position : [0, 0],
      parameters: node.parameters || {}
    };
    
    // Only add additional fields if they exist
    if (node.continueOnFail !== undefined) cleanNode.continueOnFail = Boolean(node.continueOnFail);
    if (node.disabled !== undefined) cleanNode.disabled = Boolean(node.disabled);
    if (node.notes !== undefined) cleanNode.notes = String(node.notes);
    
    return cleanNode;
  });

  // Clean connections
  if (workflow.connections && typeof workflow.connections === 'object') {
    Object.keys(workflow.connections).forEach(key => {
      if (Array.isArray(workflow.connections[key])) {
        cleaned.connections[key] = workflow.connections[key].map(conn => ({
          node: String(conn.node),
          type: String(conn.type),
          index: Number(conn.index || 0)
        }));
      }
    });
  }

  return cleaned;
}

// Clean incoming workflow JSON from AI
function cleanIncomingWorkflowJson(workflowJson) {
  const cleaned = {
    nodes: [],
    connections: {}
  };

  // Clean nodes
  if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
    cleaned.nodes = workflowJson.nodes.map((node, index) => {
      const cleanNode = {
        id: String(node.id || `node_${Date.now()}_${index}`),
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

// Copy workflow JSON to clipboard
function copyWorkflowJson(workflowJson) {
  const jsonString = JSON.stringify(workflowJson, null, 2);
  navigator.clipboard.writeText(jsonString).then(() => {
    showToast('JSON copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

// Show toast notification
function showToast(message, type = 'success') {
  // Check if there's an existing toast and remove it
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type || 'success'}-message`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Add show class after a small delay to trigger animation
  setTimeout(() => {
    toast.classList.add('fade-in');
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('fade-in');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }, 10);
}

// History functions
function loadHistoryList() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  const workflows = Object.entries(allWorkflowChats)
    .map(([id, workflow]) => ({
      ...workflow,
      workflowId: id
    }))
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
    
    const lastMessage = workflow.messages && workflow.messages.length > 0 
      ? workflow.messages[workflow.messages.length - 1] : null;
    const preview = lastMessage ? lastMessage.content.substring(0, 60) + '...' : 'No messages';
    
    item.innerHTML = `
      <div class="history-item-title">${workflow.workflowName || workflow.workflowId}</div>
      <div class="history-item-preview">${preview}</div>
      <div class="history-item-meta">
        <span>${workflow.messages?.length || 0} messages</span>
        <span>${new Date(workflow.lastActivity || Date.now()).toLocaleDateString()}</span>
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
  const historyList = document.getElementById('history-list');
  const items = historyList.querySelectorAll('.history-item');
  
  query = query.toLowerCase().trim();
  
  items.forEach(item => {
    const title = item.querySelector('.history-item-title').textContent.toLowerCase();
    const preview = item.querySelector('.history-item-preview').textContent.toLowerCase();
    
    if (title.includes(query) || preview.includes(query)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

function clearHistory() {
  if (confirm('Clear all chat history? This cannot be undone.')) {
    allWorkflowChats = {};
    chatMemory = [];
    saveChatStorage();
    refreshChatUI();
    loadHistoryList();
    showToast('Chat history cleared');
  }
}

// Load templates
function loadTemplates() {
  const templatesGrid = document.getElementById('templates-grid');
  
  // Sample templates - in a real implementation, these would come from storage or an API
  const templates = [
    {
      name: 'Email to Slack',
      category: 'automation',
      description: 'Send incoming emails to a Slack channel',
      nodes: 2
    },
    {
      name: 'Database Sync',
      category: 'data',
      description: 'Sync data between two databases on a schedule',
      nodes: 4
    },
    {
      name: 'Twitter Monitor',
      category: 'api',
      description: 'Monitor Twitter for mentions and save to database',
      nodes: 3
    },
    {
      name: 'Form Submission Handler',
      category: 'api',
      description: 'Process web form submissions and send notifications',
      nodes: 5
    }
  ];
  
  // Clear existing templates
  templatesGrid.innerHTML = '';
  
  // Add template cards
  templates.forEach(template => {
    const card = document.createElement('div');
    card.className = 'template-card';
    
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
    
    // Add click event to use template
    card.addEventListener('click', () => {
      const message = `Create a workflow for: ${template.name} - ${template.description}`;
      document.getElementById('chat-input').value = message;
      switchTab('chat');
    });
    
    templatesGrid.appendChild(card);
  });
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
    
    // Update API status
    const hasApiKey = settings.activeProvider === 'openai' 
      ? settings.openaiKey 
      : settings.anthropicKey;
    
    updateStatus('api', hasApiKey ? 'active' : 'error', 
      hasApiKey ? `${settings.activeProvider} configured` : 'API key required');
    
    showToast('Settings saved!');
    hideSettings();
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

function resetSettings() {
  if (confirm('Reset all settings to default values?')) {
    settings = {
      openaiKey: '',
      anthropicKey: '',
      activeProvider: 'openai',
      n8nApiUrl: '',
      n8nApiKey: '',
      autoApplyWorkflows: false,
      saveChatHistory: true,
      maxHistory: 25
    };
    
    updateSettingsUI();
    showToast('Settings reset to defaults');
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
      showToast('n8n connection successful!');
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
  showToast('Refreshed!');
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Side panel received message:', request);
  
  if (request.action === 'tabUpdated') {
    getCurrentTabInfo();
  }
  
  sendResponse({ status: 'received' });
  return true;
});
