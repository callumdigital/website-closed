// Example configuration file for VUW Transport Ticker
// Copy this file to config.js and add your actual API key

const config = {
    // Metlink API Configuration
    // Get your API key from: https://opendata.metlink.org.nz/
    METLINK_API_KEY: 'YOUR_ACTUAL_API_KEY_HERE',
    
    // Bus Stop IDs
    STOP_A: '4915',
    STOP_B: '5915',
    
    // API Endpoints
    METLINK_API_BASE: 'https://api.opendata.metlink.org.nz/v1',
    
    // Display Configuration
    REFRESH_INTERVAL: 60000, // 60 seconds
    INITIAL_REFRESH_DELAY: 15000, // 15 seconds
    TIMING_UPDATE_INTERVAL: 1000, // 1 second
    
    // Retry Configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 5000, // 5 seconds
    
    // Excluded Routes
    EXCLUDED_ROUTES: ['740', '739', '769']
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    // For browser environment
    window.VUW_CONFIG = config;
} 