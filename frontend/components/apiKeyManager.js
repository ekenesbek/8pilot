// API Key Manager for storing and managing API credentials
export class ApiKeyManager {
  constructor() {
    this.storageKey = '8pilot_api_credentials';
    this.defaultProvider = 'openai';
  }

  // Save API credentials to chrome storage (popup format only)
  async saveCredentials(apiKey, provider = 'openai') {
    try {
      // Save in popup format
      await chrome.storage.sync.set({ 
        openaiApiKey: apiKey,
        provider: provider
      });
      
      console.log('API credentials saved to popup storage:', { provider, hasKey: !!apiKey });
      return true;
    } catch (error) {
      console.error('Error saving API credentials:', error);
      return false;
    }
  }

  // Load API credentials from chrome storage (popup format only)
  async loadCredentials() {
    try {
      // Load from popup format (chrome.storage.sync)
      const syncResult = await chrome.storage.sync.get(['openaiApiKey', 'provider']);
      if (syncResult.openaiApiKey) {
        const credentials = {
          apiKey: syncResult.openaiApiKey,
          provider: syncResult.provider || 'openai',
          timestamp: Date.now()
        };
        
        console.log('API credentials loaded from popup:', { 
          provider: credentials.provider, 
          hasKey: !!credentials.apiKey 
        });
        return credentials;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading API credentials:', error);
      return null;
    }
  }

  // Clear API credentials
  async clearCredentials() {
    try {
      await chrome.storage.sync.remove(['openaiApiKey', 'provider']);
      console.log('API credentials cleared');
      return true;
    } catch (error) {
      console.error('Error clearing API credentials:', error);
      return false;
    }
  }

  // Check if credentials are valid
  async hasValidCredentials() {
    try {
      const result = await chrome.storage.sync.get(['openaiApiKey', 'provider']);
      return result.openaiApiKey && result.openaiApiKey.trim() !== '';
    } catch (error) {
      console.error('Error checking credentials validity:', error);
      return false;
    }
  }

  // Get current provider
  async getCurrentProvider() {
    try {
      const result = await chrome.storage.sync.get(['provider']);
      return result.provider || this.defaultProvider;
    } catch (error) {
      console.error('Error getting current provider:', error);
      return this.defaultProvider;
    }
  }

  // Get current API key
  async getCurrentApiKey() {
    try {
      const result = await chrome.storage.sync.get(['openaiApiKey']);
      return result.openaiApiKey || null;
    } catch (error) {
      console.error('Error getting current API key:', error);
      return null;
    }
  }

  // Show API key setup modal - redirect to popup instead
  showApiKeyModal() {
    // Instead of showing a modal, open the extension popup
    // This will show the existing popup with API configuration
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }
}
