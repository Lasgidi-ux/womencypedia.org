/**
 * Timelines Page - Strapi API Integration
 * Fetches timeline data from Strapi and renders it dynamically
 */

(function () {
    'use strict';

    // Wait for DOM and dependencies to be ready
    document.addEventListener('DOMContentLoaded', async () => {
        // Check if fetchStrapi is available
        if (typeof window.fetchStrapi !== 'function') {
            console.warn('fetchStrapi function not available.');
            return;
        }

        // Initialize timeline loading
        await loadTimelines();
    });

    /**
     * Load timelines from Strapi API
     */
    async function loadTimelines() {
        const timelineContainer = document.getElementById('timeline-chart');
        if (!timelineContainer) {
            console.warn('Timeline container not found.');
            return;
        }

        try {
            // Show loading state
            timelineContainer.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
                        <p class="text-text-secondary">Loading timelines...</p>
                    </div>
                </div>
            `;

            // Fetch timelines from Strapi
            const response = await window.fetchStrapi('/api/timelines?populate=*&sort=year:asc');

            if (!response || !response.data || response.data.length === 0) {
                timelineContainer.innerHTML = `
                    <div class="text-center py-12">
                        <span class="material-symbols-outlined text-4xl text-text-secondary mb-4 block">timeline</span>
                        <p class="text-text-secondary">No timeline events available yet.</p>
                    </div>
                `;
                return;
            }

            // Render timelines
            renderTimelines(response.data, timelineContainer);

        } catch (error) {
            console.error('Error loading timelines:', error);
            timelineContainer.innerHTML = `
                <div class="text-center py-12">
                    <span class="material-symbols-outlined text-4xl text-red-500 mb-4 block">error</span>
                    <p class="text-text-secondary">Unable to load timelines. Please try again later.</p>
                </div>
            `;
        }
    }

    /**
     * Render timeline events to the container
     * @param {Array} timelines - Array of timeline data from Strapi
     * @param {HTMLElement} container - Container element to render into
     */
    function renderTimelines(timelines, container) {
        // Group timelines by era/period
        const groupedTimelines = groupTimelinesByEra(timelines);

        let html = '<div class="timeline-visualization">';

        // Render each era group
        Object.keys(groupedTimelines).forEach(era => {
            const eraTimelines = groupedTimelines[era];

            html += `
                <div class="timeline-era mb-8">
                    <h3 class="font-serif text-xl font-bold text-text-main mb-4 pb-2 border-b border-border-light">
                        ${escapeHtml(era)}
                    </h3>
                    <div class="space-y-4">
            `;

            eraTimelines.forEach(timeline => {
                const attrs = timeline.attributes || timeline;
                const title = attrs.title || 'Untitled Event';
                const description = attrs.description || '';
                const year = attrs.year || '';
                const domain = attrs.domain || 'general';
                const region = attrs.region || '';

                // Get domain color
                const domainColor = getDomainColor(domain);

                html += `
                    <div class="timeline-item bg-white rounded-xl p-6 border border-border-light hover:shadow-lg transition-shadow">
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0">
                                <div class="size-12 rounded-full ${domainColor} flex items-center justify-center">
                                    <span class="material-symbols-outlined text-white text-xl">${getDomainIcon(domain)}</span>
                                </div>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="text-sm font-bold text-primary">${escapeHtml(year)}</span>
                                    ${region ? `<span class="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">${escapeHtml(region)}</span>` : ''}
                                </div>
                                <h4 class="font-serif text-lg font-bold text-text-main mb-2">${escapeHtml(title)}</h4>
                                ${description ? `<p class="text-sm text-text-secondary leading-relaxed">${escapeHtml(description)}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;

        // Re-initialize timeline animations if timeline.js is loaded
        if (typeof window.initTimelineAnimations === 'function') {
            window.initTimelineAnimations();
        }
    }

    /**
     * Group timelines by era/period
     * @param {Array} timelines - Array of timeline data
     * @returns {Object} - Grouped timelines by era
     */
    function groupTimelinesByEra(timelines) {
        const groups = {};

        timelines.forEach(timeline => {
            const attrs = timeline.attributes || timeline;
            const era = attrs.era || categorizeByYear(attrs.year);

            if (!groups[era]) {
                groups[era] = [];
            }
            groups[era].push(timeline);
        });

        return groups;
    }

    /**
     * Categorize timeline by year into an era
     * @param {string|number} year - Year value
     * @returns {string} - Era category
     */
    function categorizeByYear(year) {
        const yearNum = parseInt(year);
        if (isNaN(yearNum)) return 'Other';

        if (yearNum < 500) return 'Ancient World (Before 500 CE)';
        if (yearNum < 1500) return 'Medieval Period (500-1500 CE)';
        if (yearNum < 1800) return 'Early Modern Period (1500-1800 CE)';
        if (yearNum < 1900) return '19th Century';
        if (yearNum < 1950) return 'Early 20th Century';
        if (yearNum < 2000) return 'Late 20th Century';
        return '21st Century';
    }

    /**
     * Get color class for domain
     * @param {string} domain - Domain name
     * @returns {string} - Tailwind color class
     */
    function getDomainColor(domain) {
        const colors = {
            'leadership': 'bg-primary',
            'politics': 'bg-primary',
            'science': 'bg-accent-teal',
            'innovation': 'bg-accent-teal',
            'arts': 'bg-accent-gold',
            'culture': 'bg-accent-gold',
            'faith': 'bg-primary/40',
            'spirituality': 'bg-primary/40',
            'enterprise': 'bg-accent-gold/40',
            'economy': 'bg-accent-gold/40',
            'general': 'bg-gray-500'
        };
        return colors[domain.toLowerCase()] || colors['general'];
    }

    /**
     * Get icon for domain
     * @param {string} domain - Domain name
     * @returns {string} - Material icon name
     */
    function getDomainIcon(domain) {
        const icons = {
            'leadership': 'groups',
            'politics': 'account_balance',
            'science': 'science',
            'innovation': 'lightbulb',
            'arts': 'palette',
            'culture': 'theater_comedy',
            'faith': 'church',
            'spirituality': 'self_improvement',
            'enterprise': 'business',
            'economy': 'trending_up',
            'general': 'event'
        };
        return icons[domain.toLowerCase()] || icons['general'];
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
