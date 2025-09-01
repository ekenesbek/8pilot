// sidepanel/modules/n8n.js - N8N Integration Module

// N8N connection state
let n8nConnectionState = {
  isConnected: false,
  detectedUrl: null,
  currentStep: 'detect', // detect, api-setup, connect, completed
  isDetecting: false,
  bannerDismissed: false
};

// N8N Integration Manager
class N8nManager {
  constructor() {
    this.init();
  }

  init() {
    console.log('N8N Manager: Initializing...');
    this.setupEventListeners();
    this.updateN8nUI();
  }

  setupEventListeners() {
    // N8N connection banner events
    const setupAutoBtn = document.getElementById('n8n-setup-auto');
    const setupLaterBtn = document.getElementById('n8n-setup-later');
    const bannerCloseBtn = document.getElementById('n8n-banner-close');
    
    if (setupAutoBtn) {
      setupAutoBtn.addEventListener('click', () => this.showN8nSetupModal());
    }
    
    if (setupLaterBtn) {
      setupLaterBtn.addEventListener('click', () => this.dismissBanner());
    }
    
    if (bannerCloseBtn) {
      bannerCloseBtn.addEventListener('click', () => this.dismissBanner());
    }

    // N8N setup modal events
    const continueSetupBtn = document.getElementById('continue-setup');
    const openApiSettingsBtn = document.getElementById('open-api-settings');
    const testConnectionBtn = document.getElementById('test-connection');
    const apiKeyInput = document.getElementById('api-key-input');
    const pasteApiKeyBtn = document.getElementById('paste-api-key');
    
    if (continueSetupBtn) {
      continueSetupBtn.addEventListener('click', () => this.updateModalStep('api'));
    }
    
    if (openApiSettingsBtn) {
      openApiSettingsBtn.addEventListener('click', () => this.openN8nApiSettings());
    }
    
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => this.testN8nConnection());
    }
    
    if (apiKeyInput) {
      apiKeyInput.addEventListener('input', () => this.validateApiKey());
    }
    
    if (pasteApiKeyBtn) {
      pasteApiKeyBtn.addEventListener('click', () => this.pasteApiKey());
    }

    // Modal close events
    const modalCloseBtn = document.getElementById('n8n-modal-close');
    const modalCloseBtn2 = document.getElementById('n8n-connected-modal-close');
    
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.hideN8nSetupModal());
    }
    
    if (modalCloseBtn2) {
      modalCloseBtn2.addEventListener('click', () => this.hideN8nConnectedModal());
    }

    // Success modal events
    const closeSuccessBtn = document.getElementById('close-success-modal');
    const disconnectBtn = document.getElementById('disconnect-n8n');
    const connectedModalCloseBtn = document.getElementById('connected-modal-close-btn');
    const connectedModalDisconnectBtn = document.getElementById('connected-modal-disconnect-btn');
    
    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener('click', () => this.hideN8nSetupModal());
    }
    
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => this.disconnectN8n());
    }
    
    if (connectedModalCloseBtn) {
      connectedModalCloseBtn.addEventListener('click', () => this.hideN8nConnectedModal());
    }
    
    if (connectedModalDisconnectBtn) {
      connectedModalDisconnectBtn.addEventListener('click', () => this.disconnectN8n());
    }

    // Manual setup
    const manualSetupBtn = document.getElementById('manual-setup');
    if (manualSetupBtn) {
      manualSetupBtn.addEventListener('click', () => this.showManualSetup());
    }
  }

  // Initialize N8N connection detection
  async initN8nConnection() {
    console.log('Initializing N8N connection detection...');
    
    // Check current n8n connection status
    await this.checkN8nConnectionStatus();
    
    // Start detection process
    await this.detectN8nInstance();
    
    // Check if banner was previously dismissed (only after connection status check)
    const dismissed = localStorage.getItem('n8n-banner-dismissed');
    if (dismissed === 'true' && !n8nConnectionState.isConnected) {
      n8nConnectionState.bannerDismissed = true;
    }
    
    // Update UI based on state
    this.updateN8nUI();
  }

  // Check current n8n connection status from settings
  async checkN8nConnectionStatus() {
    try {
      const stored = await this.getStorageData(['n8nApiUrl', 'n8nApiKey']);
      if (stored.n8nApiUrl && stored.n8nApiKey) {
        console.log('Found stored n8n credentials, testing connection...');
        
        // Test the connection
        const result = await this.testN8nConnection(stored.n8nApiUrl, stored.n8nApiKey);
        n8nConnectionState.isConnected = result.success;
        
        if (result.success) {
          n8nConnectionState.currentStep = 'completed';
          n8nConnectionState.detectedUrl = stored.n8nApiUrl;
          
          // Update global settings
          if (window.settings) {
            window.settings.n8nApiUrl = stored.n8nApiUrl;
            window.settings.n8nApiKey = stored.n8nApiKey;
          }
          
          console.log('N8N already connected:', stored.n8nApiUrl);
          console.log('Connected user:', result.data?.email || 'Unknown');
        } else {
          console.log('Stored n8n credentials are invalid:', result.error);
          
          // Clear invalid credentials
          await this.setStorageData({
            n8nApiUrl: null,
            n8nApiKey: null
          });
          n8nConnectionState.isConnected = false;
          n8nConnectionState.currentStep = 'detect';
        }
      } else {
        console.log('No stored n8n credentials found');
        n8nConnectionState.isConnected = false;
      }
    } catch (error) {
      console.error('Error checking n8n connection status:', error);
      n8nConnectionState.isConnected = false;
    }
  }

  // Detect n8n instance from current tab
  async detectN8nInstance() {
    if (n8nConnectionState.isConnected) return;
    
    n8nConnectionState.isDetecting = true;
    this.updateN8nUI();
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const detectedUrl = this.extractN8nBaseUrl(tab.url);
        if (detectedUrl) {
          n8nConnectionState.detectedUrl = detectedUrl;
          console.log('Detected n8n instance:', detectedUrl);
        }
      }
    } catch (error) {
      console.error('Error detecting n8n instance:', error);
    } finally {
      n8nConnectionState.isDetecting = false;
      this.updateN8nUI();
    }
  }

  // Extract base n8n URL from current page URL
  extractN8nBaseUrl(url) {
    if (!url || !this.isN8nPage(url)) return null;
    
    try {
      const urlObj = new URL(url);
      console.log('Extracting n8n base URL from:', url);
      console.log('URL components:', {
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        port: urlObj.port,
        protocol: urlObj.protocol
      });
      
      let baseUrl = null;
      
      // Priority 1: n8n cloud instances (*.n8n.cloud)
      if (urlObj.hostname.endsWith('.n8n.cloud')) {
        baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
        console.log('Detected n8n cloud instance:', baseUrl);
        return baseUrl;
      }
      
      // Priority 2: n8n in hostname (e.g., n8n.example.com, n8n-instance.com)
      if (urlObj.hostname.includes('n8n')) {
        baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`;
        console.log('Detected n8n in hostname:', baseUrl);
        return baseUrl;
      }
      
      // Priority 3: Standard n8n ports (5678)
      if (urlObj.port === '5678' || urlObj.hostname === 'localhost') {
        baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`;
        console.log('Detected n8n on standard port:', baseUrl);
        return baseUrl;
      }
      
      // Priority 4: n8n in path (e.g., example.com/n8n/workflow/123)
      if (urlObj.pathname.includes('/n8n')) {
        const n8nIndex = urlObj.pathname.indexOf('/n8n');
        const basePath = urlObj.pathname.substring(0, n8nIndex + 4); // +4 to include '/n8n'
        baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${basePath}`;
        console.log('Detected n8n in path:', baseUrl);
        return baseUrl;
      }
      
      // Priority 5: If we detect workflow/execution patterns, assume root
      if (urlObj.pathname.includes('workflow') || urlObj.pathname.includes('execution')) {
        baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`;
        console.log('Detected workflow pattern, assuming root:', baseUrl);
        return baseUrl;
      }
      
      console.log('Could not extract n8n base URL from:', url);
      return null;
    } catch (e) {
      console.error('Error extracting n8n base URL:', e);
      return null;
    }
  }

  // Check if it's an n8n page
  isN8nPage(url) {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      
      // Check for various n8n patterns
      return (
        // n8n in hostname (e.g., kkengesbek.app.n8n.cloud, n8n.example.com)
        hostname.includes('n8n') ||
        // n8n in path (e.g., example.com/n8n)
        pathname.includes('/n8n') ||
        // workflow in path (common n8n pattern)
        pathname.includes('/workflow') ||
        pathname.includes('/execution') ||
        // Common n8n ports
        (urlObj.port === '5678') ||
        // localhost development
        (hostname === 'localhost' && (urlObj.port === '5678' || pathname.includes('workflow')))
      );
    } catch (e) {
      // Fallback to basic string matching
      return url.includes('n8n') || url.includes('workflow') || url.includes('execution');
    }
  }

  // Update N8N UI elements based on current state
  updateN8nUI() {
    // Always update the sidepanel settings card first
    this.updateSidepanelN8nCard();
    
    const banner = document.getElementById('n8n-connection-banner');
    const detectedBadge = document.getElementById('n8n-detected-badge');
    const bannerDescription = document.getElementById('n8n-banner-description');
    const setupAutoBtn = document.getElementById('n8n-setup-auto');
    
    // If banner doesn't exist, only update the card
    if (!banner) return;
    
    // Show/hide banner
    if (n8nConnectionState.isConnected || n8nConnectionState.bannerDismissed) {
      banner.classList.add('hidden');
      return;
    }
    
    banner.classList.remove('hidden');
    
    // Update detected badge and description
    if (n8nConnectionState.detectedUrl) {
      if (detectedBadge) detectedBadge.classList.remove('hidden');
      if (bannerDescription) {
        bannerDescription.textContent = `Найден ваш n8n: ${n8nConnectionState.detectedUrl}. Настройте за один клик!`;
      }
      if (setupAutoBtn) setupAutoBtn.textContent = 'Настроить автоматически';
    } else {
      if (detectedBadge) detectedBadge.classList.add('hidden');
      if (bannerDescription) {
        bannerDescription.textContent = 'Создавайте и управляйте рабочими процессами прямо из чата';
      }
      if (setupAutoBtn) setupAutoBtn.textContent = 'Настроить n8n';
    }
  }

  // Update sidepanel n8n integration card
  updateSidepanelN8nCard() {
    const card = document.getElementById('sidepanel-n8n-integration-card');
    if (!card) return;
    
    if (n8nConnectionState.isConnected) {
      card.innerHTML = `
        <div class="n8n-card connected">
          <div class="n8n-card-header">
            <div class="n8n-card-icon connected">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="n8n-card-title">n8n Connected</div>
            <div class="n8n-card-status connected">Connected</div>
          </div>
          <div class="n8n-card-content">
            <div class="n8n-card-url">${n8nConnectionState.detectedUrl || 'Unknown'}</div>
            <div class="n8n-card-actions">
              <button class="n8n-card-btn" onclick="window.n8nManager.showN8nConnectedModal()">View Details</button>
              <button class="n8n-card-btn danger" onclick="window.n8nManager.disconnectN8n()">Disconnect</button>
            </div>
          </div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="n8n-card disconnected">
          <div class="n8n-card-header">
            <div class="n8n-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="n8n-card-title">n8n Integration</div>
            <div class="n8n-card-status">Not Connected</div>
          </div>
          <div class="n8n-card-content">
            <div class="n8n-card-description">Connect to n8n to create and manage workflows</div>
            <div class="n8n-card-actions">
              <button class="n8n-card-btn primary" onclick="window.n8nManager.showN8nSetupModal()">Connect</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Show N8N setup modal
  showN8nSetupModal() {
    const modal = document.getElementById('n8n-setup-modal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Initialize modal state
      if (n8nConnectionState.detectedUrl) {
        this.updateModalStep('detect');
        const detectedUrlEl = document.getElementById('detected-url');
        if (detectedUrlEl) detectedUrlEl.textContent = n8nConnectionState.detectedUrl;
      } else {
        // Go directly to manual setup
        this.updateModalStep('connect');
      }
    }
  }

  // Hide N8N setup modal
  hideN8nSetupModal() {
    const modal = document.getElementById('n8n-setup-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Show N8N connected modal
  showN8nConnectedModal() {
    const modal = document.getElementById('n8n-connected-modal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Update instance URL
      const instanceUrlEl = document.getElementById('connected-modal-instance-url');
      if (instanceUrlEl) {
        instanceUrlEl.textContent = n8nConnectionState.detectedUrl || 'Unknown';
      }
    }
  }

  // Hide N8N connected modal
  hideN8nConnectedModal() {
    const modal = document.getElementById('n8n-connected-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Update modal step
  updateModalStep(step) {
    // Update step indicators
    document.querySelectorAll('.step-item').forEach(item => {
      item.classList.remove('active', 'completed');
    });
    
    // Update step content
    document.querySelectorAll('.step-content-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    // Show current step
    const currentStepEl = document.getElementById(`step-${step}-content`);
    if (currentStepEl) {
      currentStepEl.classList.add('active');
    }
    
    // Update step indicator
    const stepIndicator = document.getElementById(`step-${step}`);
    if (stepIndicator) {
      stepIndicator.classList.add('active');
    }
    
    // Mark previous steps as completed
    const steps = ['detect', 'api', 'connect'];
    const currentIndex = steps.indexOf(step);
    for (let i = 0; i < currentIndex; i++) {
      const prevStep = document.getElementById(`step-${steps[i]}`);
      if (prevStep) {
        prevStep.classList.add('completed');
      }
    }
  }

  // Open n8n API settings
  openN8nApiSettings() {
    if (n8nConnectionState.detectedUrl) {
      const apiUrl = `${n8nConnectionState.detectedUrl}/settings/api`;
      chrome.tabs.create({ url: apiUrl });
    }
  }

  // Validate API key input
  validateApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    const testConnectionBtn = document.getElementById('test-connection');
    
    if (apiKeyInput && testConnectionBtn) {
      const isValid = apiKeyInput.value.trim().length > 0;
      testConnectionBtn.disabled = !isValid;
    }
  }

  // Paste API key from clipboard
  async pasteApiKey() {
    try {
      const text = await navigator.clipboard.readText();
      const apiKeyInput = document.getElementById('api-key-input');
      if (apiKeyInput) {
        apiKeyInput.value = text;
        this.validateApiKey();
      }
    } catch (error) {
      console.error('Failed to paste API key:', error);
    }
  }

  // Test n8n connection
  async testN8nConnection() {
    const apiKeyInput = document.getElementById('api-key-input');
    if (!apiKeyInput) return;
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return;
    
    const url = n8nConnectionState.detectedUrl;
    if (!url) {
      this.showError('No n8n URL detected. Please navigate to an n8n page first.');
      return;
    }
    
    // Update UI to show loading state
    const testBtn = document.getElementById('test-connection');
    const testText = document.getElementById('test-connection-text');
    const testLoader = document.getElementById('test-connection-loader');
    
    if (testBtn && testText && testLoader) {
      testBtn.disabled = true;
      testText.textContent = 'Testing connection...';
      testLoader.classList.remove('hidden');
    }
    
    try {
      const result = await this.testN8nConnection(url, apiKey);
      
      if (result.success) {
        // Save credentials
        await this.setStorageData({
          n8nApiUrl: url,
          n8nApiKey: apiKey
        });
        
        // Update global settings
        if (window.settings) {
          window.settings.n8nApiUrl = url;
          window.settings.n8nApiKey = apiKey;
        }
        
        // Update connection state
        n8nConnectionState.isConnected = true;
        n8nConnectionState.currentStep = 'completed';
        
        // Show success step
        this.updateModalStep('success');
        
        // Update connected instance URL
        const connectedInstanceUrl = document.getElementById('connected-instance-url');
        if (connectedInstanceUrl) {
          connectedInstanceUrl.textContent = url;
        }
        
        // Update UI
        this.updateN8nUI();
        
        // Hide banner
        n8nConnectionState.bannerDismissed = true;
        localStorage.setItem('n8n-banner-dismissed', 'true');
        
      } else {
        this.showError(`Connection failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Connection test error:', error);
      this.showError(`Connection test failed: ${error.message}`);
    } finally {
      // Reset UI state
      if (testBtn && testText && testLoader) {
        testBtn.disabled = false;
        testText.textContent = 'Подключить n8n';
        testLoader.classList.add('hidden');
      }
    }
  }

  // Test n8n connection with detailed error handling
  async testN8nConnection(url, apiKey) {
    if (!url || !apiKey) {
      console.error('URL or API key is missing');
      return { success: false, error: 'URL or API key is missing' };
    }

    try {
      // Clean URL (remove trailing slash)
      const cleanUrl = url.replace(/\/$/, '');
      
      // Try different n8n API endpoints for health check
      const possibleEndpoints = [
        `${cleanUrl}/api/v1/workflows`,  // Most common endpoint
        `${cleanUrl}/rest/workflows`,    // Alternative REST endpoint
        `${cleanUrl}/api/v1/users/me`,   // User info endpoint
        `${cleanUrl}/api/v1/executions`, // Executions endpoint
        `${cleanUrl}/rest/executions`    // Alternative executions endpoint
      ];
      
      let testUrl = possibleEndpoints[0]; // Start with workflows endpoint
      
      console.log('Testing n8n connection...');
      console.log('API Key length:', apiKey.length);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Try each endpoint until one works
      let lastError = null;
      
      for (let i = 0; i < possibleEndpoints.length; i++) {
        testUrl = possibleEndpoints[i];
        console.log(`Trying endpoint ${i + 1}/${possibleEndpoints.length}:`, testUrl);
        
        try {
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'X-N8N-API-KEY': apiKey,
              'Accept': 'application/json'
            },
            signal: controller.signal
          });

          console.log(`Response status for ${testUrl}:`, response.status);
      
          if (response.ok) {
            clearTimeout(timeoutId);
            const responseData = await response.json();
            console.log('n8n connection successful with endpoint:', testUrl);
            console.log('Response data:', responseData);
            
            // Extract user info if available
            let userData = {};
            if (testUrl.includes('/users/me') && responseData) {
              userData = {
                email: responseData.email || 'Unknown',
                firstName: responseData.firstName || '',
                lastName: responseData.lastName || '',
                id: responseData.id
              };
            } else {
              // For other endpoints, just confirm it's working
              userData = {
                email: 'Connected',
                firstName: '',
                lastName: '',
                id: 'api-connected'
              };
            }
            
            return { 
              success: true, 
              data: userData,
              endpoint: testUrl
            };
          } else {
            // Store the error but continue trying other endpoints
            const errorText = await response.text();
            lastError = {
              status: response.status,
              message: errorText,
              endpoint: testUrl
            };
            console.log(`Endpoint ${testUrl} failed with status ${response.status}, trying next...`);
          }
          
        } catch (endpointError) {
          lastError = {
            status: 0,
            message: endpointError.message,
            endpoint: testUrl
          };
          console.log(`Endpoint ${testUrl} failed with error:`, endpointError.message);
        }
      }
      
      // All endpoints failed
      clearTimeout(timeoutId);
      
      if (lastError) {
        let errorMessage;
        switch (lastError.status) {
          case 401:
            errorMessage = 'Неверный API ключ. Проверьте корректность ключа.';
            break;
          case 403:
            errorMessage = 'API ключ не имеет необходимых прав доступа.';
            break;
          case 404:
            errorMessage = 'API endpoints не найдены. Возможно, n8n недоступен или URL неверный.';
            break;
          case 500:
            errorMessage = 'Внутренняя ошибка сервера n8n.';
            break;
          case 0:
            errorMessage = `Ошибка соединения: ${lastError.message}`;
            break;
          default:
            errorMessage = `Ошибка подключения: HTTP ${lastError.status}`;
        }
        
        return { 
          success: false, 
          error: errorMessage, 
          status: lastError.status,
          details: `Проверены endpoints: ${possibleEndpoints.join(', ')}`
        };
      }
      
      return { success: false, error: 'Все API endpoints недоступны' };
    } catch (error) {
      console.error('N8N connection test failed:', error);
      
      let errorMessage;
      if (error.name === 'AbortError') {
        errorMessage = 'Время ожидания соединения истекло. Проверьте URL и доступность сервера.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте URL и доступность n8n.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Ошибка CORS. Возможно, необходимо настроить разрешения на сервере n8n.';
      } else {
        errorMessage = `Ошибка соединения: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Disconnect n8n
  async disconnectN8n() {
    if (confirm('Вы уверены, что хотите отключить n8n?')) {
      try {
        // Clear stored credentials
        await this.setStorageData({
          n8nApiUrl: null,
          n8nApiKey: null
        });
        
        // Update global settings
        if (window.settings) {
          window.settings.n8nApiUrl = '';
          window.settings.n8nApiKey = '';
        }
        
        // Reset connection state
        n8nConnectionState.isConnected = false;
        n8nConnectionState.currentStep = 'detect';
        n8nConnectionState.detectedUrl = null;
        
        // Update UI
        this.updateN8nUI();
        
        // Show banner again
        n8nConnectionState.bannerDismissed = false;
        localStorage.removeItem('n8n-banner-dismissed');
        
        // Hide modals
        this.hideN8nSetupModal();
        this.hideN8nConnectedModal();
        
        console.log('N8N disconnected successfully');
        
      } catch (error) {
        console.error('Error disconnecting n8n:', error);
      }
    }
  }

  // Dismiss banner
  dismissBanner() {
    n8nConnectionState.bannerDismissed = true;
    localStorage.setItem('n8n-banner-dismissed', 'true');
    this.updateN8nUI();
  }

  // Show manual setup
  showManualSetup() {
    // TODO: Implement manual setup interface
    console.log('Manual setup not implemented yet');
  }

  // Show error message
  showError(message) {
    // TODO: Implement error display
    console.error('Error:', message);
    alert(message);
  }

  // Storage helper methods
  async getStorageData(keys) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(keys, resolve);
      } else {
        // Fallback for non-extension context
        const result = {};
        keys.forEach(key => {
          result[key] = localStorage.getItem(`8pilot_${key}`);
        });
        resolve(result);
      }
    });
  }

  async setStorageData(data) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set(data, resolve);
      } else {
        // Fallback for non-extension context
        Object.keys(data).forEach(key => {
          if (data[key] === null) {
            localStorage.removeItem(`8pilot_${key}`);
          } else {
            localStorage.setItem(`8pilot_${key}`, data[key]);
          }
        });
        resolve();
      }
    });
  }

  // Get connection state
  getConnectionState() {
    return n8nConnectionState;
  }

  // Check if connected
  isConnected() {
    return n8nConnectionState.isConnected;
  }
}

// Export for use in other modules
window.N8nManager = N8nManager;
window.n8nConnectionState = n8nConnectionState;
window.initN8nConnection = () => window.n8nManager?.initN8nConnection();
window.updateN8nUI = () => window.n8nManager?.updateN8nUI();
window.showN8nSetupModal = () => window.n8nManager?.showN8nSetupModal();
