// Menu management component
export class MenuManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.historyIconId = '8pilot-history-icon';
    this.chatIconId = '8pilot-chat-icon';
    
    // Listen for toggle menu event
    window.addEventListener('8pilot-toggle-menu', () => {
      this.toggleMenu();
    });
  }

  toggleMenu() {
    const historyIcon = document.getElementById(this.historyIconId);
    const chatIcon = document.getElementById(this.chatIconId);
    
    if (historyIcon && chatIcon) {
      // Menu is visible, hide it
      this.hideMenu();
    } else {
      // Menu is not visible, create and show it
      this.createMenu();
      this.showMenu();
    }
  }

  createMenu() {
    // Remove existing menu if any
    this.hideMenu();
    
    // Create history icon (clock icon)
    const historyIcon = this.createHistoryIcon();
    
    // Create chat icon (message icon)
    const chatIcon = this.createChatIcon();
    
    // Add to document
    document.body.appendChild(historyIcon);
    document.body.appendChild(chatIcon);
    
    // Add click outside handler to close menu
    this.addClickOutsideHandler();
  }

  createHistoryIcon() {
    const historyIcon = document.createElement('div');
    historyIcon.id = this.historyIconId;
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
    
    // Add hover effects
    this.addHoverEffects(historyIcon);
    
    // Add click handler
    historyIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('8pilot-menu-action', { detail: 'history' }));
    });
    
    return historyIcon;
  }

  createChatIcon() {
    const chatIcon = document.createElement('div');
    chatIcon.id = this.chatIconId;
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
    this.addHoverEffects(chatIcon);
    
    // Add click handler
    chatIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('8pilot-menu-action', { detail: 'chat' }));
    });
    
    return chatIcon;
  }

  addHoverEffects(element) {
    element.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.1)';
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  }

  showMenu() {
    const historyIcon = document.getElementById(this.historyIconId);
    const chatIcon = document.getElementById(this.chatIconId);
    
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

  hideMenu() {
    const historyIcon = document.getElementById(this.historyIconId);
    const chatIcon = document.getElementById(this.chatIconId);
    
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

  addClickOutsideHandler() {
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
            this.hideMenu();
            // Remove this event listener after hiding menu
            document.removeEventListener('click', clickHandler);
          }
        }
      }.bind(this);
      
      document.addEventListener('click', clickHandler);
    }, 100);
  }

  // Method to hide menu when extension is deactivated
  hide() {
    this.hideMenu();
  }
}
