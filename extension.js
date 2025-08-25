// Updated extension.js with Side Panel support

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('n8n Co Pilot Extension installed');
});

// Handle side panel opening
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Side panel setup error:', error));

// Message handling between popup/settings, content script, and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);

  // Handle side panel requests
  if (request.action === 'openSidePanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
    sendResponse({ status: 'side panel opened' });
    return true;
  }

  // Pass through settings updates to both content script and side panel
  if (request.action === 'settingsUpdated') {
    console.log('Settings updated, broadcasting to all scripts');
    
    // Send to content scripts
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

  // Handle showChat request from settings popup
  if (request.action === 'showChat') {
    console.log('Show chat request received in background');
    
    // Open side panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
    
    sendResponse({ status: 'side panel opened' });
    return true;
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
    const data = await response.json();
    
    sendResponse({
      success: response.ok,
      status: response.status,
      data: data
    });
    
  } catch (error) {
    console.error('n8n API request failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Handle tab updates to refresh side panel if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Send URL change notification to side panel
    chrome.runtime.sendMessage({
      action: 'tabUpdated',
      tabId: tabId,
      url: tab.url
    }).catch(() => {
      // Side panel might not be open, ignore error
    });
  }
});