/**
 * Configuration file for the Community Card Balance Checker web app
 * This file contains Firebase configurations for different environments
 */

const CONFIG = {
    // App settings
    SETTINGS: {
        // Barcode validation
        BARCODE_LENGTH: 16,
        BARCODE_PATTERN: /^[0-9]{16}$/,

        // UI settings
        CURRENCY: 'EUR',
        CURRENCY_SYMBOL: '€',

        // Scanner settings
        SCANNER_TIMEOUT: 30000, // 30 seconds

        // Debug mode (shows additional info)
        DEBUG: true
    }
};

/**
 * Get the current Firebase configuration
 * @returns {Object} Firebase config object
 */
function getCurrentFirebaseConfig() {
    const config = CONFIG.FIREBASE_CONFIGS[CONFIG.CURRENT_ENV];
    if (!config) {
        throw new Error(`No Firebase configuration found for environment: ${CONFIG.CURRENT_ENV}`);
    }
    return config;
}

/**
 * Get the current environment name
 * @returns {string} Environment display name
 */
function getCurrentEnvironmentName() {
    return CONFIG.ENV_NAMES[CONFIG.CURRENT_ENV] || 'Unknown';
}

/**
 * Check if barcode format is valid
 * @param {string} barcode - The barcode to validate
 * @returns {boolean} True if valid
 */
function isValidBarcode(barcode) {
    return CONFIG.SETTINGS.BARCODE_PATTERN.test(barcode);
}

/**
 * Format currency amount
 * @param {number} amountInCents - Amount in cents/minor currency unit
 * @returns {string} Formatted currency string
 */
function formatCurrency(amountInCents) {
    const amount = amountInCents / 100;
    return `${CONFIG.SETTINGS.CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}

/**
 * Log debug information (only in debug mode)
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
    if (CONFIG.SETTINGS.DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// Export for use in other modules
window.AppConfig = {
    getCurrentFirebaseConfig,
    getCurrentEnvironmentName,
    isValidBarcode,
    formatCurrency,
    debugLog,
    SETTINGS: CONFIG.SETTINGS,
    CURRENT_ENV: CONFIG.CURRENT_ENV
};