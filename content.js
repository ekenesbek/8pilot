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

// Initialize content script
if (isN8nPage()) {
  console.log('n8n workflow page detected');
  
  // Add visual indicator that extension is active
  const indicator = document.createElement('div');
  indicator.id = '8pilot-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #4fd1c7, #06b6d4);
    border-radius: 50%;
    z-index: 10000;
    box-shadow: 0 0 10px rgba(79, 209, 199, 0.5);
    animation: pulse 2s infinite;
  `;
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(indicator);
}
