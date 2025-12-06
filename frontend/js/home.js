// ===================================
// Home Page JavaScript
// ===================================

// Hero Image Slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    
    if (slides.length === 0) {
        console.warn('No hero slides found');
        return;
    }
    
    let currentSlide = 0;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    // Change slide every 5 seconds
    setInterval(nextSlide, 5000);
}

// Animated Counter for Stats
function animateCounter(element) {
    const targetAttr = element.getAttribute('data-target');
    if (!targetAttr) {
        console.warn('No data-target attribute found', element);
        return;
    }
    
    const target = parseInt(targetAttr);
    console.log('Animating counter to:', target);
    
    // Special handling for $0 display
    if (target === 0 && element.textContent.includes('$')) {
        element.textContent = '$0';
        return;
    }
    
    if (target === 0) {
        element.textContent = '0';
        return;
    }
    
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Animate counters when stats section is visible
                if (entry.target.classList.contains('stats-section')) {
                    console.log('Stats section is now visible, starting animation');
                    const counters = entry.target.querySelectorAll('.stat-number');
                    console.log('Found counters:', counters.length);
                    counters.forEach(counter => {
                        if (!counter.classList.contains('animated')) {
                            counter.classList.add('animated');
                            console.log('Animating counter:', counter);
                            animateCounter(counter);
                        }
                    });
                    // Stop observing after animation starts
                    observer.unobserve(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    
    // Observe stats section
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
        console.log('Stats section observer initialized');
    } else {
        console.warn('Stats section not found');
    }
}

// Back to Top Button
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Newsletter Form
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        
        // Show success message
        alert(`Thank you for subscribing! We'll send updates to ${email}`);
        form.reset();
    });
}

// Load Featured Properties
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initHeroSlider();
    initScrollAnimations();
    initBackToTop();
    initNewsletterForm();
    loadFeaturedProperties();
    
    // Trigger animation immediately if stats are already in view
    setTimeout(() => {
        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            const rect = statsSection.getBoundingClientRect();
            const isVisible = (rect.top < window.innerHeight && rect.bottom >= 0);
            if (isVisible) {
                console.log('Stats section already visible, triggering animation');
                const counters = statsSection.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    if (!counter.classList.contains('animated')) {
                        counter.classList.add('animated');
                        animateCounter(counter);
                    }
                });
            }
        }
    }, 500);
});

async function loadFeaturedProperties() {
    try {
        const response = await fetch(`${API_URL}/properties?limit=3`);
        const data = await response.json();
        
        if (response.ok && data.properties && data.properties.length > 0) {
            renderFeaturedProperties(data.properties);
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        // Keep default properties if API fails
    }
}

function renderFeaturedProperties(properties) {
    const propertiesGrid = document.getElementById('propertiesGrid');
    
    if (!propertiesGrid) {
        console.warn('Properties grid element not found');
        return;
    }
    
    propertiesGrid.innerHTML = properties.map(property => {
        const typeEmojis = {
            'house': '🏡',
            'apartment': '🏢',
            'villa': '🏘️',
            'commercial': '🏪',
            'land': '🌳'
        };
        
        return `
            <div class="property-card">
                <div class="property-badge">${property.category || 'For Sale'}</div>
                <div class="property-image">
                    <span class="property-icon">${typeEmojis[property.type] || '🏠'}</span>
                </div>
                <div class="property-info">
                    <h3>${property.title}</h3>
                    <p class="property-location">📍 ${property.city}, ${property.state}</p>
                    <p class="property-description">${property.description ? property.description.substring(0, 100) + '...' : ''}</p>
                    <div class="property-features">
                        <span>🛏️ ${property.bedrooms || 0} Beds</span>
                        <span>🚿 ${property.bathrooms || 0} Baths</span>
                        <span>📐 ${property.area || 0} sqft</span>
                    </div>
                    <div class="property-footer">
                        <span class="property-price">$${property.price.toLocaleString()}</span>
                        <a href="pages/property-detail.html?id=${property._id}" class="btn btn-primary">View Details</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Search Form Handler
const searchForm = document.querySelector('.search-form');
console.log('Search form found:', searchForm);
if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Search form submitted');
        
        const location = document.getElementById('searchLocation')?.value.toLowerCase().trim() || '';
        const propertyType = document.getElementById('searchType')?.value || '';
        const category = document.getElementById('searchCategory')?.value || '';
        
        console.log('Search params:', { location, propertyType, category });
        console.log('All properties:', window.allProperties);
        
        // Check if properties are loaded
        if (!window.allProperties) {
            // Properties not loaded yet, wait and retry
            setTimeout(() => {
                if (!window.allProperties || window.allProperties.length === 0) {
                    const propertyGrid = document.querySelector('.property-grid');
                    if (propertyGrid) {
                        propertyGrid.innerHTML = `
                            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: rgba(233, 69, 96, 0.1); border-radius: 12px; border: 2px dashed #e94560;">
                                <h3 style="color: #e94560; margin-bottom: 1rem;">No Properties Available</h3>
                                <p style="color: #546e7a;">There are currently no properties in the database. Please add some properties first.</p>
                            </div>
                        `;
                    }
                } else {
                    // Retry search
                    searchForm.dispatchEvent(new Event('submit'));
                }
            }, 1000);
            return;
        }
        
        if (window.allProperties.length === 0) {
            const propertyGrid = document.querySelector('.property-grid');
            if (propertyGrid) {
                propertyGrid.innerHTML = `
                    <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: rgba(233, 69, 96, 0.1); border-radius: 12px; border: 2px dashed #e94560;">
                        <h3 style="color: #e94560; margin-bottom: 1rem;">No Properties Available</h3>
                        <p style="color: #546e7a;">There are currently no properties in the database.</p>
                    </div>
                `;
            }
            return;
        }
        
        // Filter properties based on search criteria
        const filteredProperties = window.allProperties.filter(property => {
            const matchesLocation = !location || 
                property.city?.toLowerCase().includes(location) || 
                property.state?.toLowerCase().includes(location) ||
                property.title?.toLowerCase().includes(location);
            
            const matchesType = !propertyType || property.type === propertyType;
            const matchesCategory = !category || property.category === category;
            
            return matchesLocation && matchesType && matchesCategory;
        });
        
        // Re-render property cards with filtered results
        const propertyGrid = document.querySelector('.property-grid');
        if (propertyGrid) {
            if (filteredProperties.length === 0) {
                propertyGrid.innerHTML = `
                    <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: rgba(233, 69, 96, 0.1); border-radius: 12px; border: 2px dashed #e94560;">
                        <h3 style="color: #e94560; margin-bottom: 1rem;">No Properties Found</h3>
                        <p style="color: #546e7a;">No properties match your search criteria. Try different filters.</p>
                    </div>
                `;
            } else {
                // Use the renderPropertyCards function from index.js
                window.renderPropertyCards(filteredProperties);
            }
            
            // Scroll to results
            document.querySelector('.featured-properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}
