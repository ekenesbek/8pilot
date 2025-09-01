// Popup functionality for 8pilot extension
document.addEventListener('DOMContentLoaded', function() {
    // Initialize popup
    initializePopup();
    
    // Tab switching
    initializeTabs();
    
    // Billing toggle
    initializeBillingToggle();
    
    // Plan selection
    initializePlanSelection();
    
    // Activate button
    initializeActivateButton();
    
    // Support items interaction
    initializeSupportItems();
    
    // Settings management
    initializeSettings();
    
    // Load saved settings
    loadSettings();
});

function initializePopup() {
    console.log('8pilot popup initialized');
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

function initializeBillingToggle() {
    const billingOptions = document.querySelectorAll('.toggle-option');
    billingOptions.forEach(option => {
        option.addEventListener('click', function() {
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
}

function initializePlanSelection() {
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('click', function() {
            planCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

function initializeActivateButton() {
    const activateBtn = document.getElementById('activateBtn');
    if (activateBtn) {
        activateBtn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            this.innerHTML = 'Activating...';
            
            // Send message to background script to activate and open side panel
            chrome.runtime.sendMessage({
                action: 'activateAndOpenSidePanel',
                data: {
                    url: window.location.href
                }
            }, (response) => {
                console.log('Activation response:', response);
                
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                    this.innerHTML = '✓ Activated';
                    
                    setTimeout(() => {
                        this.innerHTML = 'Activate on Current Page';
                    }, 2000);
                }, 500);
            });
        });
    }
}

function initializeSupportItems() {
    document.querySelectorAll('.support-item').forEach(item => {
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-2px)';
            }, 100);
            
            // Handle different support actions
            const title = this.querySelector('h4').textContent;
            handleSupportAction(title);
        });
    });
}

function handleSupportAction(title) {
    const actions = {
        'Documentation': () => {
            chrome.tabs.create({ url: 'https://docs.8pilot.com' });
        },
        'Community': () => {
            chrome.tabs.create({ url: 'https://discord.gg/8pilot' });
        },
        'Report Issues': () => {
            chrome.tabs.create({ url: 'https://github.com/8pilot/issues' });
        },
        'Contact Support': () => {
            chrome.tabs.create({ url: 'https://t.me/8pilot_support' });
        }
    };
    
    if (actions[title]) {
        actions[title]();
    }
}

function initializeSettings() {
    // Provider change handler
    const providerSelect = document.getElementById('provider');
    if (providerSelect) {
        providerSelect.addEventListener('change', function() {
            updateModelOptions(this.value);
            saveSettings();
        });
    }
    
    // Model change handler
    const modelSelect = document.getElementById('model');
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            saveSettings();
        });
    }
    
    // API Key change handler
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', function() {
            saveSettings();
        });
    }
    
    // Reasoning level change handler
    const reasoningSelect = document.getElementById('reasoning');
    if (reasoningSelect) {
        reasoningSelect.addEventListener('change', function() {
            saveSettings();
        });
    }
    
    // Restore defaults button
    const restoreBtn = document.querySelector('.restore-btn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function() {
            restoreDefaultSettings();
        });
    }
    
    // Account links
    const signInLink = document.getElementById('signInLink');
    if (signInLink) {
        signInLink.addEventListener('click', function(e) {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://app.8pilot.com/signin' });
        });
    }
    
    const stripeLink = document.getElementById('stripeLink');
    if (stripeLink) {
        stripeLink.addEventListener('click', function(e) {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://billing.stripe.com/8pilot' });
        });
    }
    
    // Upgrade button
    const upgradeBtn = document.querySelector('.upgrade-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', function() {
            const selectedPlan = document.querySelector('.plan-card.selected');
            if (selectedPlan) {
                const planName = selectedPlan.querySelector('.plan-name').textContent;
                if (planName !== 'Free') {
                    chrome.tabs.create({ url: `https://app.8pilot.com/upgrade?plan=${planName.toLowerCase()}` });
                }
            }
        });
    }
    
    // Changelog link
    const changelogLink = document.querySelector('.changelog-link');
    if (changelogLink) {
        changelogLink.addEventListener('click', function(e) {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://github.com/8pilot/changelog' });
        });
    }
}

function updateModelOptions(provider) {
    const modelSelect = document.getElementById('model');
    if (!modelSelect) return;
    
    const models = {
        openai: [
            { value: 'gpt-4o-mini', text: 'GPT-4o Mini' },
            { value: 'gpt-4o', text: 'GPT-4o' },
            { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' }
        ],
        anthropic: [
            { value: 'claude-3-5-sonnet-20241022', text: 'Claude 3.5 Sonnet' },
            { value: 'claude-3-opus-20240229', text: 'Claude 3 Opus' },
            { value: 'claude-3-haiku-20240307', text: 'Claude 3 Haiku' }
        ]
    };
    
    modelSelect.innerHTML = '';
    models[provider].forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.text;
        modelSelect.appendChild(option);
    });
}

function saveSettings() {
    const settings = {
        provider: document.getElementById('provider')?.value || 'openai',
        model: document.getElementById('model')?.value || 'gpt-4o-mini',
        apiKey: document.getElementById('apiKey')?.value || '',
        reasoning: document.getElementById('reasoning')?.value || 'medium'
    };
    
    chrome.storage.sync.set({ settings: settings }, function() {
        console.log('Settings saved:', settings);
        
        // Notify background script about settings update
        chrome.runtime.sendMessage({
            action: 'settingsUpdated',
            data: settings
        });
    });
}

function loadSettings() {
    chrome.storage.sync.get(['settings'], function(result) {
        const settings = result.settings || {};
        
        // Load provider
        const providerSelect = document.getElementById('provider');
        if (providerSelect && settings.provider) {
            providerSelect.value = settings.provider;
            updateModelOptions(settings.provider);
        }
        
        // Load model
        const modelSelect = document.getElementById('model');
        if (modelSelect && settings.model) {
            modelSelect.value = settings.model;
        }
        
        // Load API key
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput && settings.apiKey) {
            apiKeyInput.value = settings.apiKey;
        }
        
        // Load reasoning level
        const reasoningSelect = document.getElementById('reasoning');
        if (reasoningSelect && settings.reasoning) {
            reasoningSelect.value = settings.reasoning;
        }
    });
}

function restoreDefaultSettings() {
    const defaultSettings = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: '',
        reasoning: 'medium'
    };
    
    // Update UI
    const providerSelect = document.getElementById('provider');
    if (providerSelect) {
        providerSelect.value = defaultSettings.provider;
        updateModelOptions(defaultSettings.provider);
    }
    
    const modelSelect = document.getElementById('model');
    if (modelSelect) {
        modelSelect.value = defaultSettings.model;
    }
    
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
        apiKeyInput.value = defaultSettings.apiKey;
    }
    
    const reasoningSelect = document.getElementById('reasoning');
    if (reasoningSelect) {
        reasoningSelect.value = defaultSettings.reasoning;
    }
    
    // Save to storage
    chrome.storage.sync.set({ settings: defaultSettings }, function() {
        console.log('Default settings restored');
        
        // Notify background script
        chrome.runtime.sendMessage({
            action: 'settingsUpdated',
            data: defaultSettings
        });
    });
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in popup:', request);
    
    if (request.action === 'settingsUpdated') {
        // Reload settings if needed
        loadSettings();
    }
    
    sendResponse({ status: 'received' });
});
