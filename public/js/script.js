// SkinSense Main JavaScript File

// Global variables
let isLoading = false;
let csrfToken = '';

// Initialize CSRF token
function initializeCSRF() {
    const token = document.querySelector('meta[name="csrf-token"]');
    if (token) {
        csrfToken = token.getAttribute('content');
        // Set default header for axios
        if (typeof axios !== 'undefined') {
            axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
        }
    }
}

// Loading utilities
function showLoading() {
    isLoading = true;
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

function hideLoading() {
    isLoading = false;
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        setTimeout(() => {
            spinner.style.display = 'none';
        }, 300);
    }
}

// Flash message utilities
function showFlashMessage(type, message, duration = 5000) {
    const container = document.getElementById('flash-messages');
    if (!container) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.appendChild(alertDiv);

    // Auto dismiss after duration
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, duration);
}

function showSuccessMessage(message) {
    showFlashMessage('success', message);
}

function showErrorMessage(message) {
    showFlashMessage('danger', message);
}

function showWarningMessage(message) {
    showFlashMessage('warning', message);
}

function showInfoMessage(message) {
    showFlashMessage('info', message);
}

// API utilities
async function makeRequest(url, options = {}) {
    showLoading();
    
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                ...options.headers
            },
            ...options
        };

        const response = await axios(url, config);
        
        // Show success message if provided
        if (response.data.message && !options.silent) {
            showSuccessMessage(response.data.message);
        }
        
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        
        let errorMessage = 'An error occurred. Please try again.';
        
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
            errorMessage = error.response.data.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (!options.silent) {
            showErrorMessage(errorMessage);
        }
        
        throw error;
    } finally {
        hideLoading();
    }
}

// Authentication utilities
async function logout() {
    try {
        await makeRequest('/api/auth/logout', { method: 'GET' });
        window.location.href = '/login';
    } catch (error) {
        // Force logout even if request fails
        window.location.href = '/login';
    }
}

function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
}

// Form utilities
function serializeForm(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Newsletter subscription
async function subscribeNewsletter(email, name = '') {
    try {
        await makeRequest('/newsletter', {
            method: 'POST',
            data: { email, name }
        });
        
        // Reset form
        const form = document.getElementById('newsletter-form');
        if (form) {
            form.reset();
        }
    } catch (error) {
        console.error('Newsletter subscription failed:', error);
    }
}

// Contact form submission
async function submitContactForm(formData) {
    try {
        await makeRequest('/contact', {
            method: 'POST',
            data: formData
        });
        
        // Reset form
        const form = document.getElementById('contact-form');
        if (form) {
            form.reset();
        }
    } catch (error) {
        console.error('Contact form submission failed:', error);
    }
}

// Cookie consent
function initializeCookieConsent() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookieConsent');
    if (!hasConsented) {
        banner.style.display = 'block';
    }
    
    // Accept cookies
    document.getElementById('accept-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.style.display = 'none';
        
        // Initialize analytics or other tracking
        initializeTracking();
    });
    
    // Decline cookies
    document.getElementById('decline-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        banner.style.display = 'none';
    });
}

function initializeTracking() {
    // Initialize Google Analytics or other tracking if consent given
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'ad_storage': 'granted',
            'analytics_storage': 'granted'
        });
    }
}

// Back to top button
function initializeBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Image lazy loading
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Form validation
function initializeFormValidation() {
    // Add real-time validation to all forms
    document.querySelectorAll('form').forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    validateField(input);
                }
            });
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required.';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number.';
        }
    }
    
    // Password validation
    if (field.type === 'password' && value) {
        if (value.length < 6) {
            isValid = false;
            errorMessage = 'Password must be at least 6 characters long.';
        }
    }
    
    // Update field appearance
    if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
    }
    
    // Show/hide error message
    let feedback = field.parentNode.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.appendChild(feedback);
    }
    feedback.textContent = errorMessage;
    
    return isValid;
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Tooltip initialization
function initializeTooltips() {
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Date and time utilities
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Service worker registration (for PWA support)
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Don't show error messages for script loading errors in production
    if (event.filename && event.filename.includes('http')) {
        return;
    }
    
    showErrorMessage('An unexpected error occurred. Please refresh the page and try again.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Page visibility API
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
    }
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('SkinSense application initialized');
    
    // Initialize core functionality
    initializeCSRF();
    initializeCookieConsent();
    initializeBackToTop();
    initializeLazyLoading();
    initializeFormValidation();
    initializeSmoothScrolling();
    initializeTooltips();
    
    // Register service worker for PWA
    registerServiceWorker();
    
    // Hide loading spinner
    hideLoading();
    
    // Newsletter form handler
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = newsletterForm.email.value;
            await subscribeNewsletter(email);
        });
    }
    
    // Contact form handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateForm(contactForm)) {
                const formData = serializeForm(contactForm);
                await submitContactForm(formData);
            }
        });
    }
    
    // Initialize animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.service-card, .feature-card, .testimonial-card, .popular-service-card').forEach(el => {
        observer.observe(el);
    });
    
    // Handle responsive navigation
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbarCollapse.contains(e.target) && !navbarToggler.contains(e.target)) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        });
        
        // Close mobile menu when clicking on nav links
        navbarCollapse.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            });
        });
    }
    
    // Add hover effects to cards
    document.querySelectorAll('.card, .service-card, .feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Auto-dismiss alerts after 5 seconds
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
});

// Export functions for use in other scripts
window.SkinSense = {
    showLoading,
    hideLoading,
    showSuccessMessage,
    showErrorMessage,
    showWarningMessage,
    showInfoMessage,
    makeRequest,
    logout,
    validateForm,
    serializeForm,
    formatDate,
    formatTime,
    formatCurrency
};
