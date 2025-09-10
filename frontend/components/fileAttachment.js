// File attachment component
export class FileAttachment {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.attachedFiles = [];
  }

  handleFileSelection(files) {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.warn('File too large:', file.name);
        return;
      }
      
      const fileInfo = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      };
      
      this.attachedFiles.push(fileInfo);
    });
    
    this.updateDisplay();
  }

  updateDisplay() {
    const attachmentsContainer = document.getElementById('8pilot-attachments-container');
    if (!attachmentsContainer) return;
    
    // Clear existing attachments
    attachmentsContainer.innerHTML = '';
    
    if (this.attachedFiles.length === 0) return;
    
    this.attachedFiles.forEach(fileInfo => {
      const fileChip = this.createFileChip(fileInfo);
      attachmentsContainer.appendChild(fileChip);
    });
  }

  createFileChip(fileInfo) {
    const fileChip = document.createElement('div');
    fileChip.style.cssText = `
      background: rgba(0, 0, 0, 0.9);
      border-radius: 4px;
      padding: 3px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #ffffff;
      max-width: 140px;
      height: 18px;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    `;
    
    const fileName = fileInfo.name.length > 18 
      ? fileInfo.name.substring(0, 18) + '...' 
      : fileInfo.name;
    
    const fileSize = this.formatFileSize(fileInfo.size);
    const fileIcon = this.getFileIcon(fileInfo.type);
    
    // Create elements
    const fileNameSpan = document.createElement('span');
    fileNameSpan.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;';
    fileNameSpan.textContent = fileName;
    
    const fileSizeSpan = document.createElement('span');
    fileSizeSpan.style.cssText = 'font-size: 10px; color: #cccccc;';
    fileSizeSpan.textContent = fileSize;
    
    const removeButton = this.createRemoveButton(fileInfo.id);
    
    // Add elements to fileChip
    fileChip.appendChild(fileNameSpan);
    fileChip.appendChild(fileSizeSpan);
    fileChip.appendChild(removeButton);
    
    // Add hover effects
    this.addHoverEffects(fileChip);
    
    return fileChip;
  }

  createRemoveButton(fileId) {
    const removeButton = document.createElement('button');
    removeButton.innerHTML = '×';
    removeButton.style.cssText = `
      background: none; 
      border: none; 
      color: #ffffff; 
      cursor: pointer; 
      padding: 1px 3px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s ease;
      margin-left: 2px;
      line-height: 1;
    `;
    
    removeButton.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      this.style.color = '#ffffff';
    });
    
    removeButton.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
      this.style.color = '#ffffff';
    });
    
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeAttachment(fileId);
    });
    
    return removeButton;
  }

  addHoverEffects(fileChip) {
    fileChip.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.style.borderColor = 'rgba(79, 209, 199, 0.4)';
      this.style.transform = 'translateY(-1px)';
    });
    
    fileChip.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      this.style.transform = 'translateY(0)';
    });
  }

  removeAttachment(fileId) {
    this.attachedFiles = this.attachedFiles.filter(file => file.id !== fileId);
    this.updateDisplay();
  }

  getFileIcon(fileType) {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📋';
    if (fileType.includes('json')) return '📝';
    if (fileType.includes('csv') || fileType.includes('xlsx')) return '📊';
    return '📄';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getAttachedFiles() {
    return this.attachedFiles;
  }

  clearAttachments() {
    this.attachedFiles = [];
    this.updateDisplay();
  }
}
