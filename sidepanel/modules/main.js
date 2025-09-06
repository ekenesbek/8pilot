// sidepanel/modules/main.js - Main Initialization Module

// Main application class
class SidepanelApp {
  constructor() {
    this.modules = {};
    this.init();
  }

  async init() {
    console.log('Sidepanel App: Initializing...');
    
    try {
      // Wait for DOM to be fully ready
      await this.waitForDOM();
      
      // Initialize all modules
      await this.initializeModules();
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Initialize UI
      this.initializeUI();
      
      // Start the application
      this.start();
      
      console.log('Sidepanel App: Initialization complete');
      
    } catch (error) {
      console.error('Sidepanel App: Initialization failed:', error);
    }
  }

  // Wait for DOM to be ready
  waitForDOM() {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  // Initialize all modules
  async initializeModules() {
    console.log('Sidepanel App: Initializing modules...');
    
    // Initialize authentication manager first
    console.log('Creating AuthManager...');
    this.modules.auth = new window.AuthManager();
    window.authManager = this.modules.auth;
    console.log('AuthManager created:', this.modules.auth);
    
    // Initialize theme manager
    console.log('Creating ThemeManager...');
    this.modules.theme = new window.ThemeManager();
    window.themeManager = this.modules.theme;
    
    // Initialize settings manager
    console.log('Creating SettingsManager...');
    this.modules.settings = new window.SettingsManager();
    window.settingsManager = this.modules.settings;
    
    // Initialize workflow manager
    console.log('Creating WorkflowManager...');
    this.modules.workflow = new window.WorkflowManager();
    window.workflowManager = this.modules.workflow;
    
    // Initialize chat manager
    console.log('Creating ChatManager...');
    this.modules.chat = new window.ChatManager();
    window.chatManager = this.modules.chat;
    
    // Initialize templates manager
    console.log('Creating TemplatesManager...');
    this.modules.templates = new window.TemplatesManager();
    window.templatesManager = this.modules.templates;
    
    // Initialize n8n manager
    console.log('Creating N8nManager...');
    this.modules.n8n = new window.N8nManager();
    window.n8nManager = this.modules.n8n;
    
    console.log('All modules initialized');
  }

  // Setup global event listeners
  setupGlobalEventListeners() {
    console.log('Sidepanel App: Setting up global event listeners...');
    
    // Listen for theme changes
    window.addEventListener('themeChanged', (event) => {
      console.log('Theme changed to:', event.detail.theme);
      this.updateThemeElements();
    });

    // Listen for tab updates to automatically refresh workflow info
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          // Check if this is the active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
            if (activeTabs[0] && activeTabs[0].id === tabId) {
              console.log('Active tab URL changed, updating workflow info:', tab.url);
              // Update workflow info when URL changes
              setTimeout(() => {
                if (window.workflowManager) {
                  window.workflowManager.getCurrentTabInfo();
                }
              }, 500); // Small delay to ensure page is fully loaded
            }
          });
        }
      });

      // Listen for tab activation to refresh workflow info
      chrome.tabs.onActivated.addListener((activeInfo) => {
        console.log('Tab activated, refreshing workflow info');
        setTimeout(() => {
          if (window.workflowManager) {
            window.workflowManager.getCurrentTabInfo();
          }
        }, 500);
      });
    }
  }

  // Initialize UI
  initializeUI() {
    console.log('Sidepanel App: Initializing UI...');
    
    // Update settings UI
    if (this.modules.settings) {
      this.modules.settings.updateSettingsUI();
    }
    
    // Add welcome message
    if (this.modules.chat) {
      this.modules.chat.addWelcomeMessage();
    }
    
    // Initialize templates
    if (this.modules.templates) {
      this.modules.templates.renderTemplates();
    }
    
    // Start with chat tab
    if (this.modules.settings) {
      this.modules.settings.switchTab('chat');
    }
    
    // Update workflow info
    if (this.modules.workflow) {
      this.modules.workflow.updateWorkflowInfo();
    }
    
    console.log('UI initialization complete');
  }

  // Start the application
  async start() {
    console.log('Sidepanel App: Starting...');
    
    // Check global activation state
    await this.checkGlobalActivationState();
    
    // Get current tab and workflow info
    if (this.modules.workflow) {
      await this.modules.workflow.getCurrentTabInfo();
    }
    
    // Initialize n8n setup
    if (this.modules.n8n) {
      this.modules.n8n.initN8nConnection();
    }
    
    // Show connection prompt when appropriate
    setTimeout(() => {
      if (this.modules.n8n) {
        this.modules.n8n.showN8nConnectionPrompt();
      }
    }, 1000);
    
    console.log('Sidepanel App: Started successfully');
  }

  // Check global activation state
  async checkGlobalActivationState() {
    try {
      const result = await chrome.storage.local.get(['globalActivationState']);
      const isActivated = result.globalActivationState || false;
      
      console.log('Global activation state:', isActivated);
      
      // Update UI based on activation state
      this.updateActivationUI(isActivated);
      
      // Listen for activation state changes
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.globalActivationState) {
          const newState = changes.globalActivationState.newValue;
          console.log('Global activation state changed:', newState);
          this.updateActivationUI(newState);
        }
      });
      
    } catch (error) {
      console.error('Failed to check global activation state:', error);
    }
  }

  // Update UI based on activation state
  updateActivationUI(isActivated) {
    // Update status indicators
    const statusElements = document.querySelectorAll('.status-indicator');
    statusElements.forEach(element => {
      if (isActivated) {
        element.classList.add('activated');
      } else {
        element.classList.remove('activated');
      }
    });
    
    // Update any activation-related UI elements
    const activationElements = document.querySelectorAll('[data-activation-state]');
    activationElements.forEach(element => {
      element.dataset.activationState = isActivated ? 'active' : 'inactive';
    });
  }

  // Update elements that depend on theme
  updateThemeElements() {
    // Update syntax highlighting if needed
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      // Re-apply syntax highlighting with new theme
      block.classList.add('theme-updated');
    });
    
    // Update any canvas or chart elements if present
    this.updateChartThemes();
  }

  // Update chart themes (placeholder for future charts)
  updateChartThemes() {
    // This would update any chart.js or other visualization themes
    if (this.modules.theme) {
      console.log('Updating chart themes for', this.modules.theme.getEffectiveTheme());
    }
  }

  // Get module by name
  getModule(name) {
    return this.modules[name];
  }

  // Get all modules
  getAllModules() {
    return this.modules;
  }

  // Restart the application
  async restart() {
    console.log('Sidepanel App: Restarting...');
    
    // Clean up existing modules
    this.cleanup();
    
    // Re-initialize
    await this.init();
  }

  // Cleanup resources
  cleanup() {
    console.log('Sidepanel App: Cleaning up...');
    
    // Clean up modules
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.cleanup === 'function') {
        module.cleanup();
      }
    });
    
    // Clear modules
    this.modules = {};
    
    // Clear global references
    window.authManager = null;
    window.themeManager = null;
    window.settingsManager = null;
    window.workflowManager = null;
    window.chatManager = null;
    window.templatesManager = null;
    window.n8nManager = null;
  }
}

// Initialize the side panel when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Side panel initializing...');
  
  // Wait a bit for DOM to be fully ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Create and start the main application
  window.sidepanelApp = new SidepanelApp();
  
  console.log('Side panel initialized successfully');
  console.log('Final sidepanelApp state:', window.sidepanelApp);
});

// Export for use in other modules
window.SidepanelApp = SidepanelApp;
