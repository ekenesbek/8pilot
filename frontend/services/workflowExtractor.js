// Workflow data extraction service
export class WorkflowExtractor {
  constructor() {
    // No initialization needed
  }

  extractWorkflowData() {
    // Try to extract workflow data from n8n page
    const workflowData = {
      url: window.location.href,
      title: document.title,
      isN8nPage: this.isN8nPage(),
      workflowId: this.extractWorkflowId(),
      nodes: this.extractNodes(),
      connections: this.extractConnections()
    };
    
    return workflowData;
  }

  isN8nPage() {
    // Check if current page is an n8n workflow page
    const url = window.location.href.toLowerCase();
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      const port = urlObj.port;
      
      // Check URL patterns
      const isN8nUrl = (
        // n8n in hostname (e.g., kkengesbek.app.n8n.cloud, n8n.example.com)
        hostname.includes('n8n') ||
        // n8n in path (e.g., example.com/n8n)
        pathname.includes('/n8n') ||
        // workflow in path (common n8n pattern)
        pathname.includes('/workflow') ||
        pathname.includes('/execution') ||
        // Common n8n ports
        (port === '5678') ||
        // localhost development
        (hostname === 'localhost' && (port === '5678' || pathname.includes('workflow'))) ||
        // IP addresses with n8n port
        (hostname.match(/^\d+\.\d+\.\d+\.\d+$/) && port === '5678')
      );
      
      // Check for n8n specific elements
      const hasN8nElements = document.querySelector('[data-test-id="workflow-canvas"]') !== null ||
                            document.querySelector('.workflow-canvas') !== null ||
                            document.querySelector('.n8n-workflow') !== null ||
                            document.querySelector('[data-n8n]') !== null ||
                            document.querySelector('canvas') !== null; // n8n uses canvas for workflow
      
      // Check for n8n in page title or meta
      const hasN8nMeta = document.title.toLowerCase().includes('n8n') ||
                        document.querySelector('meta[name="description"]')?.content?.toLowerCase().includes('n8n') ||
                        document.querySelector('meta[property="og:title"]')?.content?.toLowerCase().includes('n8n');
      
      // Check for n8n scripts or global variables
      const hasN8nGlobals = typeof window.n8n !== 'undefined' ||
                           document.querySelector('script[src*="n8n"]') !== null;
      
      console.log('N8N Detection:', {
        url: isN8nUrl,
        elements: hasN8nElements,
        meta: hasN8nMeta,
        globals: hasN8nGlobals,
        currentUrl: window.location.href,
        title: document.title,
        hostname: hostname,
        pathname: pathname,
        port: port
      });
      
      return isN8nUrl || hasN8nElements || hasN8nMeta || hasN8nGlobals;
    } catch (error) {
      console.error('Error parsing URL:', error);
      // Fallback to simple string check
      return url.includes('n8n') || url.includes('workflow') || url.includes('localhost');
    }
  }

  extractWorkflowId() {
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

  extractNodes() {
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

  extractConnections() {
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
}
