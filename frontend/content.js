// Content script for 8pilot extension
console.log('8pilot content script loaded');

// Global state for activation
let globalActivationState = false;
let isN8nPage = false;
let components = null;
let modulesLoaded = false;
let pendingActivation = false;

// Import components with error handling
let WorkflowExtractor, ActivationIcon, MenuManager, ChatManager, ChatHistory, StateManager, BackendApiService, ApiKeyManager, ChatStorageService;

// Load modules asynchronously
(async function loadModules() {
  try {
    const workflowModule = await import('./services/workflowExtractor.js');
    const activationModule = await import('./components/activationIcon.js');
    const menuModule = await import('./components/menuManager.js');
    const chatModule = await import('./components/chatManager.js');
    const chatHistoryModule = await import('./components/chatHistory.js');
    const stateModule = await import('./utils/stateManager.js');
    const backendModule = await import('./services/backendApiService.js');
    const apiKeyModule = await import('./components/apiKeyManager.js');
    const chatStorageModule = await import('./services/chatStorageService.js');
    
    WorkflowExtractor = workflowModule.WorkflowExtractor;
    ActivationIcon = activationModule.ActivationIcon;
    MenuManager = menuModule.MenuManager;
    ChatManager = chatModule.ChatManager;
    ChatHistory = chatHistoryModule.ChatHistory;
    StateManager = stateModule.StateManager;
    BackendApiService = backendModule.BackendApiService;
    ApiKeyManager = apiKeyModule.ApiKeyManager;
    ChatStorageService = chatStorageModule.ChatStorageService;
    
    console.log('All modules loaded successfully');
    modulesLoaded = true;
    
    // Initialize after modules are loaded
    initializeExtension();
    
    // Check if there was a pending activation
    if (pendingActivation) {
      console.log('Processing pending activation');
      pendingActivation = false;
      handleActivation();
    }
  } catch (error) {
    console.error('Failed to load modules:', error);
    // Fallback to basic functionality
    initializeFallback();
  }
})();

// Initialize the extension
function initializeExtension() {
  try {
    // Initialize state manager
    const stateManager = new StateManager();

    // Initialize components
    const workflowExtractor = new WorkflowExtractor();
    const backendApiService = new BackendApiService();
    const apiKeyManager = new ApiKeyManager();
    const activationIcon = new ActivationIcon(stateManager);
    const menuManager = new MenuManager(stateManager);
    const chatManager = new ChatManager(stateManager, backendApiService);
    const chatHistory = new ChatHistory(chatManager, backendApiService);

    // Store references for deactivation
    components = {
      activationIcon,
      menuManager,
      chatManager,
      chatHistory,
      workflowExtractor,
      backendApiService,
      apiKeyManager
    };
    window._8pilotComponents = components;

    // Check initial n8n page status
    checkN8nPageStatus();
    
    // Set up URL change listener for auto-detection
    setupUrlChangeListener();
    
    // Set up global activation state listener
    setupGlobalActivationListener();
    
    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Content script received message:', request);
      
      if (request.action === 'activateExtension') {
        console.log('Activating extension globally');
        globalActivationState = true;
        saveGlobalActivationState();
        
        if (modulesLoaded) {
          handleActivation();
        } else {
          console.log('Modules not loaded yet, queuing activation');
          pendingActivation = true;
        }
        
        sendResponse({ status: 'activated' });
      } else if (request.action === 'deactivateExtension') {
        console.log('Deactivating extension');
        globalActivationState = false;
        saveGlobalActivationState();
        
        // Hide all components
        activationIcon.hide();
        menuManager.hide();
        chatManager.hide();
        chatHistory.hide();
        
        sendResponse({ status: 'deactivated' });
      } else if (request.action === 'getWorkflowData') {
        if (isN8nPage) {
          const workflowData = workflowExtractor.extractWorkflowData();
          sendResponse({ status: 'success', data: workflowData });
        } else {
          sendResponse({ status: 'error', message: 'Not an n8n page' });
        }
      } else if (request.action === 'getWorkflowId') {
        if (isN8nPage) {
          const workflowId = workflowExtractor.extractWorkflowId();
          sendResponse({ status: 'success', data: { workflowId } });
        } else {
          sendResponse({ status: 'error', message: 'Not an n8n page' });
        }
      } else if (request.action === 'checkActivationState') {
        sendResponse({ 
          status: 'success', 
          data: { 
            isActivated: globalActivationState, 
            isN8nPage: isN8nPage 
          } 
        });
      } else if (request.action === 'apiCredentialsUpdated') {
        // Notify chat manager about API credentials update
        if (components && components.chatManager) {
          components.chatManager.setApiCredentials(request.data.apiKey, request.data.provider);
        }
        sendResponse({ status: 'success' });
      }
      
      return true;
    });
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    // Fallback to basic functionality
    initializeFallback();
  }
}

// Handle activation when modules are ready
function handleActivation() {
  if (!components) {
    console.error('Components not initialized');
    return;
  }
  
  const { activationIcon, menuManager } = components;
  
  // Show UI only if this is an n8n page
  if (isN8nPage) {
    console.log('n8n page detected, showing UI');
    activationIcon.show();
    menuManager.createMenu();
    menuManager.showMenu();
  } else {
    console.log('Not an n8n page, UI will appear when you navigate to n8n');
  }
}

// Check if current page is n8n and update UI accordingly
function checkN8nPageStatus() {
  if (!components) return;
  
  const wasN8nPage = isN8nPage;
  isN8nPage = components.workflowExtractor.isN8nPage();
  
  console.log('N8N page status check:', { isN8nPage, wasN8nPage, globalActivationState });
  
  if (isN8nPage && globalActivationState) {
    // Show UI on n8n page when activated
    if (!wasN8nPage) {
      console.log('Navigated to n8n page, showing UI');
      handleActivation();
    }
  } else if (!isN8nPage && wasN8nPage) {
    // Hide UI when leaving n8n page
    console.log('Left n8n page, hiding UI');
    components.activationIcon.hide();
    components.menuManager.hide();
    components.chatManager.hide();
    components.chatHistory.hide();
  } else if (isN8nPage && !globalActivationState) {
    // Show only activation icon on n8n page when not activated
    components.activationIcon.show();
    components.menuManager.hide();
    components.chatManager.hide();
    components.chatHistory.hide();
  } else if (!globalActivationState) {
    // Hide all components when extension is deactivated, regardless of page type
    console.log('Extension deactivated, hiding all components');
    components.activationIcon.hide();
    components.menuManager.hide();
    components.chatManager.hide();
    components.chatHistory.hide();
  }
}

// Set up listener for URL changes (SPA navigation)
function setupUrlChangeListener() {
  let currentUrl = window.location.href;
  
  // Listen for popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(checkN8nPageStatus, 100); // Small delay to let page load
    }
  });
  
  // Listen for pushstate/replacestate (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(checkN8nPageStatus, 100);
    }
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(checkN8nPageStatus, 100);
    }
  };
  
  // Also listen for hash changes
  window.addEventListener('hashchange', () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(checkN8nPageStatus, 100);
    }
  });
}

// Set up listener for global activation state changes
function setupGlobalActivationListener() {
  // Listen for storage changes from other tabs
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.globalActivationState) {
      const newState = changes.globalActivationState.newValue;
      if (newState !== globalActivationState) {
        console.log('Global activation state changed:', { from: globalActivationState, to: newState });
        globalActivationState = newState;
        
        // If deactivated, immediately hide all components
        if (!newState && components) {
          console.log('Extension deactivated via storage change, hiding all components');
          components.activationIcon.hide();
          components.menuManager.hide();
          components.chatManager.hide();
          components.chatHistory.hide();
        } else {
          // If activated, check page status
          checkN8nPageStatus();
        }
      }
    }
  });
  
  // Load initial activation state
  loadGlobalActivationState();
}

// Save global activation state
async function saveGlobalActivationState() {
  try {
    await chrome.storage.local.set({ globalActivationState });
  } catch (error) {
    console.error('Failed to save global activation state:', error);
  }
}

// Load global activation state
async function loadGlobalActivationState() {
  try {
    const result = await chrome.storage.local.get(['globalActivationState']);
    globalActivationState = result.globalActivationState || false;
    console.log('Loaded global activation state:', globalActivationState);
    
    // If deactivated, ensure all components are hidden
    if (!globalActivationState && components) {
      console.log('Extension is deactivated, hiding all components on load');
      components.activationIcon.hide();
      components.menuManager.hide();
      components.chatManager.hide();
      components.chatHistory.hide();
    } else {
      checkN8nPageStatus();
    }
  } catch (error) {
    console.error('Failed to load global activation state:', error);
    // Default to deactivated state on error
    globalActivationState = false;
    if (components) {
      components.activationIcon.hide();
      components.menuManager.hide();
      components.chatManager.hide();
      components.chatHistory.hide();
    }
  }
}

// Fallback initialization when modules fail to load
function initializeFallback() {
  console.log('Using fallback initialization');
  
  // Basic n8n detection
  function isN8nPage() {
    const url = window.location.href.toLowerCase();
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      const port = urlObj.port;
      
      return (
        // n8n in hostname
        hostname.includes('n8n') ||
        // n8n in path
        pathname.includes('/n8n') ||
        // workflow in path
        pathname.includes('/workflow') ||
        pathname.includes('/execution') ||
        // Common n8n ports
        (port === '5678') ||
        // localhost development
        (hostname === 'localhost' && (port === '5678' || pathname.includes('workflow'))) ||
        // IP addresses with n8n port
        (hostname.match(/^\d+\.\d+\.\d+\.\d+$/) && port === '5678') ||
        // Canvas element (n8n uses canvas)
        document.querySelector('canvas') !== null
      );
    } catch (error) {
      // Fallback to simple string check
      return url.includes('n8n') || 
             url.includes('workflow') || 
             url.includes('localhost') || 
             url.includes('127.0.0.1') ||
             document.querySelector('canvas') !== null;
    }
  }
  
  // Listen for messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message (fallback):', request);
    
    if (request.action === 'getWorkflowData') {
      if (isN8nPage()) {
        const workflowData = {
          url: window.location.href,
          title: document.title,
          isN8nPage: true,
          workflowId: null,
          nodes: [],
          connections: []
        };
        sendResponse({ status: 'success', data: workflowData });
      } else {
        sendResponse({ status: 'error', message: 'Not an n8n page' });
      }
    } else if (request.action === 'activateExtension') {
      console.log('Fallback: Activating extension globally');
      // In fallback mode, we can't show UI, but we can still activate
      sendResponse({ status: 'activated' });
    } else if (request.action === 'deactivateExtension') {
      // Hide any existing components in fallback mode
      const activationIcon = document.getElementById('8pilot-activation-icon');
      const historyIcon = document.getElementById('8pilot-history-icon');
      const chatIcon = document.getElementById('8pilot-chat-icon');
      const chatContainer = document.getElementById('8pilot-chat-container');
      const chatMessages = document.getElementById('8pilot-chat-messages');
      
      if (activationIcon) activationIcon.remove();
      if (historyIcon) historyIcon.remove();
      if (chatIcon) chatIcon.remove();
      if (chatContainer) chatContainer.remove();
      if (chatMessages) chatMessages.remove();
      
      sendResponse({ status: 'deactivated' });
    }
    
    return true;
  });
}