// N8N Integration functions for settings page

// Add remaining global functions
window.openN8nApiSettings = async function() {
  let targetUrl = n8nConnectionState.detectedUrl;
  
  if (!targetUrl) {
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
    showModalMessage('Не удалось определить URL n8n инстанса.', 'error');
    return false;
  }
  
  try {
    const cleanUrl = targetUrl.replace(/\/$/, '');
    const apiUrl = `${cleanUrl}/settings/api`;
    
    const newTab = await chrome.tabs.create({ url: apiUrl });
    
    if (newTab) {
      setTimeout(() => {
        updateModalStep('connect');
      }, 1000);
      
      return true;
    } else {
      throw new Error('Failed to create new tab');
    }
    
  } catch (error) {
    console.error('Error opening n8n API settings:', error);
    showModalMessage(`Ошибка при открытии API настроек: ${error.message}`, 'error');
    return false;
  }
};

window.pasteApiKey = async function() {
  try {
    const text = await navigator.clipboard.readText();
    const apiKeyInput = document.getElementById('api-key-input');
    const testConnectionBtn = document.getElementById('test-connection');
    
    if (apiKeyInput) {
      const trimmedText = text.trim();
      apiKeyInput.value = trimmedText;
      
      if (testConnectionBtn) {
        testConnectionBtn.disabled = !trimmedText;
      }
      
      if (trimmedText) {
        showModalMessage('API ключ вставлен из буфера обмена', 'success');
      } else {
        showModalMessage('Буфер обмена пуст', 'warning');
      }
    }
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    showModalMessage('Не удалось прочитать буфер обмена', 'error');
  }
};

window.handleN8nConnection = async function() {
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
  
  if (apiKey.length < 10) {
    showModalMessage('API ключ слишком короткий', 'warning');
    return;
  }
  
  let targetUrl = n8nConnectionState.detectedUrl;
  if (!targetUrl) {
    showModalMessage('URL n8n не определен', 'error');
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
      // Save settings
      const settingsToSave = {
        n8nApiUrl: targetUrl,
        n8nApiKey: apiKey
      };
      
      await chrome.storage.sync.set(settingsToSave);
      
      // Update hidden fields for backward compatibility
      const urlInput = document.getElementById('n8n-api-url');
      const keyInput = document.getElementById('n8n-api-key');
      if (urlInput) urlInput.value = targetUrl;
      if (keyInput) keyInput.value = apiKey;
      
      // Update state
      n8nConnectionState.isConnected = true;
      n8nConnectionState.currentStep = 'completed';
      
      // Show success
      showModalMessage(
        `Подключение успешно!\n\nURL: ${targetUrl}\nСтатус: ${result.data?.email || 'Connected'}\nEndpoint: ${result.endpoint || 'n8n API'}`,
        'success'
      );
      
      // Update UI
      updateModalStep('completed');
      updateN8nIntegrationCard();
      
      // Auto-close after delay
      setTimeout(() => {
        hideN8nSetupModal();
      }, 4000);
      
    } else {
      showModalMessage(
        `Не удалось подключиться:\n\n${result.error}\n\n${result.details || ''}\n\nПроверьте API ключ и попробуйте снова.`,
        'error'
      );
    }
    
  } catch (error) {
    console.error('Error in handleN8nConnection:', error);
    showModalMessage(`Неожиданная ошибка: ${error.message}`, 'error');
  } finally {
    // Reset button state
    testButton.disabled = false;
    testButtonText.textContent = 'Завершить подключение';
    loader.classList.add('hidden');
  }
};

window.disconnectN8n = async function() {
  try {
    await chrome.storage.sync.remove(['n8nApiUrl', 'n8nApiKey']);
    
    // Clear hidden fields for backward compatibility
    const urlInput = document.getElementById('n8n-api-url');
    const keyInput = document.getElementById('n8n-api-key');
    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';
    
    n8nConnectionState.isConnected = false;
    n8nConnectionState.detectedUrl = null;
    n8nConnectionState.currentStep = 'detect';
    
    updateN8nIntegrationCard();
    hideN8nSetupModal();
    
    // Re-detect
    await detectN8nInstance();
    
  } catch (error) {
    console.error('Error disconnecting n8n:', error);
  }
};

// Check if URL is n8n page
function isN8nPage(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const port = urlObj.port;
    
    // Check for n8n cloud domains
    if (hostname.includes('.n8n.cloud')) return true;
    
    // Check for n8n in hostname
    if (hostname.includes('n8n.')) return true;
    if (hostname.includes('.n8n.')) return true;
    
    // Check for standard n8n port
    if (port === '5678') return true;
    
    // Check for n8n in path
    if (pathname.includes('/n8n/') || pathname.includes('/n8n-')) return true;
    
    // Check for localhost with n8n indicators
    if (hostname === 'localhost' && (port === '5678' || pathname.includes('n8n'))) return true;
    
    // Check for workflow patterns
    if (pathname.includes('/workflow/') || pathname.includes('/executions/')) return true;
    
    return false;
  } catch (error) {
    console.error('Error checking n8n URL:', error);
    return false;
  }
}

// Extract n8n base URL
function extractN8nBaseUrl(url) {
  if (!url || !isN8nPage(url)) return null;
  
  try {
    const urlObj = new URL(url);
    let baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    // Priority system for URL extraction
    // 1. n8n Cloud - direct domain
    if (urlObj.hostname.includes('.n8n.cloud')) {
      return baseUrl;
    }
    
    // 2. n8n in hostname - direct domain  
    if (urlObj.hostname.includes('n8n.') || urlObj.hostname.includes('.n8n.')) {
      return baseUrl;
    }
    
    // 3. Standard port (5678) - likely direct n8n
    if (urlObj.port === '5678') {
      return baseUrl;
    }
    
    // 4. n8n in path - might be subdirectory installation
    const pathMatch = urlObj.pathname.match(/^(\/[^\/]*n8n[^\/]*)/i);
    if (pathMatch) {
      return baseUrl + pathMatch[1];
    }
    
    // 5. Workflow patterns - assume root installation
    if (urlObj.pathname.includes('/workflow/') || urlObj.pathname.includes('/executions/')) {
      return baseUrl;
    }
    
    return baseUrl;
  } catch (error) {
    console.error('Error extracting n8n URL:', error);
    return null;
  }
}

// Test n8n connection (copied from sidepanel.js)
async function testN8nConnection(url, apiKey) {
  if (!url || !apiKey) {
    return { success: false, error: 'URL or API key is missing' };
  }

  try {
    const cleanUrl = url.replace(/\/$/, '');
    
    const possibleEndpoints = [
      `${cleanUrl}/api/v1/workflows`,
      `${cleanUrl}/rest/workflows`,
      `${cleanUrl}/api/v1/users/me`,
      `${cleanUrl}/api/v1/executions`,
      `${cleanUrl}/rest/executions`
    ];
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let lastError = null;
    
    for (let i = 0; i < possibleEndpoints.length; i++) {
      const testUrl = possibleEndpoints[i];
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': apiKey,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        if (response.ok) {
          clearTimeout(timeoutId);
          const responseData = await response.json();
          
          let userData = {};
          if (testUrl.includes('/users/me') && responseData) {
            userData = {
              email: responseData.email || 'Unknown',
              firstName: responseData.firstName || '',
              lastName: responseData.lastName || '',
              id: responseData.id
            };
          } else {
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
          const errorText = await response.text();
          lastError = {
            status: response.status,
            message: errorText,
            endpoint: testUrl
          };
        }
        
      } catch (endpointError) {
        lastError = {
          status: 0,
          message: endpointError.message,
          endpoint: testUrl
        };
      }
    }
    
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
    let errorMessage;
    if (error.name === 'AbortError') {
      errorMessage = 'Превышено время ожидания подключения (10 сек)';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Не удалось подключиться к серверу. Проверьте URL и доступность n8n.';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'Ошибка CORS. n8n может не разрешать запросы с этого домена.';
    } else {
      errorMessage = `Ошибка сети: ${error.message}`;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Initialize n8n integration
async function initN8nIntegration() {
  console.log('Initializing n8n integration for settings page...');
  
  try {
    // Check existing connection status from storage
    await checkN8nConnectionStatus();
    
    // Detect n8n from current tab
    await detectN8nInstance();
    
    // Update UI
    updateN8nIntegrationCard();
    
    // Setup event listeners
    setupN8nEventListeners();
    
  } catch (error) {
    console.error('Error initializing n8n integration:', error);
    updateN8nIntegrationCard();
  }
}

// Check connection status from chrome storage
async function checkN8nConnectionStatus() {
  try {
    const result = await chrome.storage.sync.get(['n8nApiUrl', 'n8nApiKey']);
    
    if (result.n8nApiUrl && result.n8nApiKey) {
      console.log('Found stored n8n credentials, testing connection...');
      
      const testResult = await testN8nConnection(result.n8nApiUrl, result.n8nApiKey);
      
      if (testResult.success) {
        console.log('Stored n8n connection is valid');
        n8nConnectionState.isConnected = true;
        n8nConnectionState.detectedUrl = result.n8nApiUrl;
        n8nConnectionState.currentStep = 'completed';
        
        // Update hidden fields
        const urlInput = document.getElementById('n8n-api-url');
        const keyInput = document.getElementById('n8n-api-key');
        if (urlInput) urlInput.value = result.n8nApiUrl;
        if (keyInput) keyInput.value = result.n8nApiKey;
      } else {
        console.log('Stored n8n connection is invalid, clearing...');
        // Clear invalid credentials
        await chrome.storage.sync.remove(['n8nApiUrl', 'n8nApiKey']);
        n8nConnectionState.isConnected = false;
        
        // Clear hidden fields
        const urlInput = document.getElementById('n8n-api-url');
        const keyInput = document.getElementById('n8n-api-key');
        if (urlInput) urlInput.value = '';
        if (keyInput) keyInput.value = '';
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
  if (n8nConnectionState.isConnected) {
    console.log('n8n already connected, skipping detection');
    return;
  }
  
  n8nConnectionState.isDetecting = true;
  updateN8nIntegrationCard();
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      const extractedUrl = extractN8nBaseUrl(tab.url);
      
      if (extractedUrl) {
        console.log('n8n detected from current tab:', extractedUrl);
        n8nConnectionState.detectedUrl = extractedUrl;
        n8nConnectionState.currentStep = 'api-setup';
      } else {
        console.log('No n8n detected in current tab');
      }
    }
  } catch (error) {
    console.error('Error detecting n8n instance:', error);
  } finally {
    n8nConnectionState.isDetecting = false;
    updateN8nIntegrationCard();
  }
}

// Update n8n integration card
function updateN8nIntegrationCard() {
  const cardContainer = document.getElementById('n8n-integration-card');
  if (!cardContainer) return;
  
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
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
         <path d="M5 3v4"/>
         <path d="M19 17v4"/>
         <path d="M3 5h4"/>
         <path d="M17 19h4"/>
       </svg>`
    : iconClass === 'detecting'
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
         <path d="M21 12a9 9 0 11-6.219-8.56"/>
       </svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <button class="n8n-card-button ${buttonClass}" onclick="handleConnectN8n()">
            ${buttonText}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7,7 17,7 17,17"></polyline>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// Show/hide modal functions
function showN8nSetupModal() {
  const modal = document.getElementById('n8n-setup-modal');
  if (modal) {
    modal.classList.remove('hidden');
    updateModalStep(n8nConnectionState.currentStep);
  }
}

// Update modal step
function updateModalStep(step) {
  n8nConnectionState.currentStep = step;
  
  // Update step indicators
  const steps = ['detect', 'api', 'connect'];
  steps.forEach((stepId, index) => {
    const stepElement = document.getElementById(`step-${stepId}`);
    if (stepElement) {
      stepElement.classList.remove('active', 'completed');
      
      if (stepId === 'detect' && n8nConnectionState.detectedUrl) {
        stepElement.classList.add('completed');
      } else if (stepId === 'api' && step === 'completed') {
        stepElement.classList.add('completed');
      } else if (stepId === 'connect' && step === 'completed') {
        stepElement.classList.add('completed');
      } else if (stepId === step.replace('-setup', '')) {
        stepElement.classList.add('active');
      }
    }
  });
  
  // Update step content
  const stepContent = document.getElementById('step-content');
  if (!stepContent) return;
  
  if (step === 'api-setup' && n8nConnectionState.detectedUrl) {
    stepContent.innerHTML = `
      <div style="background: #f0f9f4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
          <span style="font-weight: 600; color: #166534;">n8n найден!</span>
        </div>
        <div style="color: #166534; font-size: 14px; margin-bottom: 12px;">
          Ваш n8n: ${n8nConnectionState.detectedUrl}
        </div>
        <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Создайте API ключ:</h4>
          <ol style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px; padding-left: 20px;">
            <li>Нажмите "Create an API Key"</li>
            <li>Введите название: "8pilot"</li>
            <li>Нажмите "Save"</li>
            <li>Скопируйте ключ</li>
          </ol>
          <button onclick="openN8nApiSettings()" style="width: 100%; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15,3 21,3 21,9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Открыть настройки n8n
          </button>
        </div>
      </div>
    `;
  } else if (step === 'connect') {
    stepContent.innerHTML = `
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
          Вставьте ваш API ключ
        </label>
        <div style="position: relative;">
          <input 
            type="password" 
            id="api-key-input" 
            placeholder="Вставьте API ключ сюда"
            style="width: 100%; padding: 8px 40px 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;"
          />
          <button 
            onclick="pasteApiKey()" 
            style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;"
            title="Вставить из буфера"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>
      <button 
        onclick="handleN8nConnection()" 
        id="test-connection" 
        style="width: 100%; background: #22c55e; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
      >
        <span id="test-connection-text">Завершить подключение</span>
        <svg id="test-connection-loader" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hidden animate-spin">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </button>
    `;
  } else if (step === 'completed' && n8nConnectionState.isConnected) {
    stepContent.innerHTML = `
      <div style="text-align: center; padding: 32px 0;">
        <div style="width: 64px; height: 64px; background: #f0f9f4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
        </div>
        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 18px; font-weight: 600;">🎉 Все готово!</h4>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
          n8n успешно подключен и готов для создания рабочих процессов
        </p>
        
        <div style="background: #f0f9f4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
            <span style="color: #166534;">Статус:</span>
            <span style="font-weight: 500; color: #166534;">Активно</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
            <span style="color: #166534;">Инстанс:</span>
            <span style="font-weight: 500; color: #166534; word-break: break-all;">
              ${n8nConnectionState.detectedUrl?.replace('https://', '').substring(0, 25)}...
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #166534;">Подключено:</span>
            <span style="font-weight: 500; color: #166534;">Сегодня</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button 
            onclick="hideN8nSetupModal()" 
            style="background: #22c55e; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;"
          >
            Закрыть
          </button>
          <button 
            onclick="disconnectN8n()" 
            style="background: none; border: none; color: #dc2626; font-size: 14px; cursor: pointer;"
          >
            Отключить n8n
          </button>
        </div>
      </div>
    `;
  } else {
    stepContent.innerHTML = `
      <div style="text-align: center; padding: 32px 0;">
        <div style="width: 64px; height: 64px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
        <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 18px; font-weight: 600;">n8n не обнаружен</h4>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
          Откройте ваш n8n в браузере и повторите попытку
        </p>
        <button 
          onclick="hideN8nSetupModal()" 
          style="background: none; border: none; color: #3b82f6; font-size: 14px; cursor: pointer;"
        >
          Попробую позже
        </button>
      </div>
    `;
  }
}

// Setup event listeners
function setupN8nEventListeners() {
  // Modal overlay click
  const overlay = document.querySelector('.n8n-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', window.hideN8nSetupModal);
  }
  
  // Listen to storage changes for syncing with sidepanel
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.n8nApiUrl || changes.n8nApiKey) {
          console.log('n8n storage changed in settings, updating status...', changes);
          
          // Update state based on storage changes
          if (changes.n8nApiUrl && changes.n8nApiUrl.newValue) {
            n8nConnectionState.detectedUrl = changes.n8nApiUrl.newValue;
            n8nConnectionState.isConnected = true;
            n8nConnectionState.currentStep = 'completed';
          } else if (changes.n8nApiUrl && !changes.n8nApiUrl.newValue) {
            // n8n was disconnected
            n8nConnectionState.detectedUrl = null;
            n8nConnectionState.isConnected = false;
            n8nConnectionState.currentStep = 'detect';
          }
          
          // Update UI immediately
          updateN8nIntegrationCard();
          
          // Then double-check with actual connection test
          setTimeout(() => {
            checkN8nConnectionStatus().then(() => {
              updateN8nIntegrationCard();
            });
          }, 500);
        }
      }
    });
  }
}

// Show modal message
function showModalMessage(message, type = 'info') {
  let messageArea = document.getElementById('modal-message-area');
  if (!messageArea) {
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
  
  const messageEl = document.createElement('div');
  messageEl.className = `modal-message ${type}`;
  messageEl.innerHTML = `
    <div class="modal-message-icon">
      ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
    </div>
    <div class="modal-message-text">${message}</div>
  `;
  
  messageArea.innerHTML = '';
  messageArea.appendChild(messageEl);
  
  if (type === 'success') {
    setTimeout(() => {
      if (messageArea && messageArea.contains(messageEl)) {
        messageEl.remove();
      }
    }, 3000);
  }
}
