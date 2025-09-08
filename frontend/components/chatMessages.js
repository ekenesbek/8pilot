// Улучшенный ChatMessages.js
import { WorkflowJsonBox } from './workflowJsonBox.js';

export class ChatMessages {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.messagesContainerId = '8pilot-chat-messages';
    this.messagesWrapperId = '8pilot-messages-wrapper';
    this.messages = [];
    this.workflowJsonBox = new WorkflowJsonBox(chatManager);
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
    
    // Add event handlers for JSON file elements
    setTimeout(() => {
      this.addJsonFileEventHandlers(messageContainer);
    }, 100);
    
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

  // Create JSON file element
  createJsonFileElement(jsonContent) {
    const jsonId = `json-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return `
      <div class="json-file-container" style="margin: 12px 0;">
        <div class="json-file-box" id="${jsonId}" style="
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(79, 209, 199, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              color: #4fd1c7;
              font-size: 14px;
              font-weight: 500;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>workflow_name.json</span>
            </div>
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              color: #a1a1aa;
              font-size: 12px;
            ">
              <span>Preview</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 2l-2 2m-7 4l3 3-3 3-3-3 3-3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <button class="restore-btn" style="
                display: flex;
                align-items: center;
                gap: 4px;
                background: none;
                border: none;
                color: #a1a1aa;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                transition: all 0.2s ease;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Restore
              </button>
            </div>
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <button class="copy-btn" style="
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(79, 209, 199, 0.1);
                border: 1px solid rgba(79, 209, 199, 0.3);
                color: #4fd1c7;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Add event handlers for JSON file elements
  addJsonFileEventHandlers(messageContainer) {
    const jsonFileBoxes = messageContainer.querySelectorAll('.json-file-box');
    
    jsonFileBoxes.forEach(jsonBox => {
      // Add hover effects
      jsonBox.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        jsonBox.style.borderColor = 'rgba(79, 209, 199, 0.5)';
        jsonBox.style.background = 'rgba(0, 0, 0, 0.9)';
        
        if (this.chatManager && this.chatManager.startInteraction) {
          this.chatManager.startInteraction();
        }
      });
      
      jsonBox.addEventListener('mouseleave', (e) => {
        e.stopPropagation();
        jsonBox.style.borderColor = 'rgba(79, 209, 199, 0.3)';
        jsonBox.style.background = 'rgba(0, 0, 0, 0.8)';
        
        if (this.chatManager && this.chatManager.endInteraction) {
          this.chatManager.endInteraction();
        }
      });
      
      // Handle click on JSON box to show content
      jsonBox.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (this.chatManager && this.chatManager.startInteraction) {
          this.chatManager.startInteraction();
        }
        
        // Extract JSON content from the message
        const messageContent = this.extractJsonFromMessage(jsonBox);
        if (messageContent) {
          this.workflowJsonBox.show('workflow_name', messageContent);
        }
      });
      
      // Handle copy button
      const copyBtn = jsonBox.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.copyJsonToClipboard(jsonBox);
        });
      }
      
      // Handle restore button
      const restoreBtn = jsonBox.querySelector('.restore-btn');
      if (restoreBtn) {
        restoreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.restoreWorkflow(jsonBox);
        });
      }
    });
  }

  // Extract JSON content from message
  extractJsonFromMessage(jsonBox) {
    // Find the parent message container
    let messageContainer = jsonBox.closest('.chat-message');
    if (!messageContainer) return null;
    
    // Find the message in our messages array
    const messageId = messageContainer.id;
    const message = this.messages.find(msg => msg.id === messageId);
    if (!message) return null;
    
    // Extract JSON from content using regex - try different formats
    let jsonMatch = message.content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
    
    // Try single backtick format
    jsonMatch = message.content.match(/`json\s*([\s\S]*?)`/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
    
    // Try regular code blocks that might contain JSON
    jsonMatch = message.content.match(/```([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1] && this.isJsonLike(jsonMatch[1].trim())) {
      return jsonMatch[1].trim();
    }
    
    return null;
  }

  // Copy JSON to clipboard
  copyJsonToClipboard(jsonBox) {
    const messageContent = this.extractJsonFromMessage(jsonBox);
    if (!messageContent) {
      console.warn('No JSON content found to copy');
      return;
    }
    
    // Show loading state
    const copyBtn = jsonBox.querySelector('.copy-btn');
    if (copyBtn) {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
          </circle>
        </svg>
        Copying...
      `;
      copyBtn.style.color = '#4fd1c7';
    }
    
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(messageContent).then(() => {
        this.showCopySuccess(copyBtn);
      }).catch(err => {
        console.error('Clipboard API failed:', err);
        this.fallbackCopyToClipboard(messageContent, copyBtn);
      });
    } else {
      // Fallback for older browsers or non-secure contexts
      this.fallbackCopyToClipboard(messageContent, copyBtn);
    }
  }

  // Fallback copy method for older browsers
  fallbackCopyToClipboard(text, copyBtn) {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Try to copy using execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        this.showCopySuccess(copyBtn);
      } else {
        this.showCopyError(copyBtn);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      this.showCopyError(copyBtn);
    }
  }

  // Show copy success feedback
  showCopySuccess(copyBtn) {
    if (!copyBtn) return;
    
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;
    copyBtn.style.color = '#10b981';
    copyBtn.style.background = 'rgba(16, 185, 129, 0.1)';
    copyBtn.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.style.color = '#4fd1c7';
      copyBtn.style.background = 'rgba(79, 209, 199, 0.1)';
      copyBtn.style.borderColor = 'rgba(79, 209, 199, 0.3)';
    }, 2000);
  }

  // Show copy error feedback
  showCopyError(copyBtn) {
    if (!copyBtn) return;
    
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Failed
    `;
    copyBtn.style.color = '#ef4444';
    copyBtn.style.background = 'rgba(239, 68, 68, 0.1)';
    copyBtn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.style.color = '#4fd1c7';
      copyBtn.style.background = 'rgba(79, 209, 199, 0.1)';
      copyBtn.style.borderColor = 'rgba(79, 209, 199, 0.3)';
    }, 3000);
  }

  // Restore workflow
  restoreWorkflow(jsonBox) {
    // This would restore the workflow to n8n
    console.log('Restore workflow functionality would be implemented here');
    
    // Show feedback
    const restoreBtn = jsonBox.querySelector('.restore-btn');
    if (restoreBtn) {
      const originalText = restoreBtn.innerHTML;
      restoreBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Restored!
      `;
      restoreBtn.style.color = '#10b981';
      
      setTimeout(() => {
        restoreBtn.innerHTML = originalText;
        restoreBtn.style.color = '#a1a1aa';
      }, 2000);
    }
  }

  // Остальные методы остаются без изменений...
  formatMessage(content) {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/```json\s*([\s\S]*?)```/g, (match, jsonContent) => {
        return this.createJsonFileElement(jsonContent.trim());
      })
      .replace(/`json\s*([\s\S]*?)`/g, (match, jsonContent) => {
        return this.createJsonFileElement(jsonContent.trim());
      })
      .replace(/```([\s\S]*?)```/g, (match, codeContent) => {
        // Check if the code content looks like JSON
        if (this.isJsonLike(codeContent.trim())) {
          return this.createJsonFileElement(codeContent.trim());
        }
        return '<pre style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin: 8px 0;"><code>' + codeContent + '</code></pre>';
      });
  }

  // Check if content looks like JSON
  isJsonLike(content) {
    if (!content || content.length < 10) return false;
    
    // Check for common JSON patterns
    const trimmed = content.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return true;
      } catch (e) {
        // If it looks like JSON but can't be parsed, still treat it as JSON
        return trimmed.includes('"') && (trimmed.includes('{') || trimmed.includes('['));
      }
    }
    
    return false;
  }

  showTypingIndicator(messageId) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const bubble = messageElement.querySelector('div');
    if (!bubble) return;
    
    // Create animated "Thinking" text with individual letters
    const thinkingText = 'Thinking';
    const letters = thinkingText.split('').map((letter, index) => 
      `<span class="thinking-letter" style="animation-delay: ${index * 0.1}s;">${letter}</span>`
    ).join('');
    
    bubble.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span id="thinking-text" style="font-size: 14px; display: flex; color: #e2e8f0;">${letters}</span>
        <span id="thinking-dots" style="color: #e2e8f0; font-size: 14px;">...</span>
      </div>
    `;
    
    // Add typing animation styles if not already added
    this.addTypingAnimationStyles();
    
    // Start dots animation
    this.startDotsAnimation(messageId);
  }

  addTypingAnimationStyles() {
    if (!document.getElementById('typing-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'typing-animation-styles';
      style.textContent = `
        @keyframes thinking-wave {
          0% { color: #e2e8f0; }
          12.5% { color: #4fd1c7; text-shadow: 0 0 10px #4fd1c7, 0 0 20px #4fd1c7; }
          25% { color: #e2e8f0; }
          37.5% { color: #4fd1c7; text-shadow: 0 0 10px #4fd1c7, 0 0 20px #4fd1c7; }
          50% { color: #e2e8f0; }
          62.5% { color: #4fd1c7; text-shadow: 0 0 10px #4fd1c7, 0 0 20px #4fd1c7; }
          75% { color: #e2e8f0; }
          87.5% { color: #4fd1c7; text-shadow: 0 0 10px #4fd1c7, 0 0 20px #4fd1c7; }
          100% { color: #e2e8f0; }
        }
        
        .thinking-letter {
          animation: thinking-wave 2s ease-in-out infinite;
        }
        
        .thinking-letter:nth-child(1) { animation-delay: 0s; }
        .thinking-letter:nth-child(2) { animation-delay: 0.1s; }
        .thinking-letter:nth-child(3) { animation-delay: 0.2s; }
        .thinking-letter:nth-child(4) { animation-delay: 0.3s; }
        .thinking-letter:nth-child(5) { animation-delay: 0.4s; }
        .thinking-letter:nth-child(6) { animation-delay: 0.5s; }
        .thinking-letter:nth-child(7) { animation-delay: 0.6s; }
        .thinking-letter:nth-child(8) { animation-delay: 0.7s; }
      `;
      document.head.appendChild(style);
    }
  }

  startDotsAnimation(messageId) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const dotsElement = messageElement.querySelector('#thinking-dots');
    if (!dotsElement) return;
    
    let dotCount = 3; // Start with 3 dots
    
    const animateDots = () => {
      if (dotCount === 3) {
        dotsElement.textContent = '...';
        dotCount = 2;
      } else if (dotCount === 2) {
        dotsElement.textContent = '..';
        dotCount = 1;
      } else if (dotCount === 1) {
        dotsElement.textContent = '.';
        dotCount = 0;
      } else {
        dotsElement.textContent = '';
        dotCount = 3;
      }
    };
    
    // Start animation
    this.dotsInterval = setInterval(animateDots, 500);
  }

  stopDotsAnimation() {
    if (this.dotsInterval) {
      clearInterval(this.dotsInterval);
      this.dotsInterval = null;
    }
  }

  startStreamingDotsAnimation(messageId) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const dotsElement = messageElement.querySelector('#streaming-dots');
    if (!dotsElement) return;
    
    let dotCount = 3; // Start with 3 dots
    
    const animateDots = () => {
      if (dotCount === 3) {
        dotsElement.textContent = '...';
        dotCount = 2;
      } else if (dotCount === 2) {
        dotsElement.textContent = '..';
        dotCount = 1;
      } else if (dotCount === 1) {
        dotsElement.textContent = '.';
        dotCount = 0;
      } else {
        dotsElement.textContent = '';
        dotCount = 3;
      }
    };
    
    // Start animation
    this.streamingDotsInterval = setInterval(animateDots, 500);
  }

  stopStreamingDotsAnimation() {
    if (this.streamingDotsInterval) {
      clearInterval(this.streamingDotsInterval);
      this.streamingDotsInterval = null;
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
    
    // Stop dots animation
    this.stopDotsAnimation();
    
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
    const messageBubble = this.createStreamingBubble(messageId);
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
    
    // Add event handlers for JSON file elements
    setTimeout(() => {
      this.addJsonFileEventHandlers(messageContainer);
    }, 100);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    }, 50);
    
    return messageId;
  }

  createStreamingBubble(messageId) {
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
    // Create animated "Thinking" text with individual letters
    const thinkingText = 'Thinking';
    const letters = thinkingText.split('').map((letter, index) => 
      `<span class="thinking-letter" style="animation-delay: ${index * 0.1}s;">${letter}</span>`
    ).join('');
    
    streamingIndicator.innerHTML = `
      <span style="font-size: 14px; display: flex; color: #e2e8f0;">${letters}</span>
      <span id="streaming-dots" style="color: #e2e8f0; font-size: 14px;">...</span>
    `;
    
    messageBubble.appendChild(streamingIndicator);
    
    // Add interaction handlers
    this.addBubbleInteractionHandlers(messageBubble);
    
    // Start dots animation for streaming
    this.startStreamingDotsAnimation(messageId);
    
    return messageBubble;
  }

  updateStreamingMessage(messageId, content) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    // Stop streaming dots animation
    this.stopStreamingDotsAnimation();
    
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
    
    // Add event handlers for JSON file elements
    setTimeout(() => {
      this.addJsonFileEventHandlers(messageElement);
    }, 100);
    
    this.scrollToBottom();
  }

  finalizeStreamingMessage(messageId, finalContent) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    // Stop streaming dots animation
    this.stopStreamingDotsAnimation();
    
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