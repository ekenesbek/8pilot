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
      chrome.runtime.sendMessage({ action: 'openChat' });
      break;
    case 'history':
      // Open history functionality
      chrome.runtime.sendMessage({ action: 'openHistory' });
      break;
    default:
      console.log('Unknown menu action:', action);
  }
}

// Initialize content script
if (isN8nPage()) {
  console.log('n8n workflow page detected');
}
