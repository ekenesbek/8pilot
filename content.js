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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  `;
  
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

  // Prevent click propagation on input container
  inputContainer.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  inputWrapper.appendChild(messageInput);
  inputWrapper.appendChild(sendButton);
  inputContainer.appendChild(inputWrapper);
  
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
  messagesContainer.style.cssText = `
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 120px;
    width: 600px;
    max-width: 90vw;
    height: 400px;
    max-height: 50vh;
    z-index: 10001;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  `;
  
  // Create fade mask for top
  const fadeMask = document.createElement('div');
  fadeMask.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, transparent 100%);
    pointer-events: none;
    z-index: 1;
  `;
  
  // Create messages wrapper
  const messagesWrapper = document.createElement('div');
  messagesWrapper.id = '8pilot-messages-wrapper';
  messagesWrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px 0;
    overflow-y: auto;
    max-height: 100%;
    
    /* Кастомный скроллбар */
    scrollbar-width: thin;
    scrollbar-color: rgba(79, 209, 199, 0.3) transparent;
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
  
  messagesContainer.appendChild(fadeMask);
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
      <span style="color: #a1a1aa; font-size: 14px;">thinking</span>
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
}

// Initialize content script
if (isN8nPage()) {
  console.log('n8n workflow page detected');
}
