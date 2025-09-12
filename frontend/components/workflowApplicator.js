// WorkflowApplicator with postMessage bridge to page context (Fixed for MV3)
export class WorkflowApplicator {
    constructor(chatManager) {
      this.chatManager = chatManager;
      this.isApplying = false;
      this.debugMode = true;
      this.bridgeInstalled = false;
      this._readyPromise = null;
    }
  
    // Main method - postMessage bridge approach
    async applyWorkflowFromJson(jsonContent, workflowName = 'Generated Workflow') {
      if (this.isApplying) {
        console.log('WorkflowApplicator: Already applying a workflow, skipping...');
        return false;
      }
  
      try {
        this.isApplying = true;
        this.log('Starting workflow application process...');
  
        // Parse the JSON content
        const workflowData = this.parseWorkflowJson(jsonContent);
        if (!workflowData) {
          this.log('Failed to parse workflow JSON');
          this.showErrorNotification('Invalid workflow JSON format');
          return false;
        }
  
        this.log('Parsed workflow with', workflowData.nodes.length, 'nodes');
  
        // Check if we're on an n8n page
        if (!this.isN8nPage()) {
          this.log('Not on n8n page');
          this.showErrorNotification('Please navigate to an n8n page to apply workflows');
          return false;
        }
  
        // Ensure bridge is installed
        if (!this.bridgeInstalled) {
          this.installBridge();
        }
  
        // Wait for page script to be ready
        await this._readyPromise;
  
        // Try direct application using postMessage bridge
        const success = await this.applyDirectly(workflowData, workflowName);
        
        if (success) {
          this.log('Workflow applied successfully!');
          this.showSuccessNotification(workflowName);
          return true;
        } else {
          this.log('Application failed');
          this.showErrorNotification('Failed to apply workflow automatically');
          return false;
        }
  
      } catch (error) {
        console.error('WorkflowApplicator error:', error);
        this.showErrorNotification('Failed to apply workflow automatically');
        return false;
      } finally {
        this.isApplying = false;
      }
    }
  
    // Install bridge between content script and page context
    installBridge() {
      if (this.bridgeInstalled) return;
      
      this.log('Installing postMessage bridge...');
      
      // Install page script
      this.injectPageScript();
      
      // Set up message listener for responses
      const targetWin = window.top || window;
      window.addEventListener('message', (e) => {
        if (!e.data || e.source !== targetWin) return;
        if (e.data.type === '8pilot:apply:result') {
          this.log('Apply result from page:', e.data.ok, e.data.error);
        }
      });
      
      this.bridgeInstalled = true;
      this.log('Bridge installed successfully');
    }
  
    // Inject page script into page context using src (MV3 compatible)
    injectPageScript() {
      // Set up ready promise if not already done
      if (!this._readyPromise) {
        this._readyPromise = new Promise((resolve) => {
          const targetWin = window.top || window;
          const onMsg = (e) => {
            if (e.source !== targetWin || !e.data) return;
            if (e.data.type === '8pilot:ready') {
              window.removeEventListener('message', onMsg);
              this.log('Page script ready signal received');
              resolve(true);
            }
          };
          window.addEventListener('message', onMsg);
          // Timeout fallback in case ready signal is missed
          setTimeout(() => {
            this.log('Ready timeout reached, proceeding anyway');
            resolve(true);
          }, 1500);
        });
      }
      
      // Create script element with external src
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('page-8pilot-inject.js');
      script.onload = () => {
        this.log('Page script loaded');
        script.remove();
      };
      script.onerror = () => {
        this.log('Page script load error');
        script.remove();
      };
      
      // Inject script into page
      (document.head || document.documentElement).appendChild(script);
      
      this.log('Page script injected via src');
    }
  
    // Apply workflow via postMessage bridge
    async applyDirectly(workflowData, workflowName) {
      this.log('Sending apply request via postMessage...');
      
      const workflowJson = JSON.stringify(workflowData);
      const targetWin = window.top || window;
      
      return new Promise((resolve) => {
        const handler = (e) => {
          if (!e.data || e.source !== targetWin) return;
          if (e.data.type === '8pilot:apply:result') {
            window.removeEventListener('message', handler);
            
            if (e.data.ok) {
              this.log('Applied via bridge');
              resolve(true);
            } else {
              this.log('Bridge failed:', e.data.error);
              resolve(false);
            }
          }
        };
        
        window.addEventListener('message', handler);
        
        // Send request to page context
        targetWin.postMessage({ 
          type: '8pilot:apply', 
          payload: { 
            workflowJson: workflowJson, 
            name: workflowName 
          } 
        }, '*');
        
        // Timeout fallback
        setTimeout(() => { 
          window.removeEventListener('message', handler); 
          this.log('Bridge application timeout');
          resolve(false); 
        }, 15000);
      });
    }
  
    // Parse JSON workflow content
    parseWorkflowJson(jsonContent) {
      try {
        const cleanedJson = this.cleanJsonContent(jsonContent);
        const workflowData = JSON.parse(cleanedJson);
  
        if (!this.validateWorkflowStructure(workflowData)) {
          this.log('Invalid workflow structure');
          return null;
        }
  
        return workflowData;
  
      } catch (error) {
        this.log('JSON parsing error:', error.message);
        return null;
      }
    }
  
    // Clean JSON content from markdown blocks (fixed regex)
    cleanJsonContent(content) {
      let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
      }
  
      return cleaned.trim();
    }
  
    // Validate workflow structure
    validateWorkflowStructure(workflowData) {
      return (
        workflowData &&
        typeof workflowData === 'object' &&
        Array.isArray(workflowData.nodes) &&
        workflowData.nodes.length > 0
      );
    }
  
    // Check if current page is n8n
    isN8nPage() {
      const url = window.location.href.toLowerCase();
      return (
        url.includes('n8n') ||
        url.includes('workflow') ||
        url.includes(':5678') ||
        document.querySelector('#app') !== null
      );
    }
  
    // Wait utility
    async wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    // Show success notification
    showSuccessNotification(workflowName) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(16, 185, 129, 0.95);
        border: 1px solid rgba(16, 185, 129, 0.5);
        border-radius: 12px;
        padding: 16px;
        color: #ffffff;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 10004;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 320px;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `;
  
      notification.innerHTML = `
        <div style="display: flex; align-items: center; color: #ffffff; font-weight: 600;">
          <span style="font-size: 20px; margin-right: 8px;">✅</span>
          Workflow Applied Successfully!
        </div>
        <div style="margin-top: 8px; font-size: 13px; color: #dcfce7;">
          "${workflowName}" has been added to your n8n canvas.
        </div>
      `;
  
      document.body.appendChild(notification);
  
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      }, 10);
  
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 4000);
    }
  
    // Show error notification
    showErrorNotification(message) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.95);
        border: 1px solid rgba(239, 68, 68, 0.5);
        border-radius: 12px;
        padding: 16px;
        color: #ffffff;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 10004;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 320px;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `;
  
      notification.innerHTML = `
        <div style="display: flex; align-items: center; color: #ffffff; font-weight: 600;">
          <span style="font-size: 20px; margin-right: 8px;">❌</span>
          ${message}
        </div>
      `;
  
      document.body.appendChild(notification);
  
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      }, 10);
  
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 6000);
    }
  
    // Logging utility
    log(...args) {
      if (this.debugMode) {
        console.log('WorkflowApplicator:', ...args);
      }
    }
  
    // Enable/disable debug mode
    setDebugMode(enabled) {
      this.debugMode = enabled;
    }
}
