// ===================================
// Frontend Configuration
// Environment-aware API URLs
// ===================================

window.CONFIG = {
    // API Base URL
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://your-production-domain.com/api',
    
    // Socket.io URL
    SOCKET_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://your-production-domain.com',
    
    // App Settings
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_IMAGES_PER_PROPERTY: 10,
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    
    // Pagination
    PROPERTIES_PER_PAGE: 12,
    
    // Map settings (if using maps)
    MAP_API_KEY: '', // Add your map API key for production
    
    // Feature flags
    ENABLE_CHAT: true,
    ENABLE_NOTIFICATIONS: true
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CONFIG;
}
