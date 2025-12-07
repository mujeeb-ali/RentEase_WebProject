// ===================================
// Property Detail JavaScript
// ===================================

const API_URL = window.CONFIG?.API_URL || 'https://rentease-backend-production.up.railway.app/api';

// Get property ID from URL
const urlParams = new URLSearchParams(window.location.search);
const propertyId = urlParams.get('id');

// Load Property Details
document.addEventListener('DOMContentLoaded', function() {
    if (propertyId) {
        loadPropertyDetails(propertyId);
    }
});

async function loadPropertyDetails(id) {
    try {
        const response = await fetch(`${API_URL}/properties/${id}`);
        const data = await response.json();
        
        if (response.ok) {
            renderPropertyDetails(data.property);
        } else {
            window.rentease.utils.showNotification('Property not found', 'error');
        }
    } catch (error) {
        console.error('Error loading property:', error);
        window.rentease.utils.showNotification('Failed to load property details', 'error');
    }
}

function renderPropertyDetails(property) {
    // Store property globally for access in event handlers
    window.currentProperty = property;
    
    // Update title and basic info
    document.querySelector('.property-title').textContent = property.title;
    document.querySelector('.property-price').textContent = `$${property.price.toLocaleString()}`;
    document.querySelector('.property-location').textContent = `📍 ${property.city}, ${property.state}`;
    
    // Update property type and category badges
    const propertyType = document.querySelector('.property-type');
    const propertyCategory = document.querySelector('.property-category');
    if (propertyType) propertyType.textContent = property.type;
    if (propertyCategory) propertyCategory.textContent = property.category;
    
    // Update features
    const features = document.querySelectorAll('.feature-item strong');
    if (features.length >= 4) {
        features[0].textContent = property.bedrooms || 'N/A';
        features[1].textContent = property.bathrooms || 'N/A';
        features[2].textContent = property.area ? `${property.area} sqft` : 'N/A';
        features[3].textContent = property.parking || 'N/A';
    }
    
    // Update description
    document.querySelector('.property-description').textContent = property.description;
    
    // Update location details
    const locationInfo = document.querySelector('.location-info');
    if (locationInfo) {
        locationInfo.innerHTML = `
            <p><strong>Address:</strong> ${property.address}</p>
            <p><strong>City:</strong> ${property.city}</p>
            <p><strong>State:</strong> ${property.state}</p>
            <p><strong>Zip Code:</strong> ${property.zipcode}</p>
        `;
    }
    
    // Display amenities if available
    const amenitiesContainer = document.querySelector('.amenities-list');
    if (amenitiesContainer && property.amenities && property.amenities.length > 0) {
        amenitiesContainer.innerHTML = property.amenities.map(amenity => {
            const amenityIcons = {
                'wifi': '📶',
                'parking': '🅿️',
                'gym': '🏋️',
                'pool': '🏊',
                'security': '🔒',
                'garden': '🌳',
                'elevator': '🛗',
                'balcony': '🏡',
                'ac': '❄️',
                'heating': '🔥'
            };
            const icon = amenityIcons[amenity.toLowerCase()] || '✓';
            return `<span class="amenity-badge">${icon} ${amenity}</span>`;
        }).join('');
    }
    
    // Update images if available
    const mainImage = document.querySelector('.property-main-image img');
    const thumbnailsContainer = document.querySelector('.property-thumbnails');
    
    if (property.images && property.images.length > 0) {
        if (mainImage) {
            mainImage.src = property.images[0];
            mainImage.alt = property.title;
        }
        
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = property.images.map((img, index) => `
                <img src="${img}" 
                     alt="Property ${index + 1}" 
                     class="thumbnail ${index === 0 ? 'active' : ''}"
                     onclick="updateMainImage('${img}', event)">
            `).join('');
        }
    }
}

// Update main image when thumbnail clicked
window.updateMainImage = function(imageSrc, event) {
    const mainImage = document.querySelector('.property-main-image img');
    if (mainImage) {
        mainImage.src = imageSrc;
    }
    
    // Update active thumbnail
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(t => t.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
};

// Schedule Tour Form
const scheduleForm = document.querySelector('.schedule-form');
if (scheduleForm) {
    scheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const date = document.getElementById('tourDate').value;
        const time = document.getElementById('tourTime').value;
        
        if (!date || !time) {
            window.rentease.utils.showNotification('Please select date and time', 'error');
            return;
        }
        
        window.rentease.utils.showNotification('Tour request sent successfully!', 'success');
        scheduleForm.reset();
    });
}

// Message Owner Button
const messageOwnerBtn = document.getElementById('messageOwnerBtn');
if (messageOwnerBtn) {
    messageOwnerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const ownerId = window.currentProperty?.owner?._id || window.currentProperty?.owner;
        const ownerName = window.currentProperty?.owner?.fullName || 'Property Owner';
        
        if (ownerId) {
            window.location.href = `chat.html?userId=${ownerId}&userName=${encodeURIComponent(ownerName)}`;
        } else {
            window.rentease.utils.showNotification('Owner information not available', 'error');
        }
    });
}

