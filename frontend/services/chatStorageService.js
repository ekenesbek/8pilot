// Chat Storage Service for managing workflow-specific chats
export class ChatStorageService {
  constructor() {
    this.chats = new Map(); // workflowId -> chat data
    this.currentWorkflowId = null;
    this.storageKey = '8pilot_workflow_chats';
    this.maxChats = 50; // Maximum number of chats to keep in memory
    this.maxMessagesPerChat = 100; // Maximum messages per chat
    
    // Load existing chats from localStorage
    this.loadFromStorage();
    
    // Save to localStorage periodically
    this.setupAutoSave();
  }

  // Load chats from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.chats = new Map(data.chats || []);
        this.currentWorkflowId = data.currentWorkflowId || null;
        console.log('Loaded chats from storage:', this.chats.size, 'workflows');
      }
    } catch (error) {
      console.error('Error loading chats from storage:', error);
      this.chats = new Map();
    }
  }

  // Save chats to localStorage
  saveToStorage() {
    try {
      const data = {
        chats: Array.from(this.chats.entries()),
        currentWorkflowId: this.currentWorkflowId,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('Saved chats to storage:', this.chats.size, 'workflows');
    } catch (error) {
      console.error('Error saving chats to storage:', error);
    }
  }

  // Setup automatic saving
  setupAutoSave() {
    // Save every 30 seconds
    setInterval(() => {
      this.saveToStorage();
    }, 30000);

    // Save before page unload
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  // Set current workflow ID
  setCurrentWorkflowId(workflowId) {
    this.currentWorkflowId = workflowId;
    this.saveToStorage();
  }

  // Get current workflow ID
  getCurrentWorkflowId() {
    return this.currentWorkflowId;
  }

  // Get or create chat for workflow
  getChat(workflowId) {
    if (!workflowId) {
      workflowId = this.currentWorkflowId || 'default';
    }

    if (!this.chats.has(workflowId)) {
      this.createChat(workflowId);
    }

    return this.chats.get(workflowId);
  }

  // Create new chat for workflow
  createChat(workflowId, workflowName = null) {
    const chatData = {
      workflowId: workflowId,
      workflowName: workflowName || this.getWorkflowName(workflowId),
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: false
    };

    this.chats.set(workflowId, chatData);
    this.cleanupOldChats();
    this.saveToStorage();

    console.log('Created new chat for workflow:', workflowId);
    return chatData;
  }

  // Get workflow name from various sources
  getWorkflowName(workflowId) {
    // Try to get from page title
    if (document.title && document.title !== 'n8n') {
      return document.title;
    }

    // Try to get from workflow data
    if (typeof window.n8n !== 'undefined' && window.n8n.workflow) {
      return window.n8n.workflow.name || `Workflow ${workflowId}`;
    }

    // Try to get from URL
    const url = window.location.href;
    if (url.includes('workflow')) {
      return `Workflow ${workflowId}`;
    }

    return `Workflow ${workflowId}`;
  }

  // Add message to chat
  addMessage(workflowId, role, content, messageType = 'normal') {
    const chat = this.getChat(workflowId);
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: role,
      content: content,
      type: messageType,
      timestamp: Date.now()
    };

    chat.messages.push(message);
    chat.lastActivity = Date.now();

    // Limit messages per chat
    if (chat.messages.length > this.maxMessagesPerChat) {
      chat.messages = chat.messages.slice(-this.maxMessagesPerChat);
    }

    this.saveToStorage();
    console.log('Added message to chat:', workflowId, role, content.substring(0, 50) + '...');
    
    return message;
  }

  // Get messages for workflow
  getMessages(workflowId) {
    const chat = this.getChat(workflowId);
    return chat.messages;
  }

  // Clear messages for workflow
  clearMessages(workflowId) {
    const chat = this.getChat(workflowId);
    chat.messages = [];
    chat.lastActivity = Date.now();
    this.saveToStorage();
    console.log('Cleared messages for workflow:', workflowId);
  }

  // Delete chat for workflow
  deleteChat(workflowId) {
    if (this.chats.has(workflowId)) {
      this.chats.delete(workflowId);
      this.saveToStorage();
      console.log('Deleted chat for workflow:', workflowId);
      return true;
    }
    return false;
  }

  // Get all chats
  getAllChats() {
    return Array.from(this.chats.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  }

  // Get chat by workflow ID
  getChatByWorkflowId(workflowId) {
    return this.chats.get(workflowId);
  }

  // Check if chat exists
  hasChat(workflowId) {
    return this.chats.has(workflowId);
  }

  // Get chat count
  getChatCount() {
    return this.chats.size;
  }

  // Cleanup old chats to prevent memory issues
  cleanupOldChats() {
    if (this.chats.size <= this.maxChats) {
      return;
    }

    // Sort chats by last activity and keep only the most recent ones
    const sortedChats = Array.from(this.chats.entries())
      .sort((a, b) => b[1].lastActivity - a[1].lastActivity)
      .slice(0, this.maxChats);

    this.chats = new Map(sortedChats);
    console.log('Cleaned up old chats, kept:', this.chats.size);
  }

  // Export chat data
  exportChat(workflowId) {
    const chat = this.getChat(workflowId);
    return {
      workflowId: chat.workflowId,
      workflowName: chat.workflowName,
      messages: chat.messages,
      createdAt: chat.createdAt,
      lastActivity: chat.lastActivity,
      exportDate: Date.now()
    };
  }

  // Import chat data
  importChat(chatData) {
    if (!chatData.workflowId || !chatData.messages) {
      throw new Error('Invalid chat data');
    }

    const chat = {
      workflowId: chatData.workflowId,
      workflowName: chatData.workflowName || `Imported Workflow ${chatData.workflowId}`,
      messages: chatData.messages || [],
      createdAt: chatData.createdAt || Date.now(),
      lastActivity: chatData.lastActivity || Date.now(),
      isActive: false
    };

    this.chats.set(chatData.workflowId, chat);
    this.saveToStorage();
    console.log('Imported chat for workflow:', chatData.workflowId);
    return chat;
  }

  // Get chat statistics
  getChatStats() {
    const chats = this.getAllChats();
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
    const activeChats = chats.filter(chat => chat.isActive).length;
    
    return {
      totalChats: chats.length,
      totalMessages: totalMessages,
      activeChats: activeChats,
      oldestChat: chats.length > 0 ? Math.min(...chats.map(chat => chat.createdAt)) : null,
      newestChat: chats.length > 0 ? Math.max(...chats.map(chat => chat.lastActivity)) : null
    };
  }

  // Clear all chats
  clearAllChats() {
    this.chats.clear();
    this.currentWorkflowId = null;
    this.saveToStorage();
    console.log('Cleared all chats');
  }

  // Search messages across all chats
  searchMessages(query, workflowId = null) {
    const searchQuery = query.toLowerCase();
    const results = [];

    const chatsToSearch = workflowId ? [this.getChat(workflowId)] : this.getAllChats();

    chatsToSearch.forEach(chat => {
      chat.messages.forEach(message => {
        if (message.content.toLowerCase().includes(searchQuery)) {
          results.push({
            workflowId: chat.workflowId,
            workflowName: chat.workflowName,
            message: message
          });
        }
      });
    });

    return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
  }
}
