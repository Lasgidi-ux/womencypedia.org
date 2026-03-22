/**
 * Browse functionality for Womencypedia
 * Implements search, filtering, and dynamic biography display with API integration.
 */

// Current state
let currentFilters = {
    search: '',
    regions: [],
    eras: [],
    domains: [],
    tags: [],
    page: 1
};

let currentBiographies = [];
let pagination = {
    page: 1,
    totalPages: 1,
    total: 0
};

// Flag to check if API is available
let useAPI = true;
let apiErrorCount = 0;
const MAX_API_ERRORS = 3;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeBrowse();
});

/**
 * Initialize browse page
 */
async function initializeBrowse() {
    console.log('[Browse] Initializing browse page...');

    // Set up event listeners first
    setupSearch();
    setupFilters();
    setupFilterTabs();

    // Load biographies
    await loadBiographies();

    console.log('[Browse] Browse page initialization complete');
}

/**
 * Load biographies from API or fallback to static data
 */
async function loadBiographies() {
    const container = document.querySelector('#entries-grid') ||
        document.querySelector('section:last-of-type .grid');

    if (!container) return;

    // Show loading state (guard in case UI module isn't loaded)
    if (typeof UI !== 'undefined' && UI.showLoading) {
        UI.showLoading(container, 'Loading biographies...');
    }

    try {
        // Try to fetch from Strapi API first using direct StrapiAPI calls
        if (useAPI && typeof StrapiAPI !== 'undefined') {
            // If we've had too many API errors, skip API and use static data
            if (apiErrorCount >= MAX_API_ERRORS) {
                console.log('[Browse] Using static data due to previous API errors');
                loadStaticFallback(container);
                return;
            }

            const params = buildQueryParams();
            console.log('[Browse] Attempting to load biographies from API...', params);

            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('API timeout')), 5000);
            });
            // Attach a no-op catch so the promise unhandled rejection doesn't spam the console if it rejects later.
            timeoutPromise.catch(() => { });

            const response = await Promise.race([
                StrapiAPI.biographies.getAll(params),
                timeoutPromise
            ]);
            clearTimeout(timeoutId);

            currentBiographies = response.entries || response.data || response;
            pagination = {
                page: response.page || 1,
                totalPages: response.total_pages || Math.ceil((response.total || currentBiographies.length) / CONFIG.PAGINATION.DEFAULT_PAGE_SIZE),
                total: response.total || currentBiographies.length
            };

            console.log('[Browse] Successfully loaded biographies from API:', {
                count: currentBiographies.length,
                pagination
            });

            displayBiographies();
        } else {
            // API not loaded — fall through to static fallback
            console.log('[Browse] StrapiAPI not available, using static data');
            useAPI = false;
            loadStaticFallback(container);
        }
    } catch (error) {
        apiErrorCount++;
        console.error(`[Browse] Biographies load error (attempt ${apiErrorCount}/${MAX_API_ERRORS}):`, error);
        console.error('[Browse] Error details:', {
            message: error.message,
            status: error.status,
            raw: error.raw
        });

        useAPI = false;
        loadStaticFallback(container);
    }
}

/**
 * Fallback to static biography data when API is unavailable
 */
function loadStaticFallback(container) {
    if (typeof biographies !== 'undefined') {
        currentBiographies = biographies;
        pagination = {
            page: 1,
            totalPages: 1,
            total: biographies.length
        };

        console.log('[Browse] Loaded static biographies:', {
            count: currentBiographies.length
        });

        displayBiographies();
    } else if (container && typeof UI !== 'undefined' && UI.showError) {
        UI.showError(container, 'Unable to load biographies. Please try again later.', loadBiographies);
    } else {
        // Last resort: no static data, no UI.showError available
        console.error('[Browse] Unable to load biographies: API unavailable and no static fallback data found.');

        // Clear any loading spinner left in the container
        if (container) {
            container.innerHTML = '<p class="text-center text-text-secondary py-8">Content is temporarily unavailable. Please refresh the page.</p>';
            container.classList.remove('loading');
        }

        // Dispatch event so other code can react (e.g. error tracking)
        document.dispatchEvent(new CustomEvent('biographiesLoadError', {
            detail: { reason: 'no-static-data', container }
        }));
    }
}

/**
 * Build query parameters from current filters
 */
function buildQueryParams() {
    const params = {
        page: currentFilters.page,
        limit: CONFIG.PAGINATION.DEFAULT_PAGE_SIZE
    };

    if (currentFilters.search) {
        params.search = currentFilters.search;
    }

    if (currentFilters.regions.length > 0) {
        params.region = currentFilters.regions.join(',');
    }

    if (currentFilters.eras.length > 0) {
        params.era = currentFilters.eras.join(',');
    }

    if (currentFilters.domains.length > 0) {
        params.domain = currentFilters.domains.join(',');
    }

    if (currentFilters.tags.length > 0) {
        params.tags = currentFilters.tags.join(',');
    }

    return params;
}

/**
 * Set up search functionality
 */
function setupSearch() {
    // Main search input in hero section
    const searchInputs = document.querySelectorAll('input[type="search"]');

    searchInputs.forEach(input => {
        input.addEventListener('input', UI.debounce(async function (e) {
            currentFilters.search = e.target.value.toLowerCase();
            currentFilters.page = 1;

            if (useAPI) {
                await loadBiographies();
            } else {
                displayBiographies();
            }
        }, 300));

        // Handle Enter key
        input.addEventListener('keypress', async function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                currentFilters.search = e.target.value.toLowerCase();
                currentFilters.page = 1;

                if (useAPI) {
                    await loadBiographies();
                } else {
                    displayBiographies();
                }
            }
        });
    });
}

/**
 * Set up filter modal and controls
 */
function setupFilters() {
    // Modal toggle
    const filtersBtn = document.querySelector('button:has(.material-symbols-outlined)');
    const modal = document.getElementById('filters-modal');
    const closeBtn = document.getElementById('close-filters');
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');

    // Find the filters button by text content
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Filters')) {
            btn.addEventListener('click', () => {
                if (modal) modal.classList.remove('hidden');
            });
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            collectFilters();
            currentFilters.page = 1;

            if (useAPI) {
                await loadBiographies();
            } else {
                displayBiographies();
            }

            modal.classList.add('hidden');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            clearAllFilters();

            if (useAPI) {
                await loadBiographies();
            } else {
                displayBiographies();
            }
        });
    }

    // Close modal on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
}

/**
 * Set up filter tabs (All Entries, By Region, etc.)
 */
function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', async function () {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');

            const filterType = this.textContent.trim().toLowerCase();

            // Clear existing filters based on tab
            if (filterType === 'all entries') {
                await clearAllFilters();
            }

            // Could implement specific filtering based on tab
            console.log('Switched to filter:', filterType);
        });
    });
}

/**
 * Collect filter values from checkboxes
 */
function collectFilters() {
    currentFilters.regions = [];
    currentFilters.eras = [];
    currentFilters.domains = [];
    currentFilters.tags = [];

    const checkboxes = document.querySelectorAll('.filter-checkbox:checked');
    checkboxes.forEach(checkbox => {
        const filterType = checkbox.dataset.filter;
        const value = checkbox.value;

        switch (filterType) {
            case 'region':
                currentFilters.regions.push(value);
                break;
            case 'era':
                currentFilters.eras.push(value);
                break;
            case 'domain':
                currentFilters.domains.push(value);
                break;
            case 'tag':
                currentFilters.tags.push(value);
                break;
        }
    });
}

/**
 * Clear all filters
 */
async function clearAllFilters() {
    currentFilters = {
        search: '',
        regions: [],
        eras: [],
        domains: [],
        tags: [],
        page: 1
    };

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('.filter-checkbox:checked');
    checkboxes.forEach(checkbox => checkbox.checked = false);

    // Clear search inputs
    const searchInputs = document.querySelectorAll('input[type="search"]');
    searchInputs.forEach(input => input.value = '');

    if (useAPI) {
        await loadBiographies();
    } else {
        displayBiographies();
    }
}

/**
 * Filter biographies locally (for static data fallback)
 */
function filterBiographies() {
    return currentBiographies.filter(bio => {
        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search;
            const searchableText = `${bio.name} ${bio.introduction || ''} ${bio.contributions || ''} ${(bio.tags || []).join(' ')}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        // Region filter
        if (currentFilters.regions.length > 0) {
            if (!currentFilters.regions.includes(bio.region.toLowerCase().replace(' ', '-'))) {
                return false;
            }
        }

        // Era filter
        if (currentFilters.eras.length > 0) {
            if (!currentFilters.eras.includes(bio.era.toLowerCase().replace(' ', '-'))) {
                return false;
            }
        }

        // Domain filter
        if (currentFilters.domains.length > 0) {
            const bioDomain = bio.category.toLowerCase().replace(' & ', '-').replace(' ', '-');
            if (!currentFilters.domains.includes(bioDomain)) {
                return false;
            }
        }

        // Tags filter
        if (currentFilters.tags.length > 0) {
            const hasMatchingTag = currentFilters.tags.some(tag =>
                (bio.tags || []).some(bioTag => bioTag.toLowerCase().includes(tag))
            );
            if (!hasMatchingTag) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Display biographies in the grid
 */
function displayBiographies() {
    const container = document.querySelector('#entries-grid') ||
        document.querySelector('section:last-of-type .grid');

    if (!container) return;

    // Filter if using static data
    const bios = useAPI ? currentBiographies : filterBiographies();

    // Clear existing content
    container.innerHTML = '';

    if (bios.length === 0) {
        UI.showEmpty(container, {
            icon: 'search_off',
            title: 'No biographies found',
            message: 'Try adjusting your search terms or filters.',
            actionText: 'Clear Filters',
            actionUrl: '#'
        });

        // Add event listener to clear filters link
        const clearLink = container.querySelector('a');
        if (clearLink) {
            clearLink.addEventListener('click', (e) => {
                e.preventDefault();
                clearAllFilters();
            });
        }
        return;
    }

    // Check if user is admin for showing edit/delete buttons
    const isAdmin = typeof Auth !== 'undefined' && Auth.isAdmin();

    // Display biographies
    bios.forEach(bio => {
        const cardHtml = UI.createBiographyCard(bio, isAdmin);
        container.insertAdjacentHTML('beforeend', cardHtml);
    });

    // Add pagination if using API
    if (useAPI && pagination.totalPages > 1) {
        const paginationContainer = document.querySelector('#pagination-container');
        if (paginationContainer) {
            paginationContainer.innerHTML = UI.createPagination(pagination, 'changePage');
        } else {
            container.insertAdjacentHTML('afterend', `
                <div id="pagination-container">
                    ${UI.createPagination(pagination, 'changePage')}
                </div>
            `);
        }
    }
}

/**
 * Change page (called from pagination)
 * @param {number} page - Page number
 */
async function changePage(page) {
    if (page < 1 || page > pagination.totalPages) return;

    currentFilters.page = page;

    // Scroll to top of entries
    const container = document.querySelector('#entries-grid') ||
        document.querySelector('section:last-of-type');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    await loadBiographies();
}

/**
 * Get era color class
 * @param {string} era - Era name
 * @returns {string} - Color class
 */
function getEraColor(era) {
    const colors = {
        'Ancient': 'accent-gold',
        'Pre-colonial': 'primary',
        'Colonial': 'accent-teal',
        'Post-colonial': 'divider',
        'Contemporary': 'lavender'
    };
    return colors[era] || 'text-secondary';
}

/**
 * Get category color class
 * @param {string} category - Category name
 * @returns {string} - Color class
 */
function getCategoryColor(category) {
    const colors = {
        'Leadership': 'primary',
        'Culture & Arts': 'accent-gold',
        'Spirituality & Faith': 'accent-teal',
        'Politics & Governance': 'divider',
        'Science & Innovation': 'lavender',
        'Community Builders': 'primary',
        'Activism & Justice': 'accent-gold',
        'Education': 'accent-teal',
        'Diaspora Stories': 'divider'
    };
    return colors[category] || 'text-secondary';
}

// Make functions globally available
window.toggleFilters = function () {
    const modal = document.getElementById('filters-modal');
    if (modal) {
        modal.classList.toggle('hidden');
    }
};

window.changePage = changePage;
window.clearAllFilters = clearAllFilters;
window.loadBiographies = loadBiographies;