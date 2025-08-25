console.log('page.js loaded');

// Cache for extension resource URLs
const resourceURLCache = {};

// Track extension validity
let extensionValid = true;

// Check if extension context is still valid
function checkExtensionContext() {
  try {
    if (chrome.runtime && chrome.runtime.id) {
      return true;
    }
  } catch (error) {
    console.log('Extension context invalidated:', error);
    extensionValid = false;
    return false;
  }
  return false;
}

// Safe chrome runtime wrapper
function safeGetURL(path) {
  if (!checkExtensionContext()) {
    console.warn('Extension context invalid, cannot get URL for:', path);
    return null;
  }
  
  try {
    return chrome.runtime.getURL(path);
  } catch (error) {
    console.error('Error getting extension URL:', error);
    extensionValid = false;
    return null;
  }
}

// Inject the chatbot icon script on all pages
function injectChatbotButton() {
  if (!checkExtensionContext()) {
    console.warn('Cannot inject chatbot button - extension context invalid');
    return;
  }

  // Create a button to open the side panel
  const button = document.createElement('button');
  button.id = 'n8n-builder-chatbot-button';
  button.textContent = 'Open Chat';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background-color: #ff6d00;
    color: white;
    border: none;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  button.addEventListener('click', () => {
    // This will work because it's triggered by a user click
    chrome.runtime.sendMessage({ action: "openSidePanel" });
  });
  
  document.body.appendChild(button);
}

// Get all required resource URLs
function getResourceURLs() {
  if (!checkExtensionContext()) {
    return {};
  }

  const resources = {};
  const paths = [
    'chatbot/chatbot.css',
    'chatbot/chatbot.html', 
    'icons/chat-icon-48.png'
  ];

  paths.forEach(path => {
    const url = safeGetURL(path);
    if (url) {
      resources[path] = url;
    }
  });

  return resources;
}

// Fetch content of a file
async function fetchResource(path) {
  if (!checkExtensionContext()) {
    throw new Error('Extension context invalid');
  }

  const url = safeGetURL(path);
  if (!url) {
    throw new Error(`Cannot get URL for ${path}`);
  }

  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error('Error fetching resource:', path, error);
    throw error;
  }
}

// Safe storage access
function safeStorageGet(keys, callback) {
  if (!checkExtensionContext()) {
    console.warn('Extension context invalid, cannot access storage');
    callback({});
    return;
  }

  try {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        callback({});
        return;
      }
      callback(result);
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
    callback({});
  }
}

// Setup communication bridge between content script and injected script
function setupCommunicationBridge() {
  // Listen for events from the injected script
  window.addEventListener('n8nCopilotInjectedEvent', async (event) => {
    const data = event.detail;
    console.log('Event from injected script:', data);
    
    if (!checkExtensionContext()) {
      console.warn('Extension context invalid, cannot handle event:', data.type);
      // Send error response to injected script
      window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
        detail: {
          type: 'extensionError',
          message: 'Extension context invalid - please reload the page'
        }
      }));
      return;
    }
    
    // Handle various requests from the injected script
    try {
      switch (data.type) {
        case 'getIsN8nPage':
          safeStorageGet(['isN8nPage'], (result) => {
            window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
              detail: {
                type: 'isN8nPageResponse',
                isN8nPage: result.isN8nPage || false
              }
            }));
          });
          break;
          
        case 'getResourceURLs':
          const resources = getResourceURLs();
          window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
            detail: {
              type: 'resourceURLs',
              resources: resources
            }
          }));
          break;
          
        case 'getResourceURL':
          const url = safeGetURL(data.path);
          if (url) {
            resourceURLCache[data.path] = url;
            window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
              detail: {
                type: 'resourceURL',
                path: data.path,
                url: url
              }
            }));
          } else {
            window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
              detail: {
                type: 'resourceError',
                path: data.path,
                error: 'Cannot get resource URL'
              }
            }));
          }
          break;
          
        case 'getChatHtml':
          try {
            const html = await fetchResource('chatbot/chatbot.html');
            window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
              detail: {
                type: 'chatHtml',
                html: html
              }
            }));
            // If a callback was specified, call it with the HTML
            if (data.callback && window[data.callback]) {
              window[data.callback](html);
            }
          } catch (error) {
            console.error('Error fetching chat HTML:', error);
            window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
              detail: {
                type: 'chatHtmlError',
                error: error.message
              }
            }));
          }
          break;
          
        case 'getSettings':
          // Use chrome.storage.sync for settings
          try {
            chrome.storage.sync.get(['openaiKey', 'anthropicKey', 'activeProvider', 'n8nApiUrl', 'n8nApiKey'], (result) => {
              if (chrome.runtime.lastError) {
                console.error('Settings storage error:', chrome.runtime.lastError);
                return;
              }
              
              window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
                detail: {
                  type: 'settingsUpdated',
                  settings: {
                    openaiKey: result.openaiKey || '',
                    anthropicKey: result.anthropicKey || '',
                    activeProvider: result.activeProvider || 'openai',
                    n8nApiUrl: result.n8nApiUrl || '',
                    n8nApiKey: result.n8nApiKey || ''
                  }
                }
              }));
            });
          } catch (error) {
            console.error('Error getting settings:', error);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling injected script event:', error);
      window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
        detail: {
          type: 'extensionError',
          message: error.message
        }
      }));
    }
  });
}

// Listen for messages from extension.js or settings
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  
  if (!checkExtensionContext()) {
    console.warn('Extension context invalid, cannot handle message');
    sendResponse({ status: 'error', message: 'Extension context invalid' });
    return;
  }
  
  // Handle the showChat action from settings
  if (request.action === 'showChat') {
    console.log('Show chat action received');
    
    // Make sure the chatbot script is injected
    injectChatbotButton();
    
    // Send a custom event to the injected script to show chat
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
        detail: {
          type: 'showChat'
        }
      }));
    }, 200); // Longer delay to ensure script is loaded
  }
  
  // Pass settings updates to the injected script
  if (request.action === 'settingsUpdated') {
    window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
      detail: {
        type: 'settingsUpdated',
        settings: request.settings
      }
    }));
  }
  
  sendResponse({ status: 'received' });
  return true;
});

// Initialize with retry logic
function initializeWithRetry(maxRetries = 3) {
  let retries = 0;
  
  function tryInitialize() {
    if (checkExtensionContext()) {
      injectChatbotButton();
      setupCommunicationBridge();
      
      // Check if we're on an n8n page from storage
      safeStorageGet(['isN8nPage'], (result) => {
        console.log('Retrieved isN8nPage from storage:', result.isN8nPage);
      });
      
      console.log('Extension initialized successfully');
    } else {
      retries++;
      if (retries < maxRetries) {
        console.log(`Extension context invalid, retrying... (${retries}/${maxRetries})`);
        setTimeout(tryInitialize, 1000);
      } else {
        console.error('Failed to initialize extension after', maxRetries, 'retries');
      }
    }
  }
  
  tryInitialize();
}

// Enhanced error handling for extension invalidation
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Extension context invalidated')) {
    console.warn('Extension context invalidated detected in error handler');
    extensionValid = false;
    
    // Notify the user
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 999999;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = 'n8n Co Pilot: Extension reloaded. Please refresh the page.';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }
});

// Add this to your page.js message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  
  // Handle the showChat action from settings
  if (request.action === 'showChat') {
    console.log('Show chat action received');
    injectChatbotScript();
  }
  
  // Handle applying workflow after navigation
  if (request.action === 'applyWorkflowAfterNavigation') {
    console.log('Applying workflow after navigation');
    
    // Wait for the page to fully load
    setTimeout(() => {
      applyWorkflowToCanvas(request.workflowJson);
    }, 2000);
  }
  
  // Pass settings updates to the injected script
  if (request.action === 'settingsUpdated') {
    window.dispatchEvent(new CustomEvent('n8nCopilotContentEvent', {
      detail: {
        type: 'settingsUpdated',
        settings: request.settings
      }
    }));
  }
  
  sendResponse({ status: 'received' });
  return true;
});

// Function to apply workflow to canvas
function applyWorkflowToCanvas(workflowJson) {
  // This will need to get the n8n API details from storage
  chrome.storage.sync.get(['n8nApiUrl', 'n8nApiKey'], async (settings) => {
    try {
      // Get current workflow ID from URL
      const url = window.location.href;
      const workflowIdMatch = url.match(/workflow\/([^/?]+)/);
      const workflowId = workflowIdMatch ? workflowIdMatch[1] : null;
      
      if (!workflowId) {
        console.error('Unable to extract workflow ID from URL');
        return;
      }
      
      // Get current workflow
      const getResponse = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': settings.n8nApiKey
        }
      });

      if (!getResponse.ok) {
        console.error('Failed to fetch current workflow:', getResponse.status);
        return;
      }

      const currentWorkflow = await getResponse.json();
      
      // Merge with new components - this needs the merge function from your code
      const updatedWorkflow = mergeWorkflowData(currentWorkflow, workflowJson);
      
      // Clean workflow for PUT request - this needs the clean function from your code
      const cleanWorkflow = cleanWorkflowForUpdate(updatedWorkflow);
      
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
        console.error('Failed to update workflow:', updateResponse.status);
        return;
      }
      
      // Reload the page to show changes
      window.location.reload();
      
    } catch (error) {
      console.error('Error applying workflow to canvas:', error);
    }
  });
}

// Add these helper functions to page.js (copied from your chatbot.js)
function mergeWorkflowData(currentWorkflow, newComponents) {
  const result = { ...currentWorkflow };
  
  if (!result.nodes) result.nodes = [];
  if (!result.connections) result.connections = {};
  
  if (newComponents.nodes && Array.isArray(newComponents.nodes)) {
    let maxX = 0, maxY = 0;
    
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

function cleanWorkflowForUpdate(workflow) {
  const cleanWorkflow = {
    name: workflow.name || 'Untitled Workflow',
    nodes: workflow.nodes || [],
    connections: workflow.connections || {},
    settings: workflow.settings || {},
    staticData: workflow.staticData || {}
  };

  return JSON.parse(JSON.stringify(cleanWorkflow));
}


// Initialize
console.log('Starting extension initialization...');
initializeWithRetry();
