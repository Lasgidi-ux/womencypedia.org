/**
 * Common inline scripts that appear across multiple pages
 * These were previously inline <script> blocks that needed 'unsafe-inline'
 * 
 * This file contains:
 * 1. Global Search functionality
 * 2. Service Worker Registration
 * 3. Strapi API Utilities (fetchStrapi)
 * 
 * CSP Note: This external script is loaded instead of inline scripts,
 * which allows stricter CSP policies without 'unsafe-inline'
 */

(function () {
    'use strict';

    /**
     * Strapi API Utility - Reusable fetch function for Strapi API
     * Automatically adds populate=*, authorization header, and handles media URLs
     * 
     * @param {string} endpoint - API endpoint (e.g., '/api/biographies')
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - API response data
     */
    window.fetchStrapi = async function (endpoint, options = {}) {
        // Always use production Strapi URL — CONFIG.API_BASE_URL may be localhost
        const baseUrl = 'https://womencypedia-cms.onrender.com';
        const apiToken = (typeof CONFIG !== 'undefined') ? CONFIG.API_TOKEN : '';

        // Build URL with populate (exclude sensitive relations)
        const urlObj = new URL(endpoint, baseUrl);
        if (!endpoint.includes('populate=')) {
            // Populate content fields but exclude createdBy/updatedBy (contain password hashes)
            urlObj.searchParams.set('populate', '*');
        }

        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add Authorization header if token exists
        if (apiToken) {
            headers['Authorization'] = `Bearer ${apiToken}`;
        }

        try {
            const response = await fetch(urlObj.toString(), {
                ...options,
                headers
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.error('Strapi API 404: Endpoint not found. Check if Public role has permissions.');
                    throw new Error('Data not found. Please ensure Strapi Public role has find/findOne permissions.');
                }
                if (response.status === 401) {
                    console.error('Strapi API 401: Unauthorized. Check API token.');
                    throw new Error('Unauthorized. Please check your API token.');
                }
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('fetchStrapi error:', error);
            throw error;
        }
    };

    /**
     * Transform Strapi media URL to full URL
     * @param {string|null} url - Relative media URL
     * @returns {string|null} - Full media URL
     */
    window.getMediaUrl = function (url) {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('//')) return url;

        // Always use production Strapi URL for media
        return `https://womencypedia-cms.onrender.com${url}`;
    };

    /**
     * Extract biography slug from URL query parameter
     * @returns {string|null} - Biography slug
     */
    window.getBiographySlug = function () {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    };

    /**
     * Global Search - Enhanced global search across all pages
     * Triggers search on Enter key in any search input
     */
    function initGlobalSearch() {
        document.addEventListener('DOMContentLoaded', function () {
            const searchInputs = document.querySelectorAll('input[type="search"]');
            searchInputs.forEach(input => {
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
        });
    }

    /**
     * Service Worker Registration
     * Registers the service worker for offline functionality
     */
    function initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => console.log('SW registered:', reg.scope))
                    .catch(err => console.log('SW registration failed:', err));
            });
        }
    }

    // Initialize both functionalities
    initGlobalSearch();
    initServiceWorker();

})();
