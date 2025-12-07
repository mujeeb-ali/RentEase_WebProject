// ===================================
// Authentication JavaScript
// ===================================

const API_URL = window.CONFIG?.API_URL || 'http://localhost:5000/api';
window.API_URL = API_URL; // Make it globally available

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save user data
                const userData = {
                    id: data.user._id,
                    name: data.user.fullName,
                    email: data.user.email,
                    role: data.user.role,
                    token: data.token
                };

                if (remember) {
                    localStorage.setItem('rentease_user', JSON.stringify(userData));
                } else {
                    sessionStorage.setItem('rentease_user', JSON.stringify(userData));
                }

                window.rentease.utils.showNotification('Login successful!', 'success');
                
                // Redirect to role-specific dashboard
                setTimeout(() => {
                    if (userData.role === 'tenant') {
                        window.location.href = 'buyer-dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1000);
            } else {
                window.rentease.utils.showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            window.rentease.utils.showNotification('Network error. Please try again.', 'error');
        }
    });
}

// Signup Form Handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;
        const terms = document.getElementById('terms').checked;

        // Validation
        if (password !== confirmPassword) {
            window.rentease.utils.showNotification('Passwords do not match', 'error');
            return;
        }

        if (!terms) {
            window.rentease.utils.showNotification('Please accept terms and conditions', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    phone,
                    password,
                    role
                })
            });

            const data = await response.json();

            console.log('Registration response:', data);

            if (response.ok) {
                // Save user data (auto-login after registration)
                const userData = {
                    id: data.user._id,
                    name: data.user.fullName,
                    email: data.user.email,
                    role: data.user.role,
                    token: data.token
                };

                localStorage.setItem('rentease_user', JSON.stringify(userData));

                window.rentease.utils.showNotification('Registration successful!', 'success');
                
                // Redirect to role-specific dashboard
                setTimeout(() => {
                    if (userData.role === 'tenant') {
                        window.location.href = 'buyer-dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1000);
            } else {
                // Show specific error message
                const errorMessage = data.message || 'Registration failed';
                
                if (errorMessage.toLowerCase().includes('already exists') || 
                    errorMessage.toLowerCase().includes('email')) {
                    window.rentease.utils.showNotification('This email is already registered. Please use a different email or login.', 'error');
                } else {
                    window.rentease.utils.showNotification(errorMessage, 'error');
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            window.rentease.utils.showNotification('Network error. Please try again.', 'error');
        }
    });
}

// Logout Handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Clear user data
        localStorage.removeItem('rentease_user');
        sessionStorage.removeItem('rentease_user');
        
        window.rentease.utils.showNotification('Logged out successfully', 'success');
        
        // Redirect to home
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 500);
    });
}
