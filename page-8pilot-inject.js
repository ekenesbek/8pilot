// page-8pilot-inject.js - runs in page context with access to __vue_app__
(function () {
    if (window.__8pilotPageInstalled__) return;
    window.__8pilotPageInstalled__ = true;
    
    console.log('8pilot page script injected');
    
    // Utilities
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    
    const waitFor = async (fn, { tries = 80, delay = 200 } = {}) => {
      for (let i = 0; i < tries; i++) {
        try { 
          const v = fn(); 
          if (v) return v; 
        } catch (e) {
          // Continue trying
        }
        await wait(delay);
      }
      return null;
    };
    
    // Get Vue stores with waiting
    const getStores = async () => {
      console.log('Getting Vue stores...');
      
      // Wait for Vue app to be available
      const app = await waitFor(() => {
        const el = document.querySelector('#app');
        return el && el.__vue_app__;
      });
      
      if (!app) throw new Error('Vue app not found');
      console.log('Vue app found');
      
      const pinia = app.config && app.config.globalProperties && app.config.globalProperties.$pinia;
      if (!pinia) throw new Error('Pinia not found');
      console.log('Pinia found');
      
      // More flexible store finding
      const sMap = pinia._s || new Map();
      const workflowsStore = 
        sMap.get('workflows') ||
        sMap.get('workflow') ||
        [...sMap.values()].find(s => s && typeof s.setNodes === 'function' && typeof s.setConnections === 'function');
      
      if (!workflowsStore) throw new Error('Workflows store not found');
      console.log('Workflows store found');
      
      return { workflowsStore };
    };
    
    // Generate UUID
    const genUUID = () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    
    // Clean JSON content
    const cleanJson = (s) => {
      let t = s.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
      return t;
    };
    
    // Apply workflow to n8n
    const applyWorkflow = async (rawJson, fallbackName = 'Generated Workflow') => {
      console.log('Applying workflow in page context...');
      
      // Navigate to workflow page if needed
      if (!location.pathname.startsWith('/workflow')) {
        console.log('Navigating to workflow page...');
        history.pushState({}, '', '/workflow/new');
        await wait(300);
      }
      
      const { workflowsStore } = await getStores();
      
      // Parse JSON
      let data;
      try { 
        data = JSON.parse(cleanJson(rawJson)); 
      } catch (e) { 
        throw new Error('Invalid JSON: ' + e.message); 
      }
      
      // Validate structure
      if (!data || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        throw new Error('Invalid workflow structure');
      }
      
      console.log('Processing workflow with', data.nodes.length, 'nodes');
      
      // Generate UUIDs for nodes
      const nodesWithUUID = data.nodes.map(n => ({ 
        ...n, 
        id: genUUID(),
        // Ensure position is set
        position: n.position || [200 + Math.random() * 400, 200 + Math.random() * 400]
      }));
      
      // Get current workflow
      const current = workflowsStore.workflow;
      console.log('Current workflow ID:', current?.id);
      
      // If current workflow is empty, create ID and name
      if (!current?.id || current.id === '__EMPTY__') {
        const newId = genUUID();
        console.log('Setting new workflow ID:', newId);
        workflowsStore.setWorkflowId(newId);
      }
      
      if (!current?.name) {
        const finalName = data.name || fallbackName;
        console.log('Setting workflow name:', finalName);
        workflowsStore.setWorkflowName(finalName);
      }
      
      // Apply to store
      console.log('Setting nodes...');
      workflowsStore.setNodes(nodesWithUUID);
      
      console.log('Setting connections...');
      workflowsStore.setConnections(data.connections || {});
      
      console.log('Workflow applied successfully in page context!');
      return true;
    };
    
    // Listen for commands from content script
    window.addEventListener('message', async (e) => {
      if (!e.data || e.source !== window) return;
      
      if (e.data.type === '8pilot:apply') {
        console.log('Received workflow apply request');
        
        try {
          const { workflowJson, name } = e.data.payload || {};
          const ok = await applyWorkflow(workflowJson, name);
          
          window.postMessage({ 
            type: '8pilot:apply:result', 
            ok: !!ok,
            message: 'Workflow applied successfully'
          }, '*');
          
        } catch (err) {
          console.error('Error applying workflow:', err);
          window.postMessage({ 
            type: '8pilot:apply:result', 
            ok: false, 
            error: String(err?.message || err) 
          }, '*');
        }
      }
    });
    
    console.log('8pilot page script ready');
    
    // Send ready signal for handshake
    window.postMessage({ type: '8pilot:ready' }, '*');
  })();
  