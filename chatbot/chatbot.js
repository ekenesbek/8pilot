// chatbot/chatbot.js - Enhanced with workflow-specific chat storage

// Force isN8nPage to true for development purposes
let isN8nPage = true;

// Chat storage - now workflow-specific
let currentWorkflowId = null;
let allWorkflowChats = {}; // Store all workflow chats
let chatMemory = []; // Current workflow chat memory
let apiKey = null;
let n8nApiUrl = null;
let n8nApiKey = null;

// Storage keys
const STORAGE_KEYS = {
  WORKFLOW_CHATS: '8pilot_workflow_chats',
  LAST_ACTIVE_WORKFLOW: '8pilot_last_workflow'
};

// For accessing Chrome extension resources safely
const getExtensionURL = (path) => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(path);
  }
  console.error('Unable to access chrome.runtime.getURL');
  return path;
};

// Get current workflow ID from URL
function getCurrentWorkflowId() {
  const url = window.location.href;
  
  // Handle different n8n URL patterns
  if (url.includes('/workflow/new')) {
    return 'new_workflow';
  }
  
  const workflowIdMatch = url.match(/workflow\/([^/?]+)/);
  return workflowIdMatch ? workflowIdMatch[1] : 'unknown_workflow';
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
    // Clean up old chats (keep only last 50 workflows to prevent storage bloat)
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
    console.log('Saved chat storage for', Object.keys(allWorkflowChats).length, 'workflows');
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
      workflowName: 'Unknown Workflow',
      lastActivity: Date.now(),
      createdAt: Date.now()
    };
    console.log('Created new chat for workflow:', workflowId);
  }
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

// Get workflow info (name, etc.)
async function getWorkflowInfo(workflowId) {
  if (!n8nApiUrl || !n8nApiKey || workflowId === 'new_workflow' || workflowId === 'unknown_workflow') {
    return { name: workflowId === 'new_workflow' ? 'New Workflow' : 'Unknown Workflow' };
  }
  
  try {
    const response = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey
      }
    });
    
    if (response.ok) {
      const workflow = await response.json();
      return { name: workflow.name || 'Untitled Workflow' };
    }
  } catch (error) {
    console.error('Error fetching workflow info:', error);
  }
  
  return { name: 'Unknown Workflow' };
}

// Update workflow name in chat storage
async function updateWorkflowName(workflowId) {
  if (allWorkflowChats[workflowId]) {
    const info = await getWorkflowInfo(workflowId);
    allWorkflowChats[workflowId].workflowName = info.name;
    saveChatStorage();
  }
}

// Listen for events from the content script
window.addEventListener('n8nCopilotContentEvent', (event) => {
  const data = event.detail;
  console.log('Event from content script:', data);
  
  // Handle extension context errors
  if (data.type === 'extensionError') {
    console.error('Extension error:', data.message);
    showMiniToast('Extension error: Please reload the page');
    return;
  }
  
  if (data.type === 'showChat') {
    toggleChat();
  }
  
  if (data.type === 'isN8nPageResponse') {
    console.log('Got n8n page status (ignored for dev):', data.isN8nPage);
  }
  
  if (data.type === 'resourceURLs') {
    window.extensionResources = data.resources;
    console.log('Got extension resources:', window.extensionResources);
    injectChatStyles();
    injectChatIcon();
  }
  
  if (data.type === 'resourceURL') {
    console.log('Received resource URL:', data.path, data.url);
    if (data.path === 'chatbot/chatbot.css') {
      applyChatStyles(data.url);
    }
  }
  
  if (data.type === 'chatHtml') {
    console.log('Received chat HTML content');
    if (window.processChatHtml) {
      window.processChatHtml(data.html);
    }
  }
  
  // Handle settings updates including API key
  if (data.type === 'settingsUpdated') {
    console.log('Settings updated in chatbot');
    if (data.settings) {
      if (data.settings.openaiKey) {
        apiKey = data.settings.openaiKey;
        console.log('OpenAI API key updated');
      }
      if (data.settings.n8nApiUrl) {
        n8nApiUrl = data.settings.n8nApiUrl;
        console.log('n8n API URL updated');
      }
      if (data.settings.n8nApiKey) {
        n8nApiKey = data.settings.n8nApiKey;
        console.log('n8n API key updated');
      }
    }
  }
});

// Function to communicate with content script
function sendToContentScript(data) {
  window.dispatchEvent(new CustomEvent('n8nCopilotInjectedEvent', {
    detail: data
  }));
}

// Initialize with workflow detection
function initialize() {
  // Load chat storage first
  loadChatStorage();
  
  // Get current workflow ID
  const workflowId = getCurrentWorkflowId();
  console.log('Current workflow ID:', workflowId);
  
  // Load chat for this workflow
  loadWorkflowChat(workflowId);
  
  // Update workflow name if we have API access
  setTimeout(() => {
    updateWorkflowName(workflowId);
  }, 1000);
  
  // Get other data
  sendToContentScript({ type: 'getIsN8nPage' });
  sendToContentScript({ type: 'getResourceURLs' });
  sendToContentScript({ type: 'getSettings' });
}

// Monitor URL changes for SPA navigation
let lastUrl = window.location.href;
function monitorUrlChanges() {
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('URL changed from', lastUrl, 'to', currentUrl);
      lastUrl = currentUrl;
      
      // Save current chat before switching
      saveCurrentChat();
      
      // Load chat for new workflow
      const newWorkflowId = getCurrentWorkflowId();
      if (newWorkflowId !== currentWorkflowId) {
        console.log('Switching from workflow', currentWorkflowId, 'to', newWorkflowId);
        loadWorkflowChat(newWorkflowId);
        
        // Update chat UI if it's open
        const chatContainer = document.getElementById('pilot-chat');
        if (chatContainer) {
          refreshChatUI();
        }
        
        // Update workflow name
        setTimeout(() => {
          updateWorkflowName(newWorkflowId);
        }, 1000);
      }
    }
  }, 1000);
}

// Refresh chat UI with current workflow's messages
function refreshChatUI() {
  const messagesArea = document.getElementById('pilot-messages');
  if (!messagesArea) return;
  
  // Clear current messages
  messagesArea.innerHTML = '';
  
  // Add workflow header
  addWorkflowHeader();
  
  // Restore messages from memory
  chatMemory.forEach(message => {
    addMessageToUI(message.role === 'user' ? 'user' : 'assistant', message.content, false);
  });
  
  // Add welcome message if no history
  if (chatMemory.length === 0) {
    const workflowName = allWorkflowChats[currentWorkflowId]?.workflowName || currentWorkflowId;
    if (!apiKey) {
      addMessageToUI('assistant', 'Welcome! Please add your OpenAI API key in the extension settings to use the chat functionality.', false);
    } else {
      addMessageToUI('assistant', `Hello! I can help you build your n8n workflow "${workflowName}". What would you like to add?`, false);
    }
  }
}

// Add workflow header to chat
function addWorkflowHeader() {
  const messagesArea = document.getElementById('pilot-messages');
  if (!messagesArea) return;
  
  const workflowInfo = allWorkflowChats[currentWorkflowId];
  const workflowName = workflowInfo?.workflowName || currentWorkflowId;
  const messageCount = chatMemory.length;
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'workflow-header';
  headerDiv.innerHTML = `
    <div class="workflow-info">
      <div class="workflow-name" title="${workflowName}">${workflowName}</div>
      <div class="workflow-stats">${messageCount} messages • ID: ${currentWorkflowId}</div>
      <div class="workflow-actions">
        <button class="clear-chat-btn" onclick="clearCurrentWorkflowChat()" title="Clear this workflow's chat">🗑️</button>
        <button class="workflow-list-btn" onclick="showWorkflowList()" title="View all workflow chats">📋</button>
      </div>
    </div>
  `;
  messagesArea.appendChild(headerDiv);
}

// Clear current workflow's chat
window.clearCurrentWorkflowChat = function() {
  if (confirm(`Clear chat history for this workflow?`)) {
    chatMemory = [];
    allWorkflowChats[currentWorkflowId].messages = [];
    saveCurrentChat();
    refreshChatUI();
    showMiniToast('Chat history cleared');
  }
};

// Show workflow list modal
window.showWorkflowList = function() {
  const modal = createWorkflowListModal();
  document.body.appendChild(modal);
};

// Create workflow list modal
function createWorkflowListModal() {
  const modal = document.createElement('div');
  modal.className = 'workflow-list-modal';
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  const workflowEntries = Object.entries(allWorkflowChats)
    .sort(([,a], [,b]) => (b.lastActivity || 0) - (a.lastActivity || 0))
    .slice(0, 20); // Show last 20 workflows
  
  modal.innerHTML = `
    <div class="workflow-list-content">
      <div class="workflow-list-header">
        <h3>Workflow Chats</h3>
        <button onclick="this.closest('.workflow-list-modal').remove()">×</button>
      </div>
      <div class="workflow-list-body">
        ${workflowEntries.map(([id, chat]) => {
          const isActive = id === currentWorkflowId;
          const lastActivity = new Date(chat.lastActivity || 0).toLocaleDateString();
          return `
            <div class="workflow-item ${isActive ? 'active' : ''}" onclick="switchToWorkflow('${id}')">
              <div class="workflow-item-name">${chat.workflowName || id}</div>
              <div class="workflow-item-stats">${chat.messages?.length || 0} messages • ${lastActivity}</div>
              <div class="workflow-item-id">${id}</div>
            </div>
          `;
        }).join('')}
        ${workflowEntries.length === 0 ? '<div class="no-workflows">No workflow chats yet</div>' : ''}
      </div>
      <div class="workflow-list-footer">
        <button onclick="clearAllWorkflowChats()">Clear All Chats</button>
      </div>
    </div>
  `;
  
  return modal;
}

// Switch to a different workflow
window.switchToWorkflow = function(workflowId) {
  if (workflowId === currentWorkflowId) {
    document.querySelector('.workflow-list-modal')?.remove();
    return;
  }
  
  // This would ideally navigate to the workflow, but for now just switch the chat
  saveCurrentChat();
  loadWorkflowChat(workflowId);
  refreshChatUI();
  document.querySelector('.workflow-list-modal')?.remove();
  showMiniToast(`Switched to workflow: ${allWorkflowChats[workflowId]?.workflowName || workflowId}`);
};

// Clear all workflow chats
window.clearAllWorkflowChats = function() {
  if (confirm('Clear ALL workflow chat histories? This cannot be undone.')) {
    allWorkflowChats = {};
    chatMemory = [];
    saveChatStorage();
    refreshChatUI();
    document.querySelector('.workflow-list-modal')?.remove();
    showMiniToast('All chat histories cleared');
  }
};

// Safely get resource URL
function getResourceURL(path) {
  if (window.extensionResources && window.extensionResources[path]) {
    return window.extensionResources[path];
  }
  return path;
}

// Inject chat CSS if not already present
function injectChatStyles() {
  if (document.getElementById('pilot-styles')) return;
  sendToContentScript({ type: 'getResourceURL', path: 'chatbot/chatbot.css' });
}

function applyChatStyles(cssUrl) {
  const style = document.createElement('link');
  style.id = 'pilot-styles';
  style.rel = 'stylesheet';
  style.type = 'text/css';
  style.href = cssUrl;
  document.head.appendChild(style);
}

// Inject the chat icon bubble
function injectChatIcon() {
  if (!window.extensionResources) {
    sendToContentScript({ type: 'getResourceURLs' });
    return;
  }
  
  const existingIcon = document.getElementById('pilot-icon');
  if (existingIcon) existingIcon.remove();
  
  const iconUrl = getResourceURL('icons/chat-icon-48.png');
  
  const iconDiv = document.createElement('div');
  iconDiv.id = 'pilot-icon';
  iconDiv.className = 'pilot-chat-icon';
  iconDiv.innerHTML = `<img src="${iconUrl}" alt="n8n Co Pilot" />`;
  document.body.appendChild(iconDiv);
  
  iconDiv.addEventListener('click', () => {
    toggleChat();
  });
}

// Create a mini toast notification
function showMiniToast(message) {
  const toast = document.createElement('div');
  toast.className = 'pilot-mini-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }, 10);
}

// Toggle chat visibility
function toggleChat() {
  console.log('toggleChat called');
  const existingChat = document.getElementById('pilot-chat');
  if (existingChat) {
    console.log('Removing existing chat');
    existingChat.remove();
  } else {
    console.log('Opening chat (always enabled for dev)');
    initChatbot();
  }
}

// Inject chat HTML
function injectChatHtml(callback) {
  sendToContentScript({ 
    type: 'getChatHtml', 
    callback: 'processChatHtml' 
  });
  
  window.processChatHtml = function(html) {
    const existingOverlay = document.getElementById('pilot-chat');
    if (existingOverlay) existingOverlay.remove();
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    
    const chatElement = tempDiv.firstElementChild;
    if (chatElement) {
      document.body.appendChild(chatElement);
      console.log('Chat HTML injected successfully');
    } else {
      console.error('Failed to parse chat HTML', html);
    }
    
    if (callback) callback();
  };
}

// Parse JSON from AI response
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

// Process workflow JSON and prepare for canvas injection
function processWorkflowJson(json) {
  if (!json) return;
  
  const confirmMsg = `I've extracted workflow components. Would you like to add them to your canvas?`;
  
  const messagesArea = document.getElementById('pilot-messages');
  if (!messagesArea) return;
  
  const actionDiv = document.createElement('div');
  actionDiv.className = 'pilot-message assistant-message action';
  actionDiv.innerHTML = `
    <div class="message-avatar assistant-avatar"></div>
    <div class="message-content">
      <p>${confirmMsg}</p>
      <div class="action-buttons">
        <button id="apply-workflow-btn" class="action-button primary">Apply to Canvas</button>
        <button id="copy-json-btn" class="action-button secondary">Copy JSON</button>
      </div>
    </div>
  `;
  messagesArea.appendChild(actionDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
  
  document.getElementById('apply-workflow-btn').addEventListener('click', () => {
    console.log('Apply to Canvas button clicked!');
    
    // Check if n8n API is configured
    if (!n8nApiUrl || !n8nApiKey) {
      addMessage('assistant', 
        '🔗 Для применения workflow к canvas необходимо подключение к n8n. ' +
        'Пожалуйста, настройте подключение через расширение 8pilot.'
      );
      return;
    }
    
    injectToCanvas(json);
  });
  
  document.getElementById('copy-json-btn').addEventListener('click', () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(JSON.stringify(json, null, 2))
        .then(() => {
          showMiniToast('JSON copied to clipboard');
        })
        .catch(err => {
          console.error('Could not copy JSON: ', err);
          fallbackCopyToClipboard(JSON.stringify(json, null, 2));
        });
    } else {
      fallbackCopyToClipboard(JSON.stringify(json, null, 2));
    }
  });
}

// Fallback clipboard copy function
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showMiniToast('JSON copied to clipboard');
    } else {
      showMiniToast('Copy failed - please copy manually');
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
    showMiniToast('Copy failed - please copy manually');
  }
  
  document.body.removeChild(textArea);
}

// Fixed workflow cleaning function
function cleanWorkflowForPut(workflow) {
  const cleanWorkflow = {
    name: workflow.name || 'Untitled Workflow',
    nodes: workflow.nodes || [],
    connections: workflow.connections || {},
    settings: workflow.settings || {},
    staticData: workflow.staticData || {}
  };

  return JSON.parse(JSON.stringify(cleanWorkflow));
}

// Fixed URL handling for new workflows
function getWorkflowIdFromUrl(url) {
  if (url.includes('/workflow/new')) {
    return 'new';
  }
  
  const workflowIdMatch = url.match(/workflow\/([^/?]+)/);
  return workflowIdMatch ? workflowIdMatch[1] : null;
}

// Create a new workflow if we're on the "new" page
async function createNewWorkflow() {
  try {
    const response = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey
      },
      body: JSON.stringify({
        name: 'New Workflow',
        nodes: [],
        connections: {},
        settings: {},
        staticData: {}
      })
    });

    if (response.ok) {
      const newWorkflow = await response.json();
      console.log('Created new workflow:', newWorkflow);
      return newWorkflow.id;
    } else {
      throw new Error(`Failed to create workflow: ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating new workflow:', error);
    throw error;
  }
}

// Fixed canvas injection function
async function injectToCanvas(json) {
  console.log('injectToCanvas called with:', json);

  if (!n8nApiUrl || !n8nApiKey) {
    showMiniToast('Please set n8n API URL and key in settings');
    return;
  }

  try {
    const url = window.location.href;
    let workflowId = getWorkflowIdFromUrl(url);
    
    if (!workflowId) {
      showMiniToast('Unable to detect workflow from URL');
      return;
    }

    if (workflowId === 'new') {
      console.log('Creating new workflow...');
      workflowId = await createNewWorkflow();
      window.history.replaceState({}, '', `${window.location.origin}/workflow/${workflowId}`);
    }

    console.log('Working with workflow ID:', workflowId);

    const getUrl = `${n8nApiUrl}/api/v1/workflows/${workflowId}`;
    console.log('GET request to:', getUrl);
    
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();
    console.log('Current workflow:', workflow);

    const updatedWorkflow = mergeWorkflow(workflow, json);
    console.log('Updated workflow (before cleaning):', updatedWorkflow);

    const cleanedWorkflow = cleanWorkflowForPut(updatedWorkflow);
    console.log('Cleaned workflow for PUT:', cleanedWorkflow);

    const putUrl = `${n8nApiUrl}/api/v1/workflows/${workflowId}`;
    console.log('PUT request to:', putUrl);
    
    const updateResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey
      },
      body: JSON.stringify(cleanedWorkflow)
    });

    let putResponseBody;
    try {
      const contentType = updateResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        putResponseBody = await updateResponse.json();
      } else {
        putResponseBody = await updateResponse.text();
      }
    } catch (parseError) {
      putResponseBody = 'Unable to parse response';
    }

    console.log('PUT response status:', updateResponse.status);
    console.log('PUT response body:', putResponseBody);

    if (updateResponse.ok) {
      showMiniToast('Workflow updated successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      console.error('Failed to update workflow:', updateResponse.status, putResponseBody);
      const errorMessage = typeof putResponseBody === 'object' 
        ? JSON.stringify(putResponseBody) 
        : putResponseBody;
      throw new Error(`Failed to update workflow: ${updateResponse.status} - ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error updating workflow:', error);
    showMiniToast(`Error: ${error.message}`);
  }
}

// Improved workflow merging function
function mergeWorkflow(currentWorkflow, newComponents) {
  const result = { ...currentWorkflow };
  
  if (!result.nodes) result.nodes = [];
  if (!result.connections) result.connections = {};
  
  if (newComponents.nodes && Array.isArray(newComponents.nodes)) {
    let maxX = 0;
    let maxY = 0;
    
    result.nodes.forEach(node => {
      if (node.position && Array.isArray(node.position)) {
        maxX = Math.max(maxX, node.position[0] || 0);
        maxY = Math.max(maxY, node.position[1] || 0);
      }
    });
    
    const offsetX = maxX > 0 ? maxX + 200 : 100;
    const offsetY = maxY > 0 ? maxY + 50 : 100;
    
    let maxNodeNum = 0;
    result.nodes.forEach(node => {
      const match = node.name.match(/(\d+)$/);
      if (match) {
        maxNodeNum = Math.max(maxNodeNum, parseInt(match[1]));
      }
    });
    
    newComponents.nodes.forEach((node, index) => {
      const newNode = {
        ...node,
        name: `${node.name || 'Node'} ${maxNodeNum + index + 1}`,
        position: [
          offsetX + (index * 200),
          offsetY
        ]
      };
      
      if (!newNode.parameters) newNode.parameters = {};
      if (!newNode.type) newNode.type = 'n8n-nodes-base.start';
      
      result.nodes.push(newNode);
    });
  }
  
  if (newComponents.connections && typeof newComponents.connections === 'object') {
    Object.assign(result.connections, newComponents.connections);
  }
  
  return result;
}

// Enhanced message adding with storage
function addMessage(sender, text) {
  addMessageToUI(sender, text, true);
}

// Add message to UI and optionally to memory
function addMessageToUI(sender, text, saveToMemory = true) {
  const messagesArea = document.getElementById('pilot-messages');
  if (!messagesArea) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `pilot-message ${sender}-message`;
  messageDiv.innerHTML = `
    <div class="message-avatar ${sender}-avatar"></div>
    <div class="message-content">${text}</div>
  `;
  messagesArea.appendChild(messageDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
  
  // Store message in memory and save to storage
  if (saveToMemory) {
    chatMemory.push({
      role: sender === 'user' ? 'user' : 'assistant',
      content: text,
      timestamp: Date.now()
    });
    
    saveCurrentChat();
  }
}

// Add loading indicator
function showLoadingIndicator() {
  const messagesArea = document.getElementById('pilot-messages');
  if (!messagesArea) return;
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'pilot-loading';
  loadingDiv.className = 'pilot-message assistant-message loading';
  loadingDiv.innerHTML = `
    <div class="message-avatar assistant-avatar"></div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  messagesArea.appendChild(loadingDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Remove loading indicator
function removeLoadingIndicator() {
  const loadingIndicator = document.getElementById('pilot-loading');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// Call OpenAI API
async function callOpenAI(prompt) {
  if (!apiKey) {
    addMessage('assistant', 'Error: Please add your OpenAI API key in the extension settings.');
    return;
  }
  
  showLoadingIndicator();
  
  try {
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
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    removeLoadingIndicator();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      addMessage('assistant', `Error: ${data.error.message}`);
      return;
    }
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;
      addMessage('assistant', aiResponse);
      
      // Extract and process JSON if present
      const extractedJson = extractJsonFromResponse(aiResponse);
      if (extractedJson) {
        processWorkflowJson(extractedJson);
      }
    } else {
      addMessage('assistant', 'I encountered an issue processing your request. Please try again.');
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    removeLoadingIndicator();
    addMessage('assistant', `Error: ${error.message || 'Failed to connect to OpenAI API'}`);
  }
}

// Handle sending a message
function handleSendMessage() {
  const inputElement = document.getElementById('pilot-input');
  if (!inputElement) return;
  
  const userMessage = inputElement.value.trim();
  if (userMessage) {
    addMessage('user', userMessage);
    inputElement.value = '';
    
    // Call OpenAI API
    callOpenAI(userMessage);
  }
}

// Set up event listeners
function setupEventListeners() {
  const sendButton = document.getElementById('pilot-send');
  if (sendButton) {
    sendButton.addEventListener('click', handleSendMessage);
  }
  
  const inputField = document.getElementById('pilot-input');
  if (inputField) {
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }
  
  const closeButton = document.getElementById('pilot-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      const chat = document.getElementById('pilot-chat');
      if (chat) chat.remove();
    });
  }
  
  const minimizeButton = document.getElementById('pilot-minimize');
  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      const chat = document.getElementById('pilot-chat');
      if (chat) chat.remove();
      // Show only the icon when minimized
      injectChatIcon();
    });
  }
}

// Initialize the chatbot
function initChatbot() {
  console.log('initChatbot called');
  // First ensure we have the CSS
  if (!document.getElementById('pilot-styles')) {
    console.log('Requesting CSS');
    sendToContentScript({ type: 'getResourceURL', path: 'chatbot/chatbot.css' });
  }
  
  console.log('Requesting HTML');
  // Then inject the HTML and set up the chatbot
  injectChatHtml(() => {
    console.log('Setting up event listeners');
    setupEventListeners();
    
    // Refresh chat UI with current workflow's history
    refreshChatUI();
  });
}

// Initialize with URL monitoring
console.log('Chatbot script initialized');
initialize();
monitorUrlChanges();
