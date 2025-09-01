// sidepanel/modules/templates.js - Templates Management Module

// Templates manager
class TemplatesManager {
  constructor() {
    this.templates = [];
    this.init();
  }

  init() {
    this.initializeTemplates();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Create template button
    const createTemplateBtn = document.getElementById('create-template-btn');
    if (createTemplateBtn) {
      createTemplateBtn.addEventListener('click', () => this.createTemplate());
    }

    // Category filters
    const categoryBtns = document.querySelectorAll('.category');
    categoryBtns.forEach(cat => {
      cat.addEventListener('click', (e) => this.filterTemplates(e.target.dataset.category));
    });
  }

  // Initialize templates with some basic ones
  initializeTemplates() {
    this.templates = [
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
      },
      {
        id: 'api-webhook',
        name: 'API Webhook',
        description: 'Handle incoming webhook requests',
        category: 'api',
        nodes: 2,
        workflow: {
          nodes: [
            { name: 'Webhook', type: 'n8n-nodes-base.webhook' },
            { name: 'Process Data', type: 'n8n-nodes-base.set' }
          ]
        }
      },
      {
        id: 'file-processing',
        name: 'File Processing',
        description: 'Process uploaded files automatically',
        category: 'automation',
        nodes: 3,
        workflow: {
          nodes: [
            { name: 'File Upload', type: 'n8n-nodes-base.webhook' },
            { name: 'Process File', type: 'n8n-nodes-base.code' },
            { name: 'Save Result', type: 'n8n-nodes-base.writeBinaryFile' }
          ]
        }
      },
      {
        id: 'notification-system',
        name: 'Notification System',
        description: 'Send notifications across multiple channels',
        category: 'automation',
        nodes: 4,
        workflow: {
          nodes: [
            { name: 'Trigger', type: 'n8n-nodes-base.manualTrigger' },
            { name: 'Email', type: 'n8n-nodes-base.emailSend' },
            { name: 'Slack', type: 'n8n-nodes-base.slack' },
            { name: 'SMS', type: 'n8n-nodes-base.twilio' }
          ]
        }
      }
    ];
  }

  // Filter templates by category
  filterTemplates(category) {
    // Update active category
    document.querySelectorAll('.category').forEach(cat => {
      cat.classList.toggle('active', cat.dataset.category === category);
    });
    
    this.renderTemplates(category);
  }

  // Render templates
  renderTemplates(category = 'all') {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const filtered = category === 'all' 
      ? this.templates 
      : this.templates.filter(t => t.category === category);
    
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-tertiary);">
          <p>No templates found for category: ${category}</p>
        </div>
      `;
      return;
    }
    
    filtered.forEach(template => {
      const card = this.createTemplateCard(template);
      grid.appendChild(card);
    });
  }

  // Create template card element
  createTemplateCard(template) {
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
      this.useTemplate(template);
    });
    
    return card;
  }

  // Use template
  useTemplate(template) {
    const message = `I'd like to use the "${template.name}" template: ${template.description}`;
    
    // Set message in chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = message;
    }
    
    // Switch to chat tab
    if (window.settingsManager) {
      window.settingsManager.switchTab('chat');
    }
    
    // Focus on chat input
    setTimeout(() => {
      if (chatInput) {
        chatInput.focus();
      }
    }, 100);
  }

  // Create template from current workflow
  createTemplate() {
    if (window.chatManager) {
      window.chatManager.addMessage('assistant', 'Template creation from current workflow coming soon!');
    }
  }

  // Add new template
  addTemplate(template) {
    this.templates.push(template);
    this.renderTemplates();
  }

  // Remove template
  removeTemplate(templateId) {
    this.templates = this.templates.filter(t => t.id !== templateId);
    this.renderTemplates();
  }

  // Get template by ID
  getTemplate(templateId) {
    return this.templates.find(t => t.id === templateId);
  }

  // Get all templates
  getAllTemplates() {
    return this.templates;
  }

  // Get templates by category
  getTemplatesByCategory(category) {
    return this.templates.filter(t => t.category === category);
  }

  // Search templates
  searchTemplates(query) {
    if (!query) return this.templates;
    
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Export templates
  exportTemplates() {
    const dataStr = JSON.stringify(this.templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'n8n-templates.json';
    link.click();
  }

  // Import templates
  importTemplates(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedTemplates = JSON.parse(e.target.result);
          
          // Validate templates structure
          if (Array.isArray(importedTemplates)) {
            const validTemplates = importedTemplates.filter(t => 
              t.id && t.name && t.description && t.category
            );
            
            // Add imported templates
            this.templates.push(...validTemplates);
            
            // Re-render
            this.renderTemplates();
            
            resolve(validTemplates.length);
          } else {
            reject(new Error('Invalid templates file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse templates file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Get template statistics
  getTemplateStats() {
    const stats = {
      total: this.templates.length,
      byCategory: {},
      averageNodes: 0
    };
    
    let totalNodes = 0;
    
    this.templates.forEach(template => {
      // Count by category
      if (!stats.byCategory[template.category]) {
        stats.byCategory[template.category] = 0;
      }
      stats.byCategory[template.category]++;
      
      // Sum nodes
      totalNodes += template.nodes || 0;
    });
    
    // Calculate average nodes
    if (this.templates.length > 0) {
      stats.averageNodes = Math.round(totalNodes / this.templates.length);
    }
    
    return stats;
  }
}

// Export for use in other modules
window.TemplatesManager = TemplatesManager;
window.renderTemplates = (category) => window.templatesManager?.renderTemplates(category);
