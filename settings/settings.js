// Updated settings/settings.js with Side Panel integration

document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const showChatButton = document.getElementById('show-chat');
  const settingsButton = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const saveSettingsButton = document.getElementById('save-settings');
  const toggleContainer = document.querySelector('.toggle-container');
  const toggleOptions = document.querySelectorAll('.toggle-option');
  const openaiSection = document.getElementById('openai-section');
  const anthropicSection = document.getElementById('anthropic-section');
  const openaiKeyInput = document.getElementById('openai-key');
  const anthropicKeyInput = document.getElementById('anthropic-key');
  const n8nApiUrlInput = document.getElementById('n8n-api-url');
  const n8nApiKeyInput = document.getElementById('n8n-api-key');
  
  // Check if extension context is valid
  function checkExtensionContext() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (error) {
      console.error('Extension context invalid:', error);
      return false;
    }
  }
  
  // Safe chrome tabs query
  function safeTabsQuery(queryInfo, callback) {
    if (!checkExtensionContext()) {
      console.warn('Cannot query tabs - extension context invalid');
      callback([]);
      return;
    }
    
    try {
      chrome.tabs.query(queryInfo, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Tabs query error:', chrome.runtime.lastError);
          callback([]);
          return;
        }
        callback(tabs);
      });
    } catch (error) {
      console.error('Error querying tabs:', error);
      callback([]);
    }
  }
  
  // Safe chrome runtime sendMessage
  function safeSendMessage(message, callback) {
    if (!checkExtensionContext()) {
      console.warn('Cannot send message - extension context invalid');
      if (callback) callback({ error: 'Extension context invalid' });
      return;
    }
    
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Message send error:', chrome.runtime.lastError.message);
          if (callback) callback({ error: chrome.runtime.lastError.message });
          return;
        }
        if (callback) callback(response);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      if (callback) callback({ error: error.message });
    }
  }
  
  // Safe chrome storage access
  function safeStorageGet(keys, callback) {
    if (!checkExtensionContext()) {
      console.warn('Cannot access storage - extension context invalid');
      callback({});
      return;
    }
    
    try {
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage get error:', chrome.runtime.lastError);
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
  
  // Safe chrome storage set
  function safeStorageSet(items, callback) {
    if (!checkExtensionContext()) {
      console.warn('Cannot set storage - extension context invalid');
      if (callback) callback();
      return;
    }
    
    try {
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage set error:', chrome.runtime.lastError);
          if (callback) callback(chrome.runtime.lastError);
          return;
        }
        if (callback) callback();
      });
    } catch (error) {
      console.error('Error setting storage:', error);
      if (callback) callback(error);
    }
  }
  
  // Centralized n8n page detection
  function isN8nPage(url) {
    return url.includes('n8n') || 
           url.includes('workflow') || 
           url.includes('execution') ||
           url.includes('localhost');
  }
  
  // Initialize status check with error handling
  function initializeStatus() {
    if (!checkExtensionContext()) {
      statusIndicator.classList.add('inactive');
      statusIndicator.classList.remove('active');
      statusText.textContent = 'Extension disconnected - reload page';
      showChatButton.disabled = true;
      return;
    }
    
    // Check if current tab is an n8n page
    safeTabsQuery({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        statusIndicator.classList.add('inactive');
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Cannot detect page';
        showChatButton.disabled = true;
        return;
      }
      
      const url = tabs[0].url;
      const isN8nDetected = isN8nPage(url);
      
      // Store the detection result for other scripts to use
      try {
        chrome.storage.local.set({ isN8nPage: isN8nDetected }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error storing n8n page status:', chrome.runtime.lastError);
          } else {
            console.log('n8n page status set in storage:', isN8nDetected);
          }
        });
      } catch (error) {
        console.error('Error accessing local storage:', error);
      }
      
      // Update UI based on detection
      if (isN8nDetected) {
        statusIndicator.classList.add('active');
        statusIndicator.classList.remove('inactive');
        statusText.textContent = 'On an n8n page';
        showChatButton.disabled = false;
        showChatButton.textContent = 'Open Side Panel';
      } else {
        statusIndicator.classList.add('inactive');
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Not an n8n page';
        showChatButton.disabled = false; // Allow opening side panel on any page
        showChatButton.textContent = 'Open Side Panel';
      }
    });
  }
  
  // Load saved settings with error handling
  function loadSettings() {
    safeStorageGet([
      'openaiKey', 
      'anthropicKey', 
      'activeProvider',
      'n8nApiUrl',
      'n8nApiKey',
      'backendUrl'
    ], (result) => {
      if (result.openaiKey) {
        openaiKeyInput.value = result.openaiKey;
      }
      
      if (result.anthropicKey) {
        anthropicKeyInput.value = result.anthropicKey;
      }
      
      if (result.n8nApiUrl) {
        n8nApiUrlInput.value = result.n8nApiUrl;
      }
      
      if (result.n8nApiKey) {
        n8nApiKeyInput.value = result.n8nApiKey;
      }
      
      if (result.backendUrl) {
        document.getElementById('backend-url').value = result.backendUrl;
      }
      
      // Set active provider
      if (result.activeProvider) {
        toggleContainer.setAttribute('data-selected', result.activeProvider);
        updateApiSections(result.activeProvider);
      }
    });
  }
  
  // Show chat button click handler - now opens side panel
  showChatButton.addEventListener('click', () => {
    if (!checkExtensionContext()) {
      alert('Extension context invalid. Please reload the page and try again.');
      return;
    }
    
    // Check if side panel is supported
    if (chrome.sidePanel && chrome.sidePanel.open) {
      console.log('Opening side panel...');
      
      safeTabsQuery({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          alert('Cannot detect current tab. Please try again.');
          return;
        }
        
        // Open side panel
        chrome.sidePanel.open({ tabId: tabs[0].id }).then(() => {
          console.log('Side panel opened successfully');
          window.close(); // Close the popup
        }).catch((error) => {
          console.error('Failed to open side panel:', error);
          // Fallback to content script chat overlay
          fallbackToContentScript();
        });
      });
    } else {
      // Fallback to content script for older browsers
      console.log('Side panel not supported, falling back to content script');
      fallbackToContentScript();
    }
  });
  });
  
  // Fallback to content script chat overlay
  function fallbackToContentScript() {
    safeSendMessage({ action: 'showChat' }, (response) => {
      if (response && response.error) {
        console.error('Error showing chat:', response.error);
        if (response.error.includes('Receiving end does not exist')) {
          alert('Chat extension not loaded. Please reload the page and try again.');
        }
      } else {
        window.close(); // Close the popup after clicking
      }
    });
  }
  
  // Toggle settings panel
  settingsButton.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });
  
  // Handle provider toggle selection
  toggleOptions.forEach(option => {
    option.addEventListener('click', () => {
      const provider = option.getAttribute('data-value');
      toggleContainer.setAttribute('data-selected', provider);
      updateApiSections(provider);
    });
  });
  
  // Function to update API sections based on selected provider
  function updateApiSections(provider) {
    if (provider === 'openai') {
      openaiSection.classList.remove('hidden');
      anthropicSection.classList.add('hidden');
    } else {
      openaiSection.classList.add('hidden');
      anthropicSection.classList.remove('hidden');
    }
  }
  
  // Validate n8n API URL
  function validateN8nApiUrl(url) {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }
  
  // Test n8n API connection
  async function testN8nApiConnection(url, apiKey) {
    try {
      const response = await fetch(`${url}/api/v1/me`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': apiKey
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('n8n API connection test failed:', error);
      return false;
    }
  }
  
  // Save settings with improved error handling and broadcasting
  saveSettingsButton.addEventListener('click', async () => {
    if (!checkExtensionContext()) {
      alert('Extension context invalid. Please reload and try again.');
      return;
    }
    
    const openaiKey = openaiKeyInput.value.trim();
    const anthropicKey = anthropicKeyInput.value.trim();
    const activeProvider = toggleContainer.getAttribute('data-selected');
    const n8nApiUrl = n8nApiUrlInput.value.trim();
    const n8nApiKey = n8nApiKeyInput.value.trim();
    const backendUrl = document.getElementById('backend-url').value.trim();
    
    // Validate n8n API URL if provided
    let n8nApiValid = true;
    if (n8nApiUrl && n8nApiKey) {
      if (!validateN8nApiUrl(n8nApiUrl)) {
        alert('Please enter a valid n8n API URL (e.g., https://your-n8n-instance.com)');
        n8nApiValid = false;
      }
    }
    
    if (!n8nApiValid) return;
    
    // Save settings with error handling
    safeStorageSet({ 
      openaiKey, 
      anthropicKey, 
      activeProvider,
      n8nApiUrl,
      n8nApiKey,
      backendUrl
    }, (error) => {
      if (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings. Please try again.');
        return;
      }
      
      // Show save confirmation
      saveSettingsButton.textContent = 'Saved!';
      
      // Broadcast settings update to background script (which will forward to all listeners)
      safeSendMessage({ 
        action: 'settingsUpdated',
        settings: {
          openaiKey,
          anthropicKey,
          activeProvider,
          n8nApiUrl,
          n8nApiKey,
          backendUrl
        }
      }, (response) => {
        if (response && response.error) {
          console.log('Settings broadcast error (this is normal):', response.error);
        }
      });
      
      // Test n8n API connection if provided
      if (n8nApiUrl && n8nApiKey) {
        testN8nApiConnection(n8nApiUrl, n8nApiKey)
          .then(isConnected => {
            if (isConnected) {
              statusText.textContent += ' (n8n API connected)';
            }
          })
          .catch(err => {
            console.error('API test failed:', err);
          });
      }
      
      setTimeout(() => {
        saveSettingsButton.textContent = 'Save Settings';
      }, 2000);
    });
  });
  
  // Enhanced error handling for extension context
  function handleExtensionError() {
    statusIndicator.classList.add('inactive');
    statusIndicator.classList.remove('active');
    statusText.textContent = 'Extension error - reload page';
    showChatButton.disabled = true;
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: #ff6b6b;
      color: white;
      padding: 10px;
      border-radius: 6px;
      margin: 10px 0;
      text-align: center;
      font-size: 12px;
    `;
    errorDiv.textContent = 'Extension connection lost. Please reload the page.';
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
  }
  
  // Monitor extension context
  function monitorExtensionContext() {
    setInterval(() => {
      if (!checkExtensionContext()) {
        handleExtensionError();
      }
    }, 5000);
  }
  
  // Add keyboard shortcut hint
  function addKeyboardShortcutHint() {
    const footer = document.querySelector('.footer');
    if (footer) {
      const shortcutHint = document.createElement('p');
      shortcutHint.style.cssText = `
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 8px;
      `;
      shortcutHint.innerHTML = 'Tip: Use <kbd>Ctrl+Shift+Y</kbd> to toggle side panel';
      footer.appendChild(shortcutHint);
    }
  }
  
  // Initialize everything
  try {
    if (checkExtensionContext()) {
      initializeStatus();
      loadSettings();
      monitorExtensionContext();
      addKeyboardShortcutHint();
      console.log('Settings panel initialized successfully with side panel support');
    } else {
      handleExtensionError();
    }
  } catch (error) {
    console.error('Initialization error:', error);
    handleExtensionError();
  }
});