// Улучшенный ChatMessages.js
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
    
    // Улучшенная обработка событий для контейнера сообщений
    this.setupMessagesEventHandlers(messagesContainer);
    
    // Auto-scroll to bottom when new messages arrive
    this.setupAutoScroll(messagesWrapper);
  }

  // Новый метод для настройки обработчиков событий сообщений
  setupMessagesEventHandlers(messagesContainer) {
    // Предотвращаем всплытие кликов, чтобы не закрывать чат
    messagesContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      // Уведомляем chatManager о взаимодействии
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    // Дополнительные обработчики для предотвращения закрытия чата
    messagesContainer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    messagesContainer.addEventListener('mouseup', (e) => {
      e.stopPropagation();
    });

    messagesContainer.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
    });

    // Отслеживаем наведение мыши для поддержания видимости
    messagesContainer.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    messagesContainer.addEventListener('mouseleave', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.endInteraction) {
        this.chatManager.endInteraction();
      }
    });

    // Отслеживаем фокус внутри контейнера сообщений
    messagesContainer.addEventListener('focusin', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    messagesContainer.addEventListener('focusout', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.endInteraction) {
        this.chatManager.endInteraction();
      }
    });

    // Обработчик для выделения текста
    messagesContainer.addEventListener('selectstart', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });
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
      pointer-events: auto;
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
    
    // Добавляем обработчики событий для wrapper'а
    messagesWrapper.addEventListener('scroll', (e) => {
      e.stopPropagation();
      // Уведомляем о взаимодействии при скролле
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    // Дополнительные обработчики для предотвращения закрытия чата
    messagesWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    messagesWrapper.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    messagesWrapper.addEventListener('mouseup', (e) => {
      e.stopPropagation();
    });

    messagesWrapper.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
    });

    messagesWrapper.addEventListener('selectstart', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });
    
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

  addMessage(role, content, animate = true) {
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
      ${animate ? `
        opacity: 0;
        transform: translateY(20px);
        animation: slideInUp 0.3s ease-out forwards;
      ` : `
        opacity: 1;
        transform: translateY(0);
      `}
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
        `background: rgba(7, 27, 25, 0.95); 
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
      cursor: pointer;
    `;
    
    // Add hover effect и обработчики взаимодействия
    this.addBubbleInteractionHandlers(messageBubble);
    
    if (content) {
      messageBubble.innerHTML = this.formatMessage(content);
    }
    
    return messageBubble;
  }

  addBubbleInteractionHandlers(messageBubble) {
      // Hover эффекты
    messageBubble.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      messageBubble.style.transform = 'translateY(-1px)';
      messageBubble.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.3)';
      
      // Уведомляем о взаимодействии
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });
    
    messageBubble.addEventListener('mouseleave', (e) => {
      e.stopPropagation();
      messageBubble.style.transform = 'translateY(0)';
      messageBubble.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
      
        // Уведомляем об окончании взаимодействия
      if (this.chatManager && this.chatManager.endInteraction) {
        this.chatManager.endInteraction();
      }
    });

    // Click обработчик
    messageBubble.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Уведомляем о взаимодействии
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    // Дополнительные обработчики для предотвращения закрытия чата
    messageBubble.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    messageBubble.addEventListener('mouseup', (e) => {
      e.stopPropagation();
    });

    messageBubble.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
    });

    // Обработчик для выделения текста
    messageBubble.addEventListener('selectstart', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });
  }

  // Остальные методы остаются без изменений...
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

  updateMessage(messageId, content) {
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

  updateMessageContent(messageId, content) {
    this.updateMessage(messageId, content);
  }

  clearMessages() {
    const messagesWrapper = document.getElementById(this.messagesWrapperId);
    if (messagesWrapper) {
      messagesWrapper.innerHTML = '';
    }
    this.messages = [];
  }

  hideTypingIndicator(messageId) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const bubble = messageElement.querySelector('div');
    if (!bubble) return;
    
    // Remove typing indicator and show actual content
    const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      bubble.innerHTML = this.formatMessage(this.messages[messageIndex].content);
    }
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

  // Streaming message methods
  addStreamingMessage() {
    const messagesWrapper = document.getElementById(this.messagesWrapperId);
    if (!messagesWrapper) return null;
    
    const messageId = `streaming-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.id = messageId;
    messageContainer.className = 'chat-message assistant streaming';
    messageContainer.style.cssText = `
      display: flex;
      justify-content: flex-start;
      pointer-events: auto;
      opacity: 0;
      transform: translateY(20px);
      animation: slideInUp 0.3s ease-out forwards;
      margin: 0;
      padding: 0;
    `;
    
    // Create message bubble
    const messageBubble = this.createStreamingBubble();
    messageContainer.appendChild(messageBubble);
    messagesWrapper.appendChild(messageContainer);
    
    // Store message
    this.messages.push({
      id: messageId,
      role: 'assistant',
      content: '',
      element: messageContainer,
      isStreaming: true
    });
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    }, 50);
    
    return messageId;
  }

  createStreamingBubble() {
    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      backdrop-filter: blur(10px);
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      position: relative;
      cursor: pointer;
    `;
    
    // Add streaming indicator
    const streamingIndicator = document.createElement('div');
    streamingIndicator.className = 'streaming-indicator';
    streamingIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      color: #a1a1aa;
      font-size: 14px;
    `;
    streamingIndicator.innerHTML = `
      <span>AI is typing</span>
      <div style="display: flex; gap: 3px;">
        <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite;"></div>
        <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite 0.2s;"></div>
        <div class="typing-dot" style="width: 4px; height: 4px; background: #4fd1c7; border-radius: 50%; animation: typing-bounce 1.4s infinite 0.4s;"></div>
      </div>
    `;
    
    messageBubble.appendChild(streamingIndicator);
    
    // Add interaction handlers
    this.addBubbleInteractionHandlers(messageBubble);
    
    return messageBubble;
  }

  updateStreamingMessage(messageId, content) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const bubble = messageElement.querySelector('div');
    if (!bubble) return;
    
    // Remove streaming indicator and add content
    const streamingIndicator = bubble.querySelector('.streaming-indicator');
    if (streamingIndicator) {
      streamingIndicator.remove();
    }
    
    // Add formatted content
    bubble.innerHTML = this.formatMessage(content);
    
    // Update stored message
    const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].content = content;
    }
    
    this.scrollToBottom();
  }

  finalizeStreamingMessage(messageId, finalContent) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    // Update with final content
    this.updateStreamingMessage(messageId, finalContent);
    
    // Remove streaming class and add finalized class
    messageElement.classList.remove('streaming');
    messageElement.classList.add('finalized');
    
    // Update stored message
    const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].isStreaming = false;
      this.messages[messageIndex].content = finalContent;
    }
    
    // Smooth transition to final state
    setTimeout(() => {
      messageElement.style.transition = 'all 0.5s ease';
      messageElement.style.transform = 'translateY(0)';
      messageElement.style.opacity = '1';
      
      // Remove transition after animation
      setTimeout(() => {
        messageElement.style.transition = '';
        messageElement.style.transform = '';
        messageElement.style.opacity = '';
      }, 500);
    }, 200);
  }

  // Display chat history for current workflow
  displayChatHistory(workflowId, chatHistory) {
    if (!chatHistory || chatHistory.length === 0) {
      this.showEmptyState(workflowId);
      return;
    }

    // Clear existing messages
    this.clearMessages();

    // Add workflow header
    this.addWorkflowHeader(workflowId);

    // Add all messages from history
    chatHistory.forEach((message, index) => {
      this.addMessage(message.role, message.content, false);
    });

    // Add welcome message if this is a new workflow
    if (workflowId && workflowId.startsWith('new_')) {
      this.addWelcomeMessage();
    }

    // Scroll to bottom
    this.scrollToBottom();
  }

  // Show empty state for workflow
  showEmptyState(workflowId) {
    this.clearMessages();
    this.addWorkflowHeader(workflowId);
    // Don't add welcome message - keep chat clean
    // this.addWelcomeMessage();
  }

  // Add workflow header
  addWorkflowHeader(workflowId) {
    const messagesWrapper = document.getElementById(this.messagesWrapperId);
    if (!messagesWrapper) return;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'workflow-header';
    headerDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      background: rgba(79, 209, 199, 0.1);
      border: 1px solid rgba(79, 209, 199, 0.3);
      border-radius: 6px;
      font-size: 12px;
      color: #4fd1c7;
    `;

    const workflowName = this.getWorkflowDisplayName(workflowId);
    headerDiv.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Chat for: ${workflowName}</span>
    `;

    messagesWrapper.appendChild(headerDiv);
  }

  // Get workflow display name
  getWorkflowDisplayName(workflowId) {
    if (!workflowId) return 'Unknown Workflow';
    
    if (workflowId.startsWith('new_')) {
      return 'New Workflow';
    }
    
    if (workflowId === 'default' || workflowId === 'unknown') {
      return 'Current Workflow';
    }
    
    return `Workflow ${workflowId}`;
  }

  // Add welcome message (simplified)
  addWelcomeMessage() {
    // Don't add welcome message - keep chat clean
    return;
  }

  // Load and display chat history from storage
  async loadAndDisplayChatHistory(workflowId) {
    if (!this.chatManager || !this.chatManager.chatStorage) {
      console.warn('ChatManager or ChatStorage not available');
      return;
    }

    try {
      const chat = this.chatManager.chatStorage.getChat(workflowId);
      if (chat && chat.messages.length > 0) {
        this.displayChatHistory(workflowId, chat.messages);
        console.log('Displayed chat history for workflow:', workflowId, chat.messages.length, 'messages');
      } else {
        // Don't show empty state - just show workflow header
        this.clearMessages();
        this.addWorkflowHeader(workflowId);
        console.log('No chat history found for workflow:', workflowId);
      }
    } catch (error) {
      console.error('Error loading chat history for display:', error);
      this.clearMessages();
      this.addWorkflowHeader(workflowId);
    }
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