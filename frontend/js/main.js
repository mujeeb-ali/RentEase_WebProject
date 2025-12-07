// ===================================
// Main JavaScript - Global Functions
// ===================================

// Utility Functions
const utils = {
    // Show notification
    showNotification: function(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#4ade80' : '#f87171'};
            color: #020B16;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Format currency
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate: function(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },

    // Get user from localStorage or sessionStorage
    getUser: function() {
        const user = localStorage.getItem('rentease_user') || sessionStorage.getItem('rentease_user');
        return user ? JSON.parse(user) : null;
    },

    // Save user to localStorage
    saveUser: function(user) {
        localStorage.setItem('rentease_user', JSON.stringify(user));
    },

    // Remove user from localStorage and sessionStorage
    removeUser: function() {
        localStorage.removeItem('rentease_user');
        sessionStorage.removeItem('rentease_user');
    },

    // Check if user is logged in
    isLoggedIn: function() {
        return this.getUser() !== null;
    },

    // Redirect to login if not authenticated
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            window.location.href = '../pages/login.html';
        }
    }
};

// Export utils for other scripts
window.rentease = { utils };

// Update navbar based on login status (works on all pages)
function updateNavbar() {
    const user = utils.getUser();
    const navLinks = document.getElementById('navLinks');
    
    if (!navLinks) return;
    
    // Determine if we're in the pages folder or root
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const homeLink = isInPagesFolder ? '../index.html' : 'index.html';
    const aboutLink = isInPagesFolder ? 'about.html' : 'pages/about.html';
    const contactLink = isInPagesFolder ? 'contact.html' : 'pages/contact.html';
    
    if (user) {
        // Logged in navbar - same across all pages
        const dashboardLink = isInPagesFolder 
            ? (user.role === 'owner' ? 'dashboard.html' : 'buyer-dashboard.html')
            : (user.role === 'owner' ? 'pages/dashboard.html' : 'pages/buyer-dashboard.html');
        const chatLink = isInPagesFolder ? 'chat.html' : 'pages/chat.html';
        
        navLinks.innerHTML = `
            <li><a href="${homeLink}">Home</a></li>
            <li><a href="${aboutLink}">About</a></li>
            <li><a href="${contactLink}">Contact</a></li>
            <li><a href="${dashboardLink}">Dashboard</a></li>
            <li><a href="${chatLink}">Messages</a></li>
            <li><a href="#" id="logoutBtn">Logout</a></li>
        `;
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                utils.removeUser();
                utils.showNotification('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = homeLink;
                }, 1000);
            });
        }
    }
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Update navbar based on login status
    updateNavbar();
    
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Animate menu toggle icon
            const spans = menuToggle.querySelectorAll('span');
            spans.forEach((span, index) => {
                if (navLinks.classList.contains('active')) {
                    if (index === 0) span.style.transform = 'rotate(45deg) translateY(10px)';
                    if (index === 1) span.style.opacity = '0';
                    if (index === 2) span.style.transform = 'rotate(-45deg) translateY(-10px)';
                } else {
                    span.style.transform = '';
                    span.style.opacity = '';
                }
            });
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navLinks && navLinks.classList.contains('active')) {
            if (!event.target.closest('.navbar')) {
                navLinks.classList.remove('active');
                const spans = menuToggle.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.transform = '';
                    span.style.opacity = '';
                });
            }
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Add fade-in animation to elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards and sections
    const animatedElements = document.querySelectorAll('.card, .section');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


