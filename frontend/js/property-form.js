// ===================================
// Property Form JavaScript
// ===================================

// Check authentication
window.rentease.utils.requireAuth();

// Check if user is owner
const user = window.rentease.utils.getUser();
if (user && user.role !== 'owner') {
    window.rentease.utils.showNotification('Only property owners can add properties', 'error');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}

// Check if editing existing property
const urlParams = new URLSearchParams(window.location.search);
const editPropertyId = urlParams.get('edit');
let isEditMode = false;

// Load property for editing
if (editPropertyId) {
    isEditMode = true;
    document.querySelector('h1').textContent = 'Edit Property';
    document.querySelector('button[type="submit"]').textContent = 'Update Property';
    loadPropertyForEdit(editPropertyId);
}

async function loadPropertyForEdit(id) {
    try {
        const response = await fetch(`${API_URL}/properties/${id}`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load property');
        }
        
        const data = await response.json();
        const property = data.property;
        
        // Populate form fields
        document.getElementById('propertyTitle').value = property.title;
        document.getElementById('propertyType').value = property.type;
        document.getElementById('category').value = property.category;
        document.getElementById('price').value = property.price;
        document.getElementById('area').value = property.area;
        document.getElementById('bedrooms').value = property.bedrooms || 0;
        document.getElementById('bathrooms').value = property.bathrooms || 0;
        document.getElementById('parking').value = property.parking || 0;
        document.getElementById('description').value = property.description;
        document.getElementById('address').value = property.address;
        document.getElementById('city').value = property.city;
        document.getElementById('state').value = property.state;
        document.getElementById('zipcode').value = property.zipcode;
        
        // Check amenities
        if (property.amenities && property.amenities.length > 0) {
            property.amenities.forEach(amenity => {
                const checkbox = document.querySelector(`input[value="${amenity}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    } catch (error) {
        console.error('Error loading property:', error);
        window.rentease.utils.showNotification('Failed to load property', 'error');
    }
}

// Image Preview Handler
const imageInput = document.getElementById('images');
const imagePreview = document.getElementById('imagePreview');

if (imageInput) {
    imageInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        if (files.length > 10) {
            window.rentease.utils.showNotification('Maximum 10 images allowed', 'error');
            return;
        }
        
        imagePreview.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="preview-remove" onclick="removeImage(${index})">✕</button>
                `;
                imagePreview.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
    });
}

// Remove Image
window.removeImage = function(index) {
    const dt = new DataTransfer();
    const files = Array.from(imageInput.files);
    
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    
    imageInput.files = dt.files;
    imageInput.dispatchEvent(new Event('change'));
};

// Form Submit Handler
const propertyForm = document.getElementById('addPropertyForm');
if (propertyForm) {
    propertyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentUser = window.rentease.utils.getUser();
        
        // Double check role
        if (currentUser.role !== 'owner') {
            window.rentease.utils.showNotification('Only owners can add properties', 'error');
            return;
        }
        
        // Collect amenities
        const amenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'))
            .map(checkbox => checkbox.value);
        
        // Create property object
        const propertyData = {
            title: document.getElementById('propertyTitle').value,
            type: document.getElementById('propertyType').value,
            category: document.getElementById('category').value,
            price: Number(document.getElementById('price').value),
            area: Number(document.getElementById('area').value),
            bedrooms: Number(document.getElementById('bedrooms').value) || 0,
            bathrooms: Number(document.getElementById('bathrooms').value) || 0,
            parking: Number(document.getElementById('parking').value) || 0,
            description: document.getElementById('description').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipcode: document.getElementById('zipcode').value,
            amenities: amenities,
            images: [] // Placeholder for now
        };
        
        console.log(isEditMode ? 'Updating property:' : 'Creating property:', propertyData);
        
        try {
            const url = isEditMode 
                ? `${API_URL}/properties/${editPropertyId}` 
                : `${API_URL}/properties`;
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify(propertyData)
            });
            
            const data = await response.json();
            
            console.log('Property response:', { status: response.status, data });
            
            if (response.ok) {
                window.rentease.utils.showNotification(
                    isEditMode ? 'Property updated successfully!' : 'Property added successfully!', 
                    'success'
                );
                setTimeout(() => {
                    window.location.href = 'dashboard.html?refresh=' + Date.now();
                }, 1500);
            } else {
                console.error('Failed to save property:', data);
                window.rentease.utils.showNotification(data.message || 'Failed to save property', 'error');
            }
        } catch (error) {
            console.error('Error saving property:', error);
            window.rentease.utils.showNotification('Network error. Please try again.', 'error');
        }
    });
}
