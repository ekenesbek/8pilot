// WorkflowJsonBox component for displaying JSON workflow in a separate box
export class WorkflowJsonBox {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.jsonBoxId = '8pilot-json-box';
    this.jsonContentId = '8pilot-json-content';
    this.isVisible = false;
  }

  createJsonBox(workflowName, jsonContent) {
    // Remove existing box if any
    this.hide();
    
    const jsonBox = document.createElement('div');
    jsonBox.id = this.jsonBoxId;
    jsonBox.className = 'workflow-json-box'; 
    
    // Get current chat container position for positioning
    const chatContainer = document.getElementById('8pilot-chat-container');
    let containerLeft, containerTop, containerWidth;
    
    if (chatContainer) {
      const rect = chatContainer.getBoundingClientRect();
      containerLeft = rect.left;
      containerTop = rect.top;
      containerWidth = rect.width;
    } else {
      // Fallback positioning
      containerLeft = window.innerWidth / 2;
      containerTop = window.innerHeight - 120;
      containerWidth = 600;
    }
    
    jsonBox.style.cssText = `
      position: fixed;
      left: ${containerLeft}px;
      top: ${containerTop - 450}px;
      width: ${Math.min(containerWidth, Math.min(600, window.innerWidth * 0.9))}px;
      max-height: 400px;
      z-index: 10003;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(79, 209, 199, 0.3);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
    `;
    
    // Create header
    const header = this.createHeader(workflowName);
    
    // Create content area
    const content = this.createContent(jsonContent);
    
    // Create buttons
    const buttons = this.createButtons();
    
    jsonBox.appendChild(header);
    jsonBox.appendChild(content);
    jsonBox.appendChild(buttons);
    
    // Add to document
    document.body.appendChild(jsonBox);
    
    // Animate in
    setTimeout(() => {
      jsonBox.style.opacity = '1';
      jsonBox.style.transform = 'translateY(0)';
    }, 10);
    
    this.isVisible = true;
    
    // Add event handlers
    this.addEventHandlers(jsonBox);
    
    return jsonBox;
  }

  createHeader(workflowName) {
    const header = document.createElement('div');
    header.className = 'json-box-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(79, 209, 199, 0.2);
      background: rgba(79, 209, 199, 0.05);
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4fd1c7;
      font-size: 14px;
      font-weight: 500;
    `;
    
    title.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>${workflowName}.json</span>
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #a1a1aa;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.color = '#4fd1c7';
      closeButton.style.background = 'rgba(79, 209, 199, 0.1)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.color = '#a1a1aa';
      closeButton.style.background = 'none';
    });
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    return header;
  }

  createContent(jsonContent) {
    const content = document.createElement('div');
    content.id = this.jsonContentId;
    content.className = 'json-box-content';
    content.style.cssText = `
      padding: 16px;
      max-height: 300px;
      overflow-y: auto;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #e2e8f0;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      margin: 0 16px;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;
    
    // Format JSON with syntax highlighting
    content.innerHTML = this.formatJson(jsonContent);
    
    // Add scrollbar styles
    this.addScrollbarStyles();
    
    return content;
  }

  createButtons() {
    const buttons = document.createElement('div');
    buttons.className = 'json-box-buttons';
    buttons.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-top: 1px solid rgba(79, 209, 199, 0.2);
      background: rgba(79, 209, 199, 0.05);
    `;
    
    // Left side - Copy button
    const copyButton = this.createCopyButton();
    
    // Right side - Restore button
    const restoreButton = this.createRestoreButton();
    
    buttons.appendChild(copyButton);
    buttons.appendChild(restoreButton);
    
    return buttons;
  }

  createCopyButton() {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copy
    `;
    copyButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(79, 209, 199, 0.1);
      border: 1px solid rgba(79, 209, 199, 0.3);
      color: #4fd1c7;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    copyButton.addEventListener('mouseenter', () => {
      copyButton.style.background = 'rgba(79, 209, 199, 0.2)';
      copyButton.style.borderColor = 'rgba(79, 209, 199, 0.5)';
    });
    
    copyButton.addEventListener('mouseleave', () => {
      copyButton.style.background = 'rgba(79, 209, 199, 0.1)';
      copyButton.style.borderColor = 'rgba(79, 209, 199, 0.3)';
    });
    
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyToClipboard();
    });
    
    return copyButton;
  }

  createRestoreButton() {
    const restoreButton = document.createElement('button');
    restoreButton.className = 'restore-button';
    restoreButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Restore
    `;
    restoreButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e2e8f0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    restoreButton.addEventListener('mouseenter', () => {
      restoreButton.style.background = 'rgba(255, 255, 255, 0.2)';
      restoreButton.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    });
    
    restoreButton.addEventListener('mouseleave', () => {
      restoreButton.style.background = 'rgba(255, 255, 255, 0.1)';
      restoreButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    restoreButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.restoreWorkflow();
    });
    
    return restoreButton;
  }

  formatJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      
      // Store the original formatted JSON for copying
      this.originalJsonContent = formatted;
      
      // Basic syntax highlighting
      return formatted
        .replace(/(".*?")\s*:/g, '<span style="color: #4fd1c7;">$1</span>:')
        .replace(/:\s*(".*?")/g, ': <span style="color: #fbbf24;">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span style="color: #f472b6;">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span style="color: #60a5fa;">$1</span>')
        .replace(/([{}[\]])/g, '<span style="color: #a1a1aa;">$1</span>');
    } catch (error) {
      // If JSON is invalid, return as plain text
      this.originalJsonContent = jsonString;
      return jsonString;
    }
  }

  addScrollbarStyles() {
    if (!document.getElementById('json-box-scrollbar-styles')) {
      const style = document.createElement('style');
      style.id = 'json-box-scrollbar-styles';
      style.textContent = `
        .json-box-content::-webkit-scrollbar {
          width: 6px;
        }
        .json-box-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .json-box-content::-webkit-scrollbar-thumb {
          background: rgba(79, 209, 199, 0.3);
          border-radius: 3px;
        }
        .json-box-content::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 209, 199, 0.5);
        }
      `;
      document.head.appendChild(style);
    }
  }

  addEventHandlers(jsonBox) {
    // Prevent click propagation to avoid closing chat
    jsonBox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    jsonBox.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    jsonBox.addEventListener('mouseup', (e) => {
      e.stopPropagation();
    });

    jsonBox.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
    });

    // Track mouse interaction
    jsonBox.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.startInteraction) {
        this.chatManager.startInteraction();
      }
    });

    jsonBox.addEventListener('mouseleave', (e) => {
      e.stopPropagation();
      if (this.chatManager && this.chatManager.endInteraction) {
        this.chatManager.endInteraction();
      }
    });
  }

  copyToClipboard() {
    // Use the stored original JSON content for copying
    const jsonText = this.originalJsonContent;
    
    if (!jsonText || jsonText.trim() === '') {
      console.warn('No JSON content to copy');
      return;
    }
    
    console.log('Copying JSON content:', jsonText.substring(0, 100) + '...');
    
    // Show loading state
    const copyButton = document.querySelector('.copy-button');
    if (copyButton) {
      const originalText = copyButton.innerHTML;
      copyButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
          </circle>
        </svg>
        Copying...
      `;
      copyButton.style.color = '#4fd1c7';
    }
    
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(jsonText).then(() => {
        console.log('JSON copied successfully via Clipboard API');
        this.showCopySuccess(copyButton);
      }).catch(err => {
        console.error('Clipboard API failed:', err);
        this.fallbackCopyToClipboard(jsonText, copyButton);
      });
    } else {
      // Fallback for older browsers or non-secure contexts
      this.fallbackCopyToClipboard(jsonText, copyButton);
    }
  }

  // Fallback copy method for older browsers
  fallbackCopyToClipboard(text, copyButton) {
    try {
      console.log('Using fallback copy method');
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
        console.log('JSON copied successfully via fallback method');
        this.showCopySuccess(copyButton);
      } else {
        console.error('Fallback copy command failed');
        this.showCopyError(copyButton);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      this.showCopyError(copyButton);
    }
  }

  // Show copy success feedback
  showCopySuccess(copyButton) {
    if (!copyButton) return;
    
    const originalText = copyButton.innerHTML;
    copyButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;
    copyButton.style.color = '#10b981';
    copyButton.style.background = 'rgba(16, 185, 129, 0.1)';
    copyButton.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    
    setTimeout(() => {
      copyButton.innerHTML = originalText;
      copyButton.style.color = '#4fd1c7';
      copyButton.style.background = 'rgba(79, 209, 199, 0.1)';
      copyButton.style.borderColor = 'rgba(79, 209, 199, 0.3)';
    }, 2000);
  }

  // Show copy error feedback
  showCopyError(copyButton) {
    if (!copyButton) return;
    
    const originalText = copyButton.innerHTML;
    copyButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Failed
    `;
    copyButton.style.color = '#ef4444';
    copyButton.style.background = 'rgba(239, 68, 68, 0.1)';
    copyButton.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    
    setTimeout(() => {
      copyButton.innerHTML = originalText;
      copyButton.style.color = '#4fd1c7';
      copyButton.style.background = 'rgba(79, 209, 199, 0.1)';
      copyButton.style.borderColor = 'rgba(79, 209, 199, 0.3)';
    }, 3000);
  }

  restoreWorkflow() {
    // This would restore the workflow to n8n
    // For now, just show a message
    console.log('Restore workflow functionality would be implemented here');
    
    // Show feedback
    const restoreButton = document.querySelector('.restore-button');
    if (restoreButton) {
      const originalText = restoreButton.innerHTML;
      restoreButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Restored!
      `;
      restoreButton.style.color = '#10b981';
      
      setTimeout(() => {
        restoreButton.innerHTML = originalText;
        restoreButton.style.color = '#e2e8f0';
      }, 2000);
    }
  }

  hide() {
    const jsonBox = document.getElementById(this.jsonBoxId);
    if (jsonBox) {
      jsonBox.style.opacity = '0';
      jsonBox.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        if (jsonBox.parentNode) {
          jsonBox.parentNode.removeChild(jsonBox);
        }
      }, 300);
    }
    
    this.isVisible = false;
  }

  show(workflowName, jsonContent) {
    this.createJsonBox(workflowName, jsonContent);
  }

  isBoxVisible() {
    return this.isVisible;
  }
}
