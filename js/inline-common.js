/**
 * Common inline scripts that appear across multiple pages
 * These were previously inline <script> blocks that needed 'unsafe-inline'
 * 
 * This file contains:
 * 1. Global Search functionality
 * 2. Service Worker Registration
 * 
 * CSP Note: This external script is loaded instead of inline scripts,
 * which allows stricter CSP policies without 'unsafe-inline'
 */

(function () {
    'use strict';

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
