// Activation icon component
export class ActivationIcon {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.iconId = '8pilot-activation-icon';
  }

  show() {
    // Remove existing indicator if any
    this.hide();
    
    console.log('Showing 8pilot activation icon');
    
    // Create icon element
    const icon = document.createElement('div');
    icon.id = this.iconId;
    
    // Get icon URL
    const iconUrl = chrome.runtime.getURL('icons/icon128.png');
    console.log('Icon URL:', iconUrl);
    
    icon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 64px;
      height: 64px;
      background-image: url('${iconUrl}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      border-radius: 50%;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(79, 209, 199, 0.4);
      cursor: pointer;
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
      border: 2px solid rgba(79, 209, 199, 0.3);
    `;
    
    // Add fallback if image fails to load
    const img = new Image();
    img.onload = function() {
      console.log('Icon loaded successfully');
    };
    img.onerror = function() {
      console.error('Failed to load icon, using fallback');
      // Fallback to gradient background
      icon.style.backgroundImage = 'none';
      icon.style.background = 'linear-gradient(135deg, #4fd1c7, #06b6d4)';
      icon.innerHTML = '<div style="color: white; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; height: 100%;">8P</div>';
    };
    img.src = iconUrl;
    
    // Add hover effect
    icon.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 25px rgba(79, 209, 199, 0.6)';
    });
    
    icon.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 20px rgba(79, 209, 199, 0.4)';
    });
    
    // Add click handler to toggle menu
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      // This will be handled by MenuManager
      window.dispatchEvent(new CustomEvent('8pilot-toggle-menu'));
    });
    
    // Add pulse animation
    this.addPulseAnimation();
    document.body.appendChild(icon);
  }

  hide() {
    const existingIcon = document.getElementById(this.iconId);
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Reset state
    this.stateManager.update({
      isChatWindowVisible: false,
      isChatMessagesVisible: false
    });
  }

  addPulseAnimation() {
    if (!document.getElementById('pulse-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation-styles';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
