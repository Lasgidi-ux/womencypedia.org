/**
 * Womencypedia Search Module
 * Advanced search functionality with filters and pagination
 */

const Search = {
    // Search state
    _state: {
        query: '',
        filters: {
            era: '',
            region: '',
            category: '',
            domain: ''
        },
        page: 1,
        perPage: 12,
        totalResults: 0,
        results: [],
        isLoading: false
    },

    // Search configuration
    _config: {
        debounceDelay: 300,
        minQueryLength: 2,
        maxResults: 1000
    },

    /**
     * Initialize search module
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        this._config = { ...this._config, ...options };
        this.bindEvents();
        this.restoreFromURL();
    },

    /**
     * Bind search events
     */
    bindEvents() {
        // Search input
        const searchInputs = document.querySelectorAll('[data-search-input]');
        searchInputs.forEach(input => {
            input.addEventListener('input', this.debounce((e) => {
                this.setQuery(e.target.value);
            }, this._config.debounceDelay));

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.search();
                }
            });
        });

        // Filter selects
        const filterSelects = document.querySelectorAll('[data-search-filter]');
        filterSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.setFilter(e.target.dataset.searchFilter, e.target.value);
            });
        });

        // Clear filters button
        const clearButtons = document.querySelectorAll('[data-search-clear]');
        clearButtons.forEach(btn => {
            btn.addEventListener('click', () => this.clearFilters());
        });
    },

    /**
     * Restore search state from URL parameters
     */
    restoreFromURL() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('q') || params.has('search')) {
            this._state.query = params.get('q') || params.get('search') || '';
        }

        if (params.has('era')) this._state.filters.era = params.get('era');
        if (params.has('region')) this._state.filters.region = params.get('region');
        if (params.has('category')) this._state.filters.category = params.get('category');
        if (params.has('page')) this._state.page = parseInt(params.get('page')) || 1;

        // Update UI
        this.updateUI();

        // Perform search if query exists
        if (this._state.query) {
            this.search();
        }
    },

    /**
     * Update URL with current search state
     */
    updateURL() {
        const url = new URL(window.location);

        // Clear existing search params
        url.searchParams.delete('q');
        url.searchParams.delete('search');
        url.searchParams.delete('era');
        url.searchParams.delete('region');
        url.searchParams.delete('category');
        url.searchParams.delete('page');

        // Add current state
        if (this._state.query) {
            url.searchParams.set('q', this._state.query);
        }
        if (this._state.filters.era) {
            url.searchParams.set('era', this._state.filters.era);
        }
        if (this._state.filters.region) {
            url.searchParams.set('region', this._state.filters.region);
        }
        if (this._state.filters.category) {
            url.searchParams.set('category', this._state.filters.category);
        }
        if (this._state.page > 1) {
            url.searchParams.set('page', this._state.page.toString());
        }

        window.history.replaceState({}, '', url);
    },

    /**
     * Set search query
     * @param {string} query - Search query
     */
    setQuery(query) {
        this._state.query = query.trim();
        this._state.page = 1;
        this.updateURL();
    },

    /**
     * Set filter value
     * @param {string} filter - Filter name
     * @param {string} value - Filter value
     */
    setFilter(filter, value) {
        this._state.filters[filter] = value;
        this._state.page = 1;
        this.updateURL();
        this.search();
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        this._state.filters = {
            era: '',
            region: '',
            category: '',
            domain: ''
        };
        this._state.page = 1;

        // Reset filter selects
        document.querySelectorAll('[data-search-filter]').forEach(select => {
            select.value = '';
        });

        this.updateURL();
        this.search();
    },

    /**
     * Go to specific page
     * @param {number} page - Page number
     */
    goToPage(page) {
        this._state.page = page;
        this.updateURL();
        this.search();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Perform search
     */
    async search() {
        if (this._state.isLoading) return;

        this._state.isLoading = true;
        this.showLoading();

        try {
            let results = [];

            // Try StrapiAPI search first
            if (typeof StrapiAPI !== 'undefined') {
                try {
                    const response = await StrapiAPI.biographies.search(this._state.query, {
                        era: this._state.filters.era,
                        region: this._state.filters.region,
                        category: this._state.filters.category,
                        page: this._state.page,
                        pageSize: this._state.perPage
                    });
                    results = response.entries || response.data || [];
                    this._state.totalResults = response.total || results.length;
                } catch (apiError) {
                    console.log('StrapiAPI search failed, using direct fetch');
                }
            }

            // Fallback to direct Strapi fetch if StrapiAPI failed
            if (results.length === 0) {
                try {
                    let url = `${CONFIG.API_BASE_URL}/api/biographies?populate=image,tags&pagination[page]=${this._state.page}&pagination[pageSize]=${this._state.perPage}`;
                    if (this._state.query) {
                        url += `&filters[$or][0][name][$containsi]=${encodeURIComponent(this._state.query)}`;
                        url += `&filters[$or][1][introduction][$containsi]=${encodeURIComponent(this._state.query)}`;
                    }
                    if (this._state.filters.era) url += `&filters[era][$eq]=${encodeURIComponent(this._state.filters.era)}`;
                    if (this._state.filters.region) url += `&filters[region][$eq]=${encodeURIComponent(this._state.filters.region)}`;
                    if (this._state.filters.category) url += `&filters[category][$eq]=${encodeURIComponent(this._state.filters.category)}`;

                    const resp = await fetch(url, { cache: 'no-store' });
                    if (resp.ok) {
                        const data = await resp.json();
                        results = (data.data || []).map(item => ({ id: item.id, ...(item.attributes || item) }));
                        this._state.totalResults = (data.meta && data.meta.pagination && data.meta.pagination.total) || results.length;
                    }
                } catch (strapiErr) {
                    console.warn('Strapi search fallback failed:', strapiErr);
                }
            }

            // Update results
            this._state.results = results;
            this.renderResults();

        } catch (error) {
            console.error('Search error:', error);
            this.showError('An error occurred while searching. Please try again.');
        } finally {
            this._state.isLoading = false;
            this.hideLoading();
        }
    },

    /**
     * Filter results based on query and filters
     * @param {Array} entries - Entries to filter
     * @returns {Array} Filtered entries
     */
    filterResults(entries) {
        const query = this._state.query.toLowerCase();

        return entries.filter(entry => {
            // Text search
            if (query && query.length >= this._config.minQueryLength) {
                const searchFields = [
                    entry.name,
                    entry.title,
                    entry.introduction,
                    entry.region,
                    entry.category,
                    entry.era,
                    ...(entry.tags || [])
                ].filter(Boolean).map(f => f.toLowerCase());

                const matchesQuery = searchFields.some(field => field.includes(query));
                if (!matchesQuery) return false;
            }

            // Era filter
            if (this._state.filters.era && entry.era !== this._state.filters.era) {
                return false;
            }

            // Region filter
            if (this._state.filters.region && entry.region !== this._state.filters.region) {
                return false;
            }

            // Category filter
            if (this._state.filters.category && entry.category !== this._state.filters.category) {
                return false;
            }

            return true;
        });
    },

    /**
     * Paginate results
     * @param {Array} results - Results to paginate
     * @returns {Array} Paginated results
     */
    paginateResults(results) {
        const start = (this._state.page - 1) * this._state.perPage;
        return results.slice(start, start + this._state.perPage);
    },

    /**
     * Render search results
     */
    renderResults() {
        const container = document.querySelector('[data-search-results]');
        if (!container) return;

        if (this._state.results.length === 0) {
            this.showEmpty();
            return;
        }

        const html = this._state.results.map(entry => this.renderResultCard(entry)).join('');
        // Sanitize content before rendering to prevent XSS
        container.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(html) : html;

        // Update results count
        const countEl = document.querySelector('[data-search-count]');
        if (countEl) {
            countEl.textContent = `Found ${this._state.totalResults} result${this._state.totalResults !== 1 ? 's' : ''}`;
        }

        // Render pagination
        this.renderPagination();
    },

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Sanitize image URL to prevent XSS via src attribute
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL or placeholder
     */
    sanitizeImageUrl(url) {
        if (!url || typeof url !== 'string') return null;

        // Allow data URIs
        if (url.startsWith('data:')) return url;

        // Only allow http, https, and relative URLs
        const allowedProtocols = ['http:', 'https:'];
        try {
            const urlObj = new URL(url, window.location.origin);
            if (allowedProtocols.includes(urlObj.protocol)) {
                return url;
            }
        } catch (e) {
            // If URL parsing fails, check if it's a relative path
            if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
                return url;
            }
        }

        // Return null for invalid URLs - will use placeholder
        return null;
    },

    /**
     * Encode ID for safe embedding in URL
     * @param {string|number} id - ID to encode
     * @returns {string} Encoded ID
     */
    encodeId(id) {
        if (id === null || id === undefined) return '';
        return encodeURIComponent(String(id));
    },

    /**
     * Render single result card
     * @param {Object} entry - Entry data
     * @returns {string} HTML string
     */
    renderResultCard(entry) {
        // Sanitize all user-controlled text fields
        const safeName = this.escapeHtml(entry.name || entry.title || '');
        const safeCategory = this.escapeHtml(entry.category || '');
        const safeRegion = this.escapeHtml(entry.region || '');
        const safeEra = this.escapeHtml(entry.era || '');
        const safeIntroduction = this.escapeHtml(entry.introduction || '');

        // Sanitize image URL
        const safeImage = this.sanitizeImageUrl(entry.image);

        // Encode ID for URL
        const safeId = this.encodeId(entry.id);

        const imageHtml = safeImage
            ? `<img src="${safeImage}" alt="${safeName}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center bg-primary/10">
                <span class="material-symbols-outlined text-4xl text-primary/40">person</span>
               </div>`;

        const categoryHtml = safeCategory
            ? `<span class="absolute top-3 left-3 px-2 py-1 bg-white/90 rounded text-xs font-medium text-text-main">${safeCategory}</span>`
            : '';

        const metaHtml = (safeRegion || safeEra)
            ? `<p class="text-sm text-text-secondary mb-2">${safeRegion}${safeRegion && safeEra ? ' • ' : ''}${safeEra}</p>`
            : '';

        // Trim introduction after escaping (limit to 120 characters)
        const truncatedIntro = safeIntroduction.length > 120
            ? safeIntroduction.substring(0, 120) + '...'
            : safeIntroduction;

        const descriptionHtml = truncatedIntro
            ? `<p class="text-sm text-text-secondary line-clamp-2">${truncatedIntro}</p>`
            : '';

        return `
            <a href="biography.html?id=${safeId}" class="search-result-card block bg-white rounded-xl border border-border-light overflow-hidden hover:shadow-lg transition-shadow">
                <div class="aspect-[4/3] bg-primary/10 relative overflow-hidden">
                    ${imageHtml}
                    ${categoryHtml}
                </div>
                <div class="p-4">
                    <h3 class="font-heading text-lg font-semibold text-text-main mb-1">${safeName}</h3>
                    ${metaHtml}
                    ${descriptionHtml}
                </div>
            </a>
        `;
    },

    /**
     * Render pagination
     */
    renderPagination() {
        const container = document.querySelector('[data-search-pagination]');
        if (!container) return;

        const totalPages = Math.ceil(this._state.totalResults / this._state.perPage);

        if (totalPages <= 1) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        // Generate page numbers
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this._state.page - 1 && i <= this._state.page + 1)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        const pageNumbersHtml = pages.map(page => {
            if (page === '...') {
                return `<span class="px-2 text-text-secondary">...</span>`;
            }
            return `
                <button onclick="Search.goToPage(${page})" 
                    class="size-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${page === this._state.page ? 'bg-primary text-white' : 'hover:bg-primary/10 text-text-main'}">
                    ${page}
                </button>
            `;
        }).join('');

        container.innerHTML = `
            <button onclick="Search.goToPage(${this._state.page - 1})" 
                class="size-10 flex items-center justify-center border border-border-light rounded-lg hover:bg-primary/10 transition-colors ${this._state.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                ${this._state.page === 1 ? 'disabled' : ''}>
                <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <div class="flex items-center gap-1">${pageNumbersHtml}</div>
            <button onclick="Search.goToPage(${this._state.page + 1})" 
                class="size-10 flex items-center justify-center border border-border-light rounded-lg hover:bg-primary/10 transition-colors ${this._state.page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                ${this._state.page === totalPages ? 'disabled' : ''}>
                <span class="material-symbols-outlined">chevron_right</span>
            </button>
        `;
    },

    /**
     * Update UI elements with current state
     */
    updateUI() {
        // Update search input
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
            searchInput.value = this._state.query;
        }

        // Update filter selects
        Object.entries(this._state.filters).forEach(([filter, value]) => {
            const select = document.querySelector(`[data-search-filter="${filter}"]`);
            if (select) {
                select.value = value;
            }
        });
    },

    /**
     * Show loading state
     */
    showLoading() {
        const loadingEl = document.querySelector('[data-search-loading]');
        const resultsEl = document.querySelector('[data-search-results]');
        const emptyEl = document.querySelector('[data-search-empty]');

        if (loadingEl) loadingEl.classList.remove('hidden');
        if (resultsEl) resultsEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.add('hidden');
    },

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingEl = document.querySelector('[data-search-loading]');
        if (loadingEl) loadingEl.classList.add('hidden');
    },

    /**
     * Show empty state
     */
    showEmpty() {
        const resultsEl = document.querySelector('[data-search-results]');
        const emptyEl = document.querySelector('[data-search-empty]');
        const paginationEl = document.querySelector('[data-search-pagination]');

        if (resultsEl) resultsEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (paginationEl) paginationEl.classList.add('hidden');

        const countEl = document.querySelector('[data-search-count]');
        if (countEl) {
            countEl.textContent = 'No results found';
        }
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Get current search state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this._state };
    },

    /**
     * Get current results
     * @returns {Array} Current results
     */
    getResults() {
        return [...this._state.results];
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Search;
}
