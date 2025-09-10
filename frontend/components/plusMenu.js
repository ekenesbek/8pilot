// Plus menu component
export class PlusMenu {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.menuId = '8pilot-plus-menu';
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    // Remove existing menu if any
    this.hide();
    
    const plusButton = document.getElementById('8pilot-plus-button');
    if (!plusButton) return;
    
    // Уведомляем chatManager о начале взаимодействия
    if (this.chatManager && this.chatManager.startInteraction) {
      this.chatManager.startInteraction();
    }
    
    const menu = document.createElement('div');
    menu.id = this.menuId;
    menu.className = '8pilot-plus-menu'; // Добавляем класс для идентификации
    
    // Get plusButton position for proper positioning
    const plusButtonRect = plusButton.getBoundingClientRect();
    
    menu.style.cssText = `
      position: fixed;
      bottom: ${window.innerHeight - plusButtonRect.top + 10}px;
      left: ${plusButtonRect.left}px;
      background: #000000;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      z-index: 10003;
      min-width: 200px;
      overflow: hidden;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    const menuItems = [
      {
        id: 'upload-document',
        icon: '📄',
        title: 'Upload Document',
        description: 'Attach files to analyze'
      },
      {
        id: 'quick-templates',
        icon: '⚡',
        title: 'Quick Templates',
        description: 'Pre-made workflow questions'
      },
      {
        id: 'workflow-analysis',
        icon: '🔍',
        title: 'Workflow Analysis',
        description: 'Analyze current page'
      }
    ];
    
    menuItems.forEach((item, index) => {
      const menuItem = this.createMenuItem(item, index, menuItems.length);
      menu.appendChild(menuItem);
    });
    
    // Добавляем обработчики событий для отслеживания взаимодействия
    this.setupMenuEventHandlers(menu);
    
    // Add menu to body
    document.body.appendChild(menu);
    this.isVisible = true;
    
    // Set button as active (rotated)
    plusButton.style.color = '#06b6d4';
    plusButton.style.backgroundColor = 'rgba(79, 209, 199, 0.1)';
    plusButton.style.transform = 'scale(1.1) rotate(45deg)';
    
    // Animate in
    setTimeout(() => {
      menu.style.opacity = '1';
      menu.style.transform = 'translateY(0) scale(1)';
    }, 10);
    
    // Add click outside handler - НЕ используем, так как это уже обрабатывается в ChatManager
    // this.addClickOutsideHandler(menu, plusButton);
  }

  // Новый метод для настройки обработчиков событий меню
  setupMenuEventHandlers(menu) {
    // Предотвращаем всплытие кликов
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      // Поддерживаем взаимодействие
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    // Отслеживаем наведение мыши
    menu.addEventListener('mouseenter', () => {
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    menu.addEventListener('mouseleave', () => {
      if (this.chatManager && this.chatManager.endInteraction) {
        this.chatManager.endInteraction();
      }
    });

    // Отслеживаем фокус
    menu.addEventListener('focusin', () => {
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    menu.addEventListener('focusout', () => {
      if (this.chatManager && this.chatManager.endInteraction) {
        this.chatManager.endInteraction();
      }
    });
  }

  createMenuItem(item, index, totalItems) {
    const menuItem = document.createElement('div');
    menuItem.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: ${index < totalItems - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'};
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    
    menuItem.innerHTML = `
      <span style="font-size: 16px;">${item.icon}</span>
      <div>
        <div style="color: #ffffff; font-size: 13px; font-weight: 500;">${item.title}</div>
        <div style="color: #a1a1aa; font-size: 11px; margin-top: 2px;">${item.description}</div>
      </div>
    `;
    
    // Улучшенные обработчики событий для элементов меню
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.backgroundColor = 'rgba(79, 209, 199, 0.1)';
      // Поддерживаем взаимодействие
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });
    
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.backgroundColor = 'transparent';
      // НЕ завершаем взаимодействие при уходе с элемента меню
    });
    
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Поддерживаем взаимодействие во время обработки клика
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
      
      this.handleAction(item.id);
      this.hide();
    });
    
    return menuItem;
  }

  hide() {
    const menu = document.getElementById(this.menuId);
    const plusButton = document.getElementById('8pilot-plus-button');
    
    if (menu) {
      menu.style.opacity = '0';
      menu.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => {
        if (menu.parentNode) {
          menu.parentNode.removeChild(menu);
        }
      }, 200);
    }
    
    // Reset button to normal state
    if (plusButton) {
      plusButton.style.color = '#4fd1c7';
      plusButton.style.backgroundColor = 'transparent';
      plusButton.style.transform = 'scale(1) rotate(0deg)';
    }
    
    this.isVisible = false;
    
    // Завершаем взаимодействие при скрытии меню
    if (this.chatManager && this.chatManager.endInteraction) {
      this.chatManager.endInteraction();
    }
  }

  // Убираем старый метод addClickOutsideHandler, так как обработка теперь в ChatManager
  
  handleAction(actionId) {
    const messageInput = document.getElementById('8pilot-message-input');
    if (!messageInput) return;
    
    // Поддерживаем взаимодействие при выполнении действий
    if (this.chatManager && this.chatManager.startInteraction) {
      this.chatManager.startInteraction();
    }
    
    switch (actionId) {
      case 'upload-document':
        document.getElementById('8pilot-file-input').click();
        break;
        
      case 'quick-templates':
        this.showQuickTemplates();
        break;
        
      case 'workflow-analysis':
        messageInput.value = 'Please analyze the current workflow on this page and provide optimization suggestions.';
        messageInput.focus();
        break;
    }
  }

  showQuickTemplates() {
    const messageInput = document.getElementById('8pilot-message-input');
    if (!messageInput) return;
    
    // Поддерживаем взаимодействие
    if (this.chatManager && this.chatManager.startInteraction) {
      this.chatManager.startInteraction();
    }
    
    const templates = [
      'How can I optimize this workflow for better performance?',
      'Create sticky notes explaining each step of this workflow.',
      'What are potential error points in this workflow?',
      'Help me add error handling to this workflow.',
      'Suggest alternative approaches for this workflow.',
      'How can I make this workflow more robust?'
    ];
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    messageInput.value = randomTemplate;
    messageInput.focus();
  }
}
