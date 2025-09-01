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

    if (activateBtn) {
        activateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Activate button clicked');
            
            // Show activated state
            activateSection.classList.add('activated');
            statusDisplay.classList.add('active');
            sectionDescription.style.display = 'none';
            activateBtn.style.display = 'none';
            deactivateBtn.classList.add('active');
            
            // Send message to background script
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'activateAndOpenSidePanel',
                    data: {
                        url: window.location.href
                    }
                }, (response) => {
                    console.log('Activation response:', response);
                });
            }
        });
    }

    // Deactivate button
    if (deactivateBtn) {
        deactivateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Deactivate button clicked');
            
            // Hide activated state
            activateSection.classList.remove('activated');
            statusDisplay.classList.remove('active');
            sectionDescription.style.display = 'block';
            activateBtn.style.display = 'block';
            deactivateBtn.classList.remove('active');
            
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
