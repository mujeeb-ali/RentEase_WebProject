// ===================================
// Dashboard JavaScript
// ===================================

// Check authentication
window.rentease.utils.requireAuth();

// Load user data
document.addEventListener('DOMContentLoaded', function() {
    const user = window.rentease.utils.getUser();
    
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Dashboard user data:', user);
    console.log('User ID:', user?.id);
    console.log('User Role:', user?.role);
    console.log('Token present:', !!user?.token);
    
    if (user) {
        // Redirect to role-specific dashboard ONLY if on wrong page
        const currentPage = window.location.pathname;
        const isOnBuyerDashboard = currentPage.includes('buyer-dashboard');
        const isOnOwnerDashboard = currentPage.includes('dashboard.html') && !isOnBuyerDashboard;
        
        // Only redirect if user is on the wrong dashboard
        if (user.role === 'tenant' && isOnOwnerDashboard) {
            window.location.replace('buyer-dashboard.html');
            return;
        } else if (user.role === 'owner' && isOnBuyerDashboard) {
            window.location.replace('dashboard.html');
            return;
        }
        
        // Update UI with user data
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        
        if (userNameEl) userNameEl.textContent = user.name;
        if (userRoleEl) {
            const displayRole = user.role === 'tenant' ? 'Buyer/Tenant' : user.role.charAt(0).toUpperCase() + user.role.slice(1);
            userRoleEl.textContent = displayRole;
            console.log('Display role:', displayRole);
        }
        
        // Show/Hide elements based on role
        handleRoleBasedUI(user.role);
        
        // Load properties
        loadProperties();
    }
});

// Handle Role-Based UI
function handleRoleBasedUI(role) {
    const addPropertyBtn = document.querySelector('.dashboard-header .btn-primary');
    const addPropertyNavLink = document.querySelector('a[href="add-property.html"]');
    const dashboardCard = document.querySelector('.dashboard-card');
    
    if (role === 'tenant') {
        // Hide "Add Property" button and nav link for tenants
        if (addPropertyBtn) addPropertyBtn.style.display = 'none';
        if (addPropertyNavLink) addPropertyNavLink.parentElement.style.display = 'none';
        
        // Update table header for tenants
        if (dashboardCard) {
            const cardHeader = dashboardCard.querySelector('.card-header h2');
            if (cardHeader) cardHeader.textContent = 'Interested Properties';
        }
    }
}

// Load Properties
async function loadProperties() {
    const user = window.rentease.utils.getUser();
    
    console.log('Loading properties for user:', { id: user.id, role: user.role });
    
    try {
        let response;
        
        if (user.role === 'owner') {
            // Load owner's properties
            const url = `${API_URL}/properties/user/${user.id}`;
            console.log('Fetching owner properties from:', url);
            response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
        } else {
            // Load all properties for tenants/buyers
            console.log('Fetching all properties for tenant/buyer');
            response = await fetch(`${API_URL}/properties`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
        }
        
        const data = await response.json();
        
        console.log('API Response:', { status: response.status, data });
        console.log('Properties loaded:', data.properties?.length || 0);
        
        if (response.ok && data.properties) {
            allProperties = data.properties; // Store globally for filtering
            updateStats(data.properties);
            renderPropertiesTable(data.properties, user.role);
        } else {
            console.error('Failed to load properties:', data);
            window.rentease.utils.showNotification('Failed to load properties', 'error');
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        window.rentease.utils.showNotification('Error loading properties', 'error');
    }
}

// Update Stats
function updateStats(properties) {
    const totalProperties = properties.length;
    const totalViews = properties.reduce((sum, prop) => sum + (prop.views || 0), 0);
    const totalMessages = properties.reduce((sum, prop) => sum + (prop.messages || 0), 0);
    
    // Update common stats
    if (document.getElementById('totalProperties')) {
        document.getElementById('totalProperties').textContent = totalProperties;
    }
    if (document.getElementById('totalViews')) {
        document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    }
    if (document.getElementById('totalMessages')) {
        document.getElementById('totalMessages').textContent = totalMessages;
    }
    
    // Update buyer-specific stats (set to 0 for now)
    if (document.getElementById('totalFavorites')) {
        document.getElementById('totalFavorites').textContent = '0';
    }
    if (document.getElementById('totalTours')) {
        document.getElementById('totalTours').textContent = '0';
    }
}

// Render Properties Table
function renderPropertiesTable(properties, role) {
    const tbody = document.getElementById('propertiesTableBody');
    
    if (properties.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #546e7a;">No properties found</td></tr>';
        return;
    }
    
    tbody.innerHTML = properties.map(prop => {
        const actions = role === 'owner' 
            ? `<button class="action-btn btn-view" title="View" onclick="viewProperty('${prop._id}')">👁️</button>
               <button class="action-btn btn-edit" title="Edit" onclick="editProperty('${prop._id}')">✏️</button>
               <button class="action-btn btn-delete" title="Delete" onclick="deleteProperty('${prop._id}')">🗑️</button>`
            : `<button class="action-btn btn-view" title="View" onclick="viewProperty('${prop._id}')">👁️</button>
               <button class="action-btn btn-primary" title="Contact Owner" onclick="contactOwner('${prop.owner?._id || prop.owner}')">💬</button>`;
        
        return `
            <tr>
                <td>
                    <div class="property-cell">
                        <span class="property-emoji">${getPropertyEmoji(prop.type)}</span>
                        <div>
                            <strong>${prop.title}</strong>
                            <p class="text-muted">${prop.city || 'Location'}</p>
                        </div>
                    </div>
                </td>
                <td>${prop.type}</td>
                <td><span class="badge badge-${prop.category}">${prop.category}</span></td>
                <td>$${prop.price.toLocaleString()}</td>
                <td>${prop.city || prop.location || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        ${actions}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get Property Emoji
function getPropertyEmoji(type) {
    const emojis = {
        'house': '🏡',
        'apartment': '🏢',
        'villa': '🏘️',
        'commercial': '🏪',
        'land': '🌳'
    };
    return emojis[type] || '🏠';
}

// Filter Properties
let allProperties = []; // Store all properties globally

const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        
        // Filter properties based on category
        if (filter === 'all') {
            renderPropertiesTable(allProperties, window.rentease.utils.getUser().role);
        } else {
            const filtered = allProperties.filter(prop => prop.category.toLowerCase() === filter.toLowerCase());
            renderPropertiesTable(filtered, window.rentease.utils.getUser().role);
        }
    });
});

// Property Actions
window.viewProperty = function(id) {
    window.location.href = `property-detail.html?id=${id}`;
};

window.editProperty = function(id) {
    window.location.href = `add-property.html?edit=${id}`;
};

window.deleteProperty = async function(id) {
    if (!confirm('Are you sure you want to delete this property?')) {
        return;
    }
    
    const user = window.rentease.utils.getUser();
    
    try {
        const response = await fetch(`${API_URL}/properties/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (response.ok) {
            window.rentease.utils.showNotification('Property deleted successfully', 'success');
            loadProperties();
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        window.rentease.utils.showNotification('Failed to delete property', 'error');
    }
};

window.contactOwner = function(ownerId) {
    if (ownerId) {
        window.location.href = `chat.html?userId=${ownerId}&userName=Property Owner`;
    } else {
        window.rentease.utils.showNotification('Owner information not available', 'error');
    }
};
