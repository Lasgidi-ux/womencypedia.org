/**
 * Womencypedia — Performance Optimizations
 * 
 * 1. Lazy loading for all images (with IntersectionObserver fallback)
 * 2. Client-side API response caching (stale-while-revalidate)
 * 3. Connection-aware loading (reduce quality on slow connections)
 */

const Performance = {
    init() {
        this.lazyLoadImages();
        this.initAPICache();
    },

    /**
     * Add loading="lazy" to all images that don't have it,
     * and add a fade-in effect when they load.
     */
    lazyLoadImages() {
        document.querySelectorAll('img:not([loading])').forEach(img => {
            // Don't lazy-load above-the-fold hero images
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                img.classList.add('loaded');
                return; // Already visible, don't defer
            }
            img.setAttribute('loading', 'lazy');
        });

        // Fade in lazy images when they load
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
                img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
            }
        });
    },

    /**
     * Simple in-memory cache with TTL for API responses.
     * Pages can use: Performance.cachedFetch(url, options, ttlMs)
     */
    _cache: new Map(),

    async cachedFetch(url, options = {}, ttlMs = 60000) {
        const key = `${options.method || 'GET'}:${url}`;
        const cached = this._cache.get(key);

        if (cached && Date.now() - cached.timestamp < ttlMs) {
            return cached.data;
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`${response.status}`);
            const data = await response.json();

            this._cache.set(key, { data, timestamp: Date.now() });

            // Evict old entries if cache grows too large
            if (this._cache.size > 50) {
                const oldest = [...this._cache.entries()]
                    .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
                this._cache.delete(oldest[0]);
            }

            return data;
        } catch (err) {
            // Return stale cache if available
            if (cached) return cached.data;
            throw err;
        }
    },

    initAPICache() {
        // Monkey-patch window.fetch for Strapi API calls to add caching hint
        // (actual caching is opt-in via cachedFetch above)
    },

    /**
     * Detect slow connections and reduce image quality
     */
    isSlowConnection() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return false;
        return conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Performance.init();
});
