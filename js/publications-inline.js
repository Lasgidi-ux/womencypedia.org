/**
 * Publications Page - Strapi API Integration
 * Fetches publications data from Strapi and renders it dynamically
 */

(function () {
    'use strict';

    // Wait for DOM and dependencies to be ready
    document.addEventListener('DOMContentLoaded', async () => {
        // Check if fetchStrapi is available
        if (typeof window.fetchStrapi !== 'function') {
            console.error('fetchStrapi utility not found. Ensure js/inline-common.js is loaded.');
            return;
        }

        // Initialize publications loading
        await loadPublications();
    });

    /**
     * Load publications from Strapi API
     */
    async function loadPublications() {
        const featuredContainer = document.getElementById('featured-publication');
        const upcomingContainer = document.getElementById('upcoming-publications');
        const downloadsContainer = document.getElementById('digital-downloads');

        try {
            // Fetch publications from Strapi
            const response = await window.fetchStrapi('/api/publications?populate=*&sort=publishedAt:desc');

            if (!response || !response.data || response.data.length === 0) {
                console.log('No publications found in Strapi. Using static content.');
                return;
            }

            const publications = response.data;

            // Separate featured, upcoming, and downloadable publications
            const featured = publications.find(pub => {
                const attrs = pub.attributes || pub;
                return attrs.featured === true;
            });

            const upcoming = publications.filter(pub => {
                const attrs = pub.attributes || pub;
                return attrs.status === 'upcoming' || attrs.status === 'planned';
            });

            const downloads = publications.filter(pub => {
                const attrs = pub.attributes || pub;
                return attrs.file && attrs.downloadable === true;
            });

            // Render featured publication
            if (featured && featuredContainer) {
                renderFeaturedPublication(featured, featuredContainer);
            }

            // Render upcoming publications
            if (upcoming.length > 0 && upcomingContainer) {
                renderUpcomingPublications(upcoming, upcomingContainer);
            }

            // Render digital downloads
            if (downloads.length > 0 && downloadsContainer) {
                renderDigitalDownloads(downloads, downloadsContainer);
            }

        } catch (error) {
            console.error('Error loading publications:', error);
            // Keep static content on error
        }
    }

    /**
     * Render featured publication
     * @param {Object} publication - Publication data from Strapi
     * @param {HTMLElement} container - Container element
     */
    function renderFeaturedPublication(publication, container) {
        const attrs = publication.attributes || publication;
        const title = attrs.title || 'Featured Publication';
        const description = attrs.description || '';
        const coverImage = attrs.coverImage?.data?.attributes?.url || attrs.coverImage?.url;
        const publishedDate = attrs.publishedAt ? new Date(attrs.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';
        const downloadUrl = attrs.file?.data?.attributes?.url || attrs.file?.url;

        let html = `
            <div class="bg-white rounded-2xl overflow-hidden border border-border-light shadow-lg">
                ${coverImage ? `
                    <div class="h-64 bg-gradient-to-br from-primary/20 to-accent-teal/20 relative overflow-hidden">
                        <img src="${getMediaUrl(coverImage)}" alt="${escapeHtml(title)}" 
                             class="w-full h-full object-cover">
                    </div>
                ` : `
                    <div class="h-64 bg-gradient-to-br from-primary/20 to-accent-teal/20 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary/30 text-8xl">menu_book</span>
                    </div>
                `}
                <div class="p-8">
                    <span class="text-xs font-bold text-primary uppercase tracking-wider">Featured Publication</span>
                    <h3 class="font-serif text-2xl font-bold text-text-main mt-2 mb-3">${escapeHtml(title)}</h3>
                    ${description ? `<p class="text-text-secondary mb-4 leading-relaxed">${escapeHtml(description)}</p>` : ''}
                    ${publishedDate ? `<p class="text-sm text-text-secondary mb-4">Published: ${publishedDate}</p>` : ''}
                    ${downloadUrl ? `
                        <a href="${getMediaUrl(downloadUrl)}" target="_blank" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                            <span class="material-symbols-outlined text-[20px]">download</span>
                            Download PDF
                        </a>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render upcoming publications
     * @param {Array} publications - Array of upcoming publications
     * @param {HTMLElement} container - Container element
     */
    function renderUpcomingPublications(publications, container) {
        let html = '';

        publications.forEach(publication => {
            const attrs = publication.attributes || publication;
            const title = attrs.title || 'Upcoming Publication';
            const description = attrs.description || '';
            const expectedDate = attrs.expectedDate || attrs.expectedYear || 'Coming Soon';
            const category = attrs.category || 'Publication';

            html += `
                <div class="bg-white rounded-2xl overflow-hidden border border-border-light">
                    <div class="h-48 bg-gradient-to-br from-accent-teal/20 to-divider/20 flex items-center justify-center">
                        <span class="material-symbols-outlined text-accent-teal/30 text-6xl">menu_book</span>
                    </div>
                    <div class="p-6">
                        <span class="text-xs font-bold text-accent-teal uppercase">${escapeHtml(category)}</span>
                        <h3 class="font-serif text-xl font-bold text-text-main mt-2 mb-2">${escapeHtml(title)}</h3>
                        ${description ? `<p class="text-sm text-text-secondary mb-4">${escapeHtml(description)}</p>` : ''}
                        <span class="text-xs text-accent-gold font-bold">Expected: ${escapeHtml(expectedDate)}</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Render digital downloads
     * @param {Array} publications - Array of downloadable publications
     * @param {HTMLElement} container - Container element
     */
    function renderDigitalDownloads(publications, container) {
        let html = '';

        publications.forEach(publication => {
            const attrs = publication.attributes || publication;
            const title = attrs.title || 'Download';
            const description = attrs.description || '';
            const fileUrl = attrs.file?.data?.attributes?.url || attrs.file?.url;
            const fileType = attrs.fileType || 'PDF';
            const iconColor = getIconColor(attrs.category);

            html += `
                <div class="bg-white rounded-xl p-6 border border-border-light flex items-start gap-4">
                    <span class="material-symbols-outlined ${iconColor} text-4xl">picture_as_pdf</span>
                    <div class="flex-1">
                        <h4 class="font-bold text-text-main mb-1">${escapeHtml(title)}</h4>
                        ${description ? `<p class="text-sm text-text-secondary mb-3">${escapeHtml(description)}</p>` : ''}
                        ${fileUrl ? `
                            <a href="${getMediaUrl(fileUrl)}" target="_blank" 
                               class="text-sm font-bold text-accent-teal hover:underline">
                                Download ${fileType} →
                            </a>
                        ` : '<span class="text-sm text-text-secondary">File not available</span>'}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Get icon color based on category
     * @param {string} category - Publication category
     * @returns {string} - Tailwind color class
     */
    function getIconColor(category) {
        const colors = {
            'methodology': 'text-accent-gold',
            'handbook': 'text-primary',
            'collection': 'text-divider',
            'report': 'text-accent-teal',
            'guide': 'text-primary'
        };
        return colors[category?.toLowerCase()] || 'text-accent-gold';
    }

    /**
     * Get full media URL
     * @param {string} url - Relative or absolute URL
     * @returns {string} - Full URL
     */
    function getMediaUrl(url) {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('//')) return url;
        return `https://womencypedia-cms.onrender.com${url}`;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
