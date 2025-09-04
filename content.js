// Content script for 8pilot extension
console.log('8pilot content script loaded');

// State tracking
let isChatWindowVisible = false;
let isChatMessagesVisible = false;
let chatMessages = [];

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getWorkflowData') {
    // Extract workflow data from n8n page
    const workflowData = extractWorkflowData();
    sendResponse({ status: 'success', data: workflowData });
  }
  
  return true;
});

function extractWorkflowData() {
  // Try to extract workflow data from n8n page
  const workflowData = {
    url: window.location.href,
    title: document.title,
    isN8nPage: isN8nPage(),
    workflowId: extractWorkflowId(),
    nodes: extractNodes(),
    connections: extractConnections()
  };
  
  return workflowData;
}

function isN8nPage() {
  // Check if current page is an n8n workflow page
  return window.location.href.includes('n8n.io') || 
         window.location.href.includes('localhost') || 
         window.location.href.includes('127.0.0.1') ||
         document.querySelector('[data-test-id="workflow-canvas"]') !== null ||
         document.querySelector('.workflow-canvas') !== null;
}

function extractWorkflowId() {
  // Try to extract workflow ID from URL or page
  const urlMatch = window.location.href.match(/workflow\/(\d+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Try to get from page data
  const workflowElement = document.querySelector('[data-workflow-id]');
  if (workflowElement) {
    return workflowElement.getAttribute('data-workflow-id');
  }
  
  return null;
}

function extractNodes() {
  // Try to extract workflow nodes
  const nodes = [];
  
  // Look for n8n node elements
  const nodeElements = document.querySelectorAll('.node, [data-test-id="node"]');
  nodeElements.forEach((element, index) => {
    const nodeData = {
      id: element.id || `node-${index}`,
      type: element.getAttribute('data-type') || 'unknown',
      name: element.querySelector('.node-name')?.textContent || `Node ${index + 1}`,
      position: {
        x: parseInt(element.style.left) || 0,
        y: parseInt(element.style.top) || 0
      }
    };
    nodes.push(nodeData);
  });
  
  return nodes;
}

function extractConnections() {
  // Try to extract workflow connections
  const connections = [];
  
  // Look for connection elements
  const connectionElements = document.querySelectorAll('.connection, [data-test-id="connection"]');
  connectionElements.forEach((element, index) => {
    const connectionData = {
      id: element.id || `connection-${index}`,
      source: element.getAttribute('data-source') || null,
      target: element.getAttribute('data-target') || null
    };
    connections.push(connectionData);
  });
  
  return connections;
}

// Listen for activation messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'activateExtension') {
    showActivationIcon();
    sendResponse({ status: 'activated' });
  } else if (request.action === 'deactivateExtension') {
    hideActivationIcon();
    sendResponse({ status: 'deactivated' });
  }
  
  return true;
});

// Function to show activation icon
function showActivationIcon() {
  // Remove existing indicator if any
  hideActivationIcon();
  
  console.log('Showing 8pilot activation icon');
  
  // Create icon element
  const icon = document.createElement('div');
  icon.id = '8pilot-activation-icon';
  
  // Get icon URL
  const iconUrl = chrome.runtime.getURL('icons/icon128.png');
  console.log('Icon URL:', iconUrl);
  
  icon.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 64px;
    height: 64px;
    background-image: url('${iconUrl}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 50%;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(79, 209, 199, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    animation: pulse 2s infinite;
    border: 2px solid rgba(79, 209, 199, 0.3);
  `;
  
  // Add fallback if image fails to load
  const img = new Image();
  img.onload = function() {
    console.log('Icon loaded successfully');
  };
  img.onerror = function() {
    console.error('Failed to load icon, using fallback');
    // Fallback to gradient background
    icon.style.backgroundImage = 'none';
    icon.style.background = 'linear-gradient(135deg, #4fd1c7, #06b6d4)';
    icon.innerHTML = '<div style="color: white; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; height: 100%;">8P</div>';
  };
  img.src = iconUrl;
  
  // Add hover effect
  icon.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.1)';
    this.style.boxShadow = '0 6px 25px rgba(79, 209, 199, 0.6)';
  });
  
  icon.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
  });
  
  // Add click handler to toggle menu
  icon.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleMenu();
  });
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(icon);
}

// Function to hide activation icon
function hideActivationIcon() {
  const existingIcon = document.getElementById('8pilot-activation-icon');
  if (existingIcon) {
    existingIcon.remove();
  }
  // Also hide menu and chat window if they exist
  hideMenu();
  hideChatWindow();
  hideChatMessages();
  // Reset state
  isChatWindowVisible = false;
  isChatMessagesVisible = false;
}

// Function to toggle menu visibility
function toggleMenu() {
  const historyIcon = document.getElementById('8pilot-history-icon');
  const chatIcon = document.getElementById('8pilot-chat-icon');
  
  if (historyIcon && chatIcon) {
    // Menu is visible, hide it
    hideMenu();
  } else {
    // Menu is not visible, create and show it
    createMenu();
    showMenu();
  }
}

// Function to create menu
function createMenu() {
  // Remove existing menu if any
  hideMenu();
  
  // Create history icon (clock icon)
  const historyIcon = document.createElement('div');
  historyIcon.id = '8pilot-history-icon';
  historyIcon.setAttribute('data-action', 'history');
  historyIcon.className = 'floating-icon';
  historyIcon.style.cssText = `
    position: fixed;
    right: 30px;
    bottom: 160px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateY(20px) scale(0.8);
    z-index: 10001;
    background: linear-gradient(135deg, #4fd1c7, #06b6d4);
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Add clock SVG icon for history
  historyIcon.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
      <path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  
  // Create chat icon (message icon)
  const chatIcon = document.createElement('div');
  chatIcon.id = '8pilot-chat-icon';
  chatIcon.setAttribute('data-action', 'chat');
  chatIcon.className = 'floating-icon';
  chatIcon.style.cssText = `
    position: fixed;
    right: 30px;
    bottom: 100px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateY(20px) scale(0.8);
    z-index: 10001;
    background: linear-gradient(135deg, #4fd1c7, #06b6d4);
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Add message SVG icon for chat
  chatIcon.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 9h8M8 13h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  
  // Add hover effects
  historyIcon.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-5px) scale(1.1)';
  });
  
  historyIcon.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
  
  chatIcon.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-5px) scale(1.1)';
  });
  
  chatIcon.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
  
  // Add click handlers
  historyIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    handleMenuAction('history');
  });
  
  chatIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    handleMenuAction('chat');
  });
  
  // Add to document
  document.body.appendChild(historyIcon);
  document.body.appendChild(chatIcon);
  
  // Add click outside handler to close menu (but not chat window)
  setTimeout(() => {
    const clickHandler = function(e) {
      const icon = document.getElementById('8pilot-activation-icon');
      const historyIcon = document.getElementById('8pilot-history-icon');
      const chatIcon = document.getElementById('8pilot-chat-icon');
      const chatContainer = document.getElementById('8pilot-chat-container');
      const chatMessagesContainer = document.getElementById('8pilot-chat-messages');
      
      if (historyIcon && chatIcon) {
        if (!icon?.contains(e.target) && 
            !historyIcon.contains(e.target) && 
            !chatIcon.contains(e.target) &&
            !chatContainer?.contains(e.target) &&
            !chatMessagesContainer?.contains(e.target)) {
          hideMenu();
          // Remove this event listener after hiding menu
          document.removeEventListener('click', clickHandler);
        }
      }
    };
    
    document.addEventListener('click', clickHandler);
  }, 100);
}

// Function to show menu with animation
function showMenu() {
  const historyIcon = document.getElementById('8pilot-history-icon');
  const chatIcon = document.getElementById('8pilot-chat-icon');
  
  if (historyIcon && chatIcon) {
    // Show history icon first
    setTimeout(() => {
      historyIcon.style.opacity = '1';
      historyIcon.style.transform = 'translateY(0) scale(1)';
    }, 100);
    
    // Show chat icon second
    setTimeout(() => {
      chatIcon.style.opacity = '1';
      chatIcon.style.transform = 'translateY(0) scale(1)';
    }, 200);
  }
}

// Function to hide menu with animation
function hideMenu() {
  const historyIcon = document.getElementById('8pilot-history-icon');
  const chatIcon = document.getElementById('8pilot-chat-icon');
  
  if (historyIcon && chatIcon) {
    // Hide with animation
    historyIcon.style.opacity = '0';
    historyIcon.style.transform = 'translateY(20px) scale(0.8)';
    
    chatIcon.style.opacity = '0';
    chatIcon.style.transform = 'translateY(20px) scale(0.8)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (historyIcon?.parentNode) {
        historyIcon.parentNode.removeChild(historyIcon);
      }
      if (chatIcon?.parentNode) {
        chatIcon.parentNode.removeChild(chatIcon);
      }
    }, 300);
  }
}

// Function to handle menu actions
function handleMenuAction(action) {
  console.log('Menu action:', action);
  
  switch (action) {
    case 'chat':
      // Toggle chat window
      toggleChatWindow();
      break;
    case 'history':
      // Open history functionality
      chrome.runtime.sendMessage({ action: 'openHistory' });
      break;
    default:
      console.log('Unknown menu action:', action);
  }
}

// Function to toggle chat window
function toggleChatWindow() {
  console.log('Toggle chat window, current state:', isChatWindowVisible);
  
  // Check if chat window actually exists in DOM
  const existingChatContainer = document.getElementById('8pilot-chat-container');
  
  // If state says visible but element doesn't exist, fix the state
  if (isChatWindowVisible && !existingChatContainer) {
    console.log('State mismatch detected, fixing state');
    isChatWindowVisible = false;
  }
  
  if (isChatWindowVisible && existingChatContainer) {
    hideChatWindow();
    hideChatMessages();
  } else {
    showChatWindow();
  }
}

function createDragButton() {
  const dragButton = document.createElement('button');
  dragButton.id = '8pilot-drag-button';
  dragButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Центральная точка -->
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <!-- Стрелка вверх -->
      <path d="M12 6l-3 3h6l-3-3z" fill="currentColor"/>
      <!-- Стрелка вниз -->
      <path d="M12 18l3-3h-6l3 3z" fill="currentColor"/>
      <!-- Стрелка влево -->
      <path d="M6 12l3-3v6l-3-3z" fill="currentColor"/>
      <!-- Стрелка вправо -->
      <path d="M18 12l-3 3v-6l3 3z" fill="currentColor"/>
    </svg>
  `;
  
  dragButton.style.cssText = `
    position: absolute;
    left: -40px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: move;
    color: #4fd1c7;
    transition: all 0.2s ease;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    z-index: 10003;
    filter: drop-shadow(0 0 6px rgba(79, 209, 199, 0.7));
  `;
  
  // Эффекты при наведении
  dragButton.addEventListener('mouseenter', function() {
    this.style.color = '#06b6d4';
    this.style.filter = 'drop-shadow(0 0 12px rgba(79, 209, 199, 0.9))';
    this.style.transform = 'translateY(-50%) scale(1.15)';
  });
  
  dragButton.addEventListener('mouseleave', function() {
    this.style.color = '#4fd1c7';
    this.style.filter = 'drop-shadow(0 0 6px rgba(79, 209, 199, 0.7))';
    this.style.transform = 'translateY(-50%) scale(1)';
  });
  
  // Переменные для отслеживания перетаскивания
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  
  // Обработчики перетаскивания
  dragButton.addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    
    const inputContainer = document.getElementById('8pilot-chat-container');
    const rect = inputContainer.getBoundingClientRect();
    
    // Вычисляем смещение курсора относительно левого верхнего угла контейнера
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // Добавляем визуальную обратную связь
    this.style.color = '#00d9ff';
    this.style.filter = 'drop-shadow(0 0 16px rgba(0, 217, 255, 1))';
    this.style.transform = 'translateY(-50%) scale(1.3)';
    
    // Изменяем курсор для всего документа
    document.body.style.cursor = 'move';
    
    // Добавляем класс для визуального feedback
    inputContainer.style.transition = 'none';
    inputContainer.style.opacity = '0.9';
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    const inputContainer = document.getElementById('8pilot-chat-container');
    if (!inputContainer) return;
    
    // Вычисляем новую позицию относительно курсора
    const newLeft = e.clientX - dragOffset.x;
    const newTop = e.clientY - dragOffset.y;
    
    // УВЕЛИЧЕННЫЕ ГРАНИЦЫ ПЕРЕМЕЩЕНИЯ
    const margin = 10;
    const containerRect = inputContainer.getBoundingClientRect();
    
    const maxLeft = window.innerWidth - (containerRect.width * 0.2);
    const minLeft = -(containerRect.width * 0.8);
    const maxTop = window.innerHeight - (containerRect.height * 0.3);
    const minTop = -(containerRect.height * 0.7);
    
    const constrainedLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    const constrainedTop = Math.max(minTop, Math.min(maxTop, newTop));
    
    // Устанавливаем новую позицию для chat контейнера
    inputContainer.style.left = constrainedLeft + 'px';
    inputContainer.style.top = constrainedTop + 'px';
    inputContainer.style.transform = 'none';
    inputContainer.style.bottom = 'auto';
    
    // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: обновляем позицию сообщений синхронно
    updateMessagesPosition();
  });
  
  document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    
    isDragging = false;
    const dragBtn = document.getElementById('8pilot-drag-button');
    const inputContainer = document.getElementById('8pilot-chat-container');
    
    if (dragBtn) {
      // Возвращаем обычное состояние кнопки
      dragBtn.style.color = '#4fd1c7';
      dragBtn.style.filter = 'drop-shadow(0 0 6px rgba(79, 209, 199, 0.7))';
      dragBtn.style.transform = 'translateY(-50%) scale(1)';
    }
    
    if (inputContainer) {
      // Возвращаем переходы и непрозрачность
      inputContainer.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      inputContainer.style.opacity = '1';
      
      // Функция автоматического притягивания к краям экрана
      const rect = inputContainer.getBoundingClientRect();
      const snapDistance = 30;
      let snapLeft = rect.left;
      let snapTop = rect.top;
      
      // Притягивание к левому краю
      if (rect.left < snapDistance && rect.left > -rect.width * 0.5) {
        snapLeft = 10;
      }
      // Притягивание к правому краю
      else if (rect.right > window.innerWidth - snapDistance && rect.right < window.innerWidth + rect.width * 0.5) {
        snapLeft = window.innerWidth - rect.width - 10;
      }
      
      // Притягивание к верхнему краю
      if (rect.top < snapDistance && rect.top > -rect.height * 0.5) {
        snapTop = 10;
      }
      // Притягивание к нижнему краю
      else if (rect.bottom > window.innerHeight - snapDistance && rect.bottom < window.innerHeight + rect.height * 0.5) {
        snapTop = window.innerHeight - rect.height - 10;
      }
      
      // Применяем притягивание с анимацией
      if (snapLeft !== rect.left || snapTop !== rect.top) {
        inputContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        inputContainer.style.left = snapLeft + 'px';
        inputContainer.style.top = snapTop + 'px';
        
        // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: синхронизируем сообщения после snap
        setTimeout(() => {
          updateMessagesPosition();
        }, 300);
      }
    }
    
    // Возвращаем обычный курсор
    document.body.style.cursor = 'default';
  });
  
  return dragButton;
}

// Function to show chat window
function showChatWindow() {
  // Check if already exists in DOM
  const existingChatContainer = document.getElementById('8pilot-chat-container');
  if (existingChatContainer) {
    console.log('Chat window already exists');
    return;
  }
  
  console.log('Showing 8pilot chat input');
  
  // Update state first
  isChatWindowVisible = true;
  
  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.id = '8pilot-chat-container';
  inputContainer.style.cssText = `
    position: fixed;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    max-width: 90vw;
    z-index: 10002;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Create input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    background: #000000;
    backdrop-filter: blur(10px);
    border: 2px solid #000000;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 4px 20px rgba(79, 209, 199, 0.4);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    position: relative;
  `;
  
  // Create drag button (positioned outside of input wrapper)
  const dragButton = createDragButton();
  
  // Create message input
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.id = '8pilot-message-input';
  messageInput.placeholder = 'Ask me anything about workflow...';
  messageInput.style.cssText = `
    flex: 1;
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    padding: 4px 0;
    transition: opacity 0.3s ease;
  `;

  // Create plus button (clean design)
  const plusButton = document.createElement('button');
  plusButton.id = '8pilot-plus-button';
  plusButton.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
  plusButton.style.cssText = `
    background: none !important;;
    border: none !important;;
    cursor: pointer;
    color: #4fd1c7 !important;;
    transition: all 0.2s ease;
    padding: 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 26px;
    height: 26px;
  `;

  // Create attachment button (clean design)
  const attachButton = document.createElement('button');
  attachButton.id = '8pilot-attach-button';
  attachButton.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  attachButton.style.cssText = `
    background: none !important;;
    border: none !important;;
    cursor: pointer;
    color: #4fd1c7;
    transition: all 0.2s ease;
    padding: 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 26px;
    height: 26px;
  `;

  // Create hidden file input for attachments
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = '8pilot-file-input';
  fileInput.multiple = true;
  fileInput.accept = '.pdf,.doc,.docx,.txt,.json,.csv,.xlsx,.png,.jpg,.jpeg,.gif,.webp';
  fileInput.style.display = 'none';
    
  // Create send button with arrow icon
  const sendButton = document.createElement('button');
  sendButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  sendButton.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    color: #4fd1c7;
    transition: all 0.2s ease;
    flex-shrink: 0;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Plus button hover effects (clean)
  plusButton.addEventListener('mouseenter', function() {
    if (!isPlusMenuVisible) {
      this.style.color = '#06b6d4';
      this.style.backgroundColor = 'rgba(79, 209, 199, 0.1)';
      this.style.transform = 'scale(1.1) rotate(45deg)';
    }
  });

  plusButton.addEventListener('mouseleave', function() {
    if (!isPlusMenuVisible) {
      this.style.color = '#6b7280';
      this.style.backgroundColor = 'transparent';
      this.style.transform = 'scale(1) rotate(0deg)';
    }
  });

  // Attachment button hover effects (clean)
  attachButton.addEventListener('mouseenter', function() {
    this.style.color = '#06b6d4';
    this.style.backgroundColor = 'rgba(79, 209, 199, 0.1)';
    this.style.transform = 'scale(1.1) rotate(-5deg)';
  });

  attachButton.addEventListener('mouseleave', function() {
    this.style.color = '#6b7280';
    this.style.backgroundColor = 'transparent';
    this.style.transform = 'scale(1) rotate(0deg)';
  });

  // Plus button click handler
  plusButton.addEventListener('click', function(e) {
    e.stopPropagation();
    togglePlusMenu();
  });

  // Attachment button click handler
  attachButton.addEventListener('click', function(e) {
    e.stopPropagation();
    fileInput.click();
  });

  // File input change handler
  fileInput.addEventListener('change', function(e) {
    handleFileSelection(e.target.files);
  });
  
  sendButton.addEventListener('mouseenter', function() {
    this.style.color = '#06b6d4';
    this.style.transform = 'translateX(2px)';
  });
  
  sendButton.addEventListener('mouseleave', function() {
    this.style.color = '#4fd1c7';
    this.style.transform = 'translateX(0)';
  });
  
  sendButton.addEventListener('click', function(e) {
    e.stopPropagation();
    const message = messageInput.value.trim();
    if (message) {
      stopPlaceholderCycling();
      sendChatMessage(message);
      messageInput.value = '';
      // Reset opacity to full when clearing input
      messageInput.style.opacity = '1';
      messageInput.placeholder = 'Ask me anything about workflow...';
    }
  });
  
  // Handle Enter key
  messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (message) {
        stopPlaceholderCycling();
        sendChatMessage(message);
        messageInput.value = '';
        // Reset opacity to full when clearing input
        messageInput.style.opacity = '1';
        messageInput.placeholder = 'Ask me anything about workflow...';
      }
    }
  });
  
  // Add hover and focus effects
  inputWrapper.addEventListener('mouseenter', function() {
    this.style.borderColor = '#6b7280';
    this.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
    startPlaceholderCycling();
  });
  
  inputWrapper.addEventListener('mouseleave', function() {
    if (messageInput !== document.activeElement) {
      this.style.borderColor = '#000000';
      this.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
      stopPlaceholderCycling();
    }
  });
  
  messageInput.addEventListener('focus', function() {
    inputWrapper.style.borderColor = '#4fd1c7';
    inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.8)';
    startPlaceholderCycling();
  });
  
  messageInput.addEventListener('blur', function() {
    inputWrapper.style.borderColor = '#000000';
    inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
    stopPlaceholderCycling();
  });
  
  // Закрытие меню при клике на messageInput
  messageInput.addEventListener('click', function() {
    if (isPlusMenuVisible) {
      hidePlusMenu();
    }
  });

  // Prevent click propagation on input container
  inputContainer.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  // Добавляем только input и send в wrapper
  inputWrapper.appendChild(messageInput);
  inputWrapper.appendChild(sendButton);
  inputWrapper.appendChild(fileInput); // скрытый input остается в wrapper

  // Создать контейнер для кнопок и вложений под полем ввода
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 4px;
    padding-left: 4px;
  `;

  // Создать левую часть с кнопками
  const buttonsLeft = document.createElement('div');
  buttonsLeft.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
  `;

  // Создать правую часть для вложений
  const attachmentsRight = document.createElement('div');
  attachmentsRight.id = '8pilot-attachments-container';
  attachmentsRight.style.cssText = `
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-start;
    align-items: center;
    margin-left: 2px;
    margin-top: 3.5px;
  `;

  // Добавить кнопки в левую часть
  buttonsLeft.appendChild(plusButton);
  buttonsLeft.appendChild(attachButton);

  // Добавить части в контейнер
  buttonsContainer.appendChild(buttonsLeft);
  buttonsContainer.appendChild(attachmentsRight);
  
  // Добавляем wrapper, buttonsContainer и drag button в container
  inputWrapper.appendChild(dragButton);
  inputContainer.appendChild(inputWrapper);
  inputContainer.appendChild(buttonsContainer);
  
  // Add to document
  document.body.appendChild(inputContainer);
  
  // Animate in
  setTimeout(() => {
    inputContainer.style.opacity = '1';
  }, 10);
  
  // Focus input
  setTimeout(() => {
    messageInput.focus();
  }, 300);
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style')) {
        // Update messages position when chat container style changes
        updateMessagesPosition();
      }
    });
  });
  
  observer.observe(inputContainer, {
    attributes: true,
    attributeFilter: ['style']
  });
}

// Array of placeholder examples
const placeholderExamples = [
  'Create a workflow to help me automate my social media.',
  'How would you optimize this workflow?',
  'Create sticky notes explaining this workflow.',
  'Why isn\'t my workflow working?',
  'How do I use the AI Agent node?',
  'Is there a way to optimize this?',
  'Explain this workflow to me step by step.',
  'Create a workflow to help me automate my social media.',
  'How would you optimize this workflow?',
  'Create sticky notes explaining this workflow.'
];

let currentPlaceholderIndex = 0;
let placeholderInterval = null;

// Function to cycle through placeholder examples
function cyclePlaceholder() {
  const messageInput = document.getElementById('8pilot-message-input');
  if (!messageInput) return;
  
  messageInput.placeholder = placeholderExamples[currentPlaceholderIndex];
  currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholderExamples.length;
  
  // Change placeholder every 3 seconds
  setTimeout(() => {
    if (messageInput === document.activeElement && messageInput.value === '') {
      cyclePlaceholder();
    }
  }, 3000);
}

// Function to smoothly change placeholder
function changePlaceholderSmoothly(newPlaceholder) {
  const messageInput = document.getElementById('8pilot-message-input');
  if (!messageInput) return;
  
  // Fade out current placeholder
  messageInput.style.opacity = '0.3';
  
  setTimeout(() => {
    messageInput.placeholder = newPlaceholder;
    // Fade in new placeholder
    messageInput.style.opacity = '1';
  }, 150);
}

// Function to start placeholder cycling
function startPlaceholderCycling() {
  const messageInput = document.getElementById('8pilot-message-input');
  if (!messageInput || messageInput.value !== '') return;
  
  // Clear any existing interval
  if (placeholderInterval) {
    clearInterval(placeholderInterval);
  }
  
  // Start cycling immediately with animation
  changePlaceholderSmoothly(placeholderExamples[currentPlaceholderIndex]);
  currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholderExamples.length;
  
  // Set up interval for continuous cycling
  placeholderInterval = setInterval(() => {
    if (messageInput && messageInput.value === '') {
      changePlaceholderSmoothly(placeholderExamples[currentPlaceholderIndex]);
      currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholderExamples.length;
    } else {
      stopPlaceholderCycling();
    }
  }, 4000);
}

// Function to stop placeholder cycling
function stopPlaceholderCycling() {
  if (placeholderInterval) {
    clearInterval(placeholderInterval);
    placeholderInterval = null;
  }
  
  // Smoothly return to default placeholder
  const messageInput = document.getElementById('8pilot-message-input');
  if (messageInput && messageInput.value === '') {
    changePlaceholderSmoothly('Ask me anything about workflow...');
  }
}

// Function to send chat message
function sendChatMessage(message) {
  console.log('Sending chat message:', message);

  // Handle attachments
  let messageWithAttachments = message;
  if (attachedFiles.length > 0) {
    const attachmentsList = attachedFiles.map(file => 
      `📎 ${file.name} (${formatFileSize(file.size)})`
    ).join('\n');
    messageWithAttachments = `${message}\n\nAttached files:\n${attachmentsList}`;
  }
  
  // Show chat messages if not visible
  if (!isChatMessagesVisible) {
    showChatMessages();
  }
  
  // Add user message to chat
  addMessageToChat('user', message);
  
  // Add loading message
  const loadingMessageId = addMessageToChat('assistant', '');
  showTypingIndicator(loadingMessageId);
  
  // Send to OpenAI API
  sendToOpenAI(message, loadingMessageId);

  // Clear attachments after sending
  attachedFiles = [];
  updateAttachmentsDisplay();
}

// Function to show chat messages container
function showChatMessages() {
  // Check if already exists
  const existingContainer = document.getElementById('8pilot-chat-messages');
  if (existingContainer) return;
  
  console.log('Showing chat messages container');
  isChatMessagesVisible = true;
  
  // Add slide-in animation styles
  if (!document.getElementById('chat-animation-styles')) {
    const animationStyles = document.createElement('style');
    animationStyles.id = 'chat-animation-styles';
    animationStyles.textContent = `
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeOutUp {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
    `;
    document.head.appendChild(animationStyles);
  }
  
  // Create messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = '8pilot-chat-messages';
  
  // Get current chat container position for adaptive positioning
  const chatContainer = document.getElementById('8pilot-chat-container');
  let containerLeft, containerTop, containerWidth;
  
  if (chatContainer) {
    const rect = chatContainer.getBoundingClientRect();
    containerLeft = rect.left;
    containerTop = rect.top;
    containerWidth = rect.width;
  } else {
    // Fallback to center positioning if chat container not found
    containerLeft = window.innerWidth / 2;
    containerTop = window.innerHeight - 120;
    containerWidth = 600;
  }
  
  messagesContainer.style.cssText = `
    position: fixed;
    left: ${containerLeft}px;
    top: ${containerTop - 370}px;
    width: ${Math.min(containerWidth, Math.min(600, window.innerWidth * 0.9))}px;
    height: 350px;
    max-height: 50vh;
    z-index: 10001;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    transform: none;
  `;  
  
  const messagesWrapper = document.createElement('div');
  messagesWrapper.id = '8pilot-messages-wrapper';
  messagesWrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px 0 0 0;
    overflow-y: auto;
    max-height: 100%;
    
    -webkit-mask: linear-gradient(to bottom, 
      transparent 0px, 
      rgba(0,0,0,0.2) 30px,
      rgba(0,0,0,0.6) 60px,
      rgba(0,0,0,1) 90px,
      rgba(0,0,0,1) 100%
    );
    mask: linear-gradient(to bottom, 
      transparent 0px, 
      rgba(0,0,0,0.2) 30px,
      rgba(0,0,0,0.6) 60px,
      rgba(0,0,0,1) 90px,
      rgba(0,0,0,1) 100%
  );
      
    /* Кастомный скроллбар */
    scrollbar-width: thin;
    scrollbar-color: rgba(79, 209, 199, 0) transparent;
  `;
    
  // Add custom scrollbar styles
  if (!document.getElementById('scrollbar-styles')) {
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.id = 'scrollbar-styles';
    scrollbarStyle.textContent = `
      #8pilot-messages-wrapper::-webkit-scrollbar {
        width: 4px;
      }
      #8pilot-messages-wrapper::-webkit-scrollbar-track {
        background: transparent;
      }
      #8pilot-messages-wrapper::-webkit-scrollbar-thumb {
        background: rgba(79, 209, 199, 0.3);
        border-radius: 2px;
      }
      #8pilot-messages-wrapper::-webkit-scrollbar-thumb:hover {
        background: rgba(79, 209, 199, 0.5);
      }
    `;
    document.head.appendChild(scrollbarStyle);
  }
  messagesContainer.appendChild(messagesWrapper);
  document.body.appendChild(messagesContainer);
  
  // Prevent clicks from closing the chat
  messagesContainer.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Auto-scroll to bottom when new messages arrive
  const observer = new MutationObserver(() => {
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
  });
  observer.observe(messagesWrapper, { childList: true });
}

// Function to update messages container position based on chat container
function updateMessagesPosition() {
  const messagesContainer = document.getElementById('8pilot-chat-messages');
  const chatContainer = document.getElementById('8pilot-chat-container');
  
  if (!messagesContainer || !chatContainer) return;
  
  const rect = chatContainer.getBoundingClientRect();
  
  // Update position to stay above chat container
  messagesContainer.style.left = rect.left + 'px';
  messagesContainer.style.top = (rect.top - 370) + 'px';
  messagesContainer.style.width = Math.min(rect.width, Math.min(600, window.innerWidth * 0.9)) + 'px';
  
  // Ensure messages container doesn't go off-screen
  const messagesRect = messagesContainer.getBoundingClientRect();
  let adjustedLeft = rect.left;
  let adjustedTop = rect.top - 370;
  
  // Adjust horizontal position if going off-screen
  if (messagesRect.right > window.innerWidth) {
    adjustedLeft = window.innerWidth - messagesRect.width - 10;
  }
  if (messagesRect.left < 0) {
    adjustedLeft = 10;
  }
  
  // Adjust vertical position if going off-screen
  if (adjustedTop < 0) {
    adjustedTop = 10;
  }
  
  messagesContainer.style.left = adjustedLeft + 'px';
  messagesContainer.style.top = adjustedTop + 'px';
}

// Function to hide chat messages
function hideChatMessages() {
  const messagesContainer = document.getElementById('8pilot-chat-messages');
  if (messagesContainer) {
    messagesContainer.remove();
    isChatMessagesVisible = false;
    chatMessages = [];
  }
}

// Function to add message to chat
function addMessageToChat(role, content) {
  const messagesWrapper = document.getElementById('8pilot-messages-wrapper');
  if (!messagesWrapper) return;
  
  const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const isUser = role === 'user';
  
  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.id = messageId;
  messageContainer.className = `chat-message ${role}`;
  messageContainer.style.cssText = `
    display: flex;
    ${isUser ? 'justify-content: flex-end' : 'justify-content: flex-start'};
    pointer-events: auto;
    opacity: 0;
    transform: translateY(20px);
    animation: slideInUp 0.3s ease-out forwards;
    margin: 0;
    padding: 0;
  `;
  
  // Create message bubble
  const messageBubble = document.createElement('div');
  messageBubble.style.cssText = `
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 8px;
    ${isUser ? 
      `background: rgba(7, 27, 25, 0.85); 
       color: #e2e8f0;
       border: 1px solid rgba(79, 209, 199, 0.7); 
       margin-left: auto;` : 
      `background: rgba(0, 0, 0, 1); 
       border: 1px solid rgba(255, 255, 255, 0.1); 
       color: #e2e8f0; 
       backdrop-filter: blur(10px);`
    }
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    position: relative;
  `;
  
  // Add subtle hover effect
  messageBubble.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-1px)';
    this.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.3)';
  });
  
  messageBubble.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
  });
  
  if (content) {
    messageBubble.innerHTML = formatMessage(content);
  }
  
  messageContainer.appendChild(messageBubble);
  messagesWrapper.appendChild(messageContainer);
  
  // Store message
  chatMessages.push({
    id: messageId,
    role: role,
    content: content,
    element: messageContainer
  });
  
  // Auto-scroll to bottom
  setTimeout(() => {
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
  }, 50);
  
  return messageId;
}

// Function to format message content
function formatMessage(content) {
  // Convert markdown-like formatting to HTML
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin: 8px 0;"><code>$1</code></pre>');
}

// Function to show typing indicator
function showTypingIndicator(messageId) {
  const messageElement = document.getElementById(messageId);
  if (!messageElement) return;
  
  const bubble = messageElement.querySelector('div');
  if (!bubble) return;
  
  bubble.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="color: #a1a1aa; font-size: 14px;">Thinking</span>
      <div style="display: flex; gap: 3px;">
        <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite;"></div>
        <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite 0.2s;"></div>
        <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite 0.4s;"></div>
      </div>
    </div>
  `;
  
  // Add typing animation styles if not already added
  if (!document.getElementById('typing-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'typing-animation-styles';
    style.textContent = `
      @keyframes typing-bounce {
        0%, 60%, 100% { 
          transform: translateY(0); 
          opacity: 0.4; 
        }
        30% { 
          transform: translateY(-4px); 
          opacity: 1; 
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Function to update message content
function updateMessageContent(messageId, content) {
  const messageElement = document.getElementById(messageId);
  if (!messageElement) return;
  
  const bubble = messageElement.querySelector('div');
  if (!bubble) return;
  
  bubble.innerHTML = formatMessage(content);
  
  // Update stored message
  const messageIndex = chatMessages.findIndex(msg => msg.id === messageId);
  if (messageIndex !== -1) {
    chatMessages[messageIndex].content = content;
  }
  
  scrollToBottom();
}

// Function to scroll to bottom of messages
function scrollToBottom() {
  const messagesContainer = document.getElementById('8pilot-chat-messages');
  if (messagesContainer) {
    const messagesWrapper = document.getElementById('8pilot-messages-wrapper');
    if (messagesWrapper) {
      setTimeout(() => {
        messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
      }, 100);
    }
  }
}

// Function to send message to OpenAI API
async function sendToOpenAI(message, messageId) {
  try {
    // Get API key and model from chrome storage
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(['openaiApiKey', 'provider', 'model'], resolve);
    });
    
    const apiKey = result.openaiApiKey;
    const provider = result.provider || 'openai';
    const model = result.model || 'gpt-4o-mini';
    
    if (!apiKey) {
      updateMessageContent(messageId, '❌ OpenAI API key not found. Please set your API key in the extension settings.');
      return;
    }
    
    // Prepare messages for API
    const messages = [
      {
        role: 'system',
        content: 'You are 8pilot AI, an expert assistant for n8n workflow automation. You help users create, optimize, and troubleshoot n8n workflows. Be helpful, concise, and provide actionable advice.'
      }
    ];
    
    // Add previous messages for context (last 10 messages)
    const recentMessages = chatMessages
      .filter(msg => msg.content && msg.role !== 'system')
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    messages.push(...recentMessages);
    messages.push({ role: 'user', content: message });
    
    // Make API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        stream: true,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantResponse = '';
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            
            if (delta) {
              assistantResponse += delta;
              updateMessageContent(messageId, assistantResponse);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
    
    // If no response was received, show error
    if (!assistantResponse) {
      updateMessageContent(messageId, '❌ No response received from OpenAI API');
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    updateMessageContent(messageId, `❌ Error: ${error.message}. Please check your API key and try again.`);
  }
}

// Function to hide chat window
function hideChatWindow() {
  const chatContainer = document.getElementById('8pilot-chat-container');
  if (chatContainer) {
    // Stop placeholder cycling
    stopPlaceholderCycling();
    
    chatContainer.style.opacity = '0';
    chatContainer.style.transform = 'translateX(-50%) translateY(20px)';
    
    setTimeout(() => {
      if (chatContainer.parentNode) {
        chatContainer.parentNode.removeChild(chatContainer);
      }
    }, 300);
  }
  
  isChatWindowVisible = false;

  // Clear attachments when hiding
  attachedFiles = [];
  const attachmentsContainer = document.getElementById('8pilot-attachments-container');
  if (attachmentsContainer) {
    attachmentsContainer.innerHTML = '';
  }
}

// State for plus menu and attachments
let isPlusMenuVisible = false;
let attachedFiles = [];

// Function to toggle plus menu
function togglePlusMenu() {
  if (isPlusMenuVisible) {
    hidePlusMenu();
  } else {
    showPlusMenu();
  }
}

// Function to show plus menu
function showPlusMenu() {
  // Remove existing menu if any
  hidePlusMenu();
  
  const plusButton = document.getElementById('8pilot-plus-button');
  if (!plusButton) return;
  
  const menu = document.createElement('div');
  menu.id = '8pilot-plus-menu';
  
  // Получаем позицию plusButton для правильного позиционирования
  const plusButtonRect = plusButton.getBoundingClientRect();
  
  menu.style.cssText = `
    position: fixed;
    bottom: ${window.innerHeight - plusButtonRect.top + 10}px;
    left: ${plusButtonRect.left}px;
    background: #000000;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    z-index: 10003;
    min-width: 200px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px) scale(0.95);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  const menuItems = [
    {
      id: 'upload-document',
      icon: '📄',
      title: 'Upload Document',
      description: 'Attach files to analyze'
    },
    {
      id: 'quick-templates',
      icon: '⚡',
      title: 'Quick Templates',
      description: 'Pre-made workflow questions'
    },
    {
      id: 'workflow-analysis',
      icon: '🔍',
      title: 'Workflow Analysis',
      description: 'Analyze current page'
    }
  ];
  
  menuItems.forEach((item, index) => {
    const menuItem = document.createElement('div');
    menuItem.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: ${index < menuItems.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'};
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    
    menuItem.innerHTML = `
      <span style="font-size: 16px;">${item.icon}</span>
      <div>
        <div style="color: #ffffff; font-size: 13px; font-weight: 500;">${item.title}</div>
        <div style="color: #a1a1aa; font-size: 11px; margin-top: 2px;">${item.description}</div>
      </div>
    `;
    
    menuItem.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(79, 209, 199, 0.1)';
    });
    
    menuItem.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
    });
    
    menuItem.addEventListener('click', function(e) {
      e.stopPropagation();
      handlePlusMenuAction(item.id);
      hidePlusMenu();
    });
    
    menu.appendChild(menuItem);
  });
  
  // Добавляем меню к body вместо plusButton
  document.body.appendChild(menu);
  isPlusMenuVisible = true;
  
  // Устанавливаем состояние кнопки как активное (повернутое)
  plusButton.style.color = '#06b6d4';
  plusButton.style.backgroundColor = 'rgba(79, 209, 199, 0.1)';
  plusButton.style.transform = 'scale(1.1) rotate(45deg)';
  
  // Animate in
  setTimeout(() => {
    menu.style.opacity = '1';
    menu.style.transform = 'translateY(0) scale(1)';
  }, 10);
  
  // Add click outside handler
  setTimeout(() => {
    const clickHandler = function(e) {
      if (!menu.contains(e.target) && !plusButton.contains(e.target)) {
        hidePlusMenu();
        document.removeEventListener('click', clickHandler);
      }
    };
    document.addEventListener('click', clickHandler);
  }, 100);
}

// Function to hide plus menu
function hidePlusMenu() {
  const menu = document.getElementById('8pilot-plus-menu');
  const plusButton = document.getElementById('8pilot-plus-button');
  
  if (menu) {
    menu.style.opacity = '0';
    menu.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => {
      if (menu.parentNode) {
        menu.parentNode.removeChild(menu);
      }
    }, 200);
  }
  
  // Возвращаем кнопку в исходное состояние
  if (plusButton) {
    plusButton.style.color = '#6b7280';
    plusButton.style.backgroundColor = 'transparent';
    plusButton.style.transform = 'scale(1) rotate(0deg)';
  }
  
  isPlusMenuVisible = false;
}

// Function to handle plus menu actions
function handlePlusMenuAction(actionId) {
  const messageInput = document.getElementById('8pilot-message-input');
  if (!messageInput) return;
  
  switch (actionId) {
    case 'upload-document':
      document.getElementById('8pilot-file-input').click();
      break;
      
    case 'quick-templates':
      showQuickTemplates();
      break;
      
    case 'workflow-analysis':
      messageInput.value = 'Please analyze the current workflow on this page and provide optimization suggestions.';
      messageInput.focus();
      break;
  }
}

// Function to show quick templates
function showQuickTemplates() {
  const messageInput = document.getElementById('8pilot-message-input');
  if (!messageInput) return;
  
  const templates = [
    'How can I optimize this workflow for better performance?',
    'Create sticky notes explaining each step of this workflow.',
    'What are potential error points in this workflow?',
    'Help me add error handling to this workflow.',
    'Suggest alternative approaches for this workflow.',
    'How can I make this workflow more robust?'
  ];
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  messageInput.value = randomTemplate;
  messageInput.focus();
}

// Function to handle file selection
function handleFileSelection(files) {
  if (!files || files.length === 0) return;
  
  Array.from(files).forEach(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.warn('File too large:', file.name);
      return;
    }
    
    const fileInfo = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    };
    
    attachedFiles.push(fileInfo);
  });
  
  updateAttachmentsDisplay();
}

// Function to update attachments display
function updateAttachmentsDisplay() {
  // Найти контейнер для вложений рядом со скрепкой
  const attachmentsContainer = document.getElementById('8pilot-attachments-container');
  if (!attachmentsContainer) return;
  
  // Очистить существующие вложения
  attachmentsContainer.innerHTML = '';
  
  if (attachedFiles.length === 0) return;
  
  attachedFiles.forEach(fileInfo => {
    const fileChip = document.createElement('div');
    fileChip.style.cssText = `
      background: rgba(0, 0, 0, 0.9);
      border-radius: 4px;
      padding: 3px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #ffffff;
      max-width: 140px;
      height: 18px;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    `;
    
    const fileName = fileInfo.name.length > 18 
      ? fileInfo.name.substring(0, 18) + '...' 
      : fileInfo.name;
    
    const fileSize = formatFileSize(fileInfo.size);
    
    // Определить иконку по типу файла
    let fileIcon = '📄';
    if (fileInfo.type.includes('image')) fileIcon = '🖼️';
    else if (fileInfo.type.includes('pdf')) fileIcon = '📋';
    else if (fileInfo.type.includes('json')) fileIcon = '📝';
    else if (fileInfo.type.includes('csv') || fileInfo.type.includes('xlsx')) fileIcon = '📊';
    
    // Создаем элементы отдельно для лучшего контроля
    const fileNameSpan = document.createElement('span');
    fileNameSpan.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;';
    fileNameSpan.textContent = fileName;
    
    const fileSizeSpan = document.createElement('span');
    fileSizeSpan.style.cssText = 'font-size: 10px; color: #cccccc;';
    fileSizeSpan.textContent = fileSize;
    
    const removeButton = document.createElement('button');
    removeButton.innerHTML = '×';
    removeButton.style.cssText = `
      background: none; 
      border: none; 
      color: #ffffff; 
      cursor: pointer; 
      padding: 1px 3px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s ease;
      margin-left: 2px;
      line-height: 1;
    `;
    
    // Добавляем hover эффекты
    removeButton.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      this.style.color = '#ffffff';
    });
    
    removeButton.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
      this.style.color = '#ffffff';
    });
    
    // Добавляем обработчик клика для удаления файла
    removeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      removeAttachment(fileInfo.id);
    });
    
    // Добавляем элементы в fileChip
    fileChip.appendChild(fileNameSpan);
    fileChip.appendChild(fileSizeSpan);
    fileChip.appendChild(removeButton);
    
    // Добавить hover эффект для файла
    fileChip.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.style.borderColor = 'rgba(79, 209, 199, 0.4)';
      this.style.transform = 'translateY(-1px)';
    });
    
    fileChip.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      this.style.transform = 'translateY(0)';
    });
    
    attachmentsContainer.appendChild(fileChip);
  });
}

// Function to remove attachment
function removeAttachment(fileId) {
  attachedFiles = attachedFiles.filter(file => file.id !== fileId);
  updateAttachmentsDisplay();
}

// Добавляем функцию в глобальную область видимости для доступа из HTML
window.removeAttachment = removeAttachment;

// Function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Initialize content script
if (isN8nPage()) {
  console.log('n8n workflow page detected');
}
