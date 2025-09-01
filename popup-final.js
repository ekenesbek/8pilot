// Popup functionality for 8pilot extension
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
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

    // Activate button
    const activateBtn = document.getElementById('activateBtn');
    const activateSection = document.getElementById('activateSection');
    const statusDisplay = document.getElementById('statusDisplay');
    const sectionDescription = document.getElementById('sectionDescription');
    const deactivateBtn = document.getElementById('deactivateBtn');

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
        activateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Activate button clicked');
            
            // Check if current page is n8n before activation
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    const tab = tabs[0];
                    const isN8n = isN8nPage(tab.url);
                    
                    if (isN8n) {
                        // Send message to background script first
                        if (chrome && chrome.runtime) {
                            chrome.runtime.sendMessage({
                                action: 'activateAndOpenSidePanel',
                                data: {
                                    url: tab.url
                                }
                            }, async (response) => {
                                console.log('Activation response:', response);
                                if (response && response.status === 'activated') {
                                    // Save activation state
                                    await chrome.storage.local.set({ [`activated_${tab.id}`]: true });
                                    
                                    // Only show activated state if activation was successful
                                    activateSection.classList.add('activated');
                                    statusDisplay.classList.add('active');
                                    sectionDescription.style.display = 'none';
                                    activateBtn.style.display = 'none';
                                    deactivateBtn.classList.add('active');
                                } else {
                                    // Show error if activation failed
                                    alert('Activation failed: ' + (response?.message || 'Unknown error'));
                                }
                            });
                        }
                    } else {
                        // Show error message - do not activate
                        alert('Please navigate to an n8n workflow page first');
                    }
                }
            });
        });
    }

    // Function to check if URL is n8n page (copied from sidepanel logic)
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
            
            // Remove activation state from storage
            if (tab) {
                await chrome.storage.local.remove([`activated_${tab.id}`]);
            }
            
            // Send message to background script
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'deactivateExtension'
                }, (response) => {
                    console.log('Deactivation response:', response);
                });
            }
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
