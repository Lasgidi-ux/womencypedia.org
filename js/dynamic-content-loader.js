/**
 * Dynamic Content Loader for Womencypedia
 * 
 * This module handles dynamic data loading from Strapi CMS for:
 * - browse.html: Biography entries
 * - collections.html: Collection entries
 * - featured.html: Featured content
 * - education.html: Education modules
 * - resources.html: Resources and reading lists
 * - timelines.html: Timeline data
 * 
 * It replaces hardcoded static content with dynamic data from Strapi CMS.
 */

const DynamicContentLoader = {
    // Configuration
    config: {
        apiBaseUrl: window.API_STRAPI_URL || window.API_BASE_URL || 'https://womencypedia-cms.onrender.com',
        timeout: 5000,
        retryAttempts: 2
    },

    /**
     * Initialize the dynamic content loader
     */
    async init() {
        console.log('[DynamicContentLoader] Initializing...');

        // Determine which page we're on
        const page = this.detectPage();
        if (!page) {
            console.log('[DynamicContentLoader] No dynamic page detected');
            return;
        }

        console.log(`[DynamicContentLoader] Detected page: ${page}`);

        // Load content based on page type
        try {
            await this.loadPageContent(page);
        } catch (error) {
            console.error(`[DynamicContentLoader] Error loading ${page}:`, error);
            this.showErrorFallback(page);
        }
    },

    /**
     * Detect which page we're on
     */
    detectPage() {
        const path = window.location.pathname;

        if (path.includes('browse.html') || path.includes('browse-leaders.html')) {
            return 'browse';
        }
        if (path.includes('collections.html') || path.includes('/collections/')) {
            return 'collections';
        }
        if (path.includes('featured.html')) {
            return 'featured';
        }
        if (path.includes('education.html') || path.includes('education-module')) {
            return 'education';
        }
        if (path.includes('resources.html')) {
            return 'resources';
        }
        if (path.includes('timelines.html')) {
            return 'timelines';
        }
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            return 'home';
        }

        return null;
    },

    /**
     * Load content for the detected page
     */
    async loadPageContent(page) {
        switch (page) {
            case 'browse':
                await this.loadBiographies();
                break;
            case 'collections':
                await this.loadCollections();
                break;
            case 'featured':
                await this.loadFeatured();
                break;
            case 'education':
                await this.loadEducationModules();
                break;
            case 'resources':
                await this.loadResources();
                break;
            case 'timelines':
                await this.loadTimelines();
                break;
            case 'home':
                await this.loadHomepage();
                break;
            default:
                console.log(`[DynamicContentLoader] No handler for page: ${page}`);
        }
    },

    /**
     * Load biographies for browse page
     */
    async loadBiographies() {
        const grid = document.getElementById('entries-grid');
        const recentGrid = document.getElementById('recent-entries-grid');

        try {
            // Try to fetch from Strapi
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/biographies?locale=en&populate=image&sort[0]=createdAt:desc&pagination[pageSize]=12`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const biographies = data.data || [];

            if (biographies.length > 0) {
                // Populate main grid - sanitize to prevent XSS
                if (grid) {
                    const safeContent = biographies.slice(0, 6).map(bio => this.renderBiographyCard(bio)).join('');
                    grid.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
                }

                // Populate recent entries - sanitize to prevent XSS
                if (recentGrid) {
                    const safeContent = biographies.slice(0, 4).map(bio => this.renderRecentEntry(bio)).join('');
                    recentGrid.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
                }

                console.log(`[DynamicContentLoader] Loaded ${biographies.length} biographies`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for biographies:', error.message);
            this.loadStaticFallback('biographies');
        }
    },

    /**
     * Load collections
     */
    async loadCollections() {
        const grid = document.getElementById('collections-grid') || document.querySelector('.collections-grid');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/collections?locale=en&populate=coverImage&sort[0]=createdAt:desc`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const collections = data.data || [];

            if (collections.length > 0 && grid) {
                // Sanitize to prevent XSS
                const safeContent = collections.map(col => this.renderCollectionCard(col)).join('');
                grid.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
                console.log(`[DynamicContentLoader] Loaded ${collections.length} collections`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for collections:', error.message);
            this.loadStaticFallback('collections');
        }
    },

    /**
     * Load featured content
     */
    async loadFeatured() {
        // Load featured biography (Story of the Month)
        const storyContainer = document.getElementById('story-of-month');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/biographies?locale=en&filters[featured][$eq]=true&populate=image&pagination[pageSize]=1`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const featured = data.data?.[0];

            if (featured && storyContainer) {
                storyContainer.innerHTML = this.renderFeaturedStory(featured);
                console.log('[DynamicContentLoader] Loaded featured story');
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for featured:', error.message);
        }

        // Load featured collections
        const collectionsGrid = document.getElementById('featured-collections-grid');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/collections?locale=en&filters[featured][$eq]=true&populate=coverImage&pagination[pageSize]=4`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const collections = data.data || [];

            if (collections.length > 0 && collectionsGrid) {
                collectionsGrid.innerHTML = collections.map(col => this.renderCollectionCard(col)).join('');
                console.log(`[DynamicContentLoader] Loaded ${collections.length} featured collections`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for featured collections:', error.message);
        }
    },

    /**
     * Load education modules
     */
    async loadEducationModules() {
        const grid = document.getElementById('education-modules-grid');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/education-modules?locale=en&sort[0]=order:asc`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const modules = data.data || [];

            if (modules.length > 0 && grid) {
                grid.innerHTML = modules.map(mod => this.renderEducationModule(mod)).join('');
                console.log(`[DynamicContentLoader] Loaded ${modules.length} education modules`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for education modules:', error.message);
        }
    },

    /**
     * Load resources
     */
    async loadResources() {
        // Reading lists
        const readingListContainer = document.getElementById('reading-lists-grid');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/contributions?locale=en&filters[type][$eq]=reading-list&pagination[pageSize]=6`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const readingLists = data.data || [];

            if (readingLists.length > 0 && readingListContainer) {
                readingListContainer.innerHTML = readingLists.map(item => this.renderReadingList(item)).join('');
                console.log(`[DynamicContentLoader] Loaded ${readingLists.length} reading lists`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for resources:', error.message);
        }
    },

    /**
     * Load timelines
     */
    async loadTimelines() {
        const timelineContainer = document.getElementById('timeline-events');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/biographies?locale=en&populate=image&fields[0]=name&fields[1]=era&fields[2]=region&pagination[pageSize]=50`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const biographies = data.data || [];

            if (biographies.length > 0 && timelineContainer) {
                // Group by era for timeline
                const timelineData = this.groupByEra(biographies);
                timelineContainer.innerHTML = this.renderTimelineEvents(timelineData);
                console.log(`[DynamicContentLoader] Loaded ${biographies.length} timeline events`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for timelines:', error.message);
        }
    },

    /**
     * Load homepage content
     */
    async loadHomepage() {
        // Load featured biographies
        const featuredGrid = document.getElementById('featured-biographies-grid');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/biographies?locale=en&filters[featured][$eq]=true&populate=image&pagination[pageSize]=4`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const biographies = data.data || [];

            if (biographies.length > 0 && featuredGrid) {
                featuredGrid.innerHTML = biographies.map(bio => this.renderBiographyCard(bio)).join('');
                console.log(`[DynamicContentLoader] Loaded ${biographies.length} featured biographies`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for homepage:', error.message);
        }

        // Load featured collections
        const collectionsGrid = document.getElementById('featured-collections-grid');

        try {
            const response = await this.fetchWithTimeout(
                `${this.config.apiBaseUrl}/api/collections?locale=en&filters[featured][$eq]=true&populate=coverImage&pagination[pageSize]=3`,
                this.config.timeout
            );

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const collections = data.data || [];

            if (collections.length > 0 && collectionsGrid) {
                collectionsGrid.innerHTML = collections.map(col => this.renderCollectionCard(col)).join('');
                console.log(`[DynamicContentLoader] Loaded ${collections.length} featured collections`);
            }
        } catch (error) {
            console.warn('[DynamicContentLoader] Using fallback for homepage collections:', error.message);
        }
    },

    // ============================================
    // RENDERING FUNCTIONS
    // ============================================

    /**
     * Render a biography card
     */
    renderBiographyCard(bio) {
        const attrs = bio.attributes || bio;
        const imageUrl = this.getImageUrl(attrs.image?.data);
        const region = attrs.region || 'Global';
        const category = attrs.category || 'Leadership';

        return `
            <article class="group bg-white rounded-xl overflow-hidden border border-border-light hover:shadow-xl transition-all">
                <div class="relative h-48 lg:h-56 overflow-hidden">
                    ${imageUrl
                ? `<img src="${imageUrl}" alt="${attrs.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />`
                : `<div class="w-full h-full bg-gradient-to-br from-accent-teal/20 to-primary/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary/40 text-6xl">person</span>
                           </div>`
            }
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-4 left-4 right-4">
                        <span class="text-white/80 text-xs font-medium uppercase tracking-wider">${category} • ${region}</span>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="font-serif text-xl font-bold text-text-main mb-1">${attrs.name}</h3>
                    <p class="text-sm text-accent-teal font-medium mb-3">${attrs.domain || category}</p>
                    <p class="text-sm text-text-secondary line-clamp-3 mb-4">${this.stripHtml(attrs.introduction || '').substring(0, 150)}...</p>
                    <a href="biography.html?slug=${attrs.slug}" class="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-hover transition-colors">
                        Read Full Biography <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                </div>
            </article>
        `;
    },

    /**
     * Render a recent entry card
     */
    renderRecentEntry(bio) {
        const attrs = bio.attributes || bio;
        const imageUrl = this.getImageUrl(attrs.image?.data);
        const region = attrs.region || 'Global';
        const era = attrs.era || 'Contemporary';

        return `
            <a href="biography.html?slug=${attrs.slug}" class="group bg-white rounded-2xl overflow-hidden border border-border-light hover:shadow-xl transition-all">
                <div class="aspect-[4/3] bg-lavender-soft/50 relative overflow-hidden">
                    ${imageUrl
                ? `<img src="${imageUrl}" alt="${attrs.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />`
                : `<div class="absolute inset-0 bg-gradient-to-br from-accent-teal/20 to-divider/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-accent-teal/40 text-6xl">person</span>
                           </div>`
            }
                    <span class="absolute top-3 left-3 bg-accent-gold text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>
                </div>
                <div class="p-5">
                    <span class="text-xs font-bold text-accent-teal uppercase tracking-wider">${era} • ${region}</span>
                    <h3 class="font-serif text-lg font-bold text-text-main mt-2 mb-2 group-hover:text-primary transition-colors">${attrs.name}</h3>
                    <p class="text-sm text-text-secondary line-clamp-2">${this.stripHtml(attrs.introduction || '').substring(0, 100)}...</p>
                </div>
            </a>
        `;
    },

    /**
     * Render a collection card
     */
    renderCollectionCard(collection) {
        const attrs = collection.attributes || collection;
        const imageUrl = this.getImageUrl(attrs.coverImage?.data);

        return `
            <article class="group bg-white rounded-lg overflow-hidden border border-border-light hover:border-accent-gold/50 hover:shadow-lg transition-all">
                <div class="relative h-56 overflow-hidden">
                    ${imageUrl
                ? `<img src="${imageUrl}" alt="${attrs.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />`
                : `<div class="w-full h-full bg-gradient-to-br from-primary/20 to-accent-gold/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary/40 text-6xl">collections</span>
                           </div>`
            }
                </div>
                <div class="p-6">
                    <h3 class="font-serif text-xl font-bold text-text-main mb-2">${attrs.name}</h3>
                    <p class="text-sm text-text-secondary mb-4">${this.stripHtml(attrs.description || '').substring(0, 100)}...</p>
                    <a href="collection.html?slug=${attrs.slug}" class="inline-flex items-center gap-1 text-sm font-semibold text-accent-teal hover:text-accent-teal/80">Explore <span class="material-symbols-outlined text-[16px]">arrow_forward</span></a>
                </div>
            </article>
        `;
    },

    /**
     * Render featured story
     */
    renderFeaturedStory(bio) {
        const attrs = bio.attributes || bio;
        const imageUrl = this.getImageUrl(attrs.image?.data);

        return `
            <div class="grid lg:grid-cols-2 gap-0">
                <div class="aspect-[4/3] lg:aspect-auto bg-gradient-to-br from-primary/30 to-accent-gold/30 relative">
                    ${imageUrl
                ? `<img src="${imageUrl}" alt="${attrs.name}" class="w-full h-full object-cover" />`
                : `<div class="absolute inset-0 flex items-center justify-center">
                            <span class="material-symbols-outlined text-white/20 text-[150px]">person</span>
                           </div>`
            }
                    <span class="absolute top-6 left-6 bg-accent-gold text-white text-xs font-bold px-4 py-2 rounded-full uppercase">Story of the Month</span>
                </div>
                <div class="p-8 lg:p-12 flex flex-col justify-center">
                    <div class="flex gap-2 mb-4">
                        <span class="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full">${attrs.era || 'Contemporary'}</span>
                        <span class="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full">${attrs.region || 'Global'}</span>
                    </div>
                    <h2 class="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">${attrs.name}</h2>
                    <p class="text-white/80 text-lg mb-6 leading-relaxed">${this.stripHtml(attrs.introduction || '').substring(0, 300)}...</p>
                    <a href="biography.html?slug=${attrs.slug}" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-text-main font-bold rounded-lg hover:bg-primary hover:text-white transition-colors w-fit">
                        Read Full Biography
                        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </a>
                </div>
            </div>
        `;
    },

    /**
     * Render education module
     */
    renderEducationModule(module) {
        const attrs = module.attributes || module;

        return `
            <div class="bg-white rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-lg transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="size-12 rounded-full bg-accent-gold/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-accent-gold text-2xl">school</span>
                    </div>
                    <span class="text-accent-gold text-xs font-bold uppercase tracking-wider">${attrs.moduleNumber || 'Module'}</span>
                </div>
                <h3 class="font-serif text-xl font-bold text-text-main mb-3">${attrs.title || attrs.name}</h3>
                <p class="text-text-secondary text-sm leading-relaxed mb-4">${this.stripHtml(attrs.description || '').substring(0, 150)}...</p>
                <div class="flex items-center justify-between text-sm text-text-secondary mb-4">
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">schedule</span> ${attrs.duration || '4 Hours'}
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">auto_stories</span> ${attrs.lessons || 12} Lessons
                    </span>
                </div>
                <a href="education-module.html?slug=${attrs.slug}" class="inline-flex items-center justify-center h-10 px-6 bg-accent-gold/10 text-accent-gold font-bold rounded-lg hover:bg-accent-gold/20 transition-colors gap-2 w-full">
                    <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                    View Module
                </a>
            </div>
        `;
    },

    /**
     * Render reading list item
     */
    renderReadingList(item) {
        const attrs = item.attributes || item;

        return `
            <div class="bg-white rounded-xl p-6 border border-border-light">
                <h3 class="font-bold text-text-main mb-3">${attrs.title}</h3>
                <p class="text-text-secondary text-sm">${this.stripHtml(attrs.description || '').substring(0, 100)}...</p>
                <a href="publications.html" class="text-accent-gold font-bold text-sm hover:underline">View Full List →</a>
            </div>
        `;
    },

    /**
     * Render timeline events
     */
    renderTimelineEvents(timelineData) {
        let html = '';

        for (const [era, bios] of Object.entries(timelineData)) {
            html += `
                <div class="mb-8">
                    <h3 class="font-bold text-lg text-text-main mb-4">${era}</h3>
                    <div class="space-y-4">
                        ${bios.map(bio => `
                            <div class="flex items-start gap-4">
                                <div class="flex-shrink-0 w-20 text-accent-teal font-bold">${bio.year || ''}</div>
                                <div class="flex-1">
                                    <p class="text-text-main font-medium">${bio.name}</p>
                                    <p class="text-text-secondary text-sm">${bio.description || ''}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    },

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * Fetch with timeout
     */
    async fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    },

    /**
     * Get image URL from Strapi response
     */
    getImageUrl(imageData) {
        if (!imageData) return null;

        const img = Array.isArray(imageData) ? imageData[0] : imageData;
        if (!img?.attributes?.url) return null;

        const url = img.attributes.url;
        // Handle relative URLs
        if (url.startsWith('/')) {
            return `${this.config.apiBaseUrl}${url}`;
        }
        return url;
    },

    /**
     * Strip HTML tags from text
     */
    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    },

    /**
     * Group biographies by era
     */
    groupByEra(biographies) {
        const groups = {};

        biographies.forEach(bio => {
            const attrs = bio.attributes || bio;
            const era = attrs.era || 'Contemporary';

            if (!groups[era]) {
                groups[era] = [];
            }

            groups[era].push({
                name: attrs.name,
                year: attrs.birthYear || '',
                description: this.stripHtml(attrs.introduction || '').substring(0, 100)
            });
        });

        return groups;
    },

    /**
     * Load static fallback data
     */
    loadStaticFallback(type) {
        console.log(`[DynamicContentLoader] Static fallback for ${type} - data remains empty until API is available`);
        // The static fallback is handled by the page-specific JavaScript (browse.js, etc.)
    },

    /**
     * Show error fallback UI
     */
    showErrorFallback(page) {
        console.error(`[DynamicContentLoader] Failed to load ${page} content`);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DynamicContentLoader.init());
} else {
    // DOM already loaded, init immediately
    DynamicContentLoader.init();
}

// Export for manual initialization
window.DynamicContentLoader = DynamicContentLoader;
