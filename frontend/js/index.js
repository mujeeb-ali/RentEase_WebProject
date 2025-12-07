// ===================================
// Index Page JavaScript - Load Properties
// ===================================

console.log('>>> INDEX.JS STARTING <<<');
console.log('index.js loaded');

if (typeof API_URL === 'undefined') {
    var API_URL = window.CONFIG?.API_URL || 'http://localhost:5000/api';
}

console.log('API_URL:', API_URL);

window.allProperties = []; // Store all properties globally for search filtering

// Load featured properties on page load
console.log('>>> Setting up DOMContentLoaded listener <<<');
document.addEventListener('DOMContentLoaded', function() {
    console.log('>>> DOMContentLoaded FIRED - calling loadPropertiesFromAPI <<<');
    loadPropertiesFromAPI();
});

async function loadPropertiesFromAPI() {
    try {
        console.log('Fetching properties from:', `${API_URL}/properties`);
        const response = await fetch(`${API_URL}/properties`);  // Get all properties, not limited to 6
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.properties && data.properties.length > 0) {
            window.allProperties = data.properties; // Store ALL for search
            window.renderPropertyCards(data.properties.slice(0, 6)); // Show first 6
            console.log('Loaded properties:', window.allProperties.length);
        } else {
            console.log('No properties found in response');
            window.allProperties = [];
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        window.allProperties = [];
        // Keep the static property cards as fallback
    }
}

// Make renderPropertyCards available globally for search
window.renderPropertyCards = function(properties) {
    const propertyGrid = document.querySelector('.property-grid');
    
    if (!propertyGrid) {
        console.error('Property grid not found!');
        return;
    }
    
    console.log('Rendering properties:', properties.length);
    
    // Show all properties passed (not limited to 6 for search results)
    propertyGrid.innerHTML = properties.map(property => {
        const typeEmoji = {
            'house': '🏡',
            'apartment': '🏢',
            'villa': '🏘️',
            'commercial': '🏪',
            'land': '🌳'
        }[property.type] || '🏠';
        
        return `
            <div class="property-card" data-type="${property.type}" data-category="${property.category}">
                <div class="property-image">
                    <div class="property-type-emoji">${typeEmoji}</div>
                    <div class="property-badge ${property.category === 'rent' ? 'badge-rent' : 'badge-sale'}">${property.category.toUpperCase()}</div>
                </div>
                <div class="property-info">
                    <h3 class="property-title">${property.title}</h3>
                    <p class="property-location">📍 ${property.city}, ${property.state}</p>
                    <div class="property-features">
                        <span>🛏️ ${property.bedrooms || 0} Beds</span>
                        <span>🚿 ${property.bathrooms || 0} Baths</span>
                        <span>📐 ${property.area || 0} sqft</span>
                    </div>
                    <div class="property-footer">
                        <div class="property-price">${property.category === 'rent' ? '$' + property.price.toLocaleString() + '/month' : '$' + property.price.toLocaleString()}</div>
                        <a href="#" onclick="checkAuthAndRedirect('${property._id}'); return false;" class="btn btn-primary">View Details</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Authentication check for View Details
function checkAuthAndRedirect(propertyId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Not logged in - ask user to login or signup
        if (confirm('You need to login to view property details. Click OK to login, or Cancel to signup.')) {
            window.location.href = 'pages/login.html?redirect=property-detail.html?id=' + propertyId;
        } else {
            window.location.href = 'pages/signup.html?redirect=property-detail.html?id=' + propertyId;
        }
    } else {
        // Logged in - proceed to property details
        window.location.href = 'pages/property-detail.html?id=' + propertyId;
    }
}

// Make function globally available
window.checkAuthAndRedirect = checkAuthAndRedirect;
