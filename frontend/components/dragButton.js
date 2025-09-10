// Drag button component for chat window
export class DragButton {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.buttonId = '8pilot-drag-button';
  }

  create() {
    const dragButton = document.createElement('button');
    dragButton.id = this.buttonId;
    dragButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Центральная точка -->
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
        <!-- Стрелка вверх -->
        <path d="M12 6l-3 3h6l-3-3z" fill="currentColor"/>
        <!-- Стрелка вниз -->
        <path d="M12 18l3-3h-6l3 3z" fill="currentColor"/>
        <!-- Стрелка влево -->
        <path d="M6 12l3-3v6l-3-3z" fill="currentColor"/>
        <!-- Стрелка вправо -->
        <path d="M18 12l-3 3v-6l3 3z" fill="currentColor"/>
      </svg>
    `;
    
    dragButton.style.cssText = `
      position: absolute;
      left: -40px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: move;
      color: #4fd1c7;
      transition: all 0.2s ease;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      z-index: 10003;
      filter: drop-shadow(0 0 6px rgba(79, 209, 199, 0.7));
    `;
    
    // Add hover effects
    this.addHoverEffects(dragButton);
    
    // Add drag functionality
    this.addDragFunctionality(dragButton);
    
    return dragButton;
  }

  addHoverEffects(dragButton) {
    dragButton.addEventListener('mouseenter', function() {
      this.style.color = '#06b6d4';
      this.style.filter = 'drop-shadow(0 0 12px rgba(79, 209, 199, 0.9))';
      this.style.transform = 'translateY(-50%) scale(1.15)';
    });
    
    dragButton.addEventListener('mouseleave', function() {
      this.style.color = '#4fd1c7';
      this.style.filter = 'drop-shadow(0 0 6px rgba(79, 209, 199, 0.7))';
      this.style.transform = 'translateY(-50%) scale(1)';
    });
  }

  addDragFunctionality(dragButton) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let handleMouseMove, handleMouseUp;
    
    dragButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      
      const inputContainer = document.getElementById('8pilot-chat-container');
      const rect = inputContainer.getBoundingClientRect();
      
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      // Visual feedback
      dragButton.style.color = '#00d9ff';
      dragButton.style.filter = 'drop-shadow(0 0 16px rgba(0, 217, 255, 1))';
      dragButton.style.transform = 'translateY(-50%) scale(1.3)';
      
      document.body.style.cursor = 'move';
      
      inputContainer.style.transition = 'none';
      inputContainer.style.opacity = '0.9';
      
      // Create new event handlers for this drag session
      handleMouseMove = (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        const inputContainer = document.getElementById('8pilot-chat-container');
        if (!inputContainer) return;
        
        const newLeft = e.clientX - dragOffset.x;
        const newTop = e.clientY - dragOffset.y;
        
        // Constrain movement boundaries
        const margin = 10;
        const containerRect = inputContainer.getBoundingClientRect();
        
        const maxLeft = window.innerWidth - (containerRect.width * 0.2);
        const minLeft = -(containerRect.width * 0.8);
        const maxTop = window.innerHeight - (containerRect.height * 0.3);
        const minTop = -(containerRect.height * 0.7);
        
        const constrainedLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
        const constrainedTop = Math.max(minTop, Math.min(maxTop, newTop));
        
        inputContainer.style.left = constrainedLeft + 'px';
        inputContainer.style.top = constrainedTop + 'px';
        inputContainer.style.transform = 'none';
        inputContainer.style.bottom = 'auto';
        
        // Update messages position
        this.chatManager.updateMessagesPosition();
      };
      
      handleMouseUp = (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        const inputContainer = document.getElementById('8pilot-chat-container');
        
        if (dragButton) {
          dragButton.style.color = '#4fd1c7';
          dragButton.style.filter = 'drop-shadow(0 0 6px rgba(79, 209, 199, 0.7))';
          dragButton.style.transform = 'translateY(-50%) scale(1)';
        }
        
        if (inputContainer) {
          inputContainer.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          inputContainer.style.opacity = '1';
          
          // Snap to edges
          this.snapToEdges(inputContainer);
        }
        
        document.body.style.cursor = 'default';
        
        // Remove event listeners for this drag session
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      // Add event listeners for this drag session
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  snapToEdges(inputContainer) {
    const rect = inputContainer.getBoundingClientRect();
    const snapDistance = 30;
    let snapLeft = rect.left;
    let snapTop = rect.top;
    
    // Snap to left edge
    if (rect.left < snapDistance && rect.left > -rect.width * 0.5) {
      snapLeft = 10;
    }
    // Snap to right edge
    else if (rect.right > window.innerWidth - snapDistance && rect.right < window.innerWidth + rect.width * 0.5) {
      snapLeft = window.innerWidth - rect.width - 10;
    }
    
    // Snap to top edge
    if (rect.top < snapDistance && rect.top > -rect.height * 0.5) {
      snapTop = 10;
    }
    // Snap to bottom edge
    else if (rect.bottom > window.innerHeight - snapDistance && rect.bottom < window.innerHeight + rect.height * 0.5) {
      snapTop = window.innerHeight - rect.height - 10;
    }
    
    // Apply snapping with animation
    if (snapLeft !== rect.left || snapTop !== rect.top) {
      inputContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      inputContainer.style.left = snapLeft + 'px';
      inputContainer.style.top = snapTop + 'px';
      
      setTimeout(() => {
        this.chatManager.updateMessagesPosition();
      }, 300);
    }
  }
}
