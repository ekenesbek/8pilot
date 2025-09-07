// Chat management component
import { DragButton } from './dragButton.js';
import { PlusMenu } from './plusMenu.js';
import { FileAttachment } from './fileAttachment.js';
import { ChatMessages } from './chatMessages.js';
import { OpenAIService } from '../services/openaiService.js';
import { ApiKeyManager } from './apiKeyManager.js';
import { ChatStorageService } from '../services/chatStorageService.js';
import { WorkflowExtractor } from '../services/workflowExtractor.js';

export class ChatManager {
  constructor(stateManager, backendApiService) {
    this.stateManager = stateManager;
    this.backendApiService = backendApiService;
    this.chatContainerId = '8pilot-chat-container';
    this.chatMessagesId = '8pilot-chat-messages';
    this.messageInputId = '8pilot-message-input';
    
    // Initialize components
    this.dragButton = new DragButton(this);
    this.plusMenu = new PlusMenu(this);
    this.fileAttachment = new FileAttachment(this);
    this.chatMessages = new ChatMessages(this);
    this.openaiService = new OpenAIService(this.chatMessages);
    this.apiKeyManager = new ApiKeyManager();
    this.chatStorage = new ChatStorageService();
    this.workflowExtractor = new WorkflowExtractor();
    this.isInteracting = false;
    this.interactionTimeout = null;
    
    // Chat session management
    this.currentWorkflowId = null;
    this.currentSessionId = null;
    this.apiKey = null;
    this.provider = 'openai';
    
    // Добавляем глобальный обработчик кликов
    this.setupGlobalClickHandler();
        
    // Listen for menu actions
    window.addEventListener('8pilot-menu-action', (event) => {
      this.handleMenuAction(event.detail);
    });
    
    // Listen for API credentials updates
    window.addEventListener('8pilot-api-credentials-updated', (event) => {
      this.setApiCredentials(event.detail.apiKey, event.detail.provider);
    });
    
    // Initialize chat history for current workflow
    this.initializeChatHistory();
    
    // Listen for storage changes from popup
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && (changes.openaiApiKey || changes.provider)) {
        this.loadApiCredentials();
      }
    });
    
    // Load existing API credentials
    this.loadApiCredentials();
    
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

  async showChatWindow() {
    // Check if already exists in DOM
    const existingChatContainer = document.getElementById(this.chatContainerId);
    if (existingChatContainer) {
      console.log('Chat window already exists');
      return;
    }
    
    console.log('Showing 8pilot chat input');
    
    // Update workflow context when showing chat
    await this.updateWorkflowContext();
    
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
        <path d="M1 20h12c2 0 4-2 4-4V2m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
      const messagesContainer = document.getElementById(this.chatMessages.messagesContainerId);
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
    if (this.plusMenu && this.plusMenu.isVisible) {
      this.plusMenu.hide();
    }
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
    messageInput.addEventListener('focus', async () => {
      inputWrapper.style.borderColor = '#4fd1c7';
      inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.8)';
      this.startPlaceholderCycling();
      this.showButtons();
      this.showChatMessages();
      this.startInteraction();
      
      // Load chat history when focusing on input
      await this.loadChatHistoryForDisplay();
    });
    
    messageInput.addEventListener('blur', () => {
      inputWrapper.style.borderColor = '#000000';
      inputWrapper.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
      this.stopPlaceholderCycling();
      this.endInteraction();
      
      setTimeout(() => {
        if (!this.isInteracting) {
          this.hideButtons();
          // Hide chat messages after a delay if not interacting
          this.hideChatMessages();
        }
      }, 300);
    });
    
    // Prevent click propagation
    inputWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startInteraction();
    });

    // Add click outside handler to hide chat messages
    document.addEventListener('click', (e) => {
      const chatContainer = document.getElementById('8pilot-chat-container');
      const messagesContainer = document.getElementById('8pilot-chat-messages');
      
      if (chatContainer && !chatContainer.contains(e.target) && 
          messagesContainer && !messagesContainer.contains(e.target)) {
        this.hideChatMessages();
        this.hideButtons();
      }
    });

    // Add hover handlers for chat messages container
    this.setupChatMessagesHoverHandlers();
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
      
      // Применяем курсив только для placeholderExamples, не для основного placeholder
      if (newPlaceholder === 'Ask me anything about workflow...') {
        messageInput.style.fontStyle = 'normal';
      } else {
        messageInput.style.fontStyle = 'italic';
      }
      
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

  // Workflow and session management
  async updateWorkflowContext() {
    try {
      // First try to get workflow ID from content script
      let workflowId = null;
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getWorkflowId' });
        if (response.status === 'success' && response.data.workflowId) {
          workflowId = response.data.workflowId;
        }
      } catch (error) {
        console.log('Content script not available, using local extraction');
      }
      
      // If content script didn't provide workflow ID, try local extraction
      if (!workflowId) {
        workflowId = this.workflowExtractor.extractWorkflowId();
      }
      
      if (workflowId) {
        this.currentWorkflowId = workflowId;
        this.chatStorage.setCurrentWorkflowId(workflowId);
        console.log('Updated workflow ID:', this.currentWorkflowId);
        
        // Load existing chat history for this workflow
        await this.loadChatHistory();
      } else {
        console.log('No workflow ID found or not on n8n page');
        this.currentWorkflowId = null;
      }
    } catch (error) {
      console.error('Error updating workflow context:', error);
    }
  }

  async loadChatHistory() {
    if (!this.currentWorkflowId) return;
    
    try {
      // Load from local storage first (for users without registration)
      const localChat = this.chatStorage.getChat(this.currentWorkflowId);
      if (localChat && localChat.messages.length > 0) {
        // Clear current messages and load from local storage
        this.chatMessages.clearMessages();
        
        // Add messages from local storage
        for (const message of localChat.messages) {
          this.chatMessages.addMessage(message.role, message.content, false);
        }
        
        console.log('Loaded local chat history for workflow:', this.currentWorkflowId, localChat.messages.length, 'messages');
        return;
      }
      
      // If no local chat, try backend API (for registered users)
      if (this.backendApiService) {
        const history = await this.backendApiService.getChatHistory(this.currentWorkflowId);
        if (history && history.sessions && history.sessions.length > 0) {
          // Load the latest session
          const latestSession = history.sessions[0];
          this.currentSessionId = latestSession.session_id;
          
          // Clear current messages and load history
          this.chatMessages.clearMessages();
          
          // Add messages from history
          for (const message of latestSession.messages) {
            this.chatMessages.addMessage(message.role, message.content, false);
          }
          
          console.log('Loaded backend chat history for workflow:', this.currentWorkflowId);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  // Initialize chat history for current workflow
  async initializeChatHistory() {
    try {
      // Update workflow context first
      await this.updateWorkflowContext();
      
      // Load and display chat history if we have a workflow ID
      if (this.currentWorkflowId) {
        await this.chatMessages.loadAndDisplayChatHistory(this.currentWorkflowId);
        console.log('Initialized chat history for workflow:', this.currentWorkflowId);
      }
    } catch (error) {
      console.error('Error initializing chat history:', error);
    }
  }

  // Setup hover handlers for chat messages container
  setupChatMessagesHoverHandlers() {
    // Use event delegation for dynamically created elements
    document.addEventListener('mouseenter', (e) => {
      const messagesContainer = document.getElementById('8pilot-chat-messages');
      if (messagesContainer && messagesContainer.contains(e.target)) {
        this.startInteraction();
      }
    });

    document.addEventListener('mouseleave', (e) => {
      const messagesContainer = document.getElementById('8pilot-chat-messages');
      if (messagesContainer && messagesContainer.contains(e.target)) {
        this.endInteraction();
      }
    });
  }

  // Load chat history specifically for display when focusing on input
  async loadChatHistoryForDisplay() {
    // Update workflow context first
    await this.updateWorkflowContext();
    
    // Load and display chat history if we have a workflow ID
    if (this.currentWorkflowId) {
      await this.chatMessages.loadAndDisplayChatHistory(this.currentWorkflowId);
    } else {
      // Show empty state if no workflow ID
      this.chatMessages.showEmptyState('unknown');
    }
  }

  async loadApiCredentials() {
    try {
      // Load from chrome storage sync (popup format)
      const result = await chrome.storage.sync.get(['openaiApiKey', 'provider']);
      if (result.openaiApiKey) {
        this.setApiCredentials(result.openaiApiKey, result.provider || 'openai');
        console.log('API credentials loaded from popup:', { provider: result.provider || 'openai', hasKey: !!result.openaiApiKey });
      } else {
        console.log('No API credentials found in popup storage');
      }
    } catch (error) {
      console.error('Error loading API credentials:', error);
    }
  }

  setApiCredentials(apiKey, provider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
    console.log('API credentials set:', { provider, hasKey: !!apiKey });
  }

  async checkApiCredentials() {
    try {
      const result = await chrome.storage.sync.get(['openaiApiKey', 'provider']);
      const hasCredentials = result.openaiApiKey && result.openaiApiKey.trim() !== '';
      
      if (!hasCredentials) {
        this.chatMessages.addMessage('assistant', 'Please configure your API key in the extension popup first. Click on the 8pilot icon in your browser toolbar to open settings.', false);
        return false;
      }
      
      // Update current credentials if they changed
      if (result.openaiApiKey !== this.apiKey || result.provider !== this.provider) {
        this.setApiCredentials(result.openaiApiKey, result.provider || 'openai');
      }
      
      return true;
    } catch (error) {
      console.error('Error checking API credentials:', error);
      this.chatMessages.addMessage('assistant', 'Error checking API credentials. Please try again.', false);
      return false;
    }
  }

  // Chat message methods
  async sendChatMessage(message) {
    console.log('Sending chat message:', message);
    
    this.startInteraction();
    
    // Check API credentials first
    const hasCredentials = await this.checkApiCredentials();
    if (!hasCredentials) {
      return;
    }
    
    // Update workflow context if needed
    await this.updateWorkflowContext();
    
    // Show chat messages if not visible (only when sending message)
    if (!this.stateManager.get('isChatMessagesVisible')) {
      this.chatMessages.show();
      this.stateManager.set('isChatMessagesVisible', true);
    }
    
    // Add user message to chat
    this.chatMessages.addMessage('user', message);
    
    // Save user message to local storage
    if (this.currentWorkflowId) {
      this.chatStorage.addMessage(this.currentWorkflowId, 'user', message);
    }
    
    // Create streaming message element
    const streamingMessageId = this.chatMessages.addStreamingMessage();
    
    try {
      // Prepare API key based on provider
      const apiKeyData = {};
      if (this.provider === 'openai') {
        apiKeyData.openai_api_key = this.apiKey;
      } else if (this.provider === 'anthropic') {
        apiKeyData.anthropic_api_key = this.apiKey;
      }
      
      // Use streaming API
      let fullResponse = '';
      await this.backendApiService.streamMessage(
        message,
        this.currentWorkflowId || 'unknown',
        this.currentSessionId,
        this.provider,
        apiKeyData,
        (chunk) => {
          if (chunk.chunk) {
            fullResponse += chunk.chunk;
            this.chatMessages.updateStreamingMessage(streamingMessageId, fullResponse);
          }
          if (chunk.session_id) {
            this.currentSessionId = chunk.session_id;
          }
        }
      );
      
      // Finalize streaming message
      this.chatMessages.finalizeStreamingMessage(streamingMessageId, fullResponse);
      
      // Save assistant response to local storage
      if (this.currentWorkflowId && fullResponse) {
        this.chatStorage.addMessage(this.currentWorkflowId, 'assistant', fullResponse);
      }
      
    } catch (error) {
      console.error('Error sending message to backend:', error);
      const errorMessage = `Error: ${error.message}`;
      this.chatMessages.updateStreamingMessage(streamingMessageId, errorMessage);
      this.chatMessages.finalizeStreamingMessage(streamingMessageId, errorMessage);
      
      // Save error message to local storage
      if (this.currentWorkflowId) {
        this.chatStorage.addMessage(this.currentWorkflowId, 'assistant', errorMessage, 'error');
      }
    }
    
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
