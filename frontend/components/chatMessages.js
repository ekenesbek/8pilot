// Chat messages component
export class ChatMessages {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.messagesContainerId = '8pilot-chat-messages';
    this.messagesWrapperId = '8pilot-messages-wrapper';
    this.messages = [];
  }

  show() {
    // Check if already exists
    const existingContainer = document.getElementById(this.messagesContainerId);
    if (existingContainer) return;
    
    console.log('Showing chat messages container');
    
    // Add slide-in animation styles
    this.addAnimationStyles();
    
    // Create messages container
    const messagesContainer = this.createMessagesContainer();
    
    // Create messages wrapper
    const messagesWrapper = this.createMessagesWrapper();
    
    messagesContainer.appendChild(messagesWrapper);
    document.body.appendChild(messagesContainer);
    
    // Prevent clicks from closing the chat
    messagesContainer.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Auto-scroll to bottom when new messages arrive
    this.setupAutoScroll(messagesWrapper);
  }

  createMessagesContainer() {
    const messagesContainer = document.createElement('div');
    messagesContainer.id = this.messagesContainerId;
    
    // Get current chat container position for adaptive positioning
    const chatContainer = document.getElementById('8pilot-chat-container');
    let containerLeft, containerTop, containerWidth;
    
    if (chatContainer) {
      const rect = chatContainer.getBoundingClientRect();
      containerLeft = rect.left;
      containerTop = rect.top;
      containerWidth = rect.width;
    } else {
      // Fallback to center positioning if chat container not found
      containerLeft = window.innerWidth / 2;
      containerTop = window.innerHeight - 120;
      containerWidth = 600;
    }
    
    messagesContainer.style.cssText = `
      position: fixed;
      left: ${containerLeft}px;
      top: ${containerTop - 370}px;
      width: ${Math.min(containerWidth, Math.min(600, window.innerWidth * 0.9))}px;
      height: 350px;
      max-height: 50vh;
      z-index: 10001;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      transform: none;
    `;
    
    return messagesContainer;
  }

  createMessagesWrapper() {
    const messagesWrapper = document.createElement('div');
    messagesWrapper.id = this.messagesWrapperId;
    messagesWrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px 0 0 0;
      overflow-y: auto;
      max-height: 100%;
      
      -webkit-mask: linear-gradient(to bottom, 
        transparent 0px, 
        rgba(0,0,0,0.2) 30px,
        rgba(0,0,0,0.6) 60px,
        rgba(0,0,0,1) 90px,
        rgba(0,0,0,1) 100%
      );
      mask: linear-gradient(to bottom, 
        transparent 0px, 
        rgba(0,0,0,0.2) 30px,
        rgba(0,0,0,0.6) 60px,
        rgba(0,0,0,1) 90px,
        rgba(0,0,0,1) 100%
    );
      
      scrollbar-width: thin;
      scrollbar-color: rgba(79, 209, 199, 0) transparent;
    `;
    
    // Add custom scrollbar styles
    this.addScrollbarStyles();
    
    return messagesWrapper;
  }

  addAnimationStyles() {
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
  }

  addScrollbarStyles() {
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
  }

  setupAutoScroll(messagesWrapper) {
    const observer = new MutationObserver(() => {
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    });
    observer.observe(messagesWrapper, { childList: true });
  }

  addMessage(role, content) {
    const messagesWrapper = document.getElementById(this.messagesWrapperId);
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
    const messageBubble = this.createMessageBubble(content, isUser);
    messageContainer.appendChild(messageBubble);
    messagesWrapper.appendChild(messageContainer);
    
    // Store message
    this.messages.push({
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

  createMessageBubble(content, isUser) {
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
    
    // Add hover effect
    this.addBubbleHoverEffect(messageBubble);
    
    if (content) {
      messageBubble.innerHTML = this.formatMessage(content);
    }
    
    return messageBubble;
  }

  addBubbleHoverEffect(messageBubble) {
    messageBubble.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-1px)';
      this.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.3)';
    });
    
    messageBubble.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    });
  }

  formatMessage(content) {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin: 8px 0;"><code>$1</code></pre>');
  }

  showTypingIndicator(messageId) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const bubble = messageElement.querySelector('div');
    if (!bubble) return;
    
    bubble.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #a1a1aa; font-size: 14px;">Thinking</span>
        <div style="display: flex; gap: 3px;">
          <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite;"></div>
          <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite 0.2s;"></div>
          <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite 0.4s;"></div>
        </div>
      </div>
    `;
    
    // Add typing animation styles if not already added
    this.addTypingAnimationStyles();
  }

  addTypingAnimationStyles() {
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

  updateMessageContent(messageId, content) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const bubble = messageElement.querySelector('div');
    if (!bubble) return;
    
    bubble.innerHTML = this.formatMessage(content);
    
    // Update stored message
    const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].content = content;
    }
    
    this.scrollToBottom();
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById(this.messagesContainerId);
    if (messagesContainer) {
      const messagesWrapper = document.getElementById(this.messagesWrapperId);
      if (messagesWrapper) {
        setTimeout(() => {
          messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
        }, 100);
      }
    }
  }

  updatePosition() {
    const messagesContainer = document.getElementById(this.messagesContainerId);
    const chatContainer = document.getElementById('8pilot-chat-container');
    
    if (!messagesContainer || !chatContainer) return;
    
    const rect = chatContainer.getBoundingClientRect();
    const messagesHeight = 350; // Fixed height from CSS
    const gap = 20; // Gap between chat container and messages
    
    // Calculate initial position
    let newLeft = rect.left;
    let newTop = rect.top - messagesHeight - gap;
    let newWidth = Math.min(rect.width, Math.min(600, window.innerWidth * 0.9));
    
    // Ensure messages container doesn't go off-screen horizontally
    if (newLeft + newWidth > window.innerWidth) {
      newLeft = window.innerWidth - newWidth - 10;
    }
    if (newLeft < 10) {
      newLeft = 10;
    }
    
    // Ensure messages container doesn't go off-screen vertically
    if (newTop < 10) {
      // If not enough space above, position below the chat container
      newTop = rect.bottom + gap;
      
      // If still not enough space below, position at the top of screen
      if (newTop + messagesHeight > window.innerHeight - 10) {
        newTop = 10;
      }
    }
    
    // Apply the new position
    messagesContainer.style.left = newLeft + 'px';
    messagesContainer.style.top = newTop + 'px';
    messagesContainer.style.width = newWidth + 'px';
  }

  hide() {
    const messagesContainer = document.getElementById(this.messagesContainerId);
    if (messagesContainer) {
      messagesContainer.style.opacity = '0';
      messagesContainer.style.transform = 'translateY(20px)';
      setTimeout(() => {
        if (messagesContainer.parentNode) {
          messagesContainer.parentNode.removeChild(messagesContainer);
        }
      }, 200);
    }
    this.messages = [];
  }
}
