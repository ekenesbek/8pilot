// Content script for 8pilot extension
console.log('8pilot content script loaded');

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
  // Also hide menu if it exists
  hideMenu();
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
  historyIcon.addEventListener('click', function() {
    handleMenuAction('history');
    hideMenu();
  });
  
  chatIcon.addEventListener('click', function() {
    handleMenuAction('chat');
    hideMenu();
  });
  
  // Add to document
  document.body.appendChild(historyIcon);
  document.body.appendChild(chatIcon);
  
  // Add click outside handler to close menu
  document.addEventListener('click', function(e) {
    const icon = document.getElementById('8pilot-activation-icon');
    const historyIcon = document.getElementById('8pilot-history-icon');
    const chatIcon = document.getElementById('8pilot-chat-icon');
    
    if (historyIcon && chatIcon) {
      if (!icon.contains(e.target) && 
          !historyIcon.contains(e.target) && 
          !chatIcon.contains(e.target)) {
        hideMenu();
      }
    }
  });
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
      if (historyIcon.parentNode) {
        historyIcon.parentNode.removeChild(historyIcon);
      }
      if (chatIcon.parentNode) {
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
      // Open chat functionality
      showChatWindow();
      break;
    case 'history':
      // Open history functionality
      chrome.runtime.sendMessage({ action: 'openHistory' });
      break;
    default:
      console.log('Unknown menu action:', action);
  }
}

// Function to show chat window
function showChatWindow() {
  // Remove existing chat if any
  hideChatWindow();
  
  console.log('Showing 8pilot simple chat input');
  
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
    transition: border-color 0.2s ease;
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
  
  sendButton.addEventListener('click', function() {
    const message = messageInput.value.trim();
    if (message) {
      stopPlaceholderCycling();
      showResponseOverlay(message);
      messageInput.value = '';
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
        showResponseOverlay(message);
        messageInput.value = '';
        messageInput.placeholder = 'Ask me anything about workflow...';
      }
    }
  });
  
  // Add hover and focus effects
  inputWrapper.addEventListener('mouseenter', function() {
    this.style.borderColor = '#ffffff';
    this.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.6)';
    startPlaceholderCycling();
  });
  
  inputWrapper.addEventListener('mouseleave', function() {
    if (messageInput !== document.activeElement) {
      this.style.borderColor = '#000000';
      this.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
      stopPlaceholderCycling();
      messageInput.placeholder = 'Ask me anything about workflow...';
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
    messageInput.placeholder = 'Ask me anything about workflow...';
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
  
  // Add click outside handler to close
  document.addEventListener('click', function(e) {
    if (!inputContainer.contains(e.target) && !document.getElementById('8pilot-chat-icon')?.contains(e.target)) {
      hideChatWindow();
    }
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

// Function to start placeholder cycling
function startPlaceholderCycling() {
  const messageInput = document.getElementById('8pilot-message-input');
  if (!messageInput || messageInput.value !== '') return;
  
  // Clear any existing interval
  if (placeholderInterval) {
    clearInterval(placeholderInterval);
  }
  
  // Start cycling immediately
  messageInput.placeholder = placeholderExamples[currentPlaceholderIndex];
  currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholderExamples.length;
  
  // Set up interval for continuous cycling
  placeholderInterval = setInterval(() => {
    if (messageInput && messageInput.value === '') {
      messageInput.placeholder = placeholderExamples[currentPlaceholderIndex];
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
}

// Function to show response overlay
function showResponseOverlay(userMessage) {
  // Remove existing response if any
  hideResponseOverlay();
  
  console.log('Showing response overlay for:', userMessage);
  
  // Create response container
  const responseContainer = document.createElement('div');
  responseContainer.id = '8pilot-response-overlay';
  responseContainer.style.cssText = `
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 60vw;
    max-height: 50vh;
    background: #000000;
    border: 1px solid rgba(79, 209, 199, 0.3);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(79, 209, 199, 0.4);
    z-index: 10003;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-y: auto;
  `;
  
  // Create response content
  const responseContent = document.createElement('div');
  responseContent.style.cssText = `
    color: #e2e8f0;
    font-size: 14px;
    line-height: 1.5;
  `;
  
  // Simulate AI response based on user message
  let aiResponse = generateAIResponse(userMessage);
  responseContent.innerHTML = aiResponse;
  
  responseContainer.appendChild(responseContent);
  document.body.appendChild(responseContainer);
  
  // Animate in
  setTimeout(() => {
    responseContainer.style.opacity = '1';
    responseContainer.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideResponseOverlay();
  }, 10000);
  
  // Add click to close
  responseContainer.addEventListener('click', function() {
    hideResponseOverlay();
  });
}

// Function to generate AI response
function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  if (message.includes('social media') || message.includes('automate')) {
    return `
      <div style="margin-bottom: 12px;">
        <strong style="color: #4fd1c7; font-size: 15px;">Social Media Automation Workflow</strong>
      </div>
      <div style="background: rgba(79, 209, 199, 0.1); border-left: 3px solid #4fd1c7; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0;">I'll help you create a comprehensive social media automation workflow. Here's what I recommend:</p>
        <ul style="margin: 8px 0; padding-left: 16px;">
          <li>Content scheduling across platforms</li>
          <li>Automated engagement responses</li>
          <li>Analytics tracking and reporting</li>
          <li>Cross-platform posting optimization</li>
        </ul>
      </div>
      <p style="margin: 0;">Would you like me to create specific nodes for your preferred social media platforms?</p>
    `;
  } else if (message.includes('optimize') || message.includes('optimization')) {
    return `
      <div style="margin-bottom: 12px;">
        <strong style="color: #4fd1c7; font-size: 15px;">Workflow Optimization</strong>
      </div>
      <div style="background: rgba(79, 209, 199, 0.1); border-left: 3px solid #4fd1c7; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0;">To optimize your workflow, I suggest:</p>
        <ul style="margin: 8px 0; padding-left: 16px;">
          <li>Adding error handling nodes</li>
          <li>Implementing retry mechanisms</li>
          <li>Using batch processing for efficiency</li>
          <li>Adding monitoring and logging</li>
        </ul>
      </div>
      <p style="margin: 0;">Let me analyze your current workflow structure to provide specific recommendations.</p>
    `;
  } else if (message.includes('sticky notes') || message.includes('explain')) {
    return `
      <div style="margin-bottom: 12px;">
        <strong style="color: #4fd1c7; font-size: 15px;">Workflow Documentation</strong>
      </div>
      <div style="background: rgba(79, 209, 199, 0.1); border-left: 3px solid #4fd1c7; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0;">I'll create detailed sticky notes for your workflow:</p>
        <ul style="margin: 8px 0; padding-left: 16px;">
          <li>Node-by-node explanations</li>
          <li>Data flow documentation</li>
          <li>Troubleshooting tips</li>
          <li>Best practices and warnings</li>
        </ul>
      </div>
      <p style="margin: 0;">This will help you and your team understand the workflow better.</p>
    `;
  } else if (message.includes('not working') || message.includes('error')) {
    return `
      <div style="margin-bottom: 12px;">
        <strong style="color: #4fd1c7; font-size: 15px;">Troubleshooting Help</strong>
      </div>
      <div style="background: rgba(79, 209, 199, 0.1); border-left: 3px solid #4fd1c7; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0;">Let me help you debug your workflow. Common issues include:</p>
        <ul style="margin: 8px 0; padding-left: 16px;">
          <li>Authentication problems</li>
          <li>Data format mismatches</li>
          <li>Rate limiting issues</li>
          <li>Missing required fields</li>
        </ul>
      </div>
      <p style="margin: 0;">Can you share the specific error message or describe what's happening?</p>
    `;
  } else if (message.includes('ai agent') || message.includes('agent')) {
    return `
      <div style="margin-bottom: 12px;">
        <strong style="color: #4fd1c7; font-size: 15px;">AI Agent Node Guide</strong>
      </div>
      <div style="background: rgba(79, 209, 199, 0.1); border-left: 3px solid #4fd1c7; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0;">The AI Agent node is powerful for:</p>
        <ul style="margin: 8px 0; padding-left: 16px;">
          <li>Natural language processing</li>
          <li>Content generation and analysis</li>
          <li>Decision making based on context</li>
          <li>Integration with various AI models</li>
        </ul>
      </div>
      <p style="margin: 0;">Would you like me to show you how to configure it for your specific use case?</p>
    `;
  } else {
    return `
      <div style="margin-bottom: 12px;">
        <strong style="color: #4fd1c7; font-size: 15px;">8pilot AI Assistant</strong>
      </div>
      <div style="background: rgba(79, 209, 199, 0.1); border-left: 3px solid #4fd1c7; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0;">I understand you're asking: "${userMessage}"</p>
        <p style="margin: 0;">I'm here to help you with workflow automation, optimization, and troubleshooting. How can I assist you further?</p>
      </div>
      <p style="margin: 0;">Try asking me about workflow creation, optimization, or specific n8n features!</p>
    `;
  }
}

// Function to hide response overlay
function hideResponseOverlay() {
  const responseOverlay = document.getElementById('8pilot-response-overlay');
  if (responseOverlay) {
    responseOverlay.style.opacity = '0';
    responseOverlay.style.transform = 'translate(-50%, -50%) scale(0.95)';
    
    setTimeout(() => {
      if (responseOverlay.parentNode) {
        responseOverlay.parentNode.removeChild(responseOverlay);
      }
    }, 300);
  }
}



// Function to hide chat window
function hideChatWindow() {
  const chatContainer = document.getElementById('8pilot-chat-container');
  if (chatContainer) {
    // Stop placeholder cycling
    stopPlaceholderCycling();
    
    chatContainer.style.opacity = '0';
    chatContainer.style.transform = 'translateY(20px) scale(0.95)';
    
    setTimeout(() => {
      if (chatContainer.parentNode) {
        chatContainer.parentNode.removeChild(chatContainer);
      }
    }, 300);
  }
}

// Initialize content script
if (isN8nPage()) {
  console.log('n8n workflow page detected');
}
