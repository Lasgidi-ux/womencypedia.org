/**
 * WOMENCYPEDIA - Shared Navigation JavaScript
 * Provides consistent navigation functionality across all pages
 */

document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
});

/**
 * Initialize all navigation components
 */
function initNavigation() {
    createMobileNavigation();
    initNavActiveState();
    initNavScrollBehavior();
    initKeyboardNavigation();
}

/**
 * Create mobile navigation elements if they don't exist
 */
function createMobileNavigation() {
    // Check if mobile navigation already exists
    if (document.getElementById('mobileMenu')) {
        setupMobileMenuHandlers();
        return;
    }

    // Create search sheet
    const searchSheet = document.createElement('div');
    searchSheet.id = 'searchSheet';
    searchSheet.className = 'search-sheet hidden fixed top-0 left-0 right-0 z-[150] bg-background-cream/95 backdrop-blur-sm p-4 border-b border-divider shadow-lg';
    searchSheet.innerHTML = `
        <div class="flex items-center gap-3 max-w-[1440px] mx-auto">
            <div class="flex-1 flex items-center bg-white border border-border-light rounded-lg px-4 h-12 focus-within:border-accent-teal focus-within:ring-1 focus-within:ring-accent-teal">
                <span class="material-symbols-outlined text-accent-teal text-[20px]">search</span>
                <input type="search" placeholder="Search women, cultures, eras…"
                    class="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-main placeholder-text-secondary ml-2" />
            </div>
            <button class="search-close-btn size-12 flex items-center justify-center bg-white border border-border-light rounded-lg hover:bg-primary/10 transition-colors" aria-label="Close search">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
    `;
    document.body.insertBefore(searchSheet, document.body.firstChild);

    // Add event listener for close search button (using consistent event listener pattern)
    const closeSearchBtn = searchSheet.querySelector('.search-close-btn');
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            toggleSearch();
        });
    }

    // Create menu overlay
    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'menuOverlay';
    menuOverlay.className = 'overlay hidden fixed inset-0 z-[140] bg-black/40';
    menuOverlay.onclick = toggleMenu;
    document.body.insertBefore(menuOverlay, document.body.firstChild);

    // Determine if we're in a subdirectory (like collections/)
    const pathPrefix = window.location.pathname.includes('/collections/') ? '../' : '';

    // Create mobile bottom sheet menu
    const mobileMenu = document.createElement('nav');
    mobileMenu.id = 'mobileMenu';
    mobileMenu.className = 'mobile-menu hidden fixed bottom-0 left-0 right-0 z-[150] bg-background-cream rounded-t-2xl border-t border-border-light max-h-[85vh] overflow-y-auto shadow-2xl';
    mobileMenu.innerHTML = `
        <div class="w-10 h-1 bg-border-light rounded-full mx-auto mt-3 mb-4"></div>

        <!-- Explore -->
        <div class="px-6 pb-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 pb-2 border-b border-border-light">
                Explore</h3>
            <a href="${pathPrefix}index.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Home</a>
            <a href="${pathPrefix}browse.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Browse</a>
            <a href="${pathPrefix}featured.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Featured</a>
            <a href="${pathPrefix}collections.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Collections</a>
            <a href="${pathPrefix}timelines.html"
                class="block py-3 text-base font-medium text-text-main hover:text-primary">Timelines</a>
        </div>

        <!-- Registry -->
        <div class="px-6 pb-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 pb-2 border-b border-border-light">
                Registry</h3>
            <a href="${pathPrefix}browse-leaders.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Browse Leaders</a>
            <a href="${pathPrefix}apply-verification.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Apply for Verification</a>
            <a href="${pathPrefix}controlled-contributions.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Submit Content</a>
            <a href="${pathPrefix}partners.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Partners</a>
            <a href="${pathPrefix}fellowship.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Fellowships</a>
            <a href="${pathPrefix}reports.html"
                class="block py-3 text-base font-medium text-text-main hover:text-primary">Reports</a>
        </div>

        <!-- Learn -->
        <div class="px-6 pb-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 pb-2 border-b border-border-light">
                Learn</h3>
            <a href="${pathPrefix}education.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Education</a>
            <a href="${pathPrefix}enterprises.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Enterprises</a>
            <a href="${pathPrefix}research.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Research</a>
            <a href="${pathPrefix}publications.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Publications</a>
            <a href="${pathPrefix}resources.html"
                class="block py-3 text-base font-medium text-text-main hover:text-primary">Resources</a>
        </div>

        <!-- Participate -->
        <div class="px-6 pb-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 pb-2 border-b border-border-light">
                Participate</h3>
            <a href="${pathPrefix}nominate.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Nominate
                a Woman</a>
            <a href="${pathPrefix}share-story.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Share
                Your Story</a>
            <a href="${pathPrefix}contributor-guidelines.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Contributor
                Guidelines</a>
            <a href="${pathPrefix}donate.html" class="block py-3 text-base font-medium text-text-main hover:text-primary">Donate</a>
        </div>

        <!-- About -->
        <div class="px-6 pb-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 pb-2 border-b border-border-light">
                About</h3>
            <a href="${pathPrefix}about.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">About
                Us</a>
            <a href="${pathPrefix}founders.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Founders</a>
            <a href="${pathPrefix}contributors.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Contributors</a>
            <a href="${pathPrefix}methodology.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Methodology</a>
            <a href="${pathPrefix}editorial-standards.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Editorial
                Standards</a>
            <a href="${pathPrefix}contact.html"
                class="block py-3 text-base font-medium text-text-main hover:text-primary">Contact</a>
        </div>

        <!-- My Profile -->
        <div class="px-6 pb-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 pb-2 border-b border-border-light">
                My Profile</h3>
            <a href="${pathPrefix}profile.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">My
                Profile</a>
            <a href="${pathPrefix}analytics.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Analytics</a>
            <a href="${pathPrefix}admin.html"
                class="block py-3 text-base font-medium text-text-main border-b border-border-light/50 hover:text-primary">Admin</a>
            <a href="${pathPrefix}biography.html" class="block py-3 text-base font-medium text-text-main hover:text-primary">Sample
                Biography</a>
            <!-- Sign Out - shown when authenticated -->
            <button onclick="handleMobileLogout()"
                class="block w-full text-left py-3 text-base font-medium text-red-600 hover:text-red-700 border-t border-border-light mt-2"
                id="mobile-signout-btn" style="display: none;">
                Sign Out
            </button>
        </div>

        <!-- CTA -->
        <div class="px-6 pb-8">
            <a href="${pathPrefix}share-story.html"
                class="block w-full h-12 bg-primary text-white text-base font-bold rounded-lg flex items-center justify-center hover:bg-primary-hover transition-colors">
                Share Your Story
            </a>
        </div>
    `;
    document.body.appendChild(mobileMenu);

    // Add CSS animations if not present
    addMobileNavStyles();

    // Setup handlers
    setupMobileMenuHandlers();
}

/**
 * Add required CSS for mobile navigation
 */
function addMobileNavStyles() {
    if (document.getElementById('mobile-nav-styles')) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'mobile-nav-styles';
    styleSheet.textContent = `
        /* Mobile menu animation */
        .mobile-menu {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        }

        .mobile-menu.hidden {
            transform: translateY(100%);
            opacity: 0;
            pointer-events: none;
        }

        .mobile-menu.active {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        /* Search sheet animation */
        .search-sheet {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        }

        .search-sheet.hidden {
            transform: translateY(-100%);
            opacity: 0;
            pointer-events: none;
        }

        .search-sheet.active {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        /* Overlay animation */
        .overlay {
            transition: opacity 0.3s ease;
        }

        .overlay.hidden {
            opacity: 0;
            pointer-events: none;
        }

        .overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
    `;
    document.head.appendChild(styleSheet);
}

/**
 * Setup event handlers for mobile menu buttons
 */
function setupMobileMenuHandlers() {
    // Find and attach handlers to mobile menu button
    const menuButtons = document.querySelectorAll('[aria-label="Open menu"], [aria-label="Menu"]');
    menuButtons.forEach(btn => {
        // Remove existing onclick to avoid duplicates
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            toggleMenu();
        });
    });

    // Find and attach handlers to mobile search button
    const searchButtons = document.querySelectorAll('[aria-label="Open search"]');
    searchButtons.forEach(btn => {
        // Remove existing onclick to avoid duplicates
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            toggleSearch();
        });
    });

    // Handle swipe to close on mobile menu
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
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
                toggleMenu();
            }
        }
    }
}

/**
 * Toggle mobile menu visibility
 */
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('menuOverlay');

    if (!menu || !overlay) return;

    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('active');
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        menu.classList.remove('active');
        menu.classList.add('hidden');
        overlay.classList.remove('active');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Toggle search sheet visibility
 */
function toggleSearch() {
    const search = document.getElementById('searchSheet');

    if (!search) return;

    if (search.classList.contains('hidden')) {
        search.classList.remove('hidden');
        search.classList.add('active');
        const input = search.querySelector('input');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    } else {
        search.classList.remove('active');
        search.classList.add('hidden');
    }
}

/**
 * Initialize active state for navigation links based on current page
 */
function initNavActiveState() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';

    // Desktop navigation links
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('text-primary', 'border-b-2', 'border-primary');
            link.classList.remove('text-text-main', 'hover:text-primary');
        } else {
            link.classList.remove('text-primary', 'border-b-2', 'border-primary');
            link.classList.add('text-text-main');
        }
    });
}

/**
 * Navbar hide/show on scroll
 */
function initNavScrollBehavior() {
    const navbar = document.querySelector('header');
    if (!navbar) return;

    // Add ID if missing
    if (!navbar.id) {
        navbar.id = 'navbar';
    }

    let lastScrollTop = 0;
    const scrollThreshold = 10;

    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (Math.abs(currentScroll - lastScrollTop) < scrollThreshold) {
            return;
        }

        if (currentScroll > lastScrollTop && currentScroll > 100) {
            // Scrolling down & past navbar
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, { passive: true });
}

/**
 * Keyboard navigation support
 */
function initKeyboardNavigation() {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobileMenu');
            const search = document.getElementById('searchSheet');

            if (menu && !menu.classList.contains('hidden')) {
                toggleMenu();
            }
            if (search && !search.classList.contains('hidden')) {
                toggleSearch();
            }
        }
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// Make functions globally available
window.toggleMenu = toggleMenu;
window.toggleSearch = toggleSearch;

/**
 * Handle mobile menu logout
 */
function handleMobileLogout() {
    // Close menu first
    toggleMenu();

    // Use Auth.logout() if available, otherwise do basic logout
    if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
        Auth.logout()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(() => {
                // Fallback: clear storage and redirect even on error
                localStorage.removeItem('womencypedia_access_token');
                localStorage.removeItem('womencypedia_refresh_token');
                localStorage.removeItem('womencypedia_user');
                window.location.href = 'index.html';
            });
    } else {        // Fallback: clear storage and redirect
        localStorage.removeItem('womencypedia_access_token');
        localStorage.removeItem('womencypedia_refresh_token');
        localStorage.removeItem('womencypedia_user');
        window.location.href = 'index.html';
    }
}

window.handleMobileLogout = handleMobileLogout;

/**
 * Update mobile menu auth state
 */
function updateMobileMenuAuthState() {
    const signOutBtn = document.getElementById('mobile-signout-btn');
    if (!signOutBtn) return;

    // Check for token
    const token = localStorage.getItem('womencypedia_access_token');
    if (token) {
        signOutBtn.style.display = 'block';
    } else {
        signOutBtn.style.display = 'none';
    }
}

/**
 * Initialize auth state listeners
 */
function initAuthStateListener() {
    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateMobileMenuAuthState);
    } else {
        updateMobileMenuAuthState();
    }

    // Also run when storage changes (in case of logout in another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'womencypedia_access_token') {
            updateMobileMenuAuthState();
        }
    });
}

// Initialize auth state listener
initAuthStateListener();
