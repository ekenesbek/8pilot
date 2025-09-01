// sidepanel/modules/workflow.js - Workflow Management Module

// Workflow manager
class WorkflowManager {
  constructor() {
    this.currentWorkflowId = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Workflow controls
    const workflowRefreshBtn = document.getElementById('workflow-refresh-btn');
    if (workflowRefreshBtn) {
      workflowRefreshBtn.addEventListener('click', async () => {
        console.log('Workflow refresh button clicked');
        await this.getCurrentTabInfo();
        await this.loadWorkflowStats();
        this.showToast('Workflow info refreshed!', 'success');
      });
    }
  }

  // Get current workflow ID from URL
  getCurrentWorkflowId(url) {
    if (!url) return null;
    
    if (url.includes('/workflow/new')) {
      return 'new_workflow';
    }
    
    const workflowIdMatch = url.match(/workflow\/([^/?]+)/);
    return workflowIdMatch ? workflowIdMatch[1] : 'unknown_workflow';
  }

  // Check if it's an n8n page
  isN8nPage(url) {
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

  // Get current tab information
  async getCurrentTabInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        const url = tab.url;
        const isN8n = this.isN8nPage(url);
        
        // Update status
        this.updateStatus('page', isN8n ? 'active' : 'warning', 
          isN8n ? 'n8n page detected' : 'Not an n8n page');
        
        // Get workflow ID
        this.currentWorkflowId = this.getCurrentWorkflowId(url);
        this.updateWorkflowInfo();
        
        // Load chat for this workflow
        if (window.chatManager) {
          window.chatManager.loadWorkflowChat(this.currentWorkflowId);
        }
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
      this.updateStatus('page', 'error', 'Connection failed');
    }
  }

  // Update status indicators
  updateStatus(type, status, text) {
    const indicator = document.getElementById(`${type}-status`);
    const textEl = document.getElementById(`${type}-status-text`);
    
    if (indicator && textEl) {
      indicator.className = `status-indicator ${status}`;
      textEl.textContent = text;
    }
  }

  // Update workflow information display
  updateWorkflowInfo() {
    const nameEl = document.getElementById('workflow-name');
    const idEl = document.getElementById('workflow-id');
    const statusEl = document.getElementById('workflow-status');
    
    if (!nameEl || !idEl || !statusEl) return;
    
    if (this.currentWorkflowId) {
      const allWorkflowChats = window.chatManager ? window.chatManager.getAllWorkflowChats() : {};
      const workflowName = allWorkflowChats[this.currentWorkflowId]?.workflowName || 
        (this.currentWorkflowId === 'new_workflow' ? 'New Workflow' : `Workflow ${this.currentWorkflowId}`);
      
      nameEl.textContent = workflowName;
      idEl.textContent = this.currentWorkflowId;
      
      // Update workflow status
      if (this.currentWorkflowId === 'new_workflow') {
        statusEl.textContent = 'New';
        statusEl.style.background = 'var(--success)';
        statusEl.style.color = 'white';
        statusEl.style.borderColor = 'var(--success)';
      } else if (this.currentWorkflowId === 'unknown_workflow') {
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

  // Load workflow stats from n8n API
  async loadWorkflowStats() {
    if (!window.settings?.n8nApiUrl || !window.settings?.n8nApiKey || !this.currentWorkflowId || 
        this.currentWorkflowId === 'unknown_workflow' || this.currentWorkflowId === 'new_workflow') {
      return;
    }
    
    try {
      const response = await fetch(`${window.settings.n8nApiUrl}/api/v1/workflows/${this.currentWorkflowId}`, {
        headers: { 'X-N8N-API-KEY': window.settings.n8nApiKey }
      });
      
      if (response.ok) {
        const workflow = await response.json();
        
        // Update workflow name if we got it from API
        if (workflow.name && window.chatManager) {
          const allWorkflowChats = window.chatManager.getAllWorkflowChats();
          if (allWorkflowChats[this.currentWorkflowId]) {
            allWorkflowChats[this.currentWorkflowId].workflowName = workflow.name;
            document.getElementById('workflow-name').textContent = workflow.name;
            window.chatManager.saveChatStorage();
          }
        }
      }
    } catch (error) {
      console.error('Failed to load workflow stats:', error);
    }
  }

  // Get current workflow ID
  getCurrentWorkflowId() {
    return this.currentWorkflowId;
  }

  // Set current workflow ID
  setCurrentWorkflowId(workflowId) {
    this.currentWorkflowId = workflowId;
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `${type}-message`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
}

// Export for use in other modules
window.WorkflowManager = WorkflowManager;
window.getCurrentTabInfo = () => window.workflowManager?.getCurrentTabInfo();
window.loadWorkflowStats = () => window.workflowManager?.loadWorkflowStats();
window.updateWorkflowInfo = () => window.workflowManager?.updateWorkflowInfo();
