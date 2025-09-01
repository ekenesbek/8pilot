// Updated extension.js with Popup and Side Panel support

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('8pilot Extension installed');
});

// Handle extension icon click - popup will open automatically
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked - popup should open');
  // Popup will open automatically due to default_popup in manifest
});

// Message handling between settings and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);

  // Handle side panel requests (disabled for now)
  if (request.action === 'openSidePanel') {
    sendResponse({ status: 'side panel disabled', message: 'Side panel is temporarily disabled' });
    return true;
  }

  // Pass through settings updates to side panel
  if (request.action === 'settingsUpdated') {
    console.log('Settings updated, broadcasting to side panel');
    
    // Send to side panel
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, request).catch(err => {
          // Ignore errors for tabs that don't have listeners
          console.log(`Could not send to tab ${tab.id}`, err);
        });
      });
    });
    
    sendResponse({ status: 'settings broadcasted' });
    return true;
  }

  // Handle showChat request from settings popup (disabled for now)
  if (request.action === 'showChat') {
    console.log('Show chat request received in background');
    sendResponse({ status: 'side panel disabled', message: 'Side panel is temporarily disabled' });
    return true;
  }

  // Handle extension activation from popup
  if (request.action === 'activateExtension') {
    console.log('Extension activation request received');
    
    // Get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tab = tabs[0];
        
        // Check if it's an n8n workflow page
        if (tab.url.includes('n8n.io') || tab.url.includes('localhost') || tab.url.includes('127.0.0.1')) {
          // Inject content script if not already injected
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).catch(err => {
            console.log('Content script already injected or error:', err);
          });
          
          sendResponse({ status: 'activated', message: 'Extension activated successfully' });
        } else {
          sendResponse({ status: 'error', message: 'Please navigate to an n8n workflow page first' });
        }
      } else {
        sendResponse({ status: 'error', message: 'No active tab found' });
      }
    });
    
    return true; // Keep message channel open for async response
  }

  // Handle activation from popup (side panel disabled for now)
  if (request.action === 'activateAndOpenSidePanel') {
    console.log('Activate request received');
    
    // Get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tab = tabs[0];
        
        // Check if it's an n8n workflow page
        if (tab.url.includes('n8n.io') || tab.url.includes('localhost') || tab.url.includes('127.0.0.1')) {
          // Inject content script if not already injected
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).catch(err => {
            console.log('Content script already injected or error:', err);
          });
          
          sendResponse({ status: 'activated', message: 'Extension activated successfully' });
        } else {
          sendResponse({ status: 'error', message: 'Please navigate to an n8n workflow page first' });
        }
      } else {
        sendResponse({ status: 'error', message: 'No active tab found' });
      }
    });
    
    return true; // Keep message channel open for async response
  }

  // Handle workflow data requests from side panel
  if (request.action === 'getWorkflowData') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Forward request to content script
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          sendResponse(response || { error: 'No response from content script' });
        });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true; // Keep message channel open for async response
  }

  // Handle n8n API requests from side panel (proxy to avoid CORS)
  if (request.action === 'n8nApiRequest') {
    handleN8nApiRequest(request, sendResponse);
    return true; // Keep message channel open for async response
  }

  sendResponse({ status: 'received' });
  return true;
});

// Handle n8n API requests as a proxy to avoid CORS issues
async function handleN8nApiRequest(request, sendResponse) {
  try {
    const { url, method = 'GET', headers = {}, body } = request.data;
    
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body && method !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    const response = await fetch(url, fetchOptions);
    const responseData = await response.text();
    
    // Try to parse as JSON, fallback to text
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }
    
    sendResponse({
      status: 'success',
      data: parsedData,
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('Error handling n8n API request:', error);
    sendResponse({
      status: 'error',
      error: error.message
    });
  }
}