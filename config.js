// Configuration file for 8pilot extension
// This file contains settings that can be customized for different deployments

window.APP_CONFIG = {
  // Backend API configuration
  BACKEND: {
    HOST: 'localhost',
    PORT: 8000,
    PROTOCOL: 'http',
    
    // Computed URL - don't modify this
    get URL() {
      return `${this.PROTOCOL}://${this.HOST}:${this.PORT}`;
    }
  },
  
  // Default settings
  DEFAULTS: {
    AI_PROVIDER: 'openai'
  },
  
  // Feature flags
  FEATURES: {
    DEMO_MODE: false,
    DEBUG: false
  }
};

// Helper function to get backend URL
window.getBackendUrl = function() {
  return window.APP_CONFIG.BACKEND.URL;
};

console.log('8pilot config loaded:', window.APP_CONFIG);
