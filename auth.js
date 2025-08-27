document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const authForms = document.querySelectorAll('.auth-form');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const tabHeader = document.querySelector('.tab-header');
  const demoModeBtn = document.getElementById('demo-mode');
  const langBtns = document.querySelectorAll('.lang-btn');
  
  // Language support
  const translations = {
    ru: {
      subtitle: "AI-помощник для эффективного создания n8n рабочих процессов.",
      login: "Вход",
      signup: "Регистрация",
      email: "Email:",
      password: "Пароль:",
      confirm_password: "Подтвердите пароль:",
      login_btn: "Войти",
      signup_btn: "Зарегистрироваться",
      forgot_password: "Забыли пароль?",
      ready_status: "Готов к авторизации",
      demo_text: "Хотите попробовать без регистрации?",
      demo_btn: "Демо режим",
      enter_password: "Введите пароль",
      password_min_6: "Введите пароль (минимум 6 символов)",
      repeat_password: "Повторите пароль",
      // Messages
      fill_all_fields: "Пожалуйста, заполните все поля",
      invalid_email: "Пожалуйста, введите корректный email",
      password_min_length: "Пароль должен содержать минимум 6 символов",
      passwords_not_match: "Пароли не совпадают",
      login_loading: "Выполняется вход...",
      signup_loading: "Выполняется регистрация...",
      login_success: "Вход выполнен успешно!",
      welcome: "Добро пожаловать!",
      signup_success: "Регистрация успешна!",
      account_created: "Аккаунт создан! Теперь вы можете войти.",
      login_error: "Неверный email или пароль",
      signup_error: "Ошибка при создании аккаунта",
      general_error: "Произошла ошибка",
      demo_confirm: "Демо режим предоставляет ограниченный доступ к функциям. Продолжить?",
      demo_activated: "Демо режим активирован!",
      demo_redirecting: "Переходим в демо режим...",
      extension_error: "Ошибка расширения",
      reload_page: "Перезагрузите страницу",
      init_error: "Ошибка инициализации"
    },
    en: {
      subtitle: "AI-powered assistant for building n8n workflows efficiently.",
      login: "Login",
      signup: "Sign Up",
      email: "Email:",
      password: "Password:",
      confirm_password: "Confirm Password:",
      login_btn: "Login",
      signup_btn: "Sign Up",
      forgot_password: "Forgot Password?",
      ready_status: "Ready for authentication",
      demo_text: "Want to try without registration?",
      demo_btn: "Demo Mode",
      enter_password: "Enter password",
      password_min_6: "Enter password (minimum 6 characters)",
      repeat_password: "Repeat password",
      // Messages
      fill_all_fields: "Please fill in all fields",
      invalid_email: "Please enter a valid email",
      password_min_length: "Password must contain at least 6 characters",
      passwords_not_match: "Passwords do not match",
      login_loading: "Logging in...",
      signup_loading: "Registering...",
      login_success: "Login successful!",
      welcome: "Welcome!",
      signup_success: "Registration successful!",
      account_created: "Account created! Now you can log in.",
      login_error: "Invalid email or password",
      signup_error: "Error creating account",
      general_error: "An error occurred",
      demo_confirm: "Demo mode provides limited access to features. Continue?",
      demo_activated: "Demo mode activated!",
      demo_redirecting: "Redirecting to demo mode...",
      extension_error: "Extension error",
      reload_page: "Reload the page",
      init_error: "Initialization error"
    }
  };
  
  let currentLang = 'ru';
  
  // Language switching functionality
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
      
      // Update active button
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Set language and update all text
  function setLanguage(lang) {
    currentLang = lang;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[lang][key]) {
        element.textContent = translations[lang][key];
      }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (translations[lang][key]) {
        element.placeholder = translations[lang][key];
      }
    });
    
    // Save language preference
    safeStorageSet({ language: lang });
  }
  
  // Get translation
  function t(key) {
    return translations[currentLang][key] || key;
  }
  
  // Check if extension context is valid
  function checkExtensionContext() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (error) {
      console.error('Extension context invalid:', error);
      return false;
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
  
  // Tab switching functionality
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
      
      // Clear any existing messages
      clearMessages();
      
      // Update status
      updateStatus('ready', t('ready_status'));
    });
  });
  
  // Update status indicator and text
  function updateStatus(type, text) {
    statusIndicator.className = `status-indicator ${type}`;
    statusText.textContent = text;
  }
  
  // Show message (error or success)
  function showMessage(type, text) {
    clearMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    
    const authTabs = document.querySelector('.auth-tabs');
    authTabs.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }
  
  // Clear all messages
  function clearMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => msg.remove());
  }
  
  // Validate email format
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Validate password strength
  function isValidPassword(password) {
    return password.length >= 6;
  }
  
  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validation
    if (!email || !password) {
      showMessage('error', t('fill_all_fields'));
      return;
    }
    
    if (!isValidEmail(email)) {
      showMessage('error', t('invalid_email'));
      return;
    }
    
    // Update status to loading
    updateStatus('loading', t('login_loading'));
    
    try {
      // Get backend URL from storage
      safeStorageGet(['backendUrl'], (result) => {
        const backendUrl = result.backendUrl || 'http://localhost:8000';
        
        // Make login request
        fetch(`${backendUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.access_token) {
            // Save token and user info
            safeStorageSet({
              authToken: data.access_token,
              userInfo: data.user,
              isAuthenticated: true,
              language: currentLang
            }, () => {
              updateStatus('success', t('login_success'));
              showMessage('success', t('welcome'));
              
              // Redirect to main extension after successful login
              setTimeout(() => {
                window.location.href = 'settings/settings.html';
              }, 1500);
            });
          } else {
            throw new Error(data.detail || t('login_error'));
          }
        })
        .catch(error => {
          console.error('Login error:', error);
          updateStatus('error', t('login_error'));
          showMessage('error', error.message || t('login_error'));
        });
      });
      
    } catch (error) {
      console.error('Login error:', error);
      updateStatus('error', t('login_error'));
      showMessage('error', t('general_error'));
    }
  });
  
  // Handle signup form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // Validation
    if (!email || !password || !confirmPassword) {
      showMessage('error', t('fill_all_fields'));
      return;
    }
    
    if (!isValidEmail(email)) {
      showMessage('error', t('invalid_email'));
      return;
    }
    
    if (!isValidPassword(password)) {
      showMessage('error', t('password_min_length'));
      return;
    }
    
    if (password !== confirmPassword) {
      showMessage('error', t('passwords_not_match'));
      return;
    }
    
    // Update status to loading
    updateStatus('loading', t('signup_loading'));
    
    try {
      // Get backend URL from storage
      safeStorageGet(['backendUrl'], (result) => {
        const backendUrl = result.backendUrl || 'http://localhost:8000';
        
        // Make registration request
        fetch(`${backendUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.id) {
            updateStatus('success', t('signup_success'));
            showMessage('success', t('account_created'));
            
            // Switch to login tab after successful registration
            setTimeout(() => {
              document.querySelector('[data-tab="login"]').click();
              document.getElementById('login-email').value = email;
              document.getElementById('login-password').value = password;
            }, 2000);
          } else {
            throw new Error(data.detail || t('signup_error'));
          }
        })
        .catch(error => {
          console.error('Registration error:', error);
          updateStatus('error', t('signup_error'));
          showMessage('error', error.message || t('signup_error'));
        });
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      updateStatus('error', t('signup_error'));
      showMessage('error', t('general_error'));
    }
  });
  
  // Demo mode button handler
  demoModeBtn.addEventListener('click', () => {
    if (confirm(t('demo_confirm'))) {
      // Save demo mode flag
      safeStorageSet({
        isDemoMode: true,
        demoModeActivated: new Date().toISOString(),
        language: currentLang
      }, () => {
        updateStatus('success', t('demo_activated'));
        showMessage('success', t('demo_redirecting'));
        
        // Redirect to main extension in demo mode
        setTimeout(() => {
          window.location.href = 'settings/settings.html';
        }, 1500);
      });
    }
  });
  
  // Check if user is already authenticated
  function checkAuthenticationStatus() {
    safeStorageGet(['isAuthenticated', 'authToken', 'userInfo', 'isDemoMode', 'language'], (result) => {
      // Set language first
      if (result.language) {
        setLanguage(result.language);
      }
      
      if (result.isDemoMode) {
        // User is in demo mode, redirect to main extension
        window.location.href = 'settings/settings.html';
        return;
      }
      
      if (result.isAuthenticated && result.authToken) {
        // User is already logged in, redirect to main extension
        window.location.href = 'settings/settings.html';
        return;
      }
      
      // User is not authenticated, show auth page
      updateStatus('ready', t('ready_status'));
    });
  }
  
  // Initialize
  try {
    if (checkExtensionContext()) {
      checkAuthenticationStatus();
      console.log('Auth page initialized successfully');
    } else {
      updateStatus('error', t('extension_error'));
      showMessage('error', t('reload_page'));
    }
  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus('error', t('init_error'));
    showMessage('error', t('general_error'));
  }
});
