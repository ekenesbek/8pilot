// Popup functionality for 8pilot extension
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
    // Get form elements
    const providerSelect = document.getElementById('provider');
    const modelSelect = document.getElementById('model');
    const apiKeyInput = document.getElementById('apiKey');
    const reasoningSelect = document.getElementById('reasoning');
    const activateBtn = document.getElementById('activateBtn');
    const activateSection = document.getElementById('activateSection');
    const statusDisplay = document.getElementById('statusDisplay');
    const sectionDescription = document.getElementById('sectionDescription');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
    const activateTooltip = document.getElementById('activateTooltip');
    
    // Load saved settings on startup
    loadSavedSettings();
    
    // Tab switching
    function initTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');

        console.log('Found tabs:', tabs.length);
        console.log('Found contents:', contents.length);

        tabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                const targetTab = this.dataset.tab;
                console.log('Tab clicked:', targetTab);
                
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Hide all content
                contents.forEach(c => c.classList.remove('active'));
                
                // Show target content
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                    console.log('Activated tab content:', targetTab);
                } else {
                    console.error('Target content not found:', targetTab);
                }
            });
        });
    }

    // Initialize tabs
    setTimeout(() => {
        initTabs();
    }, 100);

    // API Key and settings management
    function loadSavedSettings() {
        chrome.storage.sync.get(['openaiApiKey', 'anthropicApiKey', 'provider', 'model', 'reasoning'], function(result) {
            console.log('Loaded settings:', result);
            
            // Load provider first
            const provider = result.provider || 'openai';
            if (providerSelect) {
                providerSelect.value = provider;
            }
            
            // Load API key based on provider
            const apiKeyField = provider === 'anthropic' ? 'anthropicApiKey' : 'openaiApiKey';
            if (result[apiKeyField]) {
                // Show dots equal to API key length
                const maskedKey = '•'.repeat(result[apiKeyField].length);
                apiKeyInput.value = maskedKey;
                apiKeyInput.dataset.hasKey = 'true';
                apiKeyInput.dataset.originalLength = result[apiKeyField].length;
                updateActivateButtonState(true);
            } else {
                apiKeyInput.value = '';
                apiKeyInput.dataset.hasKey = 'false';
                apiKeyInput.dataset.originalLength = '0';
                updateActivateButtonState(false);
            }
            
            // Load model
            if (result.model && modelSelect) {
                modelSelect.value = result.model;
            }
            
            // Load reasoning
            if (result.reasoning && reasoningSelect) {
                reasoningSelect.value = result.reasoning;
            }
            
            // Initialize model options and UI after loading settings
            setTimeout(() => {
                updateModelOptions(provider);
                updateProviderUI();
            }, 100);
        });
        
        // Check global activation state
        chrome.storage.local.get(['globalActivationState'], function(result) {
            if (result.globalActivationState) {
                // Show activated state
                activateSection.classList.add('activated');
                statusDisplay.classList.add('active');
                sectionDescription.style.display = 'none';
                activateBtn.style.display = 'none';
                deactivateBtn.classList.add('active');
            }
        });
    }
    
    // Update activate button state based on API key presence
    function updateActivateButtonState(hasApiKey) {
        if (activateBtn) {
            if (hasApiKey) {
                activateBtn.disabled = false;
                activateBtn.style.opacity = '1';
                activateBtn.style.cursor = 'pointer';
                activateBtn.title = '';
                // Hide tooltip when button is enabled
                if (activateTooltip) {
                    activateTooltip.classList.remove('show');
                }
            } else {
                activateBtn.disabled = true;
                activateBtn.style.opacity = '0.5';
                activateBtn.style.cursor = 'not-allowed';
                activateBtn.title = '';
            }
        }
        
        // Update clear API key button visibility
        if (clearApiKeyBtn) {
            if (hasApiKey) {
                clearApiKeyBtn.style.display = 'flex';
            } else {
                clearApiKeyBtn.style.display = 'none';
            }
        }
    }
    
    // API Key input handling
    if (apiKeyInput) {
        apiKeyInput.addEventListener('focus', function() {
            // Clear masked value when focusing
            if (this.dataset.hasKey === 'true') {
                this.value = '';
            }
        });
        
        apiKeyInput.addEventListener('blur', function() {
            const apiKey = this.value.trim();
            const provider = providerSelect ? providerSelect.value : 'openai';
            
            if (apiKey && this.dataset.hasKey !== 'true') {
                // Validate API key format based on provider
                let isValid = false;
                
                if (provider === 'openai' && apiKey.startsWith('sk-')) {
                    isValid = true;
                } else if (provider === 'anthropic' && apiKey.startsWith('sk-ant-')) {
                    isValid = true;
                }
                
                if (isValid) {
                    // Save API key for current provider
                    saveApiKey(apiKey, provider);
                } else {
                    const expectedFormat = provider === 'openai' ? 'sk-' : 'sk-ant-';
                    alert(`Invalid API key format. ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API keys should start with "${expectedFormat}"`);
                    this.value = '';
                    updateActivateButtonState(false);
                }
            } else if (!apiKey) {
                // If empty, check if we had a saved key for current provider
                const apiKeyField = provider === 'anthropic' ? 'anthropicApiKey' : 'openaiApiKey';
                chrome.storage.sync.get([apiKeyField], function(result) {
                    if (result[apiKeyField]) {
                        // Show dots equal to API key length
                        const maskedKey = '•'.repeat(result[apiKeyField].length);
                        apiKeyInput.value = maskedKey;
                        apiKeyInput.dataset.hasKey = 'true';
                        apiKeyInput.dataset.originalLength = result[apiKeyField].length;
                        updateActivateButtonState(true);
                    } else {
                        updateActivateButtonState(false);
                    }
                });
            }
        });
        
        apiKeyInput.addEventListener('input', function() {
            const apiKey = this.value.trim();
            if (apiKey && this.dataset.hasKey !== 'true') {
                updateActivateButtonState(true);
            } else if (!apiKey) {
                updateActivateButtonState(false);
            }
        });
        
        apiKeyInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur(); // Trigger blur event to save
            }
        });
    }
    
    // Save API key function
    function saveApiKey(apiKey, provider) {
        console.log('Saving API key for provider:', provider);
        
        // Prepare data to save
        const dataToSave = {
            provider: provider
        };
        
        // Save API key for specific provider
        if (provider === 'anthropic') {
            dataToSave.anthropicApiKey = apiKey;
        } else {
            dataToSave.openaiApiKey = apiKey;
        }
        
        chrome.storage.sync.set(dataToSave, function() {
            if (chrome.runtime.lastError) {
                console.error('Failed to save API key:', chrome.runtime.lastError);
                alert('Failed to save API key');
                updateActivateButtonState(false);
            } else {
                console.log('API key saved successfully for provider:', provider);
                // Mask the input after saving with correct number of dots
                const maskedKey = '•'.repeat(apiKey.length);
                apiKeyInput.value = maskedKey;
                apiKeyInput.dataset.hasKey = 'true';
                apiKeyInput.dataset.originalLength = apiKey.length;
                updateActivateButtonState(true);
                
                // Notify content scripts about API key update
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'apiCredentialsUpdated',
                            data: { apiKey, provider }
                        }, (response) => {
                            // Ignore errors for tabs without content script
                        });
                    });
                });
                
                // Show success indicator briefly
                const originalBorder = apiKeyInput.style.borderColor;
                apiKeyInput.style.borderColor = '#4fd1c7';
                setTimeout(() => {
                    apiKeyInput.style.borderColor = originalBorder;
                }, 1000);
            }
        });
    }
    
    // Save other settings
    function saveSettings() {
        const settings = {
            provider: providerSelect ? providerSelect.value : 'openai',
            model: modelSelect ? modelSelect.value : 'gpt-4o',
            reasoning: reasoningSelect ? reasoningSelect.value : 'medium'
        };
        
        chrome.storage.sync.set(settings, function() {
            if (chrome.runtime.lastError) {
                console.error('Failed to save settings:', chrome.runtime.lastError);
            } else {
                console.log('Settings saved:', settings);
            }
        });
    }
    
    // Add event listeners for settings
    if (providerSelect) {
        providerSelect.addEventListener('change', function() {
            updateProviderUI();
            saveSettings();
        });
    }
    
    // Update UI based on selected provider
    function updateProviderUI() {
        const provider = providerSelect ? providerSelect.value : 'openai';
        const apiKeyLabel = document.getElementById('apiKeyLabel');
        const apiKeyInput = document.getElementById('apiKey');
        const helpLinks = document.getElementById('helpLinks');
        
        // Update model options based on provider
        updateModelOptions(provider);
        
        if (provider === 'anthropic') {
            if (apiKeyLabel) apiKeyLabel.textContent = 'Anthropic API Key';
            if (apiKeyInput) apiKeyInput.placeholder = 'Enter your Anthropic API key (sk-ant-...)';
            if (helpLinks) {
                helpLinks.innerHTML = `
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" class="help-link">Get Anthropic API Key ↗</a>
                    <div class="help-text">You must have valid <a href="https://console.anthropic.com/settings/billing" target="_blank" class="help-link">billing setup ↗</a> with Anthropic</div>
                    <a href="https://docs.anthropic.com/claude/reference/getting-started-with-the-api" target="_blank" class="help-link">Setup Guide ↗</a>
                `;
            }
        } else {
            if (apiKeyLabel) apiKeyLabel.textContent = 'OpenAI API Key';
            if (apiKeyInput) apiKeyInput.placeholder = 'Enter your OpenAI API key (sk-...)';
            if (helpLinks) {
                helpLinks.innerHTML = `
                    <a href="https://platform.openai.com/api-keys" target="_blank" class="help-link">Get OpenAI API Key ↗</a>
                    <div class="help-text">You must have valid <a href="https://platform.openai.com/settings/organization/billing/payment-methods" target="_blank" class="help-link">billing information ↗</a> setup with OpenAI</div>
                    <a href="https://www.youtube.com/watch?v=w6LbUiVMl8g" target="_blank" class="help-link">Not working? Watch setup tutorial ↗</a>
                `;
            }
        }
        
        // Load saved API key for this provider
        chrome.storage.sync.get(['openaiApiKey', 'anthropicApiKey'], function(result) {
            const apiKeyField = provider === 'anthropic' ? 'anthropicApiKey' : 'openaiApiKey';
            if (result[apiKeyField]) {
                // Show dots equal to API key length
                const maskedKey = '•'.repeat(result[apiKeyField].length);
                apiKeyInput.value = maskedKey;
                apiKeyInput.dataset.hasKey = 'true';
                apiKeyInput.dataset.originalLength = result[apiKeyField].length;
                updateActivateButtonState(true);
            } else {
                apiKeyInput.value = '';
                apiKeyInput.dataset.hasKey = 'false';
                apiKeyInput.dataset.originalLength = '0';
                updateActivateButtonState(false);
                
                // Check if extension is activated but no API key for this provider
                chrome.storage.local.get(['globalActivationState'], function(activationResult) {
                    if (activationResult.globalActivationState) {
                        console.log('Extension is activated but no API key for provider:', provider, 'deactivating');
                        
                        // Hide activated state
                        activateSection.classList.remove('activated');
                        statusDisplay.classList.remove('active');
                        sectionDescription.style.display = 'block';
                        activateBtn.style.display = 'block';
                        deactivateBtn.classList.remove('active');
                        
                        // Remove global activation state from storage
                        chrome.storage.local.set({ globalActivationState: false });
                        
                        // Send message to all tabs to deactivate
                        chrome.tabs.query({}, (tabs) => {
                            tabs.forEach(tab => {
                                chrome.tabs.sendMessage(tab.id, {
                                    action: 'deactivateExtension'
                                }, (response) => {
                                    console.log('Deactivation response from tab', tab.id, ':', response);
                                });
                            });
                        });
                    }
                });
            }
        });
    }
    
    // Update model options based on selected provider
    function updateModelOptions(provider) {
        if (!modelSelect) return;
        
        // Get all model options
        const allOptions = Array.from(modelSelect.querySelectorAll('option'));
        
        // Hide all options first
        allOptions.forEach(option => {
            option.style.display = 'none';
        });
        
        // Show only options for selected provider
        const providerOptions = allOptions.filter(option => 
            option.dataset.provider === provider
        );
        
        providerOptions.forEach(option => {
            option.style.display = 'block';
        });
        
        // Set default model for provider
        let defaultModel;
        if (provider === 'openai') {
            defaultModel = 'gpt-4o';
        } else if (provider === 'anthropic') {
            defaultModel = 'claude-3-7-sonnet-20250219';
        }
        
        // Set default model if current selection is not available for this provider
        const currentModel = modelSelect.value;
        const isCurrentModelAvailable = providerOptions.some(option => option.value === currentModel);
        
        if (!isCurrentModelAvailable && defaultModel) {
            modelSelect.value = defaultModel;
            saveSettings();
        }
    }
    
    // Provider UI will be initialized after settings are loaded
    
    if (modelSelect) {
        modelSelect.addEventListener('change', saveSettings);
    }
    
    if (reasoningSelect) {
        reasoningSelect.addEventListener('change', saveSettings);
    }
    
    // Clear API key button
    if (clearApiKeyBtn) {
        clearApiKeyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const provider = providerSelect ? providerSelect.value : 'openai';
            const apiKeyField = provider === 'anthropic' ? 'anthropicApiKey' : 'openaiApiKey';
            
            // Clear API key from storage
            chrome.storage.sync.remove([apiKeyField], function() {
                if (chrome.runtime.lastError) {
                    console.error('Failed to clear API key:', chrome.runtime.lastError);
                    alert('Failed to clear API key');
                } else {
                    console.log('API key cleared for provider:', provider);
                    
                    // Clear input field
                    apiKeyInput.value = '';
                    apiKeyInput.dataset.hasKey = 'false';
                    apiKeyInput.dataset.originalLength = '0';
                    updateActivateButtonState(false);
                    
                    // Check if extension is activated and deactivate it
                    chrome.storage.local.get(['globalActivationState'], function(result) {
                        if (result.globalActivationState) {
                            console.log('Extension is activated, deactivating due to API key removal');
                            
                            // Hide activated state
                            activateSection.classList.remove('activated');
                            statusDisplay.classList.remove('active');
                            sectionDescription.style.display = 'block';
                            activateBtn.style.display = 'block';
                            deactivateBtn.classList.remove('active');
                            
                            // Remove global activation state from storage
                            chrome.storage.local.set({ globalActivationState: false });
                            
                            // Send message to all tabs to deactivate
                            chrome.tabs.query({}, (tabs) => {
                                tabs.forEach(tab => {
                                    chrome.tabs.sendMessage(tab.id, {
                                        action: 'deactivateExtension'
                                    }, (response) => {
                                        console.log('Deactivation response from tab', tab.id, ':', response);
                                    });
                                });
                            });
                        }
                    });
                    
                    // Notify content scripts about API key removal
                    chrome.tabs.query({}, (tabs) => {
                        tabs.forEach(tab => {
                            chrome.tabs.sendMessage(tab.id, {
                                action: 'apiCredentialsUpdated',
                                data: { apiKey: null, provider }
                            }, (response) => {
                                // Ignore errors for tabs without content script
                            });
                        });
                    });
                }
            });
        });
    }
    
    // Restore defaults button
    const restoreBtn = document.querySelector('.restore-btn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Reset to defaults
            if (providerSelect) providerSelect.value = 'openai';
            if (modelSelect) modelSelect.value = 'gpt-4o';
            if (reasoningSelect) reasoningSelect.value = 'medium';
            
            // Update UI to reflect changes
            updateProviderUI();
            
            // Save defaults
            saveSettings();
            
            // Visual feedback
            this.textContent = 'Restored!';
            setTimeout(() => {
                this.textContent = 'Restore Defaults';
            }, 1500);
        });
    }

    // Billing toggle
    const billingOptions = document.querySelectorAll('.toggle-option');
    console.log('Found billing options:', billingOptions.length);
    
    billingOptions.forEach(option => {
        option.addEventListener('click', function() {
            console.log('Billing option clicked:', this.textContent);
            billingOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            
            // Update pricing
            const isYearly = this.textContent === 'Yearly';
            const planPrices = document.querySelectorAll('.plan-price');
            
            planPrices.forEach(priceEl => {
                if (priceEl.dataset.monthly && priceEl.dataset.yearly) {
                    priceEl.innerHTML = isYearly ? priceEl.dataset.yearly : priceEl.dataset.monthly;
                }
            });
        });
    });

    // Plan selection
    const planCards = document.querySelectorAll('.plan-card');
    console.log('Found plan cards:', planCards.length);
    
    planCards.forEach(card => {
        card.addEventListener('click', function() {
            console.log('Plan card clicked');
            planCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Check if extension is already activated on page load
    async function checkActivationStatus() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && isN8nPage(tab.url)) {
                // Check if extension is activated for this tab
                const result = await chrome.storage.local.get([`activated_${tab.id}`]);
                if (result[`activated_${tab.id}`]) {
                    console.log('Extension is already activated for this n8n page');
                    // Show activated state
                    activateSection.classList.add('activated');
                    statusDisplay.classList.add('active');
                    sectionDescription.style.display = 'none';
                    activateBtn.style.display = 'none';
                    deactivateBtn.classList.add('active');
                }
            }
        } catch (error) {
            console.error('Error checking activation status:', error);
        }
    }

    // Check activation status on page load
    checkActivationStatus();

    if (activateBtn) {
        // Show tooltip on hover when button is disabled
        activateBtn.addEventListener('mouseenter', function() {
            if (this.disabled && activateTooltip) {
                activateTooltip.classList.add('show');
            }
        });
        
        // Hide tooltip when mouse leaves
        activateBtn.addEventListener('mouseleave', function() {
            if (activateTooltip) {
                activateTooltip.classList.remove('show');
            }
        });
        
        activateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Activate button clicked');
            
            // Check if button is disabled
            if (this.disabled) {
                const provider = providerSelect ? providerSelect.value : 'openai';
                const providerName = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
                alert(`Please enter your ${providerName} API key first`);
                // Switch to API tab
                document.querySelector('.nav-tab[data-tab="api"]').click();
                return;
            }
            
            // Activate extension globally (no need to be on n8n page)
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    const tab = tabs[0];
                    
                    // Send message to content script to activate
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'activateExtension'
                    }, async (response) => {
                        console.log('Activation response:', response);
                        if (response && response.status === 'activated') {
                            // Save global activation state
                            await chrome.storage.local.set({ globalActivationState: true });
                            
                            // Show activated state
                            activateSection.classList.add('activated');
                            statusDisplay.classList.add('active');
                            sectionDescription.style.display = 'none';
                            activateBtn.style.display = 'none';
                            deactivateBtn.classList.add('active');
                            
                            // Show success message
                            console.log('✅ Extension activated successfully');
                        } else {
                            // Show error if activation failed
                            console.error('❌ Activation failed:', response);
                            alert('Activation failed. Please try again. Check console for details.');
                        }
                    });
                }
            });
        });
    }

    // Function to check if URL is n8n page - using extension.js logic
    function isN8nPage(url) {
        if (!url) return false;
        
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            const pathname = urlObj.pathname.toLowerCase();
            
            // Check for various n8n patterns
            return (
                // n8n in hostname (e.g., kkengesbek.app.n8n.cloud, n8n.example.com)
                hostname.includes('n8n') ||
                // n8n in path (e.g., example.com/n8n)
                pathname.includes('/n8n') ||
                // workflow in path (common n8n pattern)
                pathname.includes('/workflow') ||
                pathname.includes('/execution') ||
                // Common n8n ports
                (urlObj.port === '5678') ||
                // localhost development
                (hostname === 'localhost' && (urlObj.port === '5678' || pathname.includes('workflow')))
            );
        } catch (e) {
            // Fallback to basic string matching
            return url.includes('n8n') || url.includes('workflow') || url.includes('execution');
        }
    }

    // Deactivate button
    if (deactivateBtn) {
        deactivateBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Deactivate button clicked');
            
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Hide activated state
            activateSection.classList.remove('activated');
            statusDisplay.classList.remove('active');
            sectionDescription.style.display = 'block';
            activateBtn.style.display = 'block';
            deactivateBtn.classList.remove('active');
            
            // Remove global activation state from storage
            await chrome.storage.local.set({ globalActivationState: false });
            
            // Send message to all tabs to deactivate
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'deactivateExtension'
                    }, (response) => {
                        console.log('Deactivation response from tab', tab.id, ':', response);
                    });
                });
            });
        });
    }

    // Support items interaction
    document.querySelectorAll('.support-item').forEach(item => {
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-2px)';
            }, 100);
        });
    });

    // Community Discord link
    const communityItem = document.getElementById('communityItem');
    if (communityItem) {
        communityItem.addEventListener('click', function() {
            chrome.tabs.create({ url: 'https://discord.gg/WzY2XEzYQp' });
        });
    }

    // Alternative tab switching (backup)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('nav-tab')) {
            const targetTab = e.target.dataset.tab;
            console.log('Alternative tab click:', targetTab);
            
            // Remove active from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Hide all content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show target content
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        }
    });
});
