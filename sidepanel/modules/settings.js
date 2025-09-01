// sidepanel/modules/settings.js - Settings Management Module

// Settings manager
class SettingsManager {
  constructor() {
    this.settings = {
      activeProvider: 'openai',
      backendUrl: '',
      n8nApiUrl: '',
      n8nApiKey: '',
      autoApplyWorkflows: false,
      saveChatHistory: true,
      maxHistory: 25
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateSettingsUI();
  }

  setupEventListeners() {
    // Settings panel toggle
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const logoutSettingsBtn = document.getElementById('logout-settings-btn');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettings());
    }
    
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => this.hideSettings());
    }
    
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }
    
    if (logoutSettingsBtn) {
      logoutSettingsBtn.addEventListener('click', () => this.handleLogout());
    }

    // Provider toggle
    const providerBtns = document.querySelectorAll('.provider-btn');
    providerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchProvider(e.target.dataset.provider));
    });

    // Theme selection
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        if (window.themeManager) {
          window.themeManager.setTheme(e.target.value);
        }
      });
    }

    // Auto-resize textarea
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
      });
    }

    // History search
    const historySearch = document.getElementById('history-search');
    if (historySearch) {
      historySearch.addEventListener('input', (e) => this.searchHistory(e.target.value));
    }

    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // Templates
    const createTemplateBtn = document.getElementById('create-template-btn');
    if (createTemplateBtn) {
      createTemplateBtn.addEventListener('click', () => this.createTemplate());
    }

    const categoryBtns = document.querySelectorAll('.category');
    categoryBtns.forEach(cat => {
      cat.addEventListener('click', (e) => this.filterTemplates(e.target.dataset.category));
    });

    // Workflow controls
    const workflowRefreshBtn = document.getElementById('workflow-refresh-btn');
    if (workflowRefreshBtn) {
      workflowRefreshBtn.addEventListener('click', async () => {
        console.log('Workflow refresh button clicked');
        if (window.getCurrentTabInfo) {
          await window.getCurrentTabInfo();
        }
        if (window.loadWorkflowStats) {
          await window.loadWorkflowStats();
        }
        this.showToast('Workflow info refreshed!', 'success');
      });
    }

    // Workflows tab refresh button
    const refreshWorkflowsBtn = document.getElementById('refresh-workflows-btn');
    if (refreshWorkflowsBtn) {
      refreshWorkflowsBtn.addEventListener('click', () => {
        if (window.chatManager) {
          window.chatManager.renderWorkflowsList();
        }
        this.showToast('Workflows list refreshed!', 'success');
      });
    }

    // Navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.closest('.nav-tab').dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Header controls
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshSidePanel());
    }
  }

  // Load settings from chrome storage
  async loadSettings() {
    try {
      const stored = await this.getStorageData([
        'activeProvider', 'n8nApiUrl', 'n8nApiKey', 'autoApplyWorkflows', 
        'saveChatHistory', 'maxHistory', 'backendUrl'
      ]);
      
      this.settings = { ...this.settings, ...stored };
      
      // Set default backend URL if not configured
      if (!this.settings.backendUrl) {
        this.settings.backendUrl = window.getBackendUrl();
      }
      
      // Validate and update API status
      this.updateApiStatus();
      
      // Update global settings
      window.settings = this.settings;
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  // Update API status based on current settings
  updateApiStatus() {
    // API keys are now configured on the backend
    // We assume they are available and properly configured
    this.updateStatus('api', 'active', '');
  }

  // Update status indicators
  updateStatus(type, status, text) {
    const indicator = document.getElementById(`${type}-status`);
    const textEl = document.getElementById(`${type}-status-text`);
    
    if (indicator && textEl) {
      indicator.className = `status-indicator ${status}`;
      textEl.textContent = text;
    }
    
    // Update API status specifically - avoid recursive calls
    if (type === 'api') {
      // API keys are now configured on the backend
      if (status !== 'active') {
        // Only update if status is different to avoid recursion
        indicator.className = 'status-indicator active';
      }
    }
  }

  // Show settings panel
  showSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
      settingsPanel.classList.remove('hidden');
    }
  }

  // Hide settings panel
  hideSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
      settingsPanel.classList.add('hidden');
    }
  }

  // Switch provider
  switchProvider(provider) {
    this.settings.activeProvider = provider;
    this.updateSettingsUI();
    
    // Update API status after switching provider
    this.updateApiStatus();
  }

  // Update settings UI
  updateSettingsUI() {
    // Provider toggle
    const providerBtns = document.querySelectorAll('.provider-btn');
    providerBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.provider === this.settings.activeProvider);
    });
    
    // Show/hide provider configs
    const openaiConfig = document.getElementById('openai-config');
    const anthropicConfig = document.getElementById('anthropic-config');
    
    if (openaiConfig) {
      openaiConfig.classList.toggle('hidden', this.settings.activeProvider !== 'openai');
    }
    if (anthropicConfig) {
      anthropicConfig.classList.toggle('hidden', this.settings.activeProvider !== 'anthropic');
    }
    
    // Fill in values
    const backendUrlInput = document.getElementById('backend-url');
    const n8nUrlInput = document.getElementById('n8n-url');
    const n8nKeyInput = document.getElementById('n8n-key');
    const autoApplyCheckbox = document.getElementById('auto-apply-workflows');
    const saveHistoryCheckbox = document.getElementById('save-chat-history');
    const maxHistorySelect = document.getElementById('max-history');
    
    if (backendUrlInput) backendUrlInput.value = this.settings.backendUrl || window.getBackendUrl();
    if (n8nUrlInput) n8nUrlInput.value = this.settings.n8nApiUrl || '';
    if (n8nKeyInput) n8nKeyInput.value = this.settings.n8nApiKey || '';
    if (autoApplyCheckbox) autoApplyCheckbox.checked = this.settings.autoApplyWorkflows;
    if (saveHistoryCheckbox) saveHistoryCheckbox.checked = this.settings.saveChatHistory;
    if (maxHistorySelect) maxHistorySelect.value = this.settings.maxHistory;
    
    // Theme setting
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect && window.themeManager) {
      themeSelect.value = window.themeManager.currentTheme;
    }
    
    // Update API status after updating UI
    this.updateApiStatus();
  }

  // Save settings
  async saveSettings() {
    // Get values from UI
    const backendUrlInput = document.getElementById('backend-url');
    const n8nUrlInput = document.getElementById('n8n-url');
    const n8nKeyInput = document.getElementById('n8n-key');
    const autoApplyCheckbox = document.getElementById('auto-apply-workflows');
    const saveHistoryCheckbox = document.getElementById('save-chat-history');
    const maxHistorySelect = document.getElementById('max-history');
    
    if (backendUrlInput) this.settings.backendUrl = backendUrlInput.value.trim();
    if (n8nUrlInput) this.settings.n8nApiUrl = n8nUrlInput.value.trim();
    if (n8nKeyInput) this.settings.n8nApiKey = n8nKeyInput.value.trim();
    if (autoApplyCheckbox) this.settings.autoApplyWorkflows = autoApplyCheckbox.checked;
    if (saveHistoryCheckbox) this.settings.saveChatHistory = saveHistoryCheckbox.checked;
    if (maxHistorySelect) this.settings.maxHistory = parseInt(maxHistorySelect.value);
    
    try {
      await this.setStorageData(this.settings);
      
      // Update global settings
      window.settings = this.settings;
      
      // Update API status after saving
      this.updateApiStatus();
      
      this.showToast('Settings saved!', 'success');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  // Test backend connection
  async testBackendConnection() {
    const backendUrlInput = document.getElementById('backend-url');
    if (!backendUrlInput) return;
    
    const url = backendUrlInput.value.trim();
    
    if (!url) {
      this.showToast('Please enter backend URL', 'error');
      return;
    }
    
    try {
      const response = await fetch(`${url}/health`);
      
      if (response.ok) {
        this.showToast('Backend connection successful!', 'success');
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      this.showToast(`Backend connection failed: ${error.message}`, 'error');
    }
  }

  // Switch between tabs
  switchTab(tabName) {
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
      if (window.chatManager) {
        window.chatManager.loadHistoryList();
      }
    } else if (tabName === 'workflows') {
      if (window.chatManager) {
        window.chatManager.renderWorkflowsList();
      }
    } else if (tabName === 'templates') {
      if (window.renderTemplates) {
        window.renderTemplates();
      }
    }
    
    // Update workflow info when switching to chat tab
    if (tabName === 'chat') {
      if (window.updateWorkflowInfo) {
        window.updateWorkflowInfo();
      }
    }
  }

  // Handle logout
  handleLogout() {
    console.log('Logout button clicked, authManager:', window.authManager);
    if (window.authManager) {
      window.authManager.logout();
    } else {
      console.error('authManager not available');
      // Fallback: reload page to show auth overlay
      window.location.reload();
    }
  }

  // Search history
  searchHistory(query) {
    // TODO: Implement history search
    console.log('Searching history for:', query);
  }

  // Clear history
  clearHistory() {
    if (confirm('Clear all chat history? This cannot be undone.')) {
      if (window.chatManager) {
        window.chatManager.clearHistory();
      }
    }
  }

  // Create template
  createTemplate() {
    if (window.chatManager) {
      window.chatManager.addMessage('assistant', 'Template creation from current workflow coming soon!');
    }
  }

  // Filter templates
  filterTemplates(category) {
    // Update active category
    document.querySelectorAll('.category').forEach(cat => {
      cat.classList.toggle('active', cat.dataset.category === category);
    });
    
    if (window.renderTemplates) {
      window.renderTemplates(category);
    }
  }

  // Refresh side panel
  async refreshSidePanel() {
    if (window.getCurrentTabInfo) {
      await window.getCurrentTabInfo();
    }
    if (window.loadWorkflowStats) {
      await window.loadWorkflowStats();
    }
    this.showToast('Refreshed!', 'success');
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `${type}-message`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
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

  // Get settings
  getSettings() {
    return this.settings;
  }

  // Update specific setting
  updateSetting(key, value) {
    this.settings[key] = value;
    this.setStorageData({ [key]: value });
  }
}

// Export for use in other modules
window.SettingsManager = SettingsManager;
