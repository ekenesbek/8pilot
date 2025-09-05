// Content script for 8pilot extension
console.log('8pilot content script loaded');

// Import components with error handling
let WorkflowExtractor, ActivationIcon, MenuManager, ChatManager, StateManager;

// Load modules asynchronously
(async function loadModules() {
  try {
    const workflowModule = await import('./services/workflowExtractor.js');
    const activationModule = await import('./components/activationIcon.js');
    const menuModule = await import('./components/menuManager.js');
    const chatModule = await import('./components/chatManager.js');
    const stateModule = await import('./utils/stateManager.js');
    
    WorkflowExtractor = workflowModule.WorkflowExtractor;
    ActivationIcon = activationModule.ActivationIcon;
    MenuManager = menuModule.MenuManager;
    ChatManager = chatModule.ChatManager;
    StateManager = stateModule.StateManager;
    
    console.log('All modules loaded successfully');
    
    // Initialize after modules are loaded
    initializeExtension();
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
    const activationIcon = new ActivationIcon(stateManager);
    const menuManager = new MenuManager(stateManager);
    const chatManager = new ChatManager(stateManager);

    // Check if this is an n8n page before initializing
    if (!workflowExtractor.isN8nPage()) {
      console.log('Not an n8n page, skipping initialization');
      // Still listen for messages but don't show UI
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'activateExtension') {
          sendResponse({ status: 'error', message: 'Activation failed. Please make sure you are on an n8n workflow page.' });
        } else if (request.action === 'getWorkflowData') {
          sendResponse({ status: 'error', message: 'Not an n8n page' });
        }
        return true;
      });
    } else {
      console.log('n8n workflow page detected, initializing components');
      
      // Listen for messages from background script
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        if (request.action === 'getWorkflowData') {
          // Extract workflow data from n8n page
          const workflowData = workflowExtractor.extractWorkflowData();
          sendResponse({ status: 'success', data: workflowData });
        } else if (request.action === 'activateExtension') {
          activationIcon.show();
          sendResponse({ status: 'activated' });
        } else if (request.action === 'deactivateExtension') {
          activationIcon.hide();
          sendResponse({ status: 'deactivated' });
        }
        
        return true;
      });
    }
  } catch (error) {
    console.error('Failed to initialize extension:', error);
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
      if (isN8nPage()) {
        console.log('Fallback: n8n page detected, but modules not loaded');
        sendResponse({ status: 'error', message: 'Extension modules failed to load. Please refresh the page.' });
      } else {
        sendResponse({ status: 'error', message: 'Activation failed. Please make sure you are on an n8n workflow page.' });
      }
    } else if (request.action === 'deactivateExtension') {
      sendResponse({ status: 'deactivated' });
    }
    
    return true;
  });
}
