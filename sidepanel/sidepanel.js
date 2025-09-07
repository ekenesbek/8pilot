// sidepanel/sidepanel.js - Full integration with chatbot logic + Theme Support + Authentication

// Language support
const translations = {
  en: {
    subtitle: "AI-powered assistant for building n8n workflows",
    login: "Login",
    signup: "Sign Up",
    email: "Email:",
    password: "Password:",
    confirm_password: "Confirm Password:",
    login_btn: "Login",
    signup_btn: "Sign Up",
    forgot_password: "Forgot Password?",
    demo_text: "Want to try without registration?",
    demo_btn: "Demo Mode",
    enter_password: "Enter password",
    password_min_8: "Enter password (minimum 8 characters)",
    repeat_password: "Repeat password",
    // Error messages
    email_required: "Email is required",
    password_required: "Password is required",
    confirm_password_required: "Password confirmation is required",
    password_min_length: "Password must be at least 8 characters long",
    passwords_not_match: "Passwords do not match",
    email_already_exists: "Email is already registered",
    invalid_credentials: "Invalid email or password",
    account_created: "Account created! Now you can log in.",
    welcome_message: "Welcome!",
    demo_mode_activated: "Going to demo mode...",
    account_creation_error: "Error creating account",

  },
  ru: {
    subtitle: "AI-помощник для эффективного создания n8n рабочих процессов",
    login: "Вход",
    signup: "Регистрация",
    email: "Email:",
    password: "Пароль:",
    confirm_password: "Подтвердите пароль:",
    login_btn: "Войти",
    signup_btn: "Зарегистрироваться",
    forgot_password: "Забыли пароль?",
    demo_text: "Хотите попробовать без регистрации?",
    demo_btn: "Демо режим",
    enter_password: "Введите пароль",
    password_min_8: "Введите пароль (минимум 8 символов)",
    repeat_password: "Повторите пароль",
    // Error messages
    email_required: "Email обязателен",
    password_required: "Пароль обязателен",
    confirm_password_required: "Подтверждение пароля обязательно",
    password_min_length: "Пароль должен содержать минимум 8 символов",
    passwords_not_match: "Пароли не совпадают",
    email_already_exists: "Email уже зарегистрирован",
    invalid_credentials: "Неверный email или пароль",
    account_created: "Аккаунт создан! Теперь вы можете войти.",
    welcome_message: "Добро пожаловать!",
    demo_mode_activated: "Переходим в демо режим...",
    account_creation_error: "Ошибка при создании аккаунта",

  }
};

let currentLang = 'en';

// Language switching functionality
function setLanguage(lang) {
  console.log('Setting language to:', lang);
  currentLang = lang;
  
  // Update active button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  
  // Update all translatable elements
  const translatableElements = document.querySelectorAll('[data-i18n]');
  console.log('Found translatable elements:', translatableElements.length);
  
  translatableElements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    console.log('Updating element with key:', key, 'for language:', lang);
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
      console.log('Updated element:', key, 'to:', translations[lang][key]);
    } else {
      console.warn('Translation not found for key:', key, 'in language:', lang);
    }
  });
  
  // Update placeholders
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  console.log('Found placeholder elements:', placeholderElements.length);
  
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });
  
  console.log('Language switch completed. Current language:', currentLang);
}

// Authentication System
class AuthManager {
  constructor() {
    this.isAuthenticated = false;
    this.isDemoMode = false;
    this.currentUser = null;
    this.authOverlay = document.getElementById('auth-overlay');
    this.tokenRefreshTimer = null;
    this.init();
  }

  async init() {
    console.log('AuthManager: Initializing...');
    this.setupAuthForms();
    console.log('Auth forms setup complete, checking auth status...');
    await this.checkAuthStatus();
    console.log('AuthManager: Initialization complete');
  }

  setupAuthForms() {
    console.log('AuthManager: Setting up auth forms...');
    
    // Language switcher setup
    const langBtns = document.querySelectorAll('.lang-btn');
    console.log('AuthManager: Found language buttons:', langBtns.length);
    
    langBtns.forEach(btn => {
      console.log('AuthManager: Adding click listener to button:', btn.getAttribute('data-lang'));
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        console.log('AuthManager: Language button clicked:', lang);
        setLanguage(lang);
      });
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const tabHeader = document.querySelector('.tab-header');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update tab header data attribute for CSS animation
        tabHeader.setAttribute('data-active', targetTab);
        
        // Show corresponding form
        authForms.forEach(form => {
          form.classList.remove('active');
          if (form.id === `${targetTab}-form`) {
            form.classList.add('active');
          }
        });
        
        // Clear errors when switching tabs
        if (targetTab === 'login') {
          this.clearLoginErrors();
        } else if (targetTab === 'signup') {
          this.clearSignupErrors();
        }
        

      });
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      console.log('AuthManager: Found login form, adding submit listener');
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
      
      // Clear errors on input
      document.getElementById('login-email').addEventListener('input', () => {
        this.clearFieldError('login-email-error');
      });
      document.getElementById('login-password').addEventListener('input', () => {
        this.clearFieldError('login-password-error');
      });
    } else {
      console.error('AuthManager: Login form not found!');
    }

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      console.log('AuthManager: Found signup form, adding submit listener');
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
      
      // Clear errors on input
      document.getElementById('signup-email').addEventListener('input', () => {
        this.clearFieldError('signup-email-error');
      });
      document.getElementById('signup-password').addEventListener('input', () => {
        this.clearFieldError('signup-password-error');
      });
      document.getElementById('signup-confirm-password').addEventListener('input', () => {
        this.clearFieldError('signup-confirm-password-error');
      });
    } else {
      console.error('AuthManager: Signup form not found!');
    }

    // Demo mode
    const demoBtn = document.getElementById('demo-mode');
    if (demoBtn) {
      console.log('AuthManager: Found demo button, adding click listener');
      demoBtn.addEventListener('click', () => this.activateDemoMode());
    } else {
      console.error('AuthManager: Demo button not found!');
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    // Clear previous errors
    this.clearLoginErrors();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validate fields
    let hasErrors = false;
    
    if (!email) {
      this.showFieldError('login-email-error', this.getTranslation('email_required'));
      hasErrors = true;
    }
    
    if (!password) {
      this.showFieldError('login-password-error', this.getTranslation('password_required'));
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    try {
      const backendUrl = await this.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        await this.saveAuthData(data);
        this.showAuthMessage('success', this.getTranslation('welcome_message'));
        
        setTimeout(() => {
          this.hideAuthOverlay();
          
          // After successful login, initialize n8n connection detection
          setTimeout(() => {
            initN8nConnection();
          }, 500);
        }, 1500);
      } else {
        throw new Error(data.detail || 'Ошибка входа');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show generic error message for login under password field
      this.showFieldError('login-password-error', this.getTranslation('invalid_credentials'));
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    console.log('Signup form submitted');
    
    // Clear previous errors
    this.clearSignupErrors();
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    console.log('Form data:', { email, passwordLength: password.length, confirmPasswordLength: confirmPassword.length });
    
    // Validate fields
    let hasErrors = false;
    
    if (!email) {
      this.showFieldError('signup-email-error', this.getTranslation('email_required'));
      hasErrors = true;
    }
    
    if (!password) {
      this.showFieldError('signup-password-error', this.getTranslation('password_required'));
      hasErrors = true;
    } else if (password.length < 8) {
      this.showFieldError('signup-password-error', this.getTranslation('password_min_length'));
      hasErrors = true;
    }
    
    if (!confirmPassword) {
      this.showFieldError('signup-confirm-password-error', this.getTranslation('confirm_password_required'));
      hasErrors = true;
    } else if (password !== confirmPassword) {
      this.showFieldError('signup-confirm-password-error', this.getTranslation('passwords_not_match'));
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    console.log('Validation passed, starting registration...');
    
    try {
      const backendUrl = await this.getBackendUrl();
      console.log('Backend URL:', backendUrl);
      
      const requestBody = { email, password };
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${backendUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.id) {
        console.log('Registration successful');
        this.showAuthMessage('success', this.getTranslation('account_created'));
        
        // Switch to login tab
        setTimeout(() => {
          document.querySelector('[data-tab="login"]').click();
          document.getElementById('login-email').value = email;
          document.getElementById('login-password').value = password;
        }, 2000);
      } else {
        throw new Error(data.detail || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific backend errors
      if (error.message.includes('already registered')) {
        this.showFieldError('signup-email-error', this.getTranslation('email_already_exists'));
      } else {
        this.showAuthMessage('error', this.getTranslation('account_creation_error'));
      }
    }
  }

  async activateDemoMode() {
    const confirmMessage = currentLang === 'ru' 
      ? 'Демо режим предоставляет ограниченный доступ к функциям. Продолжить?'
      : 'Demo mode provides limited access to features. Continue?';
      
    if (confirm(confirmMessage)) {
      await this.saveDemoData();
      this.showAuthMessage('success', this.getTranslation('demo_mode_activated'));
      
      setTimeout(() => {
        this.hideAuthOverlay();
        
        // After demo mode activation, initialize n8n connection detection
        setTimeout(() => {
          initN8nConnection();
        }, 500);
      }, 1500);
    }
  }

  async checkAuthStatus() {
    console.log('checkAuthStatus called');
    try {
      const result = await this.getStorageData(['isAuthenticated', 'authToken', 'userInfo', 'isDemoMode', 'userLoggedOut']);
      console.log('Storage data result:', result);
      
      if (result.isDemoMode) {
        console.log('Demo mode detected, showing demo mode');
        this.isDemoMode = true;
        this.hideAuthOverlay();
        this.showDemoMode();
        
        // Initialize n8n connection detection for demo mode
        setTimeout(() => {
          initN8nConnection();
        }, 500);
        return;
      }
      
      // Check if user explicitly logged out
      if (result.userLoggedOut) {
        console.log('User previously logged out, showing auth overlay');
        this.showAuthOverlay();
        return;
      }
      
      if (result.isAuthenticated && result.authToken) {
        console.log('User is authenticated, verifying token');
        // Verify token with backend
        const isValid = await this.verifyToken(result.authToken);
        if (isValid) {
          console.log('Token is valid, showing authenticated mode');
          this.isAuthenticated = true;
          this.currentUser = result.userInfo;
          this.hideAuthOverlay();
          this.showAuthenticatedMode();
          
          // Initialize n8n connection detection for authenticated user
          setTimeout(() => {
            initN8nConnection();
          }, 500);
          return;
        } else {
          console.log('Token verification failed');
          // Don't immediately clear auth data, could be a network issue
          // Only clear if we're sure the token is expired
          console.log('Showing auth overlay due to token verification failure');
        }
      }
      
      // Not authenticated, show auth overlay
      console.log('Not authenticated, showing auth overlay');
      this.showAuthOverlay();
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.showAuthOverlay();
    }
  }

  async saveAuthData(data) {
    try {
      await this.setStorageData({
        authToken: data.access_token,
        userInfo: data.user,
        isAuthenticated: true,
        isDemoMode: false,
        userLoggedOut: false  // Clear logout flag on successful login
      });
      
      this.isAuthenticated = true;
      this.currentUser = data.user;
      this.isDemoMode = false;
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  }

  async saveDemoData() {
    try {
      await this.setStorageData({
        isDemoMode: true,
        demoModeActivated: new Date().toISOString(),
        isAuthenticated: false,
        authToken: null,
        userInfo: null
      });
      
      this.isDemoMode = true;
      this.isAuthenticated = false;
      this.currentUser = null;
    } catch (error) {
      console.error('Error saving demo data:', error);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      const backendUrl = await this.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Token expired, attempting to refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          console.log('Token successfully refreshed');
          return true;
        } else {
          console.log('Failed to refresh token');
          // Clear auth data only if refresh definitely failed
          await this.clearAuthData();
          return false;
        }
      }
      
      if (response.ok) {
        // Update user info from response
        try {
          const userData = await response.json();
          await this.setStorageData({ userInfo: userData });
          this.currentUser = userData;
        } catch (e) {
          console.error('Error updating user info:', e);
        }
        return true;
      }
      
      // For other HTTP errors, don't clear auth data
      console.log('Token verification failed with status:', response.status);
      return false;
    } catch (error) {
      console.error('Token verification error (network/other):', error);
      // For network errors, don't clear auth data - might be temporary
      return false;
    }
  }

  async refreshToken() {
    try {
      const result = await this.getStorageData(['authToken']);
      if (!result.authToken) {
        console.log('No token found for refresh');
        return false;
      }
      
      const backendUrl = await this.getBackendUrl();
      console.log('Attempting to refresh token...');
      
      const response = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${result.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Token refresh successful');
        await this.setStorageData({
          authToken: data.access_token
        });
        return true;
      } else {
        console.log('Token refresh failed:', response.status, response.statusText);
        // If refresh fails with 401, the refresh token is also expired
        if (response.status === 401) {
          console.log('Refresh token expired, clearing auth data');
          await this.clearAuthData();
        }
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async clearAuthData() {
    try {
      await this.setStorageData({
        isAuthenticated: false,
        isDemoMode: false,
        authToken: null,
        userInfo: null,
        demoModeActivated: null
      });
      
      this.isAuthenticated = false;
      this.isDemoMode = false;
      this.currentUser = null;
      
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  async getUserInfo() {
    try {
      const result = await this.getStorageData(['authToken']);
      if (!result.authToken) return null;
      
      const backendUrl = await this.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${result.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Update stored user info
        await this.setStorageData({ userInfo: userData });
        this.currentUser = userData;
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  async getBackendUrl() {
    try {
      // First try to get from global settings
      if (typeof settings !== 'undefined' && settings.backendUrl) {
        return settings.backendUrl;
      }
      
      // Then try to get from storage
      const result = await this.getStorageData(['backendUrl']);
      if (result.backendUrl) {
        return result.backendUrl;
      }
      
      // Fallback to config default
      return window.getBackendUrl();
    } catch (error) {
      console.error('Error getting backend URL:', error);
      return window.getBackendUrl();
    }
  }

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
          localStorage.setItem(`8pilot_${key}`, data[key]);
        });
        resolve();
      }
    });
  }

  showAuthOverlay() {
    console.log('showAuthOverlay called');
    this.authOverlay.classList.remove('hidden');
    console.log('Auth overlay shown');
  }

  hideAuthOverlay() {
    console.log('hideAuthOverlay called');
    this.authOverlay.classList.add('hidden');
    console.log('Auth overlay hidden');
  }



  showAuthMessage(type, text) {
    console.log('Showing auth message:', type, text);
    
    // Create and show message
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = text;
    
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.appendChild(messageDiv);
      console.log('Auth message added to container');
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
          console.log('Auth message removed');
        }
      }, 5000);
    } else {
      console.error('Auth container not found');
    }
  }

  showFieldError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearFieldError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  clearSignupErrors() {
    this.clearFieldError('signup-email-error');
    this.clearFieldError('signup-password-error');
    this.clearFieldError('signup-confirm-password-error');
  }

  clearLoginErrors() {
    this.clearFieldError('login-email-error');
    this.clearFieldError('login-password-error');
  }

  getTranslation(key) {
    if (translations[currentLang] && translations[currentLang][key]) {
      return translations[currentLang][key];
    }
    // Fallback to English if translation not found
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    // Final fallback
    return key;
  }

  showDemoMode() {
    console.log('showDemoMode called');
    // Show demo mode indicators
    const demoIndicator = document.createElement('div');
    demoIndicator.className = 'demo-indicator';
    demoIndicator.innerHTML = '🎭 <strong>Демо режим</strong> - Ограниченный доступ';
    demoIndicator.style.cssText = `
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      padding: 10px;
      border-radius: 6px;
      margin: 10px 0;
      text-align: center;
      font-size: 12px;
      border: 1px solid rgba(245, 158, 11, 0.2);
    `;
    
    const container = document.querySelector('.sidepanel-container');
    if (container) {
      container.insertBefore(demoIndicator, container.firstChild);
      console.log('Demo indicator added to container');
    } else {
      console.error('Container not found for demo indicator');
    }
  }

  showAuthenticatedMode() {
    console.log('showAuthenticatedMode called');
    // Show logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
      logoutBtn.addEventListener('click', () => this.logout());
      console.log('Logout button shown and listener added');
    } else {
      console.error('Logout button not found');
    }
    
    // Update user info display
    this.updateUserInfoDisplay();
    
    // Start token refresh timer (every 25 minutes)
    this.startTokenRefreshTimer();
  }

  updateUserInfoDisplay() {
    if (this.currentUser) {
      // Update header to show user info
      const headerTitle = document.querySelector('.header-title .title-text');
      if (headerTitle) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
          <div class="user-email">${this.currentUser.email}</div>
          <div class="user-created">Member since ${new Date(this.currentUser.created_at).toLocaleDateString()}</div>
        `;
        headerTitle.appendChild(userInfo);
      }
    }
  }

  startTokenRefreshTimer() {
    // Clear existing timer
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }
    
    // Set new timer (30 days = 2592000000 ms)
    this.tokenRefreshTimer = setInterval(async () => {
      try {
        const result = await this.getStorageData(['authToken']);
        if (result.authToken) {
          await this.refreshToken();
          console.log('Token refreshed automatically');
        }
      } catch (error) {
        console.error('Auto token refresh error:', error);
      }
    }, 2592000000); // 30 days
  }

  stopTokenRefreshTimer() {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  async logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
      try {
        // Stop token refresh timer first
        this.stopTokenRefreshTimer();
        
        // Get current token for logout request
        const result = await this.getStorageData(['authToken']);
        
        // Call backend logout endpoint if we have a token
        if (result.authToken) {
          try {
            const backendUrl = await this.getBackendUrl();
            await fetch(`${backendUrl}/api/v1/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${result.authToken}`,
                'Content-Type': 'application/json'
              }
            });
            console.log('Server logout successful');
          } catch (error) {
            console.log('Server logout failed, but continuing with client logout:', error);
          }
        }
        
        // Clear all authentication data
        await this.clearAuthData();
        
        // Set explicit logout flag to prevent auto re-login
        await this.setStorageData({
          userLoggedOut: true
        });
        
        // Also clear any cached data except the logout flag
        if (typeof chrome !== 'undefined' && chrome.storage) {
          // Don't use sync.clear() as it would remove the logout flag
          const keysToRemove = ['isAuthenticated', 'authToken', 'userInfo', 'isDemoMode', 'demoModeActivated'];
          for (const key of keysToRemove) {
            await chrome.storage.sync.remove(key);
          }
        } else {
          // Clear localStorage fallback but keep logout flag
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('8pilot_') && key !== '8pilot_userLoggedOut') {
              localStorage.removeItem(key);
            }
          });
        }
        
        // Reset internal state
        this.isAuthenticated = false;
        this.isDemoMode = false;
        this.currentUser = null;
        
        // Show auth overlay immediately instead of reloading
        this.showAuthOverlay();
        
        console.log('Logout completed successfully');
      } catch (error) {
        console.error('Logout error:', error);
        // Force reload as fallback
        window.location.reload();
      }
    }
  }
}

// Theme management
class ThemeManager {
  constructor() {
    this.currentTheme = 'auto'; // 'light', 'dark', 'auto'
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.init();
  }

  init() {
    // Load saved theme preference
    this.loadThemePreference();
    
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.applySystemTheme();
      }
    });
    
    // Apply initial theme
    this.applyTheme();
    
    // Add theme toggle if needed (future feature)
    this.setupThemeToggle();
  }

  loadThemePreference() {
    const saved = localStorage.getItem('8pilot_theme');
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.currentTheme = saved;
    }
  }

  saveThemePreference() {
    localStorage.setItem('8pilot_theme', this.currentTheme);
  }

  applyTheme() {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    
    if (this.currentTheme === 'light') {
      body.classList.add('theme-light');
    } else if (this.currentTheme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      // Auto mode - let CSS media query handle it
      this.applySystemTheme();
    }
  }

  applySystemTheme() {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    
    // CSS media query will handle the theme in auto mode
    console.log('Using system theme:', this.mediaQuery.matches ? 'dark' : 'light');
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.saveThemePreference();
    this.applyTheme();
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: this.getEffectiveTheme() } 
    }));
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  setupThemeToggle() {
    // Create theme toggle button (hidden by default)
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.style.display = 'none'; // Hidden for now
    toggle.innerHTML = '🌓';
    toggle.title = 'Toggle theme';
    toggle.onclick = () => this.cycleTheme();
    document.body.appendChild(toggle);
  }

  cycleTheme() {
    const themes = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    this.setTheme(nextTheme);
  }
}

// Chat storage - workflow-specific
let currentWorkflowId = null;
let allWorkflowChats = {};
let chatMemory = [];
let settings = {
  activeProvider: 'openai',
  backendUrl: '',
  n8nApiUrl: '',
  n8nApiKey: '',
  autoApplyWorkflows: false,
  saveChatHistory: true,
  maxHistory: 25
};

// Theme manager instance
let themeManager;

// Storage keys
const STORAGE_KEYS = {
  WORKFLOW_CHATS: '8pilot_workflow_chats',
  LAST_ACTIVE_WORKFLOW: '8pilot_last_workflow'
};

// Initialize the side panel
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Side panel initializing...');
  
  // Wait a bit for DOM to be fully ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Initialize authentication manager first
  console.log('Creating AuthManager...');
  window.authManager = new AuthManager();
  console.log('AuthManager created:', window.authManager);
  
  // Setup N8N event listeners (but don't initialize detection yet)
  setupN8nEventListeners();
  
  // Initialize n8n card display (will show default state)
  updateSidepanelN8nCard();
  
  // Initialize theme manager
  console.log('Creating ThemeManager...');
  themeManager = new ThemeManager();
  
  // Load settings and chat storage
  await loadSettings();
  loadChatStorage();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize language (set to English by default)
  console.log('Initializing language...');
  setLanguage('en');
  
  // Debug: Check if language buttons exist
  setTimeout(() => {
    const langBtns = document.querySelectorAll('.lang-btn');
    console.log('Language buttons after initialization:', langBtns.length);
    langBtns.forEach(btn => {
      console.log('Button:', btn.getAttribute('data-lang'), 'Element:', btn);
    });
  }, 100);
  
  // Get current tab and workflow info
  await getCurrentTabInfo();
  
  // Initialize UI
  initializeUI();
  
  // Initialize n8n setup
  initializeN8nSetup();
  
  // Show connection prompt when appropriate
  setTimeout(showN8nConnectionPrompt, 1000);
  
  console.log('Side panel initialized successfully');
  console.log('Final authManager state:', window.authManager);
});

// Listen for theme changes
window.addEventListener('themeChanged', (event) => {
  console.log('Theme changed to:', event.detail.theme);
  
  // Update any theme-dependent elements
  updateThemeElements();
});

// Listen for tab updates to automatically refresh workflow info
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (activeTabs[0] && activeTabs[0].id === tabId) {
        console.log('Active tab URL changed, updating workflow info:', tab.url);
        // Update workflow info when URL changes
        setTimeout(() => {
          getCurrentTabInfo();
        }, 500); // Small delay to ensure page is fully loaded
      }
    });
  }
});

// Listen for tab activation to refresh workflow info
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated, refreshing workflow info');
  setTimeout(() => {
    getCurrentTabInfo();
  }, 500);
});

// Update elements that depend on theme
function updateThemeElements() {
  // Update syntax highlighting if needed
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    // Re-apply syntax highlighting with new theme
    block.classList.add('theme-updated');
  });
  
  // Update any canvas or chart elements if present
  updateChartThemes();
}

// Update chart themes (placeholder for future charts)
function updateChartThemes() {
  // This would update any chart.js or other visualization themes
  console.log('Updating chart themes for', themeManager.getEffectiveTheme());
}

// Get current workflow ID from URL
function getCurrentWorkflowId(url) {
  if (!url) return null;
  
  if (url.includes('/workflow/new')) {
    return 'new_workflow';
  }
  
  const workflowIdMatch = url.match(/workflow\/([^/?]+)/);
  return workflowIdMatch ? workflowIdMatch[1] : 'unknown_workflow';
}

// Check if it's an n8n page
function isN8nPage(url) {
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

// Extract base n8n URL from current page URL
function extractN8nBaseUrl(url) {
  if (!url || !isN8nPage(url)) return null;
  
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

// Get current tab information
async function getCurrentTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const url = tab.url;
      const isN8n = isN8nPage(url);
      
      // Update status
      updateStatus('page', isN8n ? 'active' : 'warning', 
        isN8n ? 'n8n page detected' : 'Not an n8n page');
      
      // Get workflow ID
      currentWorkflowId = getCurrentWorkflowId(url);
      updateWorkflowInfo();
      
      // Load chat for this workflow
      loadWorkflowChat(currentWorkflowId);
    }
  } catch (error) {
    console.error('Failed to get current tab:', error);
    updateStatus('page', 'error', 'Connection failed');
  }
}

// Load settings from chrome storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get([
      'activeProvider', 'n8nApiUrl', 'n8nApiKey', 'autoApplyWorkflows', 
      'saveChatHistory', 'maxHistory', 'backendUrl'
    ]);
    
    settings = { ...settings, ...stored };
    
    // Set default backend URL if not configured
    if (!settings.backendUrl) {
      settings.backendUrl = window.getBackendUrl();
    }
    
    // Validate and update API status
    updateApiStatus();
      
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Update API status based on current settings
function updateApiStatus() {
  // API keys are now configured on the backend
  // We assume they are available and properly configured
  updateStatus('api', 'active', '');
}

// Load chat storage from localStorage
function loadChatStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOW_CHATS);
    if (stored) {
      allWorkflowChats = JSON.parse(stored);
      console.log('Loaded chat storage:', Object.keys(allWorkflowChats).length, 'workflows');
    }
  } catch (error) {
    console.error('Error loading chat storage:', error);
    allWorkflowChats = {};
  }
}

// Save chat storage to localStorage
function saveChatStorage() {
  try {
    // Clean up old chats (keep only last 50 workflows)
    const workflowIds = Object.keys(allWorkflowChats);
    if (workflowIds.length > 50) {
      const sortedByTime = workflowIds
        .map(id => ({ id, lastActivity: allWorkflowChats[id].lastActivity || 0 }))
        .sort((a, b) => b.lastActivity - a.lastActivity)
        .slice(0, 50);
      
      const newChats = {};
      sortedByTime.forEach(({ id }) => {
        newChats[id] = allWorkflowChats[id];
      });
      allWorkflowChats = newChats;
    }
    
    localStorage.setItem(STORAGE_KEYS.WORKFLOW_CHATS, JSON.stringify(allWorkflowChats));
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_WORKFLOW, currentWorkflowId);
  } catch (error) {
    console.error('Error saving chat storage:', error);
  }
}

// Load chat for current workflow
function loadWorkflowChat(workflowId) {
  if (!workflowId) return;
  
  currentWorkflowId = workflowId;
  
  if (allWorkflowChats[workflowId]) {
    chatMemory = allWorkflowChats[workflowId].messages || [];
    console.log(`Loaded ${chatMemory.length} messages for workflow:`, workflowId);
    
    // Show notification about loaded chat
    const workflowName = allWorkflowChats[workflowId].workflowName || workflowId;
    showToast(`Loaded chat for: ${workflowName}`, 'info');
  } else {
    chatMemory = [];
    allWorkflowChats[workflowId] = {
      messages: [],
      workflowName: workflowId === 'new_workflow' ? 'New Workflow' : 'Unknown Workflow',
      lastActivity: Date.now(),
      createdAt: Date.now()
    };
    console.log('Created new chat for workflow:', workflowId);
    
    // Show notification about new chat
    const workflowName = workflowId === 'new_workflow' ? 'New Workflow' : `Workflow ${workflowId}`;
    showToast(`Started new chat for: ${workflowName}`, 'success');
  }
  
  refreshChatUI();
}

// Save current chat to storage
function saveCurrentChat() {
  if (!currentWorkflowId) return;
  
  allWorkflowChats[currentWorkflowId] = {
    ...allWorkflowChats[currentWorkflowId],
    messages: chatMemory,
    lastActivity: Date.now()
  };
  
  saveChatStorage();
  
  // Update workflows list if it's currently visible
  const workflowsTab = document.getElementById('workflows-tab');
  if (workflowsTab && !workflowsTab.classList.contains('hidden')) {
    renderWorkflowsList();
  }
}

// Setup all event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  // Language switcher (both top and old positions)
  const langBtns = document.querySelectorAll('.lang-btn');
  console.log('Found language buttons:', langBtns.length);
  
  langBtns.forEach(btn => {
    console.log('Adding click listener to button:', btn.getAttribute('data-lang'));
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      console.log('Language button clicked:', lang);
      setLanguage(lang);
    });
  });

  // Header controls
  document.getElementById('refresh-btn').addEventListener('click', refreshSidePanel);
  document.getElementById('settings-btn').addEventListener('click', showSettings);
  
  // Workflow controls
  document.getElementById('workflow-refresh-btn').addEventListener('click', async () => {
    console.log('Workflow refresh button clicked');
    await getCurrentTabInfo();
    await loadWorkflowStats();
    showToast('Workflow info refreshed!', 'success');
  });
  
  // Workflows tab refresh button
  document.getElementById('refresh-workflows-btn').addEventListener('click', () => {
    renderWorkflowsList();
    showToast('Workflows list refreshed!', 'success');
  });

  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.closest('.nav-tab').dataset.tab;
      switchTab(tabName);
    });
  });

  // Chat functionality
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('loading-btn').addEventListener('click', stopGeneration);
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Settings functionality
  document.getElementById('close-settings-btn').addEventListener('click', hideSettings);
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('logout-settings-btn').addEventListener('click', () => {
    console.log('Logout button clicked, authManager:', window.authManager);
    if (window.authManager) {
      window.authManager.logout();
    } else {
      console.error('authManager not available');
      // Fallback: reload page to show auth overlay
      window.location.reload();
    }
  });

  // Provider toggle
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchProvider(e.target.dataset.provider));
  });

  // Theme selection
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      if (themeManager) {
        themeManager.setTheme(e.target.value);
      }
    });
  }

  // Auto-resize textarea
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // History search
  document.getElementById('history-search').addEventListener('input', (e) => searchHistory(e.target.value));
  document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

  // Templates
  document.getElementById('create-template-btn').addEventListener('click', createTemplate);
  document.querySelectorAll('.category').forEach(cat => {
    cat.addEventListener('click', (e) => filterTemplates(e.target.dataset.category));
  });
  
  console.log('Event listeners setup complete');
}

// Initialize UI
function initializeUI() {
  console.log('Initializing UI...');
  updateSettingsUI();
  addWelcomeMessage();
  initializeTemplates();
  switchTab('chat'); // Start with chat tab
  console.log('UI initialization complete');
}

// Update status indicators
function updateStatus(type, status, text) {
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

// Update workflow information display
function updateWorkflowInfo() {
  const nameEl = document.getElementById('workflow-name');
  const idEl = document.getElementById('workflow-id');
  const statusEl = document.getElementById('workflow-status');
  
  if (currentWorkflowId) {
    const workflowName = allWorkflowChats[currentWorkflowId]?.workflowName || 
      (currentWorkflowId === 'new_workflow' ? 'New Workflow' : `Workflow ${currentWorkflowId}`);
    
    nameEl.textContent = workflowName;
    idEl.textContent = currentWorkflowId;
    
    // Update workflow status
    if (currentWorkflowId === 'new_workflow') {
      statusEl.textContent = 'New';
      statusEl.style.background = 'var(--success)';
      statusEl.style.color = 'white';
      statusEl.style.borderColor = 'var(--success)';
    } else if (currentWorkflowId === 'unknown_workflow') {
      statusEl.textContent = 'Unknown';
      statusEl.style.background = 'var(--warning)';
      statusEl.style.color = 'white';
      statusEl.style.borderColor = 'var(--warning)';
    } else {
      statusEl.textContent = 'Active';
      statusEl.style.background = 'var(--primary-blue)';
      statusEl.style.color = 'white';
      statusEl.style.borderColor = 'var(--primary-blue)';
    }
  } else {
    nameEl.textContent = 'No workflow detected';
    idEl.textContent = '-';
    statusEl.textContent = '-';
    statusEl.style.background = 'var(--bg-tertiary)';
    statusEl.style.color = 'var(--text-quaternary)';
    statusEl.style.borderColor = 'var(--border-secondary)';
  }
}

// Load workflow stats from n8n API (simplified - just update name if available)
async function loadWorkflowStats() {
  if (!settings.n8nApiUrl || !settings.n8nApiKey || !currentWorkflowId || 
      currentWorkflowId === 'unknown_workflow' || currentWorkflowId === 'new_workflow') {
    return;
  }
  
  try {
    const response = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${currentWorkflowId}`, {
      headers: { 'X-N8N-API-KEY': settings.n8nApiKey }
    });
    
    if (response.ok) {
      const workflow = await response.json();
      
      // Update workflow name if we got it from API
      if (workflow.name && allWorkflowChats[currentWorkflowId]) {
        allWorkflowChats[currentWorkflowId].workflowName = workflow.name;
        document.getElementById('workflow-name').textContent = workflow.name;
        saveChatStorage();
      }
    }
  } catch (error) {
    console.error('Failed to load workflow stats:', error);
  }
}

// Switch between tabs
function switchTab(tabName) {
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
    loadHistoryList();
  } else if (tabName === 'workflows') {
    renderWorkflowsList();
  } else if (tabName === 'templates') {
    renderTemplates();
  }
  
  // Update workflow info when switching to chat tab
  if (tabName === 'chat') {
    updateWorkflowInfo();
  }
}

// Add welcome message
function addWelcomeMessage() {
  // API keys are now managed on the backend
  if (!currentWorkflowId || currentWorkflowId === 'unknown_workflow') {
    addMessage('assistant', 
      'Welcome! I can help you build n8n workflows. Navigate to an n8n workflow page to get started.', 
      false
    );
  } else {
    const workflowName = allWorkflowChats[currentWorkflowId]?.workflowName || currentWorkflowId;
    addMessage('assistant', 
      `Hello! I'm here to help you build your n8n workflow "${workflowName}". What would you like to add or modify?`, 
      false
    );
  }
}

// Render workflows list
function renderWorkflowsList() {
  const workflowsList = document.getElementById('workflows-list');
  if (!workflowsList) return;
  
  workflowsList.innerHTML = '';
  
  const workflowIds = Object.keys(allWorkflowChats);
  
  if (workflowIds.length === 0) {
    workflowsList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-tertiary);">
        <p>No workflow chats yet</p>
        <p style="font-size: 12px; margin-top: 8px;">Navigate to an n8n workflow to start chatting</p>
      </div>
    `;
    return;
  }
  
  // Sort workflows by last activity (most recent first)
  const sortedWorkflows = workflowIds
    .map(id => ({ id, ...allWorkflowChats[id] }))
    .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
  
  sortedWorkflows.forEach(workflow => {
    const workflowItem = document.createElement('div');
    workflowItem.className = `workflow-item ${workflow.id === currentWorkflowId ? 'active' : ''}`;
    
    const workflowName = workflow.workflowName || 
      (workflow.id === 'new_workflow' ? 'New Workflow' : `Workflow ${workflow.id}`);
    
    const messageCount = workflow.messages ? workflow.messages.length : 0;
    const lastActivity = workflow.lastActivity ? new Date(workflow.lastActivity).toLocaleDateString() : 'Unknown';
    
    workflowItem.innerHTML = `
      <div class="workflow-item-info">
        <div class="workflow-item-name">${workflowName}</div>
        <div class="workflow-item-id">${workflow.id} • ${messageCount} messages • ${lastActivity}</div>
      </div>
      <div class="workflow-item-actions">
        <button class="workflow-item-btn load" data-workflow-id="${workflow.id}">Load</button>
        <button class="workflow-item-btn delete" data-workflow-id="${workflow.id}">Delete</button>
      </div>
    `;
    
    // Add event listeners
    const loadBtn = workflowItem.querySelector('.workflow-item-btn.load');
    const deleteBtn = workflowItem.querySelector('.workflow-item-btn.delete');
    
    loadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadWorkflowChat(workflow.id);
      switchTab('chat');
      showToast(`Loaded chat for: ${workflowName}`, 'success');
    });
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete chat for workflow "${workflowName}"? This action cannot be undone.`)) {
        delete allWorkflowChats[workflow.id];
        saveChatStorage();
        renderWorkflowsList();
        showToast(`Deleted chat for: ${workflowName}`, 'success');
        
        // If this was the current workflow, clear it
        if (workflow.id === currentWorkflowId) {
          currentWorkflowId = null;
          chatMemory = [];
          refreshChatUI();
          updateWorkflowInfo();
        }
      }
    });
    
    workflowsList.appendChild(workflowItem);
  });
}

// Refresh chat UI with current workflow's messages
function refreshChatUI() {
  const messagesArea = document.getElementById('chat-messages');
  if (!messagesArea) return;
  
  // Clear current messages
  messagesArea.innerHTML = '';
  
  // Restore messages from memory
  chatMemory.forEach(message => {
    addMessageToUI(message.role === 'user' ? 'user' : 'assistant', message.content, false);
  });
  
  // Add welcome message if no history
  if (chatMemory.length === 0) {
    addWelcomeMessage();
  }
  
  // Scroll to bottom
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Send message with streaming
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Reset generation stopped flag
  window.isGenerationStopped = false;
  
  // Start loading state
  startLoading();
  
  // Clear input
  input.value = '';
  input.style.height = '60px';
  
  // Add user message
  addMessage('user', message);
  
  // Check if user is requesting workflow creation but n8n is not connected
  const isWorkflowRequest = /создай|создать|сделай|сделать|workflow|автоматизаци|процесс|integration|веб-хук|webhook|n8n/i.test(message);
  
  if (isWorkflowRequest && !n8nConnectionState.isConnected) {
    // Show n8n setup prompt
    setTimeout(() => {
      addMessage('assistant', 
        '🔧 Для создания рабочих процессов необходимо подключение к n8n. Хотите настроить подключение сейчас? Нажмите на кнопку "Настроить автоматически" в появившемся баннере выше.', 
        'n8n-prompt'
      );
      
      // Show banner if it was dismissed
      n8nConnectionState.bannerDismissed = false;
      localStorage.removeItem('n8n-banner-dismissed');
      updateN8nUI();
    }, 500);
    return;
  }
  
  // Remove typing indicator (replaced by streaming)
  hideTypingIndicator();
  
  try {
    // Call AI API with streaming
    const response = await callAI(message);
    
    // Save the complete response to chat memory
    if (response && response.trim()) {
      // Update chat memory with the final response
      chatMemory.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      
      // Save to storage
      if (currentWorkflowId && allWorkflowChats[currentWorkflowId]) {
        allWorkflowChats[currentWorkflowId].messages = chatMemory;
        allWorkflowChats[currentWorkflowId].lastActivity = Date.now();
        saveCurrentChat();
      }
      
      // Check for workflow JSON in the complete response
      processWorkflowResponse(response);
    }
    
  } catch (error) {
    console.error('AI API error:', error);
    
    // Remove any streaming message on error
    const streamingMsg = document.getElementById('streaming-message');
    if (streamingMsg) {
      streamingMsg.remove();
    }
    
    // Provide more specific error messages
    let errorMessage = 'Failed to get AI response';
    if (error.message.includes('API key')) {
      errorMessage = `Invalid ${settings.activeProvider} API key. Please check your settings.`;
    } else if (error.message.includes('Backend API error')) {
      errorMessage = 'Backend service unavailable. Please check if the backend is running.';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else {
      errorMessage = `Error: ${error.message}`;
    }
    
    addMessage('assistant', errorMessage);
  }
  
  // Stop loading state
  stopLoading();
}

// Call AI API with streaming
async function callAI(message) {
  const provider = settings.activeProvider;
  
  // API keys are now managed on the backend
  
  // Use our backend API with streaming
  try {
    const backendUrl = settings.backendUrl || window.getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        workflow_id: currentWorkflowId || 'default',
        provider: provider,
        // Pass n8n API credentials if available
        n8n_api_url: settings.n8nApiUrl,
        n8n_api_key: settings.n8nApiKey
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    // Handle streaming response
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      // Create streaming message element
      const streamingMessageDiv = createStreamingMessage();
      
      try {
        while (true) {
          // Check if generation was stopped
          if (window.isGenerationStopped) {
            break;
          }
          
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.chunk) {
                  fullResponse += parsed.chunk;
                  updateStreamingMessage(streamingMessageDiv, fullResponse);
                }
              } catch (e) {
                // Skip invalid JSON chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        finalizeStreamingMessage(streamingMessageDiv);
      }
      
      return fullResponse;
    } else {
      // Fallback to non-streaming if streaming not supported
      const data = await response.json();
      return data.response || data.message || 'No response from backend';
    }
    
  } catch (error) {
    console.error('Backend API error:', error);
    
    // Backend is not available and API keys are managed on backend
    console.log('Backend API unavailable, cannot fallback to direct API calls');
    throw new Error('Backend API is unavailable. Please check backend service.');
  }
}

// Call OpenAI API with streaming (fallback)
async function callOpenAIDirect(message, apiKey) {
  const messages = [
    {
      role: 'system',
      content: `You are an n8n expert. Help users create working n8n workflows.

For each request provide:
1. Brief explanation of the solution
2. Valid JSON workflow for n8n

JSON must contain:
- nodes: array with node parameters
- connections: links between nodes
- pinData: {} (empty object)

Each node must have:
- parameters: node settings
- name: unique name
- type: node type (e.g., "n8n-nodes-base.gmail")
- typeVersion: 1
- position: [x, y] coordinates
- id: unique ID

Simple structure example:
{
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [100, 100],
      "id": "node1"
    }
  ],
  "connections": {},
  "pinData": {}
}

Create only working, tested configurations.`
    },
    ...chatMemory.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',              
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  
  // Create message element for streaming
  const streamingMessageDiv = createStreamingMessage();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              updateStreamingMessage(streamingMessageDiv, fullResponse);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    finalizeStreamingMessage(streamingMessageDiv);
  }
  
  return fullResponse || 'No response received';
}

// Call Anthropic API with streaming (fallback)
async function callAnthropicDirect(message, apiKey) {
  const messages = [
    ...chatMemory.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      system: `You are 8pilot, an AI assistant specializing in n8n workflow automation. Help users build effective n8n workflows by providing guidance and generating workflow components.`,
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API request failed');
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  
  // Create message element for streaming
  const streamingMessageDiv = createStreamingMessage();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta?.text;
              if (delta) {
                fullResponse += delta;
                updateStreamingMessage(streamingMessageDiv, fullResponse);
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    finalizeStreamingMessage(streamingMessageDiv);
  }
  
  return fullResponse || 'No response received';
}

// Create streaming message element with simple animated dot
function createStreamingMessage() {
  const messagesContainer = document.getElementById('chat-messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message assistant streaming';
  messageDiv.id = 'streaming-message';
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar assistant';
  avatar.textContent = 'AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Add simple animated dot
  const dot = document.createElement('span');
  dot.className = 'streaming-dot';
  
  contentDiv.appendChild(dot);
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

// Update streaming message content
function updateStreamingMessage(messageDiv, content) {
  const contentDiv = messageDiv.querySelector('.message-content');
  
  // Remove animated dot and add content
  const dot = contentDiv.querySelector('.streaming-dot');
  if (dot) {
    dot.remove();
  }
  
  // Add formatted content
  contentDiv.innerHTML = formatMessage(content);
  
  // Auto-scroll to bottom
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Finalize streaming message with smooth transition
function finalizeStreamingMessage(messageDiv) {
  const contentDiv = messageDiv.querySelector('.message-content');
  
  // Add finalized class for smooth transition
  messageDiv.classList.add('finalized');
  
  // Smooth transition to final state
  setTimeout(() => {
    // Remove streaming classes and attributes
    messageDiv.classList.remove('streaming');
    messageDiv.removeAttribute('id');
    
    // Add completion effect
    messageDiv.style.transition = 'all 0.5s ease';
    messageDiv.style.transform = 'translateY(0)';
    messageDiv.style.opacity = '1';
    
    // Remove transition after animation
    setTimeout(() => {
      messageDiv.style.transition = '';
      messageDiv.style.transform = '';
      messageDiv.style.opacity = '';
    }, 500);
  }, 200); // Wait for typing indicator to fade out
}

// Add message to chat
function addMessage(role, content, messageType = 'normal', saveToHistory = true) {
  addMessageToUI(role, content, messageType, saveToHistory);
  
  if (saveToHistory && settings.saveChatHistory) {
    // Add to current chat
    chatMemory.push({
      role: role,
      content: content,
      type: messageType,
      timestamp: Date.now()
    });
    
    // Update workflow chat
    if (currentWorkflowId && allWorkflowChats[currentWorkflowId]) {
      allWorkflowChats[currentWorkflowId].messages = chatMemory;
      allWorkflowChats[currentWorkflowId].lastActivity = Date.now();
      
      // Save to storage
      saveCurrentChat();
    }
  }
}

// Add message to UI
function addMessageToUI(role, content, messageType = 'normal', saveToHistory = true) {
  const messagesContainer = document.getElementById('chat-messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}`;
  
  // Add message type class for special styling
  if (messageType && messageType !== 'normal') {
    messageDiv.classList.add(`message-${messageType}`);
  }
  
  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${role}`;
  avatar.textContent = role === 'user' ? 'U' : 'AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Process content for code blocks, etc.
  contentDiv.innerHTML = formatMessage(content);
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Add fade-in animation
  messageDiv.classList.add('fade-in');
}

// Format message content
function formatMessage(content) {
  // Basic markdown-like formatting
  let formatted = content
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  
  return formatted;
}

// Show typing indicator
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages');
  
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'chat-message assistant';
  
  typingDiv.innerHTML = `
    <div class="message-avatar assistant">AI</div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// Process workflow response for JSON
function processWorkflowResponse(response) {
  // Extract JSON from response
  const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const workflowJson = JSON.parse(jsonMatch[1]);
      showWorkflowActions(workflowJson);
    } catch (error) {
      console.error('Failed to parse workflow JSON:', error);
    }
  }
}

// Show workflow action buttons
function showWorkflowActions(workflowJson) {
  const messagesContainer = document.getElementById('chat-messages');
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'chat-message assistant';
  
  actionsDiv.innerHTML = `
    <div class="message-avatar assistant">AI</div>
    <div class="message-content">
      <p>I've extracted workflow components. Would you like to apply them?</p>
      <div class="message-actions">
        <button class="message-action-btn primary" data-action="apply-workflow">
          Apply to Canvas
        </button>
        <button class="message-action-btn" data-action="copy-workflow">
          Copy JSON
        </button>
        <button class="message-action-btn" data-action="save-template">
          Save as Template
        </button>
      </div>
    </div>
  `;
  
  // Store workflow JSON for later use
  actionsDiv.setAttribute('data-workflow-json', JSON.stringify(workflowJson));
  
  // Add event listeners to buttons
  const buttons = actionsDiv.querySelectorAll('.message-action-btn');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      const workflowData = JSON.parse(actionsDiv.getAttribute('data-workflow-json'));
      
      switch(action) {
        case 'apply-workflow':
          applyWorkflow(workflowData);
          break;
        case 'copy-workflow':
          copyWorkflowJson(workflowData);
          break;
        case 'save-template':
          saveAsTemplate(workflowData);
          break;
      }
    });
  });
  
  messagesContainer.appendChild(actionsDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Apply workflow to n8n canvas
async function applyWorkflow(workflowJson) {
  // Check if n8n is connected
  if (!n8nConnectionState.isConnected || !settings.n8nApiUrl || !settings.n8nApiKey) {
    // Show n8n setup message with link
    addMessage('assistant', 
      '🔗 Для применения workflow к canvas необходимо подключение к n8n. ' +
      'Пожалуйста, настройте подключение, нажав на кнопку "Настроить автоматически" в баннере выше, ' +
      'или перейдите в настройки для ручной настройки.', 
      'warning'
    );
    
    // Show banner if it was dismissed
    n8nConnectionState.bannerDismissed = false;
    localStorage.removeItem('n8n-banner-dismissed');
    updateN8nUI();
    
    return;
  }

  if (!currentWorkflowId || currentWorkflowId === 'unknown_workflow') {
    addMessage('assistant', 'Please navigate to an n8n workflow page first.');
    return;
  }

  try {
    // Apply workflow via n8n API
    await applyToN8nCanvas(workflowJson);
    addMessage('assistant', 'Workflow components applied successfully! The page will refresh shortly.', 'success');
    
    // Refresh the page after a delay
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    }, 2000);
    
  } catch (error) {
    console.error('Failed to apply workflow:', error);
    addMessage('assistant', `Error applying workflow: ${error.message}`, 'error');
  }
}

// Apply workflow to n8n canvas via API
async function applyToN8nCanvas(workflowJson) {
  try {
    // Check if n8n API is configured
    if (!settings.n8nApiUrl || !settings.n8nApiKey) {
      throw new Error('n8n API not configured. Please set n8n API URL and API key in settings.');
    }

    console.log('n8n API URL:', settings.n8nApiUrl);
    console.log('n8n API Key configured:', !!settings.n8nApiKey);

    // Clean incoming workflow JSON first
    const cleanIncomingJson = cleanIncomingWorkflowJson(workflowJson);
    console.log('Original workflow JSON:', workflowJson);
    console.log('Cleaned incoming workflow JSON:', cleanIncomingJson);

    const workflowId = currentWorkflowId === 'new_workflow' 
      ? await createNewWorkflow() 
      : currentWorkflowId;

    console.log('Applying workflow to ID:', workflowId);

    // Get current workflow
    const getResponse = await fetch(`${settings.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': settings.n8nApiKey
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('Failed to fetch current workflow:', getResponse.status, errorText);
      throw new Error(`Failed to fetch current workflow: ${getResponse.status} ${errorText}`);
    }

    const currentWorkflow = await getResponse.json();
    console.log('Current workflow:', currentWorkflow);
    
    // Merge with new components
    const updatedWorkflow = mergeWorkflow(currentWorkflow, cleanIncomingJson);
    console.log('Updated workflow:', updatedWorkflow);
    
    // Clean workflow for PUT request
    const cleanWorkflow = cleanWorkflowForPut(updatedWorkflow);
    console.log('Clean workflow for PUT:', cleanWorkflow);
    
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
      const errorText = await updateResponse.text();
      console.error('Failed to update workflow:', updateResponse.status, errorText);
      throw new Error(`Failed to update workflow: ${updateResponse.status} ${errorText}`);
    }

    const result = await updateResponse.json();
    console.log('Workflow updated successfully:', result);
    
  } catch (error) {
    console.error('Error in applyToN8nCanvas:', error);
    throw error;
  }
}

// Create new workflow
async function createNewWorkflow() {
  const response = await fetch(`${settings.n8nApiUrl}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': settings.n8nApiKey
    },
    body: JSON.stringify({
      name: 'New Workflow',
      nodes: [],
      connections: {},
      settings: {},
      staticData: {}
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create new workflow');
  }

  const newWorkflow = await response.json();
  return newWorkflow.id;
}

// Merge workflow with new components
function mergeWorkflow(currentWorkflow, newComponents) {
  const result = { ...currentWorkflow };
  
  if (!result.nodes) result.nodes = [];
  if (!result.connections) result.connections = {};
  
  if (newComponents.nodes && Array.isArray(newComponents.nodes)) {
    // Calculate offset for new nodes
    let maxX = 0, maxY = 0;
    result.nodes.forEach(node => {
      if (node.position && Array.isArray(node.position)) {
        maxX = Math.max(maxX, node.position[0] || 0);
        maxY = Math.max(maxY, node.position[1] || 0);
      }
    });
    
    const offsetX = maxX > 0 ? maxX + 200 : 100;
    const offsetY = maxY > 0 ? maxY + 50 : 100;
    
    // Add new nodes with clean structure
    let nodeCounter = result.nodes.length;
    newComponents.nodes.forEach((node, index) => {
      const newNode = {
        id: String(node.id), // Ensure ID is string
        name: String(node.name),
        type: String(node.type),
        typeVersion: Number(node.typeVersion || 1),
        position: [offsetX + (index * 200), offsetY],
        parameters: node.parameters || {}
      };
      
      result.nodes.push(newNode);
    });
  }
  
  if (newComponents.connections && typeof newComponents.connections === 'object') {
    // Add new connections
    Object.keys(newComponents.connections).forEach(sourceNodeId => {
      if (!result.connections[sourceNodeId]) {
        result.connections[sourceNodeId] = [];
      }
      
      const connections = newComponents.connections[sourceNodeId];
      if (Array.isArray(connections)) {
        connections.forEach(connection => {
          if (connection && connection.node && connection.type) {
            result.connections[sourceNodeId].push({
              node: String(connection.node), // Ensure node ID is string
              type: String(connection.type), // Ensure type is string
              index: Number(connection.index || 0) // Ensure index is number
            });
          }
        });
      }
    });
  }
  
  console.log('Merged workflow result:', result);
  return result;
}

// Clean workflow for PUT request - only send fields that n8n API accepts
function cleanWorkflowForPut(workflow) {
  // n8n API only accepts specific fields, remove all others
  const cleaned = {
    name: String(workflow.name || 'Untitled Workflow'),
    nodes: [],
    connections: {},
    settings: workflow.settings || {},
    staticData: workflow.staticData || {}
  };

  // Clean nodes - only keep essential fields and ensure proper types
  cleaned.nodes = (workflow.nodes || []).map(node => {
    const cleanNode = {
      id: String(node.id), // Ensure ID is string
      name: String(node.name || 'Node'),
      type: String(node.type || 'n8n-nodes-base.start'),
      typeVersion: Number(node.typeVersion || 1),
      position: Array.isArray(node.position) ? node.position : [0, 0],
      parameters: node.parameters || {}
    };
    
    // Only add additional fields if they exist and are not undefined
    if (node.continueOnFail !== undefined) cleanNode.continueOnFail = Boolean(node.continueOnFail);
    if (node.disabled !== undefined) cleanNode.disabled = Boolean(node.disabled);
    if (node.notes !== undefined) cleanNode.notes = String(node.notes);
    
    return cleanNode;
  });

  // Clean connections - ensure proper format and types
  if (workflow.connections && typeof workflow.connections === 'object') {
    Object.keys(workflow.connections).forEach(key => {
      if (!Array.isArray(workflow.connections[key])) {
        cleaned.connections[key] = [];
      } else {
        cleaned.connections[key] = workflow.connections[key].map(conn => ({
          node: String(conn.node),
          type: String(conn.type),
          index: Number(conn.index || 0)
        }));
      }
    });
  }

  console.log('Cleaned workflow for PUT (n8n API compatible):', cleaned);
  return cleaned;
}

// Copy workflow JSON to clipboard
function copyWorkflowJson(workflowJson) {
  const jsonString = JSON.stringify(workflowJson, null, 2);
  navigator.clipboard.writeText(jsonString).then(() => {
    showToast('JSON copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

// Save as template
function saveAsTemplate(workflowJson) {
  const templateName = prompt('Enter template name:');
  if (templateName) {
    addMessage('assistant', `Template "${templateName}" saved! (Feature coming soon)`);
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `${type}-message`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// History functions
function loadHistoryList() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  const workflows = Object.values(allWorkflowChats)
    .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
    .slice(0, settings.maxHistory);
  
  if (workflows.length === 0) {
    historyList.innerHTML = '<div class="loading-indicator">No chat history</div>';
    return;
  }
  
  workflows.forEach(workflow => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.setAttribute('data-workflow-id', workflow.workflowId);
    
    const lastMessage = workflow.messages[workflow.messages.length - 1];
    const preview = lastMessage ? lastMessage.content.substring(0, 100) + '...' : 'No messages';
    
    item.innerHTML = `
      <div class="history-item-title">${workflow.workflowName}</div>
      <div class="history-item-preview">${preview}</div>
      <div class="history-item-meta">
        <span>${workflow.messages.length} messages</span>
        <span>${new Date(workflow.lastActivity).toLocaleDateString()}</span>
      </div>
    `;
    
    // Add click event listener
    item.addEventListener('click', () => {
      loadHistoryItem(workflow.workflowId);
    });
    
    historyList.appendChild(item);
  });
}

function loadHistoryItem(workflowId) {
  if (allWorkflowChats[workflowId]) {
    loadWorkflowChat(workflowId);
    switchTab('chat');
    updateWorkflowInfo();
  }
}

function searchHistory(query) {
  // TODO: Implement history search
  console.log('Searching history for:', query);
}

function clearHistory() {
  if (confirm('Clear all chat history? This cannot be undone.')) {
    allWorkflowChats = {};
    chatMemory = [];
    saveChatStorage();
    refreshChatUI();
    loadHistoryList();
    showToast('Chat history cleared', 'success');
  }
}

// Template functions
function initializeTemplates() {
  // Pre-populate with some basic templates
  window.templates = [
    {
      id: 'email-to-slack',
      name: 'Email to Slack',
      description: 'Forward emails to Slack channel',
      category: 'automation',
      nodes: 3,
      workflow: {
        nodes: [
          { name: 'Email Trigger', type: 'n8n-nodes-base.emailReadImap' },
          { name: 'Slack', type: 'n8n-nodes-base.slack' }
        ]
      }
    },
    {
      id: 'data-sync',
      name: 'Database Sync',
      description: 'Sync data between databases',
      category: 'data',
      nodes: 4,
      workflow: {
        nodes: [
          { name: 'Schedule', type: 'n8n-nodes-base.cron' },
          { name: 'Source DB', type: 'n8n-nodes-base.postgres' },
          { name: 'Transform', type: 'n8n-nodes-base.set' },
          { name: 'Target DB', type: 'n8n-nodes-base.postgres' }
        ]
      }
    }
  ];
}

function filterTemplates(category) {
  // Update active category
  document.querySelectorAll('.category').forEach(cat => {
    cat.classList.toggle('active', cat.dataset.category === category);
  });
  
  renderTemplates(category);
}

function renderTemplates(category = 'all') {
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = '';
  
  const filtered = category === 'all' 
    ? window.templates 
    : window.templates.filter(t => t.category === category);
  
  filtered.forEach(template => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.setAttribute('data-template-id', template.id);
    
    card.innerHTML = `
      <div class="template-card-header">
        <div>
          <div class="template-title">${template.name}</div>
          <div class="template-category">${template.category}</div>
        </div>
      </div>
      <div class="template-description">${template.description}</div>
      <div class="template-meta">
        <div class="template-nodes">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
          </svg>
          ${template.nodes} nodes
        </div>
      </div>
    `;
    
    // Add click event listener
    card.addEventListener('click', () => {
      useTemplate(template);
    });
    
    grid.appendChild(card);
  });
}

function useTemplate(template) {
  const message = `I'd like to use the "${template.name}" template: ${template.description}`;
  document.getElementById('chat-input').value = message;
  switchTab('chat');
}

function createTemplate() {
  addMessage('assistant', 'Template creation from current workflow coming soon!');
}

// Settings functions
function showSettings() {
  document.getElementById('settings-panel').classList.remove('hidden');
}

function hideSettings() {
  document.getElementById('settings-panel').classList.add('hidden');
}

function switchProvider(provider) {
  settings.activeProvider = provider;
  updateSettingsUI();
  
  // Update API status after switching provider
  updateApiStatus();
}

function updateSettingsUI() {
  // Provider toggle
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === settings.activeProvider);
  });
  
  // Show/hide provider configs
  document.getElementById('openai-config').classList.toggle('hidden', settings.activeProvider !== 'openai');
  document.getElementById('anthropic-config').classList.toggle('hidden', settings.activeProvider !== 'anthropic');
  
  // Fill in values
  document.getElementById('backend-url').value = settings.backendUrl || window.getBackendUrl();
  document.getElementById('n8n-url').value = settings.n8nApiUrl || '';
  document.getElementById('n8n-key').value = settings.n8nApiKey || '';
  document.getElementById('auto-apply-workflows').checked = settings.autoApplyWorkflows;
  document.getElementById('save-chat-history').checked = settings.saveChatHistory;
  document.getElementById('max-history').value = settings.maxHistory;
  
  // Theme setting
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect && themeManager) {
    themeSelect.value = themeManager.currentTheme;
  }
  
  // Update API status after updating UI
  updateApiStatus();
}

async function saveSettings() {
  // Get values from UI
  settings.backendUrl = document.getElementById('backend-url').value.trim();
  settings.n8nApiUrl = document.getElementById('n8n-url').value.trim();
  settings.n8nApiKey = document.getElementById('n8n-key').value.trim();
  settings.autoApplyWorkflows = document.getElementById('auto-apply-workflows').checked;
  settings.saveChatHistory = document.getElementById('save-chat-history').checked;
  settings.maxHistory = parseInt(document.getElementById('max-history').value);
  
  try {
    await chrome.storage.sync.set(settings);
    
    // Update API status after saving
    updateApiStatus();
    
    showToast('Settings saved!', 'success');
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

async function testBackendConnection() {
  const url = document.getElementById('backend-url').value.trim();
  
  if (!url) {
    showToast('Please enter backend URL', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${url}/health`);
    
    if (response.ok) {
      showToast('Backend connection successful!', 'success');
    } else {
      throw new Error('Backend not responding');
    }
  } catch (error) {
    showToast(`Backend connection failed: ${error.message}`, 'error');
  }
}



// Utility functions
async function refreshSidePanel() {
  await getCurrentTabInfo();
  await loadWorkflowStats();
  showToast('Refreshed!', 'success');
}

// =============================================
// N8N One-Click Connect Logic
// =============================================

// N8N connection state
let n8nConnectionState = {
  isConnected: false,
  detectedUrl: null,
  currentStep: 'detect', // detect, api-setup, connect, completed
  isDetecting: false,
  bannerDismissed: false
};

// Initialize N8N connection detection
async function initN8nConnection() {
  console.log('Initializing N8N connection detection...');
  
  // Check current n8n connection status
  await checkN8nConnectionStatus();
  
  // Start detection process
  await detectN8nInstance();
  
  // Check if banner was previously dismissed (only after connection status check)
  const dismissed = localStorage.getItem('n8n-banner-dismissed');
  if (dismissed === 'true' && !n8nConnectionState.isConnected) {
    n8nConnectionState.bannerDismissed = true;
  }
  
  // Update UI based on state
  updateN8nUI();
}

// Check current n8n connection status from settings
async function checkN8nConnectionStatus() {
  try {
    const stored = await chrome.storage.sync.get(['n8nApiUrl', 'n8nApiKey']);
    if (stored.n8nApiUrl && stored.n8nApiKey) {
      console.log('Found stored n8n credentials, testing connection...');
      
      // Test the connection
      const result = await testN8nConnection(stored.n8nApiUrl, stored.n8nApiKey);
      n8nConnectionState.isConnected = result.success;
      
      if (result.success) {
        n8nConnectionState.currentStep = 'completed';
        n8nConnectionState.detectedUrl = stored.n8nApiUrl;
        
        // Update global settings
        settings.n8nApiUrl = stored.n8nApiUrl;
        settings.n8nApiKey = stored.n8nApiKey;
        
        console.log('N8N already connected:', stored.n8nApiUrl);
        console.log('Connected user:', result.data?.email || 'Unknown');
      } else {
        console.log('Stored n8n credentials are invalid:', result.error);
        
        // Clear invalid credentials
        await chrome.storage.sync.remove(['n8nApiUrl', 'n8nApiKey']);
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
async function detectN8nInstance() {
  if (n8nConnectionState.isConnected) return;
  
  n8nConnectionState.isDetecting = true;
  updateN8nUI();
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const detectedUrl = extractN8nBaseUrl(tab.url);
      if (detectedUrl) {
        n8nConnectionState.detectedUrl = detectedUrl;
        console.log('Detected n8n instance:', detectedUrl);
      }
    }
  } catch (error) {
    console.error('Error detecting n8n instance:', error);
  } finally {
    n8nConnectionState.isDetecting = false;
    updateN8nUI();
  }
}

// Update N8N UI elements based on current state
function updateN8nUI() {
  // Always update the sidepanel settings card first
  updateSidepanelN8nCard();
  
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
    detectedBadge.classList.remove('hidden');
    bannerDescription.textContent = `Найден ваш n8n: ${n8nConnectionState.detectedUrl}. Настройте за один клик!`;
    setupAutoBtn.textContent = 'Настроить автоматически';
  } else {
    detectedBadge.classList.add('hidden');
    bannerDescription.textContent = 'Создавайте и управляйте рабочими процессами прямо из чата';
    setupAutoBtn.textContent = 'Настроить n8n';
  }
}

// Test n8n connection with detailed error handling
async function testN8nConnection(url, apiKey) {
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

// Show N8N setup modal
function showN8nSetupModal() {
  const modal = document.getElementById('n8n-setup-modal');
  if (modal) {
    modal.classList.remove('hidden');
    
    // Initialize modal state
    if (n8nConnectionState.detectedUrl) {
      updateModalStep('detect');
      document.getElementById('detected-url').textContent = n8nConnectionState.detectedUrl;
    } else {
      // Go directly to manual setup
      updateModalStep('connect');
    }
  }
}

// Make function globally accessible for onclick handlers
window.showN8nSetupModal = showN8nSetupModal;

// Hide N8N setup modal
function hideN8nSetupModal() {
  const modal = document.getElementById('n8n-setup-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Update modal step
function updateModalStep(step) {
  n8nConnectionState.currentStep = step;
  
  // Update step indicators
  const steps = ['detect', 'api', 'connect'];
  steps.forEach((stepName, index) => {
    const stepElement = document.getElementById(`step-${stepName}`);
    const contentElement = document.getElementById(`step-${stepName}-content`);
    
    if (stepElement) {
      stepElement.classList.remove('active', 'completed');
      
      if (stepName === step) {
        stepElement.classList.add('active');
      } else if (steps.indexOf(stepName) < steps.indexOf(step)) {
        stepElement.classList.add('completed');
      }
    }
    
    if (contentElement) {
      contentElement.classList.toggle('active', stepName === step);
    }
  });
  
  // Update success content visibility
  const successContent = document.getElementById('step-success-content');
  if (successContent) {
    successContent.classList.toggle('active', step === 'completed');
    
    // Update connection details when showing success
    if (step === 'completed') {
      const instanceUrlElement = document.getElementById('connected-instance-url');
      if (instanceUrlElement && n8nConnectionState.detectedUrl) {
        const shortUrl = n8nConnectionState.detectedUrl.replace('https://', '').substring(0, 25);
        instanceUrlElement.textContent = shortUrl + (shortUrl.length === 25 ? '...' : '');
        instanceUrlElement.title = n8nConnectionState.detectedUrl;
      }
    }
  }
}

// Open n8n API settings in new tab
async function openN8nApiSettings() {
  try {
    let targetUrl = n8nConnectionState.detectedUrl;
    
    // If no detected URL, try to get current tab URL and extract n8n base
    if (!targetUrl) {
      console.log('No detected URL, trying to extract from current tab...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        targetUrl = extractN8nBaseUrl(tab.url);
        if (targetUrl) {
          n8nConnectionState.detectedUrl = targetUrl;
          console.log('Extracted n8n URL from current tab:', targetUrl);
        }
      }
    }
    
    if (!targetUrl) {
      console.error('No n8n URL available for API settings');
      showModalMessage(
        'Не удалось определить URL n8n инстанса. Пожалуйста, перейдите на страницу вашего n8n и попробуйте снова.', 
        'error'
      );
      return false;
    }
    
    // Ensure URL doesn't end with slash
    const cleanUrl = targetUrl.replace(/\/$/, '');
    const apiUrl = `${cleanUrl}/settings/api`;
    
    console.log('Opening n8n API settings:', apiUrl);
    
    // Create new tab with API settings
    const newTab = await chrome.tabs.create({ url: apiUrl });
    
    if (newTab) {
      console.log('Successfully opened API settings tab:', newTab.id);
      
      // Move to next step after a short delay
      setTimeout(() => {
        updateModalStep('connect');
      }, 1000);
      
      // Show success message in chat only (brief)
      addMessage('assistant', 
        `✅ Открыта страница API настроек: ${apiUrl}`, 
        'success'
      );
      
      return true;
    } else {
      throw new Error('Failed to create new tab');
    }
    
  } catch (error) {
    console.error('Error opening n8n API settings:', error);
    showModalMessage(
      `Ошибка при открытии API настроек: ${error.message}`, 
      'error'
    );
    return false;
  }
}

// Show message in modal instead of chat
function showModalMessage(message, type = 'info') {
  // Create or update message area in modal
  let messageArea = document.getElementById('modal-message-area');
  if (!messageArea) {
    // Create message area if it doesn't exist
    const modalBody = document.querySelector('.n8n-modal-body');
    if (modalBody) {
      messageArea = document.createElement('div');
      messageArea.id = 'modal-message-area';
      messageArea.className = 'modal-message-area';
      modalBody.appendChild(messageArea);
    } else {
      console.error('Modal body not found');
      return;
    }
  }
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `modal-message ${type}`;
  messageEl.innerHTML = `
    <div class="modal-message-icon">
      ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
    </div>
    <div class="modal-message-text">${message}</div>
  `;
  
  // Replace existing message or add new one
  messageArea.innerHTML = '';
  messageArea.appendChild(messageEl);
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      if (messageArea && messageArea.contains(messageEl)) {
        messageEl.remove();
      }
    }, 3000);
  }
}

// Handle API key input and connection test
async function handleN8nConnection() {
  const apiKeyInput = document.getElementById('api-key-input');
  const testButton = document.getElementById('test-connection');
  const testButtonText = document.getElementById('test-connection-text');
  const loader = document.getElementById('test-connection-loader');
  
  if (!apiKeyInput) {
    showModalMessage('Поле ввода API ключа не найдено', 'error');
    return;
  }
  
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showModalMessage('Пожалуйста, введите API ключ', 'warning');
    return;
  }
  
  // Validate API key format (basic check)
  if (apiKey.length < 10) {
    showModalMessage('API ключ кажется слишком коротким. Проверьте корректность ключа.', 'warning');
    return;
  }
  
  // Get URL to test
  let targetUrl = n8nConnectionState.detectedUrl;
  if (!targetUrl) {
    // Try to extract from current tab
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        targetUrl = extractN8nBaseUrl(tab.url);
        if (targetUrl) {
          n8nConnectionState.detectedUrl = targetUrl;
        }
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }
  
  if (!targetUrl) {
    showModalMessage('Не удалось определить URL n8n инстанса. Убедитесь, что вы находитесь на странице n8n.', 'error');
    return;
  }
  
  // Show loading state
  testButton.disabled = true;
  testButtonText.textContent = 'Подключение...';
  loader.classList.remove('hidden');
  
  try {
    showModalMessage(`Тестирую подключение к ${targetUrl}...`, 'info');
    
    const result = await testN8nConnection(targetUrl, apiKey);
    
    if (result.success) {
      // Save connection settings
      const settingsToSave = {
        n8nApiUrl: targetUrl,
        n8nApiKey: apiKey
      };
      
      console.log('Saving n8n settings:', { ...settingsToSave, n8nApiKey: '[HIDDEN]' });
      
      await chrome.storage.sync.set(settingsToSave);
      
      // Update global settings object
      settings.n8nApiUrl = targetUrl;
      settings.n8nApiKey = apiKey;
      
      // Update state
      n8nConnectionState.isConnected = true;
      n8nConnectionState.detectedUrl = targetUrl;
      n8nConnectionState.currentStep = 'completed';
      
      // Show success in modal
      showModalMessage(
        `Подключение к n8n успешно настроено!\n\n` +
        `URL: ${targetUrl}\n` +
        `Статус: ${result.data?.email || 'Connected'}\n` +
        `Endpoint: ${result.endpoint || 'n8n API'}\n\n` +
        `Модальное окно закроется автоматически...`, 
        'success'
      );
      
      // Update UI
      updateModalStep('completed');
      updateN8nUI();
      
      // Add success message to chat (brief)
      addMessage('assistant', 
        `🎉 n8n успешно подключен! URL: ${targetUrl}`, 
        'success'
      );
      
      // Close modal after delay
      setTimeout(() => {
        hideN8nSetupModal();
      }, 4000);
      
    } else {
      // Show detailed error in modal
      showModalMessage(
        `Не удалось подключиться к n8n:\n\n${result.error}\n\n${result.details || ''}\n\nПроверьте API ключ и попробуйте снова.`, 
        'error'
      );
    }
    
  } catch (error) {
    console.error('Error in handleN8nConnection:', error);
    showModalMessage(
      `Неожиданная ошибка при подключении к n8n: ${error.message}`, 
      'error'
    );
  } finally {
    // Reset button state
    testButton.disabled = false;
    testButtonText.textContent = 'Подключить n8n';
    loader.classList.add('hidden');
  }
}

// Dismiss banner
function dismissN8nBanner() {
  n8nConnectionState.bannerDismissed = true;
  localStorage.setItem('n8n-banner-dismissed', 'true');
  updateN8nUI();
}

// Setup N8N event listeners
function setupN8nEventListeners() {
  // Banner events
  const setupAutoBtn = document.getElementById('n8n-setup-auto');
  const setupLaterBtn = document.getElementById('n8n-setup-later');
  const bannerCloseBtn = document.getElementById('n8n-banner-close');
  
  if (setupAutoBtn) {
    setupAutoBtn.addEventListener('click', showN8nSetupModal);
  }
  
  if (setupLaterBtn) {
    setupLaterBtn.addEventListener('click', dismissN8nBanner);
  }
  
  if (bannerCloseBtn) {
    bannerCloseBtn.addEventListener('click', dismissN8nBanner);
  }
  
  // Modal events
  const modalCloseBtn = document.getElementById('n8n-modal-close');
  const continueSetupBtn = document.getElementById('continue-setup');
  const openApiBtn = document.getElementById('open-api-settings');
  const testConnectionBtn = document.getElementById('test-connection');
  const manualSetupBtn = document.getElementById('manual-setup');
  const pasteApiKeyBtn = document.getElementById('paste-api-key');
  const apiKeyInput = document.getElementById('api-key-input');
  
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', hideN8nSetupModal);
  }
  
  if (continueSetupBtn) {
    continueSetupBtn.addEventListener('click', () => updateModalStep('api'));
  }
  
  if (openApiBtn) {
    openApiBtn.addEventListener('click', openN8nApiSettings);
  }
  
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', handleN8nConnection);
  }
  
  if (manualSetupBtn) {
    manualSetupBtn.addEventListener('click', () => updateModalStep('connect'));
  }
  
  if (pasteApiKeyBtn) {
    pasteApiKeyBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (apiKeyInput) {
          const trimmedText = text.trim();
          apiKeyInput.value = trimmedText;
          
          // Enable test button if API key is present
          if (testConnectionBtn) {
            testConnectionBtn.disabled = !trimmedText;
          }
          
          // Show feedback
          if (trimmedText) {
            console.log('API key pasted from clipboard, length:', trimmedText.length);
            showModalMessage('API ключ вставлен из буфера обмена', 'success');
          } else {
            showModalMessage('Буфер обмена пуст или не содержит текста', 'warning');
          }
        }
      } catch (error) {
        console.error('Failed to read clipboard:', error);
        showModalMessage(
          'Не удалось прочитать буфер обмена. Возможно, нужно разрешить доступ или вставить ключ вручную.', 
          'error'
        );
      }
    });
  }
  
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', (e) => {
      if (testConnectionBtn) {
        testConnectionBtn.disabled = !e.target.value.trim();
      }
    });
  }
  
  // Close modal on backdrop click
  const modal = document.getElementById('n8n-setup-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideN8nSetupModal();
      }
    });
  }
  
  // Success modal buttons
  const closeSuccessBtn = document.getElementById('close-success-modal');
  const disconnectBtn = document.getElementById('disconnect-n8n');
  
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', hideN8nSetupModal);
  }
  
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      try {
        disconnectBtn.disabled = true;
        disconnectBtn.textContent = 'Отключение...';
        
        // Clear local storage
        await chrome.storage.sync.remove(['n8nApiUrl', 'n8nApiKey']);
        
        // Clear global settings
        settings.n8nApiUrl = null;
        settings.n8nApiKey = null;
        
        // Update state
        n8nConnectionState.isConnected = false;
        n8nConnectionState.detectedUrl = null;
        n8nConnectionState.currentStep = 'detect';
        
        // Update UI
        updateN8nUI();
        updateSidepanelN8nCard();
        
        // Close modal
        hideN8nSetupModal();
        
        // Show success message
        addMessage('assistant', '🔌 n8n отключен', 'info');
        
      } catch (error) {
        console.error('Error disconnecting n8n:', error);
        showModalMessage('Ошибка при отключении n8n', 'error');
      } finally {
        disconnectBtn.disabled = false;
        disconnectBtn.textContent = 'Отключить n8n';
      }
    });
  }
  
  // Connected modal events
  const connectedModalCloseBtn = document.getElementById('n8n-connected-modal-close');
  const connectedModalCloseBtnMain = document.getElementById('connected-modal-close-btn');
  const connectedModalDisconnectBtn = document.getElementById('connected-modal-disconnect-btn');
  
  if (connectedModalCloseBtn) {
    connectedModalCloseBtn.addEventListener('click', hideN8nConnectedModal);
  }
  
  if (connectedModalCloseBtnMain) {
    connectedModalCloseBtnMain.addEventListener('click', hideN8nConnectedModal);
  }
  
  if (connectedModalDisconnectBtn) {
    connectedModalDisconnectBtn.addEventListener('click', async () => {
      try {
        connectedModalDisconnectBtn.disabled = true;
        connectedModalDisconnectBtn.textContent = 'Отключение...';
        
        // Clear local storage
        await chrome.storage.sync.remove(['n8nApiUrl', 'n8nApiKey']);
        
        // Clear global settings
        settings.n8nApiUrl = null;
        settings.n8nApiKey = null;
        
        // Update state
        n8nConnectionState.isConnected = false;
        n8nConnectionState.detectedUrl = null;
        n8nConnectionState.currentStep = 'detect';
        
        // Update UI
        updateN8nUI();
        updateSidepanelN8nCard();
        
        // Close modal
        hideN8nConnectedModal();
        
        // Show success message
        addMessage('assistant', '🔌 n8n отключен', 'info');
        
      } catch (error) {
        console.error('Error disconnecting n8n:', error);
        // Could show error in modal, but for now just log
      } finally {
        connectedModalDisconnectBtn.disabled = false;
        connectedModalDisconnectBtn.textContent = 'Отключить n8n';
      }
    });
  }
  
  // Close connected modal on backdrop click
  const connectedModal = document.getElementById('n8n-connected-modal');
  if (connectedModal) {
    connectedModal.addEventListener('click', (e) => {
      if (e.target === connectedModal) {
        hideN8nConnectedModal();
      }
    });
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Side panel received message:', request);
  
  if (request.action === 'tabUpdated') {
    getCurrentTabInfo();
    // Re-detect n8n instance when tab changes
    detectN8nInstance();
  }
  
  if (request.action === 'prefillMessage') {
    document.getElementById('chat-input').value = request.message;
    switchTab('chat');
  }
  
  sendResponse({ status: 'received' });
});

// Clean incoming workflow JSON from AI - remove any extra fields
function cleanIncomingWorkflowJson(workflowJson) {
  // Extract only the essential workflow structure
  const cleaned = {
    nodes: [],
    connections: {}
  };

  // Clean nodes
  if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
    cleaned.nodes = workflowJson.nodes.map((node, index) => {
      const cleanNode = {
        id: String(node.id || `node_${Date.now()}_${index}`), // Ensure ID is string
        name: String(node.name || 'Node'),
        type: String(node.type || 'n8n-nodes-base.start'),
        typeVersion: Number(node.typeVersion || 1),
        position: Array.isArray(node.position) ? node.position : [0, 0],
        parameters: node.parameters || {}
      };
      return cleanNode;
    });
  }

  // Clean connections
  if (workflowJson.connections && typeof workflowJson.connections === 'object') {
    Object.keys(workflowJson.connections).forEach(sourceNodeId => {
      if (workflowJson.connections[sourceNodeId] && Array.isArray(workflowJson.connections[sourceNodeId])) {
        cleaned.connections[sourceNodeId] = workflowJson.connections[sourceNodeId].filter(conn => 
          conn && typeof conn === 'object' && conn.node && conn.type
        );
      }
    });
  }

  return cleaned;
}



// Update n8n integration card in sidepanel settings
function updateSidepanelN8nCard() {
  const cardContainer = document.getElementById('sidepanel-n8n-integration-card');
  console.log('updateSidepanelN8nCard - cardContainer found:', !!cardContainer);
  
  if (!cardContainer) {
    console.error('Card container not found! Element sidepanel-n8n-integration-card does not exist');
    return;
  }
  
  console.log('updateSidepanelN8nCard - current state:', {
    isConnected: n8nConnectionState.isConnected,
    detectedUrl: n8nConnectionState.detectedUrl,
    isDetecting: n8nConnectionState.isDetecting,
    currentStep: n8nConnectionState.currentStep
  });
  
  let cardClass, iconClass, statusText, description, buttonText, buttonClass;
  
  if (n8nConnectionState.isDetecting) {
    cardClass = 'n8n-card-detecting';
    iconClass = 'detecting';
    statusText = 'Поиск n8n...';
    description = 'Проверяем активные вкладки';
    buttonText = null;
  } else if (n8nConnectionState.isConnected) {
    cardClass = 'n8n-card-connected';
    iconClass = 'connected';
    statusText = 'n8n подключен';
    description = 'Готов для создания workflow';
    buttonText = 'Подробнее';
    buttonClass = 'secondary';
  } else {
    cardClass = 'n8n-card-disconnected';
    iconClass = 'disconnected';
    statusText = 'n8n Integration';
    description = n8nConnectionState.detectedUrl 
      ? 'Обнаружен n8n - настройте подключение' 
      : 'Подключите для создания workflow';
    buttonText = n8nConnectionState.detectedUrl ? 'Подключить' : 'Настроить';
    buttonClass = 'primary';
  }
  
  const iconSvg = iconClass === 'connected' 
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M12 20h.01"/>
         <path d="M8.5 16.429a5 5 0 0 1 7 0M5 12.859a10 10 0 0 1 14 0M2 8.82a15 15 0 0 1 20 0"/>
       </svg>`
    : iconClass === 'detecting'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
         <path d="M21 12a9 9 0 11-6.219-8.56"/>
       </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
       </svg>`;
  
  cardContainer.innerHTML = `
    <div class="n8n-card ${cardClass}">
      <div class="n8n-card-header">
        <div class="n8n-card-info">
          <div class="n8n-card-icon ${iconClass}">
            ${iconSvg}
          </div>
          <div class="n8n-card-text">
            <h4>${statusText}</h4>
            <p>${description}</p>
          </div>
        </div>
        ${buttonText ? `
          <button class="n8n-card-button ${buttonClass}" id="sidepanel-n8n-connect-btn">
            ${buttonText}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7,7 17,7 17,17"></polyline>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  console.log('updateSidepanelN8nCard - HTML set, final state:', {
    cardClass,
    statusText,
    description,
    buttonText,
    htmlLength: cardContainer.innerHTML.length
  });
  
  // Update hidden fields for backward compatibility with existing save function
  const urlInput = document.getElementById('n8n-url');
  const keyInput = document.getElementById('n8n-key');
  if (urlInput && n8nConnectionState.isConnected && n8nConnectionState.detectedUrl) {
    urlInput.value = n8nConnectionState.detectedUrl;
  }
  if (keyInput && n8nConnectionState.isConnected && settings.n8nApiKey) {
    keyInput.value = settings.n8nApiKey;
  }
  
  // Add event listener for the connect button
  const connectBtn = document.getElementById('sidepanel-n8n-connect-btn');
  if (connectBtn) {
    // Remove any existing listeners by cloning the element
    const newConnectBtn = connectBtn.cloneNode(true);
    connectBtn.parentNode.replaceChild(newConnectBtn, connectBtn);
    
    // Add the appropriate listener based on state
    if (n8nConnectionState.isConnected && buttonText === 'Подробнее') {
      newConnectBtn.addEventListener('click', showN8nConnectedModal);
    } else {
      newConnectBtn.addEventListener('click', showN8nSetupModal);
    }
  }
}

// Show N8N connected status modal
function showN8nConnectedModal() {
  const modal = document.getElementById('n8n-connected-modal');
  if (modal) {
    modal.classList.remove('hidden');
    
    // Update instance URL
    const instanceUrlElement = document.getElementById('connected-modal-instance-url');
    if (instanceUrlElement && n8nConnectionState.detectedUrl) {
      const shortUrl = n8nConnectionState.detectedUrl.replace('https://', '').substring(0, 25);
      instanceUrlElement.textContent = shortUrl + (shortUrl.length === 25 ? '...' : '');
      instanceUrlElement.title = n8nConnectionState.detectedUrl;
    }
    
    // Update connection date (for now just "Сегодня")
    const dateElement = document.getElementById('connected-modal-date');
    if (dateElement) {
      const today = new Date().toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long' 
      });
      dateElement.textContent = `Сегодня (${today})`;
    }
  }
}

// Hide N8N connected status modal
function hideN8nConnectedModal() {
  const modal = document.getElementById('n8n-connected-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Loading state management
function startLoading() {
  const sendBtn = document.getElementById('send-btn');
  const loadingBtn = document.getElementById('loading-btn');
  
  if (sendBtn && loadingBtn) {
    sendBtn.style.display = 'none';
    loadingBtn.style.display = 'flex';
  }
}

function stopLoading() {
  const sendBtn = document.getElementById('send-btn');
  const loadingBtn = document.getElementById('loading-btn');
  
  if (sendBtn && loadingBtn) {
    sendBtn.style.display = 'flex';
    loadingBtn.style.display = 'none';
  }
}

function stopGeneration() {
  // Set flag to stop generation
  window.isGenerationStopped = true;
  
  // Stop any ongoing generation
  if (window.currentGenerationAbortController) {
    window.currentGenerationAbortController.abort();
    window.currentGenerationAbortController = null;
  }
  
  // Stop loading state
  stopLoading();
}
