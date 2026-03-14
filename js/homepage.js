/**
 * Womencypedia Homepage Dynamic Content Loader
 * 
 * Fetches homepage content from Strapi CMS at runtime.
 * Sections loaded:
 *  - Hero (title, subtitle, badge, quote)
 *  - Featured biographies
 *  - "Why Womencypedia?" stats
 *  - Audience cards
 *  - Mission/Vision
 *  - Credibility partners
 * 
 * Fallback: If Strapi is unavailable, the static HTML content
 *           remains visible (graceful degradation).
 */

const Homepage = {
    /** Whether the CMS API is reachable (cached after first check) */
    _cmsAvailable: null,

    /**
     * Quick CMS availability check (HEAD request with short timeout).
     * Result is cached so we only check once per page load.
     */
    async _isCmsAvailable() {
        if (this._cmsAvailable !== null) return this._cmsAvailable;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            // Strapi APIs return 404 for HEAD by default, use minimal GET instead
            var headers = {};
            if (CONFIG.API_TOKEN) {
                headers['Authorization'] = 'Bearer ' + CONFIG.API_TOKEN;
            }
            const res = await fetch(CONFIG.API_BASE_URL + '/api/homepage?fields[0]=id', {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
                headers: headers
            });
            clearTimeout(timeout);
            if (res.status === 404) {
                console.info('[Homepage] CMS homepage content type not found (404). This is expected if the homepage single type has not been created/published in Strapi admin, or if public find permission is not enabled. Using static HTML fallback.');
                this._cmsAvailable = false;
            } else {
                this._cmsAvailable = res.ok;
            }
        } catch {
            this._cmsAvailable = false;
        }
        return this._cmsAvailable;
    },

    /**
     * Initialize homepage dynamic content
     */
    async init() {
        // Quick check — skip all API calls if CMS is unreachable
        const cmsReady = await this._isCmsAvailable();
        if (!cmsReady) {
            // Static HTML is already rendered; nothing to do
            return;
        }

        try {
            await Promise.allSettled([
                this.loadHomepageContent(),
                this.loadFeaturedBiographies(),
                this.loadFeaturedCollections(),
                this.loadRecentBiographies()
            ]);
        } catch {
            // Static HTML fallback remains visible
        }
    },

    /**
     * Load homepage single type content from Strapi
     */
    async loadHomepageContent() {
        try {
            var locale = 'en';
            if (typeof I18N !== 'undefined') {
                locale = I18N.currentLocale;
            }
            var controller = new AbortController();
            var timeout = setTimeout(function () { controller.abort(); }, 5000);
            var headers = {
                'Content-Type': 'application/json'
            };
            if (CONFIG.API_TOKEN) {
                headers['Authorization'] = 'Bearer ' + CONFIG.API_TOKEN;
            }
            var response = await fetch(CONFIG.API_BASE_URL + '/api/homepage?locale=' + locale + '&populate=*', {
                cache: 'no-store',
                signal: controller.signal,
                headers: headers
            });
            clearTimeout(timeout);

            if (!response.ok) return;

            const result = await response.json();
            const data = result.data;

            if (!data) return;

            // Flatten Strapi v4 response (attributes nesting)
            const content = data.attributes ? data.attributes : data;

            // Hero Section
            this.setTextContent('hero-title', content.heroTitle);
            this.setTextContent('hero-subtitle', content.heroSubtitle);
            this.setTextContent('hero-badge', content.heroBadge);
            this.setTextContent('hero-quote', content.quoteText);

            // Featured Collection Title
            this.setTextContent('featured-collection-title', content.featuredCollectionTitle);

            // "Why Womencypedia?" Section
            this.setTextContent('why-title', content.whyTitle);
            this.setTextContent('why-description', content.whyDescription);

            // Why Stats
            if (content.whyStats && Array.isArray(content.whyStats)) {
                this.renderWhyStats(content.whyStats);
            }

            // Audience Section
            this.setTextContent('audience-title', content.audienceTitle);
            this.setTextContent('audience-description', content.audienceDescription);

            if (content.audienceCards && Array.isArray(content.audienceCards)) {
                this.renderAudienceCards(content.audienceCards);
            }

            // Mission/Vision
            this.setTextContent('mission-title', content.missionTitle);
            this.setInnerHTML('mission-body', content.missionBody);
            this.setTextContent('vision-title', content.visionTitle);
            this.setInnerHTML('vision-body', content.visionBody);

            // Credibility Partners
            if (content.credibilityPartners && Array.isArray(content.credibilityPartners)) {
                this.renderCredibilityPartners(content.credibilityPartners);
            }

        } catch (error) {
            console.warn('Failed to load homepage content from CMS:', error);
            // Static fallback remains visible
        }
    },

    /**
     * Load featured biographies for the homepage grid
     */
    async loadFeaturedBiographies() {
        const container = document.getElementById('featured-biographies-grid');
        if (!container) return;

        try {
            const locale = typeof I18N !== 'undefined' ? I18N.currentLocale : 'en';
            const url = `${CONFIG.API_BASE_URL}/api/biographies?locale=${locale}&filters[featured][$eq]=true&populate=image,tags&pagination[pageSize]=6&sort[0]=createdAt:desc`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) return;

            const result = await response.json();
            const entries = this.flattenCollection(result);

            if (entries.length === 0) return;

            // Sanitize content before rendering to prevent XSS
            const safeContent = entries.map(entry => this.biographyCard(entry)).join('');
            container.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
        } catch {
            // CMS unavailable — static content remains
        }
    },

    /**
     * Load featured collections for the homepage
     */
    async loadFeaturedCollections() {
        const container = document.getElementById('featured-collections-grid');
        if (!container) return;

        try {
            const locale = typeof I18N !== 'undefined' ? I18N.currentLocale : 'en';
            const url = `${CONFIG.API_BASE_URL}/api/collections?locale=${locale}&filters[featured][$eq]=true&populate=coverImage,biographies&sort[0]=createdAt:desc`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) return;

            const result = await response.json();
            const collections = this.flattenCollection(result);

            if (collections.length === 0) return;

            // Sanitize content before rendering to prevent XSS
            const safeContent = collections.map(col => this.collectionCard(col)).join('');
            container.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
        } catch {
            // CMS unavailable — static content remains
        }
    },

    /**
     * Load recently published biographies
     */
    async loadRecentBiographies() {
        const container = document.getElementById('recent-biographies-grid');
        if (!container) return;

        try {
            const locale = typeof I18N !== 'undefined' ? I18N.currentLocale : 'en';
            const url = `${CONFIG.API_BASE_URL}/api/biographies?locale=${locale}&populate=image,tags&pagination[pageSize]=4&sort[0]=publishedAt:desc`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) return;

            const result = await response.json();
            const entries = this.flattenCollection(result);

            if (entries.length === 0) return;

            // Sanitize content before rendering to prevent XSS
            const safeContent = entries.map(entry => this.biographyCard(entry)).join('');
            container.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
        } catch {
            // CMS unavailable — static content remains
        }
    },

    // ─── Rendering Helpers ───────────────────────────────────

    /**
     * Render a biography card (preserving original CSS structure)
     */
    biographyCard(entry) {
        const imageUrl = this.getMediaUrl(entry.image);
        const tags = entry.tags ? entry.tags.map(t => t.name || t).slice(0, 3) : [];
        const tagsHtml = tags.map(t =>
            `<span class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">${this.escapeHtml(t)}</span>`
        ).join('');

        return `
            <div class="bg-white rounded-xl border border-border-light overflow-hidden hover:shadow-lg transition-shadow group">
                <div class="h-48 overflow-hidden">
                    <img src="${imageUrl}" alt="${this.escapeHtml(entry.name)}"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                </div>
                <div class="p-6">
                    <span class="text-xs font-bold uppercase tracking-wider text-primary">${this.escapeHtml(entry.category || '')}</span>
                    <h3 class="font-serif text-lg font-bold text-text-main mt-2 mb-2">${this.escapeHtml(entry.name)}</h3>
                    <p class="text-sm text-text-secondary line-clamp-3">${this.escapeHtml(this.stripHtml(entry.introduction || ''))}</p>
                    <div class="flex flex-wrap gap-1 mt-3">${tagsHtml}</div>
                    <a href="biography.html?slug=${encodeURIComponent(entry.slug)}"
                       class="inline-flex items-center gap-1 text-sm font-bold text-primary mt-4 hover:underline">
                        Read More <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                </div>
            </div>
        `;
    },

    /**
     * Render a collection card
     */
    collectionCard(col) {
        const imageUrl = this.getMediaUrl(col.coverImage);
        const count = col.biographies ? col.biographies.length : 0;

        return `
            <a href="collection.html?slug=${encodeURIComponent(col.slug)}"
               class="group block bg-white rounded-xl border border-border-light overflow-hidden hover:shadow-lg transition-shadow">
                <div class="h-40 overflow-hidden">
                    <img src="${imageUrl}" alt="${this.escapeHtml(col.title)}"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                </div>
                <div class="p-5">
                    <h3 class="font-serif text-lg font-bold text-text-main group-hover:text-primary transition-colors">${this.escapeHtml(col.title)}</h3>
                    <p class="text-sm text-text-secondary mt-1">${count} biographies</p>
                </div>
            </a>
        `;
    },

    /**
     * Render "Why Womencypedia?" stats
     */
    renderWhyStats(stats) {
        const container = document.getElementById('why-stats-grid');
        if (!container) return;

        // Sanitize content before rendering to prevent XSS
        const safeContent = stats.map(stat => `
            <div class="text-center p-6">
                <div class="text-3xl md:text-4xl font-bold text-primary mb-2">${this.escapeHtml(stat.value || '')}</div>
                <h3 class="font-serif text-lg font-bold text-text-main mb-2">${this.escapeHtml(stat.title || '')}</h3>
                <p class="text-sm text-text-secondary">${this.escapeHtml(stat.description || '')}</p>
            </div>
        `).join('');
        container.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
    },

    /**
     * Render audience cards
     */
    renderAudienceCards(cards) {
        const container = document.getElementById('audience-cards-grid');
        if (!container) return;

        // Sanitize content before rendering to prevent XSS
        const safeContent = cards.map(card => `
            <div class="bg-white rounded-xl border border-border-light p-6 hover:shadow-lg transition-shadow">
                <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-primary text-2xl">${this.escapeHtml(card.icon || 'person')}</span>
                </div>
                <h3 class="font-serif text-lg font-bold text-text-main mb-2">${this.escapeHtml(card.title || '')}</h3>
                <p class="text-sm text-text-secondary">${this.escapeHtml(card.description || '')}</p>
            </div>
        `).join('');
        container.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
    },

    /**
     * Render credibility partner badges
     */
    renderCredibilityPartners(partners) {
        const container = document.getElementById('credibility-partners');
        if (!container) return;

        // Sanitize content before rendering to prevent XSS
        const safeContent = partners.map(p => `
            <div class="flex items-center gap-2 text-gray-400">
                <span class="text-sm font-medium">${this.escapeHtml(p.name || '')}</span>
            </div>
        `).join('');
        container.innerHTML = typeof Security !== 'undefined' ? Security.sanitize(safeContent) : safeContent;
    },

    // ─── Utility Methods ─────────────────────────────────────

    /**
     * Safely set text content of an element by ID
     */
    setTextContent(id, text) {
        if (!text) return;
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    /**
     * Safely set innerHTML with DOMPurify if available
     */
    setInnerHTML(id, html) {
        if (!html) return;
        const el = document.getElementById(id);
        if (!el) return;

        if (typeof DOMPurify !== 'undefined') {
            el.innerHTML = DOMPurify.sanitize(html);
        } else {
            console.warn(`DOMPurify not available; skipping HTML content for #${id}`);
            // Static fallback content remains visible
        }
    },
    /**
     * Flatten Strapi v4 collection response
     */
    flattenCollection(result) {
        if (!result || !result.data) return [];

        return result.data.map(item => {
            const attrs = item.attributes || item;
            const flat = { id: item.id, ...attrs };

            // Flatten nested relations
            Object.keys(flat).forEach(key => {
                if (flat[key] && flat[key].data) {
                    if (Array.isArray(flat[key].data)) {
                        flat[key] = flat[key].data.map(rel => ({
                            id: rel.id,
                            ...(rel.attributes || rel)
                        }));
                    } else if (flat[key].data) {
                        flat[key] = {
                            id: flat[key].data.id,
                            ...(flat[key].data.attributes || flat[key].data)
                        };
                    }
                }
            });

            return flat;
        });
    },

    /**
     * Get full media URL from Strapi media object
     */
    getMediaUrl(media) {
        if (!media) return 'images/placeholder-biography.jpg';

        // Handle Strapi v4 nested media format
        const mediaData = media.data ? (media.data.attributes || media.data) : media;
        const url = mediaData.url || mediaData.formats?.medium?.url || mediaData.formats?.small?.url;

        if (!url) return 'images/placeholder-biography.jpg';

        // If URL is relative, prepend the Strapi base URL
        if (url.startsWith('/')) {
            // Extract base URL without /api
            const baseUrl = CONFIG.API_BASE_URL.replace('/api', '');
            return `${baseUrl}${url}`;
        }

        return url;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    /**
     * Strip HTML tags from rich text to get plain text
     */
    stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Homepage.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Homepage;
}
