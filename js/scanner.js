/**
 * Barcode Scanner functionality using QuaggaJS
 * Handles camera access, barcode detection, and scanner UI management
 */

class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.scannerInitialized = false;
        this.currentStream = null;
        this.flashEnabled = false;
        this.onScanResult = null;
        this.onScanError = null;
    }

    /**
     * Initialize the scanner with the given video element
     * @param {HTMLVideoElement} videoElement - Video element to display camera feed
     * @param {Function} onResult - Callback for successful scan
     * @param {Function} onError - Callback for errors
     */
    async initialize(videoElement, onResult, onError) {
        this.onScanResult = onResult;
        this.onScanError = onError;

        try {
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            // Configure QuaggaJS
            const config = {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: videoElement,
                    constraints: {
                        width: { min: 400, ideal: 800, max: 1920 },
                        height: { min: 300, ideal: 600, max: 1080 },
                        facingMode: "environment", // Use back camera on mobile
                        aspectRatio: { min: 1, max: 2 }
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: false
                },
                numOfWorkers: 2,
                frequency: 10,
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "codabar_reader",
                        "upc_reader",
                        "upc_e_reader",
                        "i2of5_reader"
                    ]
                },
                locate: true
            };

            // Initialize QuaggaJS
            return new Promise((resolve, reject) => {
                Quagga.init(config, (err) => {
                    if (err) {
                        console.error('QuaggaJS initialization failed:', err);
                        reject(new Error('Scanner initialization failed: ' + err.message));
                        return;
                    }

                    // Set up detection handler
                    Quagga.onDetected(this.handleDetection.bind(this));

                    // Start scanning
                    Quagga.start();
                    this.isScanning = true;
                    this.scannerInitialized = true;

                    window.AppConfig.debugLog('Scanner initialized successfully');
                    resolve();
                });
            });

        } catch (error) {
            console.error('Scanner initialization error:', error);
            this.onScanError?.('Scanner initialization failed: ' + error.message);
            throw error;
        }
    }

    /**
     * Handle barcode detection
     * @param {Object} result - QuaggaJS detection result
     */
    handleDetection(result) {
        if (!this.isScanning) {
            return;
        }

        const code = result.codeResult.code;
        window.AppConfig.debugLog('Barcode detected:', code);

        // Validate barcode format (16 digits)
        if (window.AppConfig.isValidBarcode(code)) {
            // Stop scanning to prevent multiple detections
            this.stop();
            this.onScanResult?.(code);
        } else {
            window.AppConfig.debugLog('Invalid barcode format detected:', code);
            // Continue scanning for valid barcodes
        }
    }

    /**
     * Stop the scanner and clean up resources
     */
    stop() {
        if (this.isScanning) {
            try {
                Quagga.stop();
                this.isScanning = false;
                window.AppConfig.debugLog('Scanner stopped');
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }

        // Clean up event listeners
        Quagga.offDetected();
        this.scannerInitialized = false;
    }

    /**
     * Toggle flashlight (if supported)
     */
    async toggleFlash() {
        try {
            const track = Quagga.CameraAccess.getActiveTrack();
            if (track && track.getCapabilities) {
                const capabilities = track.getCapabilities();
                if (capabilities.torch) {
                    this.flashEnabled = !this.flashEnabled;
                    await track.applyConstraints({
                        advanced: [{ torch: this.flashEnabled }]
                    });
                    return this.flashEnabled;
                }
            }
            throw new Error('Flash not supported on this device');
        } catch (error) {
            console.error('Flash toggle error:', error);
            throw error;
        }
    }

    /**
     * Check if flash is supported
     * @returns {boolean} True if flash is supported
     */
    isFlashSupported() {
        try {
            const track = Quagga.CameraAccess.getActiveTrack();
            if (track && track.getCapabilities) {
                const capabilities = track.getCapabilities();
                return capabilities.torch === true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get current flash state
     * @returns {boolean} True if flash is enabled
     */
    isFlashEnabled() {
        return this.flashEnabled;
    }

    /**
     * Check if scanner is currently active
     * @returns {boolean} True if scanning
     */
    isActive() {
        return this.isScanning;
    }
}

/**
 * Scanner Manager - Handles scanner modal and UI interactions
 */
class ScannerManager {
    constructor() {
        this.scanner = new BarcodeScanner();
        this.modal = null;
        this.video = null;
        this.flashButton = null;
        this.closeButton = null;
        this.onScanComplete = null;
        this.scanTimeout = null;
    }

    /**
     * Initialize scanner manager with DOM elements
     */
    initialize() {
        this.modal = document.getElementById('scannerModal');
        this.video = document.getElementById('scannerVideo');
        this.flashButton = document.getElementById('toggleFlashButton');
        this.closeButton = document.getElementById('closeScannerButton');

        // Set up event listeners
        if (this.flashButton) {
            this.flashButton.addEventListener('click', this.toggleFlash.bind(this));
        }

        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.closeScannerModal.bind(this));
        }

        // Close modal when clicking outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeScannerModal();
                }
            });
        }
    }

    /**
     * Open scanner modal and start scanning
     * @param {Function} onComplete - Callback when scan is complete
     */
    async openScannerModal(onComplete) {
        this.onScanComplete = onComplete;

        try {
            // Show modal
            this.modal.classList.remove('hidden');

            // Start scanner
            await this.scanner.initialize(
                this.video,
                this.handleScanResult.bind(this),
                this.handleScanError.bind(this)
            );

            // Update flash button state
            this.updateFlashButton();

            // Set timeout for automatic closure
            this.scanTimeout = setTimeout(() => {
                this.handleScanError('Scan timeout - please try again');
            }, window.AppConfig.SETTINGS.SCANNER_TIMEOUT);

            window.AppConfig.debugLog('Scanner modal opened');

        } catch (error) {
            console.error('Failed to open scanner:', error);
            this.handleScanError(error.message);
        }
    }

    /**
     * Close scanner modal and cleanup
     */
    closeScannerModal() {
        // Hide modal
        if (this.modal) {
            this.modal.classList.add('hidden');
        }

        // Stop scanner
        this.scanner.stop();

        // Clear timeout
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }

        window.AppConfig.debugLog('Scanner modal closed');
    }

    /**
     * Handle successful scan result
     * @param {string} barcode - Detected barcode
     */
    handleScanResult(barcode) {
        window.AppConfig.debugLog('Scan successful:', barcode);
        this.closeScannerModal();
        this.onScanComplete?.(barcode, null);
    }

    /**
     * Handle scan error
     * @param {string} error - Error message
     */
    handleScanError(error) {
        console.error('Scan error:', error);
        this.closeScannerModal();
        this.onScanComplete?.(null, error);
    }

    /**
     * Toggle flash and update UI
     */
    async toggleFlash() {
        try {
            const flashEnabled = await this.scanner.toggleFlash();
            this.updateFlashButton(flashEnabled);
        } catch (error) {
            console.error('Flash toggle failed:', error);
        }
    }

    /**
     * Update flash button appearance
     * @param {boolean} enabled - Flash state
     */
    updateFlashButton(enabled = null) {
        if (!this.flashButton) return;

        const isEnabled = enabled !== null ? enabled : this.scanner.isFlashEnabled();
        const icon = this.flashButton.querySelector('.material-icons');
        const text = this.flashButton.querySelector('span:last-child');

        if (icon) {
            icon.textContent = isEnabled ? 'flash_on' : 'flash_off';
        }

        if (text) {
            text.textContent = isEnabled ? 'Flash On' : 'Flash Off';
        }

        // Update button style
        if (isEnabled) {
            this.flashButton.style.background = '#667eea';
            this.flashButton.style.color = 'white';
        } else {
            this.flashButton.style.background = '#f8f9fa';
            this.flashButton.style.color = '#333';
        }
    }
}

// Create and export singleton instance
window.ScannerManager = new ScannerManager();