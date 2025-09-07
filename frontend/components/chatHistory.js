// Chat History component for displaying and managing chat history
export class ChatHistory {
  constructor(chatManager, backendApiService) {
    this.chatManager = chatManager;
    this.backendApiService = backendApiService;
    this.chatStorage = chatManager.chatStorage;
    this.historyContainerId = '8pilot-chat-history';
    this.isVisible = false;
    
    // Listen for menu actions
    window.addEventListener('8pilot-menu-action', (event) => {
      if (event.detail === 'history') {
        this.toggleHistory();
      }
    });
  }

  toggleHistory() {
    if (this.isVisible) {
      this.hideHistory();
    } else {
      this.showHistory();
    }
  }

  async showHistory() {
    if (this.isVisible) return;
    
    // Hide chat window if visible
    if (this.chatManager.stateManager.get('isChatWindowVisible')) {
      this.chatManager.hideChatWindow();
    }
    
    // Hide chat messages if visible
    if (this.chatManager.stateManager.get('isChatMessagesVisible')) {
      this.chatManager.hideChatMessages();
    }
    
    this.createHistoryContainer();
    await this.loadChatHistory();
    this.animateIn();
    this.isVisible = true;
  }

  hideHistory() {
    if (!this.isVisible) return;
    
    const container = document.getElementById(this.historyContainerId);
    if (container) {
      this.animateOut(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
    }
    
    this.isVisible = false;
  }

  createHistoryContainer() {
    // Remove existing container if any
    const existing = document.getElementById(this.historyContainerId);
    if (existing) {
      existing.remove();
    }

    const container = document.createElement('div');
    container.id = this.historyContainerId;
    container.style.cssText = `
      position: fixed;
      right: 30px;
      bottom: 100px;
      width: 400px;
      max-width: 90vw;
      max-height: 70vh;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      z-index: 10003;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    `;

    // Create header
    const header = this.createHeader();
    container.appendChild(header);

    // Create content area
    const content = this.createContentArea();
    container.appendChild(content);

    // Add to document
    document.body.appendChild(container);

    // Add click outside handler
    this.addClickOutsideHandler();
  }

  createHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #333;
      background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Chat History';
    title.style.cssText = `
      margin: 0;
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    closeButton.addEventListener('click', () => {
      this.hideHistory();
    });

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.color = '#ffffff';
      closeButton.style.background = '#333';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.color = '#9ca3af';
      closeButton.style.background = 'none';
    });

    header.appendChild(title);
    header.appendChild(closeButton);

    return header;
  }

  createContentArea() {
    const content = document.createElement('div');
    content.id = '8pilot-history-content';
    content.style.cssText = `
      padding: 0;
      max-height: calc(70vh - 60px);
      overflow-y: auto;
      background: #1a1a1a;
    `;

    // Add custom scrollbar styles
    const style = document.createElement('style');
    style.textContent = `
      #8pilot-history-content::-webkit-scrollbar {
        width: 6px;
      }
      #8pilot-history-content::-webkit-scrollbar-track {
        background: #2a2a2a;
      }
      #8pilot-history-content::-webkit-scrollbar-thumb {
        background: #4fd1c7;
        border-radius: 3px;
      }
      #8pilot-history-content::-webkit-scrollbar-thumb:hover {
        background: #06b6d4;
      }
    `;
    document.head.appendChild(style);

    return content;
  }

  async loadChatHistory() {
    const content = document.getElementById('8pilot-history-content');
    if (!content) return;

    // Show loading state
    content.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: #9ca3af;
        font-size: 14px;
      ">
        <div style="
          width: 20px;
          height: 20px;
          border: 2px solid #4fd1c7;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        "></div>
        Loading chat history...
      </div>
    `;

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    try {
      // Get all chats from local storage
      const localChats = this.chatStorage.getAllChats();
      
      // Try to get additional chats from backend if available
      let backendChats = [];
      if (this.backendApiService) {
        try {
          // This would need to be implemented in the backend API
          // For now, we'll use local storage only
        } catch (error) {
          console.log('Backend not available, using local storage only');
        }
      }

      this.renderChatHistory(localChats);
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.renderError('Failed to load chat history');
    }
  }

  renderChatHistory(chats) {
    const content = document.getElementById('8pilot-history-content');
    if (!content) return;

    if (chats.length === 0) {
      content.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: #9ca3af;
        ">
          <div style="
            width: 48px;
            height: 48px;
            background: #2a2a2a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h4 style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px;">No chat history yet</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.4;">
            Start a conversation to see your chat history here
          </p>
        </div>
      `;
      return;
    }

    const chatList = document.createElement('div');
    chatList.style.cssText = `
      padding: 8px 0;
    `;

    chats.forEach((chat, index) => {
      const chatItem = this.createChatItem(chat, index);
      chatList.appendChild(chatItem);
    });

    content.innerHTML = '';
    content.appendChild(chatList);
  }

  createChatItem(chat, index) {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid #2a2a2a;
      position: relative;
    `;

    // Add hover effects
    item.addEventListener('mouseenter', () => {
      item.style.background = '#2a2a2a';
    });

    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    // Get last message preview
    const lastMessage = chat.messages.length > 0 
      ? chat.messages[chat.messages.length - 1] 
      : null;
    
    const messagePreview = lastMessage 
      ? (lastMessage.content.length > 60 
          ? lastMessage.content.substring(0, 60) + '...' 
          : lastMessage.content)
      : 'No messages yet';

    const timeAgo = this.getTimeAgo(chat.lastActivity);

    item.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #4fd1c7, #06b6d4);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div style="
          flex: 1;
          min-width: 0;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 4px;
          ">
            <h4 style="
              margin: 0;
              color: #ffffff;
              font-size: 14px;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 200px;
            ">${this.escapeHtml(chat.workflowName)}</h4>
            <span style="
              color: #9ca3af;
              font-size: 12px;
              flex-shrink: 0;
              margin-left: 8px;
            ">${timeAgo}</span>
          </div>
          <p style="
            margin: 0;
            color: #9ca3af;
            font-size: 12px;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${this.escapeHtml(messagePreview)}</p>
          <div style="
            display: flex;
            align-items: center;
            margin-top: 4px;
            gap: 8px;
          ">
            <span style="
              color: #6b7280;
              font-size: 11px;
            ">${chat.messages.length} messages</span>
            <span style="
              color: #6b7280;
              font-size: 11px;
            ">•</span>
            <span style="
              color: #6b7280;
              font-size: 11px;
            ">ID: ${chat.workflowId}</span>
          </div>
        </div>
      </div>
    `;

    // Add click handler
    item.addEventListener('click', () => {
      this.openChat(chat);
    });

    return item;
  }

  async openChat(chat) {
    try {
      // Hide history
      this.hideHistory();

      // Navigate to n8n workflow page if not already there
      await this.navigateToWorkflow(chat.workflowId);

      // Wait a bit for navigation
      setTimeout(() => {
        // Show chat window
        this.chatManager.showChatWindow();
        
        // Load the specific chat
        this.chatManager.currentWorkflowId = chat.workflowId;
        this.chatManager.chatStorage.setCurrentWorkflowId(chat.workflowId);
        
        // Load chat history
        this.chatManager.loadChatHistory();
      }, 1000);

    } catch (error) {
      console.error('Error opening chat:', error);
      // Still try to show chat window even if navigation fails
      this.chatManager.showChatWindow();
    }
  }

  async navigateToWorkflow(workflowId) {
    try {
      // Check if we're already on the correct workflow page
      const currentUrl = window.location.href;
      if (currentUrl.includes(`/workflow/${workflowId}`) || currentUrl.includes(`workflow/${workflowId}`)) {
        console.log('Already on correct workflow page');
        return;
      }

      // Try to construct n8n workflow URL
      const baseUrl = this.extractN8nBaseUrl();
      if (baseUrl) {
        const workflowUrl = `${baseUrl}/workflow/${workflowId}`;
        console.log('Navigating to workflow:', workflowUrl);
        window.location.href = workflowUrl;
      } else {
        console.log('Could not determine n8n base URL, staying on current page');
      }
    } catch (error) {
      console.error('Error navigating to workflow:', error);
    }
  }

  extractN8nBaseUrl() {
    try {
      const currentUrl = window.location.href;
      const urlObj = new URL(currentUrl);
      
      // If we're already on an n8n page, use current domain
      if (this.isN8nPage(currentUrl)) {
        return `${urlObj.protocol}//${urlObj.host}`;
      }
      
      // Try to get from settings or use default
      // This could be enhanced to read from extension settings
      return null;
    } catch (error) {
      console.error('Error extracting n8n base URL:', error);
      return null;
    }
  }

  isN8nPage(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      
      return (
        hostname.includes('n8n') ||
        pathname.includes('/n8n') ||
        pathname.includes('/workflow') ||
        urlObj.port === '5678'
      );
    } catch (error) {
      return false;
    }
  }

  renderError(message) {
    const content = document.getElementById('8pilot-history-content');
    if (!content) return;

    content.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        color: #ef4444;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: #2a2a2a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h4 style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px;">Error</h4>
        <p style="margin: 0; font-size: 14px; line-height: 1.4;">${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  animateIn() {
    const container = document.getElementById(this.historyContainerId);
    if (container) {
      setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0) scale(1)';
      }, 10);
    }
  }

  animateOut(callback) {
    const container = document.getElementById(this.historyContainerId);
    if (container) {
      container.style.opacity = '0';
      container.style.transform = 'translateY(20px) scale(0.95)';
      
      setTimeout(() => {
        if (callback) callback();
      }, 300);
    } else if (callback) {
      callback();
    }
  }

  addClickOutsideHandler() {
    setTimeout(() => {
      const clickHandler = (e) => {
        const container = document.getElementById(this.historyContainerId);
        const historyIcon = document.getElementById('8pilot-history-icon');
        
        if (container && !container.contains(e.target) && 
            historyIcon && !historyIcon.contains(e.target)) {
          this.hideHistory();
          document.removeEventListener('click', clickHandler);
        }
      };
      
      document.addEventListener('click', clickHandler);
    }, 100);
  }

  // Method to hide history when extension is deactivated
  hide() {
    this.hideHistory();
  }
}
