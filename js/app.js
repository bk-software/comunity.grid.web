/**
 * Main application file for Community Card Balance Checker
 * Handles UI interactions, form validation, and coordinates between services
 */

class CommunityCardApp {
    constructor() {
        // DOM elements
        this.barcodeInput = null;
        this.scanButton = null;
        this.lookupButton = null;
        this.loadingSection = null;
        this.errorSection = null;
        this.successSection = null;
        this.environmentBadge = null;

        // UI elements for displaying results
        this.errorMessage = null;
        this.availableBalance = null;
        this.monthlyBudget = null;

        // State
        this.isLookingUp = false;
        this.currentBarcode = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Initialize DOM references
            this.initializeDOMReferences();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize scanner manager
            window.ScannerManager.initialize();

            // Set initial UI state
            this.resetUI();

            window.AppConfig.debugLog('App initialized successfully');

        } catch (error) {
            console.error('App initialization failed:', error);

            // Check for specific Firebase errors
            if (error.message.includes('Authentication failed')) {
                this.showError('Authentication setup required. Anonymous sign-in may not be enabled in Firebase console.');
            } else {
                this.showError('Failed to initialize application: ' + error.message);
            }
        }
    }

    /**
     * Initialize DOM element references
     */
    initializeDOMReferences() {
        this.barcodeInput = document.getElementById('barcodeInput');
        this.scanButton = document.getElementById('scanButton');
        this.lookupButton = document.getElementById('lookupButton');
        this.loadingSection = document.getElementById('loadingSection');
        this.errorSection = document.getElementById('errorSection');
        this.successSection = document.getElementById('successSection');

        // Result display elements
        this.errorMessage = document.getElementById('errorMessage');
        this.availableBalance = document.getElementById('availableBalance');
        this.monthlyBudget = document.getElementById('monthlyBudget');

        // Validate required elements
        const requiredElements = [
            'barcodeInput', 'scanButton', 'lookupButton',
            'loadingSection', 'errorSection', 'successSection'
        ];

        for (const elementName of requiredElements) {
            if (!this[elementName]) {
                throw new Error(`Required element not found: ${elementName}`);
            }
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Barcode input events
        this.barcodeInput.addEventListener('input', this.handleBarcodeInput.bind(this));
        this.barcodeInput.addEventListener('keypress', this.handleBarcodeKeypress.bind(this));
        this.barcodeInput.addEventListener('paste', this.handleBarcodePaste.bind(this));

        // Button events
        this.scanButton.addEventListener('click', this.handleScanButtonClick.bind(this));
        this.lookupButton.addEventListener('click', this.handleLookupButtonClick.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    /**
     * Handle barcode input changes
     */
    handleBarcodeInput(event) {
        const value = event.target.value;

        // Only allow digits
        const digitsOnly = value.replace(/\D/g, '');

        if (digitsOnly !== value) {
            this.barcodeInput.value = digitsOnly;
        }

        // Limit to 16 digits
        if (digitsOnly.length > 16) {
            this.barcodeInput.value = digitsOnly.substring(0, 16);
        }

        // Reset previous results when input changes
        if (this.currentBarcode !== this.barcodeInput.value) {
            this.resetResults();
        }

        // Auto-lookup when 16 digits are entered
        if (this.barcodeInput.value.length === 16) {
            setTimeout(() => this.performLookup(), 500);
        }
    }

    /**
     * Handle keypress events in barcode input
     */
    handleBarcodeKeypress(event) {
        // Allow Enter key to trigger lookup
        if (event.key === 'Enter') {
            event.preventDefault();
            this.performLookup();
        }
    }

    /**
     * Handle paste events in barcode input
     */
    handleBarcodePaste(event) {
        // Allow paste to proceed, then clean up the input
        setTimeout(() => {
            this.handleBarcodeInput({ target: this.barcodeInput });
        }, 0);
    }

    /**
     * Handle scan button click
     */
    async handleScanButtonClick() {
        try {
            await window.ScannerManager.openScannerModal((barcode, error) => {
                if (error) {
                    this.showError('Scanning failed: ' + error);
                } else if (barcode) {
                    this.barcodeInput.value = barcode;
                    this.performLookup();
                }
            });
        } catch (error) {
            this.showError('Failed to open scanner: ' + error.message);
        }
    }

    /**
     * Handle lookup button click
     */
    handleLookupButtonClick() {
        this.performLookup();
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S to scan
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.handleScanButtonClick();
        }

        // Escape to close modals
        if (event.key === 'Escape') {
            window.ScannerManager.closeScannerModal();
        }
    }

    /**
     * Perform card balance lookup
     */
    async performLookup() {
        const barcode = this.barcodeInput.value.trim();

        // Validate input
        if (!barcode) {
            this.showError('Please enter a barcode');
            this.barcodeInput.focus();
            return;
        }

        if (!window.AppConfig.isValidBarcode(barcode)) {
            this.showError('Please enter a valid 16-digit barcode');
            this.barcodeInput.focus();
            return;
        }

        // Prevent duplicate lookups
        if (this.isLookingUp) {
            return;
        }

        try {
            this.setLookupState(true);
            this.currentBarcode = barcode;

            window.AppConfig.debugLog('Starting lookup for barcode:', barcode);

            // Perform the lookup
            const result = await this.getCardBalance(barcode)

            window.AppConfig.debugLog('Lookup result:', result);

            // Handle result
            switch (result.status) {
                case 'success':
                    this.showSuccess(result.data);
                    break;
                case 'card_not_found':
                    this.showError('Card not found. Please check the barcode and try again.');
                    break;
                case 'error':
                    this.showError(result.message || 'An error occurred while checking the card');
                    break;
                default:
                    this.showError('Unexpected response from server');
            }

        } catch (error) {
            console.error('Lookup failed:', error);
            this.showError('Network error: ' + error.message);
        } finally {
            this.setLookupState(false);
        }
    }

    /**
     * Set the lookup state and update UI accordingly
     * @param {boolean} isLookingUp - Whether lookup is in progress
     */
    setLookupState(isLookingUp) {
        this.isLookingUp = isLookingUp;

        // Update button state
        this.lookupButton.disabled = isLookingUp;
        this.scanButton.disabled = isLookingUp;
        this.barcodeInput.disabled = isLookingUp;

        // Update button text
        const buttonText = this.lookupButton.querySelector('.button-text');
        const buttonIcon = this.lookupButton.querySelector('.button-icon');

        if (isLookingUp) {
            if (buttonText) buttonText.textContent = 'Checking...';
            if (buttonIcon) buttonIcon.textContent = 'hourglass_empty';
            this.showLoading();
        } else {
            if (buttonText) buttonText.textContent = 'Check Balance';
            if (buttonIcon) buttonIcon.textContent = 'search';
            this.hideLoading();
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllSections();
        this.loadingSection.classList.remove('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.loadingSection.classList.add('hidden');
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.hideAllSections();
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        this.errorSection.classList.remove('hidden');

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            if (!this.errorSection.classList.contains('hidden')) {
                this.resetUI();
            }
        }, 5000);
    }

    /**
     * Show success result
     * @param {Object} data - Balance data
     */
    showSuccess(data) {
        this.hideAllSections();

        // Update balance display
        if (this.availableBalance) {
            this.availableBalance.textContent = window.AppConfig.formatCurrency(data.availableMoneyMinor);
        }

        if (this.monthlyBudget) {
            this.monthlyBudget.textContent = window.AppConfig.formatCurrency(data.startingBudgetMinor);
        }

        this.successSection.classList.remove('hidden');

        window.AppConfig.debugLog('Success result displayed:', data);
    }

    /**
     * Hide all result sections
     */
    hideAllSections() {
        this.loadingSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
        this.successSection.classList.add('hidden');
    }

    /**
     * Reset results but keep the barcode input
     */
    resetResults() {
        this.hideAllSections();
        this.currentBarcode = null;
    }

    /**
     * Reset entire UI to initial state
     */
    resetUI() {
        this.hideAllSections();
        this.setLookupState(false);
        this.currentBarcode = null;
        // Don't clear the input - let user decide
    }

    /**
     * Clear the barcode input and reset results
     */
    clearBarcode() {
        this.barcodeInput.value = '';
        this.resetResults();
        this.barcodeInput.focus();
    }

    async getCardBalance(barcode) {

        const url = 'https://europe-west1-community-card-dev.cloudfunctions.net/getCardBalance';

        const response = await fetch(url, {
            method: 'POST', // Corresponds to -X POST
            headers: {
                'Content-Type': 'application/json' // Corresponds to -H "Content-Type: application/json"
            },
            body: JSON.stringify({data: {barcode: barcode}}) //'{"data":{"barcode":'+ barcode +'}}'
        });
        
        const res =  await response.json()
        return res.result 
    }
}


// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.AppConfig.debugLog('DOM loaded, initializing app...');

    const app = new CommunityCardApp();

    try {
        await app.initialize();
        window.AppConfig.debugLog('App ready!');

        // Focus on barcode input
        if (app.barcodeInput) {
            app.barcodeInput.focus();
        }

    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to initialize application. Please refresh the page and try again.');
    }

    // Make app globally available for debugging
    window.CommunityCardApp = app;
});