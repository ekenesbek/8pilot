// Chat management component
import { DragButton } from './dragButton.js';
import { PlusMenu } from './plusMenu.js';
import { FileAttachment } from './fileAttachment.js';
import { ChatMessages } from './chatMessages.js';
import { OpenAIService } from '../services/openaiService.js';

export class ChatManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.chatContainerId = '8pilot-chat-container';
    this.chatMessagesId = '8pilot-chat-messages';
    this.messageInputId = '8pilot-message-input';
    
    // Initialize components
    this.dragButton = new DragButton(this);
    this.plusMenu = new PlusMenu(this);
    this.fileAttachment = new FileAttachment(this);
    this.chatMessages = new ChatMessages(this);
    this.openaiService = new OpenAIService(this.chatMessages);
    this.isInteracting = false;
    this.interactionTimeout = null;
    
    // Добавляем глобальный обработчик кликов
    this.setupGlobalClickHandler();
        
    // Listen for menu actions
    window.addEventListener('8pilot-menu-action', (event) => {
      this.handleMenuAction(event.detail);
    });
    
    // Initialize placeholder cycling
    this.placeholderExamples = [
      'Create a workflow to help me automate my social media.',
      'How would you optimize this workflow?',
      'Create sticky notes explaining this workflow.',
      'Why isn\'t my workflow working?',
      'How do I use the AI Agent node?',
      'Is there a way to optimize this?',
      'Explain this workflow to me step by step.',
      'Create a workflow to help me automate my social media.',
      'How would you optimize this workflow?',
      'Create sticky notes explaining this workflow.'
    ];
    
    this.currentPlaceholderIndex = 0;
    this.placeholderInterval = null;
  }

    handleMenuAction(action) {
    console.log('Menu action:', action);
    
    switch (action) {
      case 'chat':
        this.toggleChatWindow();
        break;
      case 'history':
        chrome.runtime.sendMessage({ action: 'openHistory' });
        break;
      default:
        console.log('Unknown menu action:', action);
    }
  }

  toggleChatWindow() {
    console.log('Toggle chat window, current state:', this.stateManager.get('isChatWindowVisible'));
    
    // Check if chat window actually exists in DOM
    const existingChatContainer = document.getElementById(this.chatContainerId);
    
    // If state says visible but element doesn't exist, fix the state
    if (this.stateManager.get('isChatWindowVisible') && !existingChatContainer) {
      console.log('State mismatch detected, fixing state');
      this.stateManager.set('isChatWindowVisible', false);
    }
    
    if (this.stateManager.get('isChatWindowVisible') && existingChatContainer) {
      this.hideChatWindow();
      this.hideChatMessages();
    } else {
      this.showChatWindow();
    }
  }

  showChatWindow() {
    // Check if already exists in DOM
    const existingChatContainer = document.getElementById(this.chatContainerId);
    if (existingChatContainer) {
      console.log('Chat window already exists');
      return;
    }
    
    console.log('Showing 8pilot chat input');
    
    // Update state first
    this.stateManager.set('isChatWindowVisible', true);
    
    // Create input container
    const inputContainer = this.createInputContainer();
    
    // Add to document
    document.body.appendChild(inputContainer);
    
    // Animate in
    setTimeout(() => {
      inputContainer.style.opacity = '1';
    }, 10);
    
    // Focus input
    setTimeout(() => {
      const messageInput = document.getElementById(this.messageInputId);
      if (messageInput) {
        messageInput.focus();
      }
    }, 300);
  }

  createInputContainer() {
    const inputContainer = document.createElement('div');
    inputContainer.id = this.chatContainerId;
    inputContainer.style.cssText = `
      position: fixed;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      max-width: 90vw;
      z-index: 10002;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Create input wrapper
    const inputWrapper = this.createInputWrapper();
    
    // Create drag button
    const dragButton = this.dragButton.create();
    dragButton.style.opacity = '0'; // Скрываем через opacity
    dragButton.style.visibility = 'hidden'; // И через visibility
    dragButton.style.transition = 'opacity 0.3s ease, visibility 0.3s ease'; // Добавляем transition
    
    // Create buttons container
    const buttonsContainer = this.createButtonsContainer();
    
    // Add elements to container
    inputWrapper.appendChild(dragButton);
    inputContainer.appendChild(inputWrapper);
    inputContainer.appendChild(buttonsContainer);
    
    return inputContainer;
  }

  createInputWrapper() {
    const inputWrapper = document.createElement('div');
    inputWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: #000000;
      backdrop-filter: blur(10px);
      border: 1px solid #000000;
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow: 0 4px 20px rgba(79, 209, 199, 0.4);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
      position: relative;
    `;
    
    // Create message input
    const messageInput = this.createMessageInput();
    
    // Create send button
    const sendButton = this.createSendButton();
    
    // Create hidden file input
    const fileInput = this.createFileInput();
    
    // Add event listeners
    this.addInputEventListeners(inputWrapper, messageInput, sendButton, fileInput);
    
    // Add elements to wrapper
    inputWrapper.appendChild(messageInput);
    inputWrapper.appendChild(sendButton);
    inputWrapper.appendChild(fileInput);
    
    return inputWrapper;
  }

  createMessageInput() {
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.id = this.messageInputId;
    messageInput.placeholder = 'Ask me anything about workflow...';
    messageInput.style.cssText = `
      flex: 1;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      padding: 4px 0;
      transition: opacity 0.3s ease;
    `;
    
    return messageInput;
  }

  createSendButton() {
    const sendButton = document.createElement('button');
    sendButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    sendButton.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      color: #4fd1c7;
      transition: all 0.2s ease;
      flex-shrink: 0;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    return sendButton;
  }

  createFileInput() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = '8pilot-file-input';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.doc,.docx,.txt,.json,.csv,.xlsx,.png,.jpg,.jpeg,.gif,.webp';
    fileInput.style.display = 'none';
    
    return fileInput;
  }

  createButtonsContainer() {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = '8pilot-buttons-container';
    buttonsContainer.style.cssText = `
      display: flex; /* Всегда занимаем место */
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 4px;
      padding-left: 4px;
      opacity: 0; /* Скрываем через opacity */
      visibility: hidden; /* И через visibility */
      transition: opacity 0.3s ease, visibility 0.3s ease;
      height: 36px; /* Фиксированная высота для предотвращения подскока */
      min-height: 36px; /* Минимальная высота */
    `;
    
    // Create left buttons
    const buttonsLeft = this.createLeftButtons();
    
    // Create attachments container
    const attachmentsRight = this.createAttachmentsContainer();
    
    buttonsContainer.appendChild(buttonsLeft);
    buttonsContainer.appendChild(attachmentsRight);
    
    return buttonsContainer;
  }

  createLeftButtons() {
    const buttonsLeft = document.createElement('div');
    buttonsLeft.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
    `;
    
    // Create plus button
    const plusButton = this.createPlusButton();
    
    // Create attach button
    const attachButton = this.createAttachButton();
    
    buttonsLeft.appendChild(plusButton);
    buttonsLeft.appendChild(attachButton);
    
    return buttonsLeft;
  }

  setupGlobalClickHandler() {
    document.addEventListener('click', (e) => {
      const chatContainer = document.getElementById(this.chatContainerId);
      const messagesContainer = document.getElementById(this.messagesContainerId);
      const plusMenu = document.querySelector('.8pilot-plus-menu'); // если есть меню плюса
      
      let clickedInsideChat = false;
      
      if (chatContainer && chatContainer.contains(e.target)) {
        clickedInsideChat = true;
      }
      
      if (messagesContainer && messagesContainer.contains(e.target)) {
        clickedInsideChat = true;
      }
      
      if (plusMenu && plusMenu.contains(e.target)) {
        clickedInsideChat = true;
      }
      
      if (!clickedInsideChat) {
        this.handleOutsideClick();
      }
    });
  }

  handleOutsideClick() {
    this.hideButtons();
    this.hideChatMessages();
    const messageInput = document.getElementById(this.messageInputId);
    if (messageInput && messageInput === document.activeElement) {
      messageInput.blur();
    }
  }

  startInteraction() {
    this.isInteracting = true;
    
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
    }
  }

  endInteraction() {
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
    }
    
    this.interactionTimeout = setTimeout(() => {
      this.isInteracting = false;
    }, 100);
  }

  createPlusButton() {
    const plusButton = document.createElement('button');
    plusButton.id = '8pilot-plus-button';
    plusButton.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `;
    plusButton.style.cssText = `
      background: none !important;
      border: none !important;
      cursor: pointer;
      color: #4fd1c7 !important;
      transition: all 0.2s ease;
      padding: 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 26px;
      height: 26px;
    `;
    
    // Add click handler for plus menu
    plusButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startInteraction();
      this.plusMenu.toggle();
    });

    plusButton.addEventListener('mouseenter', () => {
      this.startInteraction();
    });

    plusButton.addEventListener('mouseleave', () => {
      this.endInteraction();
    });
    
    return plusButton;
  }

  createAttachButton() {
    const attachButton = document.createElement('button');
    attachButton.id = '8pilot-attach-button';
    attachButton.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    attachButton.style.cssText = `
      background: none !important;
      border: none !important;
      cursor: pointer;
      color: #4fd1c7;
      transition: all 0.2s ease;
      padding: 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 26px;
      height: 26px;
    `;
    
    // Add click handler for file input
    attachButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startInteraction();
      document.getElementById('8pilot-file-input').click();
    });

    attachButton.addEventListener('mouseenter', () => {
      this.startInteraction();
    });

    attachButton.addEventListener('mouseleave', () => {
      this.endInteraction();
    });
    
    return attachButton;
  }

  createAttachmentsContainer() {
    const attachmentsRight = document.createElement('div');
    attachmentsRight.id = '8pilot-attachments-container';
    attachmentsRight.style.cssText = `
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-start;
      align-items: center;
      margin-left: 2px;
      margin-top: 3.5px;
    `;
    
    return attachmentsRight;
  }

  addInputEventListeners(inputWrapper, messageInput, sendButton, fileInput) {
    // Send button click handler
    sendButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const message = messageInput.value.trim();
      if (message) {
        this.stopPlaceholderCycling();
        this.sendChatMessage(message);
        messageInput.value = '';
        messageInput.style.opacity = '1';
        messageInput.placeholder = 'Ask me anything about workflow...';
      }
    });
    
    // Enter key handler
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
          this.stopPlaceholderCycling();
          this.sendChatMessage(message);
          messageInput.value = '';
          messageInput.style.opacity = '1';
          messageInput.placeholder = 'Ask me anything about workflow...';
        }
      }
    });
    
    // File input change handler
    fileInput.addEventListener('change', (e) => {
      this.startInteraction();
      this.fileAttachment.handleFileSelection(e.target.files);
    });
    
    // Hover effects - показываем кнопки при наведении
    inputWrapper.addEventListener('mouseenter', () => {
      inputWrapper.style.borderColor = '#9ca3af';
      inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
      this.startPlaceholderCycling();
      this.showButtons();
      this.startInteraction();
    });
    
    inputWrapper.addEventListener('mouseleave', () => {
      inputWrapper.style.borderColor = '#000000';
      inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
      this.stopPlaceholderCycling();
      this.endInteraction();
      
      if (messageInput !== document.activeElement) {
        setTimeout(() => {
          if (!this.isInteracting) {
            this.hideButtons();
            this.hideChatMessages();
          }
        }, 150);
      }
    });
    
    // Focus effects - показываем кнопки и чат при фокусе
    messageInput.addEventListener('focus', () => {
      inputWrapper.style.borderColor = '#4fd1c7';
      inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.8)';
      this.startPlaceholderCycling();
      this.showButtons();
      this.showChatMessages();
      this.startInteraction();
    });
    
    messageInput.addEventListener('blur', () => {
      inputWrapper.style.borderColor = '#000000';
      inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
      this.stopPlaceholderCycling();
      this.endInteraction();
      
      setTimeout(() => {
        if (!this.isInteracting) {
          this.hideButtons();
          this.hideChatMessages();
        }
      }, 150);
    });
    
    // Prevent click propagation
    inputWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startInteraction();
    });
  }

  // Placeholder cycling methods
  startPlaceholderCycling() {
    const messageInput = document.getElementById(this.messageInputId);
    if (!messageInput || messageInput.value !== '') return;
    
    if (this.placeholderInterval) {
      clearInterval(this.placeholderInterval);
    }
    
    this.changePlaceholderSmoothly(this.placeholderExamples[this.currentPlaceholderIndex]);
    this.currentPlaceholderIndex = (this.currentPlaceholderIndex + 1) % this.placeholderExamples.length;
    
    this.placeholderInterval = setInterval(() => {
      if (messageInput && messageInput.value === '') {
        this.changePlaceholderSmoothly(this.placeholderExamples[this.currentPlaceholderIndex]);
        this.currentPlaceholderIndex = (this.currentPlaceholderIndex + 1) % this.placeholderExamples.length;
      } else {
        this.stopPlaceholderCycling();
      }
    }, 4000);
  }

  stopPlaceholderCycling() {
    if (this.placeholderInterval) {
      clearInterval(this.placeholderInterval);
      this.placeholderInterval = null;
    }
    
    const messageInput = document.getElementById(this.messageInputId);
    if (messageInput && messageInput.value === '') {
      this.changePlaceholderSmoothly('Ask me anything about workflow...');
    }
  }

  changePlaceholderSmoothly(newPlaceholder) {
    const messageInput = document.getElementById(this.messageInputId);
    if (!messageInput) return;
    
    messageInput.style.opacity = '0.3';
    
    setTimeout(() => {
      messageInput.placeholder = newPlaceholder;
      messageInput.style.opacity = '1';
    }, 150);
  }

  // Button visibility methods
  showButtons() {
    const dragButton = document.getElementById('8pilot-drag-button');
    const buttonsContainer = document.getElementById('8pilot-buttons-container');
    
    if (dragButton) {
      dragButton.style.opacity = '1';
      dragButton.style.visibility = 'visible';
    }
    if (buttonsContainer) {
      buttonsContainer.style.opacity = '1';
      buttonsContainer.style.visibility = 'visible';
    }
    
    this.stateManager.set('areButtonsVisible', true);
  }
  
  hideButtons() {
    const dragButton = document.getElementById('8pilot-drag-button');
    const buttonsContainer = document.getElementById('8pilot-buttons-container');
    
    if (dragButton) {
      dragButton.style.opacity = '0';
      dragButton.style.visibility = 'hidden';
    }
    if (buttonsContainer) {
      buttonsContainer.style.opacity = '0';
      buttonsContainer.style.visibility = 'hidden';
    }
    
    this.stateManager.set('areButtonsVisible', false);
  }

  toggleButtonsVisibility(show) {
    if (show) {
      this.showButtons();
    } else {
      this.hideButtons();
    }
  }

  showChatMessages() {
    if (!this.stateManager.get('isChatMessagesVisible')) {
      this.chatMessages.show();
      this.stateManager.set('isChatMessagesVisible', true);
    }
  }
  
  hideChatMessages() {
    if (this.stateManager.get('isChatMessagesVisible')) {
      this.chatMessages.hide();
      this.stateManager.set('isChatMessagesVisible', false);
    }
  }

  toggleChatVisibility(show) {
    if (show) {
      this.showChatMessages();
    } else {
      this.hideChatMessages();
    }
  }

  // Chat message methods
  sendChatMessage(message) {
    console.log('Sending chat message:', message);
    
    this.startInteraction();
    
    // Show chat messages if not visible (only when sending message)
    if (!this.stateManager.get('isChatMessagesVisible')) {
      this.chatMessages.show();
      this.stateManager.set('isChatMessagesVisible', true);
    }
    
    // Add user message to chat
    this.chatMessages.addMessage('user', message);
    
    // Add loading message
    const loadingMessageId = this.chatMessages.addMessage('assistant', '');
    this.chatMessages.showTypingIndicator(loadingMessageId);
    
    // Send to OpenAI API
    this.openaiService.sendMessage(message, loadingMessageId, this.chatMessages.messages);
    
    // Clear attachments after sending
    this.fileAttachment.clearAttachments();
  }

  hideChatWindow() {
    const chatContainer = document.getElementById(this.chatContainerId);
    if (chatContainer) {
      this.stopPlaceholderCycling();
      
      chatContainer.style.opacity = '0';
      chatContainer.style.transform = 'translateX(-50%) translateY(20px)';
      
      setTimeout(() => {
        if (chatContainer.parentNode) {
          chatContainer.parentNode.removeChild(chatContainer);
        }
      }, 300);
    }
    
    this.stateManager.set('isChatWindowVisible', false);
    
    // Clear attachments when hiding
    this.fileAttachment.clearAttachments();
  }

  hideChatMessages() {
    this.chatMessages.hide();
    this.stateManager.set('isChatMessagesVisible', false);
  }

  // Method for drag button to update messages position
  updateMessagesPosition() {
    this.chatMessages.updatePosition();
  }

  // Method to hide all chat components when extension is deactivated
  hide() {
    this.hideChatWindow();
    this.hideChatMessages();
  }
}
