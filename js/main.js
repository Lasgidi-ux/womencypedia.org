/**
 * WOMENCYPEDIA - Main JavaScript
 * Enterprise-grade Editorial Knowledge Platform
 */

/**
 * Global logout handler — used by all pages via onclick="handleLogout()"
 * Replaces previous inline onclick handlers for security (CSP compliance)
 */
function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        // Use Auth module if available
        if (typeof Auth !== 'undefined' && Auth.logout) {
            Auth.logout().then(() => {
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('You have been signed out successfully', 'success');
                }
                setTimeout(() => { window.location.href = 'index.html'; }, 500);
            }).catch(() => {
                // Fallback: clear storage manually
                localStorage.removeItem('womencypedia_access_token');
                localStorage.removeItem('womencypedia_refresh_token');
                localStorage.removeItem('womencypedia_user');
                window.location.href = 'index.html';
            });
        } else {
            // No Auth module — manual cleanup
            localStorage.removeItem('womencypedia_access_token');
            localStorage.removeItem('womencypedia_refresh_token');
            localStorage.removeItem('womencypedia_user');
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initNavigation();
    initSearch();
    initScrollBehavior();
    initMobileMenu();
    initAccessibility();
});

/**
 * Navigation Scroll Behavior
 * Navbar hides on scroll down, reappears on scroll up
 */
function initScrollBehavior() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollTop = 0;
    const scrollThreshold = 10;

    window.addEventListener('scroll', function () {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (Math.abs(currentScrollTop - lastScrollTop) < scrollThreshold) {
            return;
        }

        if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
            // Scrolling down & past navbar
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    }, { passive: true });
}

/**
 * Navigation Active State
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('.navbar__nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('.html', ''))) {
            link.classList.add('active');
        }
    });
}

/**
 * Search Functionality
 */
function initSearch() {
    const searchBtn = document.querySelector('.navbar__search-btn');
    const searchSheet = document.querySelector('.search-sheet');
    const searchClose = document.querySelector('.search-sheet__close');
    const searchInput = document.querySelector('.search-sheet__input');

    if (!searchBtn || !searchSheet) return;

    // Open search sheet
    searchBtn.addEventListener('click', function (e) {
        e.preventDefault();
        searchSheet.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus search input after animation
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 300);
    });

    // Close search sheet
    if (searchClose) {
        searchClose.addEventListener('click', function () {
            closeSearchSheet();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && searchSheet.classList.contains('active')) {
            closeSearchSheet();
        }
    });

    function closeSearchSheet() {
        searchSheet.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Search form submission
    const searchForm = document.querySelector('.search-sheet__form');
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const query = searchInput?.value.trim();
            if (query) {
                window.location.href = 'browse.html?search=' + encodeURIComponent(query);
            }
        });
    }

    // Also handle Enter key on any search input across the site
    document.querySelectorAll('input[type="search"]').forEach(input => {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim();
                if (query) {
                    window.location.href = 'browse.html?search=' + encodeURIComponent(query);
                }
            }
        });
    });
}

/**
 * Mobile Bottom Sheet Menu with Accordion Categories
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.navbar__menu-btn');
    const mobileMenu = document.querySelector('#mobileMenu');
    const menuOverlay = document.querySelector('#menuOverlay');

    if (!menuBtn || !mobileMenu) return;

    // Open menu
    menuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openMenu();
    });

    // Close on overlay click
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function () {
            closeMenu();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Handle swipe to close
    let touchStartY = 0;
    let touchEndY = 0;

    mobileMenu.addEventListener('touchstart', function (e) {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    mobileMenu.addEventListener('touchend', function (e) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeDistance = touchEndY - touchStartY;
        if (swipeDistance > 100) {
            closeMenu();
        }
    }

    function openMenu() {
        mobileMenu.classList.add('active');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first menu item
        const firstLink = mobileMenu.querySelector('a');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 300);
        }
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Accordion functionality for mobile categories
    initMobileAccordion();
}

/**
 * Mobile Accordion Categories
 */
function initMobileAccordion() {
    const mobileMenu = document.querySelector('#mobileMenu');
    if (!mobileMenu) return;

    // Add click handlers to section headers
    const sectionHeaders = mobileMenu.querySelectorAll('h3');

    sectionHeaders.forEach((header, index) => {
        // Create clickable wrapper for section
        const section = header.parentElement;
        section.style.cursor = 'pointer';

        // Add expand icon to header
        header.innerHTML = `${header.textContent} <span class="material-symbols-outlined accordion-icon" style="float:right;font-size:18px;transition:transform 0.3s ease;">expand_more</span>`;

        // Initially collapse all sections except first
        if (index > 0) {
            const links = section.querySelectorAll('a');
            links.forEach(link => {
                link.style.display = 'none';
            });
        }

        header.addEventListener('click', function (e) {
            e.preventDefault();
            toggleSection(section, header);
        });

        // Also make section container clickable
        section.addEventListener('click', function (e) {
            if (e.target === header || header.contains(e.target)) return;
            const links = section.querySelectorAll('a');
            if (links.length > 0 && links[0].style.display === 'none') {
                toggleSection(section, header);
            }
        });
    });
}

function toggleSection(section, header) {
    const links = section.querySelectorAll('a');
    const icon = header.querySelector('.accordion-icon');
    const isExpanded = links.length > 0 && links[0].style.display !== 'none';

    links.forEach(link => {
        link.style.display = isExpanded ? 'none' : 'block';
        link.style.opacity = '0';
        link.style.transition = 'opacity 0.2s ease';
        setTimeout(() => {
            link.style.opacity = '1';
        }, 50);
    });

    if (icon) {
        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}

/**
 * Accessibility Enhancements
 */
function initAccessibility() {
    // Skip to main content
    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('main');

    if (skipLink && mainContent) {
        skipLink.addEventListener('click', function (e) {
            e.preventDefault();
            mainContent.focus();
            mainContent.scrollIntoView();
        });
    }

    // Add keyboard navigation for interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, textarea, select');

    interactiveElements.forEach(element => {
        // Ensure visible focus states
        element.addEventListener('focus', function () {
            this.classList.add('focus-visible');
        });

        element.addEventListener('blur', function () {
            this.classList.remove('focus-visible');
        });
    });

    // Handle reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty('--transition-duration', '0s');
    }
}

/**
 * Form Validation Helper
 */
function validateForm(formElement) {
    const requiredFields = formElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');

            // Show error message
            let errorMsg = field.parentElement.querySelector('.error-message');
            if (!errorMsg) {
                errorMsg = document.createElement('span');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'This field is required';
                field.parentElement.appendChild(errorMsg);
            }
        } else {
            field.classList.remove('error');
            const errorMsg = field.parentElement.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        }
    });

    // Email validation
    const emailFields = formElement.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            isValid = false;
            field.classList.add('error');
        }
    });

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Smooth scroll for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

/**
 * Global Error Handler for Uncaught Promise Rejections
 * Catches unhandled API errors and shows user-friendly notifications
 */
window.addEventListener('unhandledrejection', function (event) {
    // Prevent default browser error logging
    event.preventDefault();

    // Log error for debugging
    console.error('Unhandled Promise Rejection:', event.reason);

    // Show user-friendly notification
    const errorMessage = event.reason?.message || event.reason || 'An unexpected error occurred';

    // Only show toast if UI is available and loaded
    if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Something went wrong. Please try again.', 'error');
    } else {
        // Fallback: log to console if UI not available
        console.warn('UI not available for toast notification');
    }
});

/**
 * Global Error Handler for Uncaught Errors
 */
window.addEventListener('error', function (event) {
    // Log error for debugging
    console.error('Global Error:', event.error);

    // Don't prevent default - let the error propagate for debugging
    // But we can show a notification for unexpected errors
    if (event.error && typeof event.error.message !== 'undefined') {
        // Only notify for non-critical errors
        if (typeof UI !== 'undefined' && UI.showToast) {
            // Only show if not a resource loading error (images, scripts, etc.)
            if (event.target.tagName !== 'IMG' && event.target.tagName !== 'SCRIPT' && event.target.tagName !== 'LINK') {
                UI.showToast('An error occurred. Please refresh the page.', 'error');
            }
        }
    }
});

/**
 * Lazy loading for images
 */
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Animation on scroll
 */
if ('IntersectionObserver' in window) {
    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        animateObserver.observe(el);
    });
}

// Export functions for external use if needed
window.WomencypediaApp = {
    validateForm,
    isValidEmail
};

// NOTE: toggleMenu and toggleSearch are defined in navigation.js
// Do NOT redefine them here to avoid conflicts.

/**
 * Wire up desktop Sign In / Sign Out buttons
 * Sign In buttons redirect to login page.
 * Sign Out buttons call Auth.logout().
 */
document.addEventListener('DOMContentLoaded', function () {
    // Sign In buttons
    document.querySelectorAll('[data-auth="signin"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'login.html';
        });
    });

    // Sign Out buttons (inside [data-auth="signout"] containers)
    document.querySelectorAll('[data-auth="signout"] button').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
                Auth.logout().then(() => {
                    window.location.href = 'index.html';
                });
            } else {
                // Fallback: clear storage and redirect
                localStorage.removeItem('womencypedia_access_token');
                localStorage.removeItem('womencypedia_refresh_token');
                localStorage.removeItem('womencypedia_user');
                window.location.href = 'index.html';
            }
        });
    });

    // Update auth UI state on load
    updateDesktopAuthUI();
});

/**
 * Update desktop auth UI based on current login state
 */
function updateDesktopAuthUI() {
    const token = localStorage.getItem('womencypedia_access_token');
    const isLoggedIn = !!token;

    // Show/hide sign-in vs sign-out buttons
    document.querySelectorAll('[data-auth="signin"]').forEach(el => {
        el.style.display = isLoggedIn ? 'none' : '';
    });
    document.querySelectorAll('[data-auth="signout"]').forEach(el => {
        el.style.display = isLoggedIn ? 'flex' : 'none';
    });

    // Show admin link only for admin users
    const userData = localStorage.getItem('womencypedia_user');
    let isAdmin = false;
    if (userData) {
        try {
            const user = JSON.parse(userData);
            isAdmin = user.role === 'admin' || user.role?.type === 'admin';
        } catch (e) { /* ignore parse errors */ }
    }
    document.querySelectorAll('[data-auth="admin-only"]').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });

    // Show user info (name or email)
    if (isLoggedIn && userData) {
        try {
            const user = JSON.parse(userData);
            const displayName = user.username || user.email || '';
            document.querySelectorAll('[data-auth="user-info"]').forEach(el => {
                el.textContent = displayName;
            });
        } catch (e) { /* ignore parse errors */ }
    }
}
