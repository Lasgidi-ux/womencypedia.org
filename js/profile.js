/**
 * Womencypedia User Profile — PRO Enhanced Version
 * Cleaner architecture, safer, scalable, production-ready
 */

//////////////////////////////
// CONFIG + HELPERS
//////////////////////////////

// Simple in-memory cache for API responses
const apiCache = new Map();

// Constants
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_LOCATION_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Feature flags for gradual rollout
const FEATURES = {
    ENABLE_PROFILE_EDITING: true,
    ENABLE_PASSWORD_CHANGE: true,
    ENABLE_AVATAR_UPLOAD: true,
    ENABLE_CACHING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_ADVANCED_VALIDATION: true
};

// PWA features
const pwaFeatures = {
    /**
     * Check if the app can be installed as PWA
     */
    canInstall() {
        return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
    },

    /**
     * Register service worker for offline functionality
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('[PWA] Service Worker registered:', registration.scope);

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New content available, show update prompt
                                this.showUpdatePrompt();
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        }
    },

    /**
     * Show update prompt when new version is available
     */
    showUpdatePrompt() {
        const updateToast = document.createElement('div');
        updateToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50';
        updateToast.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined">update</span>
                <div>
                    <p class="font-bold">Update Available</p>
                    <p class="text-sm">Refresh to get the latest version</p>
                </div>
                <button onclick="window.location.reload()" class="ml-2 bg-white text-blue-500 px-3 py-1 rounded text-sm font-bold hover:bg-gray-100">
                    Refresh
                </button>
            </div>
        `;
        document.body.appendChild(updateToast);

        // Auto-remove after 10 seconds
        setTimeout(() => updateToast.remove(), 10000);
    },

    /**
     * Check for app updates
     */
    checkForUpdates() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' });
        }
    }
};

/**
 * Profile API Client
 *
 * Centralized API client for profile-related operations with:
 * - Automatic request caching (5-minute TTL)
 * - Comprehensive error handling
 * - Performance monitoring
 * - Authentication header management
 *
 * @example
 * // Get user profile
 * const profile = await ProfileAPI.request('/api/users/me');
 *
 * // Update profile with caching
 * await ProfileAPI.request('/api/users/123', { method: 'PUT', body: data });
 *
 * // Clear cache after updates
 * ProfileAPI.invalidateCache('/api/users');
 */
const ProfileAPI = {
    /** Base API URL */
    base: (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'https://womencypedia-cms.onrender.com',

    /** Cache TTL in milliseconds */
    CACHE_TTL: CACHE_TTL_MS,

    /**
     * Make an API request with caching and error handling
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Response data
     */
    async request(url, options = {}) {
        const cacheKey = this._createCacheKey(url, options);

        // Check cache for GET requests
        if (this._shouldCache(options)) {
            const cached = this._getCachedResponse(cacheKey);
            if (cached) {
                console.log('[Profile] Using cached response for:', url);
                performanceMonitor.endMark(`api-${cacheKey}`);
                return cached;
            }
        }

        performanceMonitor.startMark(`api-${cacheKey}`);

        try {
            const response = await this._makeRequest(url, options);
            const data = await this._parseResponse(response);

            // Cache successful GET responses
            if (this._shouldCache(options)) {
                this._cacheResponse(cacheKey, data);
            }

            performanceMonitor.endMark(`api-${cacheKey}`);
            return data;
        } catch (err) {
            console.error('[Profile] API request failed:', {
                url,
                error: err.message,
                stack: err.stack,
                timestamp: new Date().toISOString()
            });
            performanceMonitor.endMark(`api-${cacheKey}`);
            throw err;
        }
    },

    /**
     * Create a cache key for the request
     * @private
     */
    _createCacheKey(url, options) {
        return `${options.method || 'GET'}:${url}`;
    },

    /**
     * Check if request should be cached
     * @private
     */
    _shouldCache(options) {
        return !options.method || options.method === 'GET';
    },

    /**
     * Get cached response if valid
     * @private
     */
    _getCachedResponse(cacheKey) {
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        return null;
    },

    /**
     * Make the actual HTTP request
     * @private
     */
    _makeRequest(url, options) {
        return fetch(url, {
            cache: 'no-store',
            ...options
        });
    },

    /**
     * Parse the response safely
     * @private
     */
    async _parseResponse(response) {
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error?.message || `HTTP ${response.status}`);
        }
        return await response.json();
    },

    /**
     * Cache the response
     * @private
     */
    _cacheResponse(cacheKey, data) {
        apiCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
    },

    getAuthHeaders() {
        if (typeof Auth === 'undefined') return {};
        const token = Auth.getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    // Cache management methods
    clearCache() {
        apiCache.clear();
        console.log('[Profile] API cache cleared');
    },

    invalidateCache(pattern) {
        const keysToDelete = [];
        for (const key of apiCache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => apiCache.delete(key));
        console.log(`[Profile] Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`);
    },

    /**
     * Retry failed requests with exponential backoff
     * @param {Function} requestFn - The request function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @returns {Promise} The result of the successful request
     */
    async retryRequest(requestFn, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;

                if (attempt < maxRetries && this._shouldRetry(error)) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.warn(`[Profile] Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    },

    /**
     * Check if an error should trigger a retry
     * @private
     */
    _shouldRetry(error) {
        // Retry on network errors or 5xx server errors
        return !error.message?.includes('4') || error.message?.includes('50');
    }
};

function safeText(str = '') {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function qs(id) {
    return document.getElementById(id);
}

/**
 * Show a non-blocking toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('success', 'error', 'warning', 'info')
 */
function profileToast(message, type = 'info') {
    if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(message, type);
        return;
    }
    // Fallback inline toast
    const toast = document.createElement('div');
    const bg = { success: '#16a34a', error: '#dc2626', warning: '#d97706', info: '#6366f1' }[type] || '#6366f1';
    toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;padding:12px 24px;border-radius:12px;background:${bg};color:#fff;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.15);opacity:0;transition:opacity .3s`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

//////////////////////////////
// STATE
//////////////////////////////

let profileData = {
    id: null,
    name: "Guest User",
    email: "",
    role: "Contributor",
    location: "",
    joinDate: "",
    avatar: null,
    bio: "",
    website: "",
    stats: { contributions: 0, saved: 0, badges: 0, views: 0 },
    contributions: [],
    nominations: [],
    saved: [],
    badges: []
};

let profileInitialized = false;

//////////////////////////////
// INIT
//////////////////////////////

document.addEventListener('DOMContentLoaded', async () => {
    if (profileInitialized) return;
    profileInitialized = true;

    // Initialize PWA features if enabled
    if (FEATURES.ENABLE_PERFORMANCE_MONITORING) {
        performanceMonitor.startMark('app-init');
    }

    // Register PWA features
    if (pwaFeatures.canInstall()) {
        pwaFeatures.registerServiceWorker();
        // Check for updates every hour
        setInterval(() => pwaFeatures.checkForUpdates(), 60 * 60 * 1000);
    }

    // Initialize UI components based on feature flags
    initUI();
    await loadProfile();

    if (FEATURES.ENABLE_PERFORMANCE_MONITORING) {
        performanceMonitor.endMark('app-init');
        console.log('[Performance] App initialization metrics:', performanceMonitor.getMetrics());
    }
});

function initUI() {
    initTabs();

    if (FEATURES.ENABLE_PROFILE_EDITING) {
        setupSettingsForm();
    }

    setup2FA();
    setupSessions();

    if (FEATURES.ENABLE_ADVANCED_VALIDATION) {
        setupNotificationPreferences();
    }
}

//////////////////////////////
// PROFILE LOAD
//////////////////////////////

async function loadProfile() {
    performanceMonitor.startMark('loadProfile');
    showSkeleton();

    try {
        if (!Auth?.isAuthenticated?.()) {
            console.info('[Profile] User not authenticated, loading demo profile');
            loadDemo();
            renderUI();
            hideSkeleton();
            performanceMonitor.endMark('loadProfile');
            return;
        }

        console.info('[Profile] Loading authenticated user profile');
        const user = await ProfileAPI.request(
            `${ProfileAPI.base}/api/users/me?populate=*`,
            { headers: ProfileAPI.getAuthHeaders() }
        );

        hydrateUser(user);

        await Promise.allSettled([
            loadStats(),
            loadContributions(),
            loadNominations(),
            loadSaved(),
            loadBadges()
        ]);

    } catch (err) {
        console.error('[Profile] Failed to load profile, falling back to demo:', {
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
        loadDemo();
    }

    renderUI();
    prefillSettingsForms();
    hideSkeleton();
    performanceMonitor.endMark('loadProfile');
}

function hydrateUser(user) {
    const avatarUrl =
        user.avatar?.url ||
        user.avatar?.data?.attributes?.url;

    profileData = {
        ...profileData,
        id: user.id,
        name: user.username || user.email || 'User',
        email: user.email || '',
        role: user.role?.name || user.role?.type || (typeof user.role === 'string' ? user.role : 'User'),
        location: user.location || '',
        bio: user.bio || '',
        website: user.website || '',
        joinDate: user.createdAt ? formatDate(user.createdAt) : '',
        avatar: avatarUrl
            ? avatarUrl.startsWith('http')
                ? avatarUrl
                : `${ProfileAPI.base}${avatarUrl}`
            : null
    };
}

//////////////////////////////
// LOAD DATA
//////////////////////////////

async function loadStats() {
    try {
        const res = await ProfileAPI.request(
            `${ProfileAPI.base}/api/contributions?filters[author][id][$eq]=${profileData.id}&pagination[pageSize]=1`,
            { headers: ProfileAPI.getAuthHeaders() }
        );

        profileData.stats.contributions = res.meta?.pagination?.total || 0;
    } catch { }
}

async function loadContributions() {
    try {
        const res = await ProfileAPI.request(
            `${ProfileAPI.base}/api/contributions?filters[author][id][$eq]=${profileData.id}&sort=createdAt:desc&pagination[pageSize]=5`,
            { headers: ProfileAPI.getAuthHeaders() }
        );

        profileData.contributions = (res.data || []).map(item => {
            const attrs = item.attributes || item;
            return { id: item.id, ...attrs };
        });
    } catch { }
}

async function loadNominations() {
    try {
        const res = await ProfileAPI.request(
            `${ProfileAPI.base}/api/nominations?filters[user][id][$eq]=${profileData.id}&sort=createdAt:desc&pagination[pageSize]=5`,
            { headers: ProfileAPI.getAuthHeaders() }
        );

        profileData.nominations = (res.data || []).map(item => {
            const attrs = item.attributes || item;
            return { id: item.id, ...attrs };
        });
    } catch (err) {
        if (err.message?.includes('403') || err.message?.includes('Forbidden') || err.message?.includes('Invalid key')) {
            console.warn('[Profile] Unable to load nominations');
            profileData.nominations = [];
        }
    }
}

async function loadSaved() {
    try {
        const res = await ProfileAPI.request(
            `${ProfileAPI.base}/api/users/me`,
            { headers: ProfileAPI.getAuthHeaders() }
        );

        profileData.saved = res.savedBiographies || [];
        profileData.stats.saved = profileData.saved.length;
    } catch { }
}

async function loadBadges() {
    try {
        const res = await ProfileAPI.request(
            `${ProfileAPI.base}/api/users/me?populate=badges`,
            { headers: ProfileAPI.getAuthHeaders() }
        );

        profileData.badges = res.badges || [];
        profileData.stats.badges = profileData.badges.length;
    } catch { }
}

//////////////////////////////
// DEMO MODE
//////////////////////////////

function loadDemo() {
    const data = JSON.parse(localStorage.getItem('demo_profile') || '{}');
    profileData = { ...profileData, ...data };
    // renderUI is called by loadProfile after this returns
}

//////////////////////////////
// RENDER
//////////////////////////////

function renderUI() {
    // Header card
    if (qs('profile-name')) qs('profile-name').textContent = profileData.name;
    if (qs('profile-email')) qs('profile-email').textContent = profileData.email || 'No email set';
    if (qs('profile-bio')) qs('profile-bio').textContent = profileData.bio || 'Member of the Womencypedia community.';
    if (qs('profile-joined')) qs('profile-joined').textContent = profileData.joinDate ? `Joined ${profileData.joinDate}` : 'Member since 2024';

    // Role badge
    const roleEl = qs('profile-role');
    if (roleEl && profileData.role) {
        roleEl.textContent = profileData.role;
        roleEl.classList.remove('hidden');
    }

    // Location
    const locEl = qs('profile-location');
    if (locEl) locEl.textContent = profileData.location || '';

    renderAvatar();
    renderStats();
    renderContributions();
    renderSaved();
    renderNominations();
    renderBadges();
    renderProfileCompleteness();
}

function renderAvatar() {
    const el = qs('profile-avatar-container');
    if (!el) return;

    if (profileData.avatar) {
        el.innerHTML = `<img src="${safeText(profileData.avatar)}" alt="${safeText(profileData.name)}" class="w-full h-full object-cover">`;
    } else {
        el.innerHTML = `<span class="text-3xl font-serif font-bold text-white">${safeText(getInitials(profileData.name))}</span>`;
    }
}

function renderStats() {
    if (qs('stat-contributions'))
        qs('stat-contributions').textContent = profileData.stats.contributions;

    if (qs('stat-saved'))
        qs('stat-saved').textContent = profileData.stats.saved;

    if (qs('stat-badges'))
        qs('stat-badges').textContent = profileData.stats.badges;

    if (qs('stat-views'))
        qs('stat-views').textContent = profileData.stats.views;
}

function renderContributions() {
    const el = qs('contributions-list');
    if (!el) return;

    if (!profileData.contributions.length) {
        el.innerHTML = `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-5xl text-text-secondary/40 mb-4 block">edit_note</span>
                <h3 class="font-serif text-lg font-semibold text-text-main mb-2">No contributions yet</h3>
                <p class="text-text-secondary text-sm mb-4">Start sharing your knowledge with the community.</p>
                <a href="share-story.html" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                    Share Your Story
                </a>
            </div>
        `;
        return;
    }

    el.innerHTML = profileData.contributions.map(c => {
        const statusColor = {
            published: 'bg-green-100 text-green-700',
            draft: 'bg-yellow-100 text-yellow-700',
            pending: 'bg-blue-100 text-blue-700',
            rejected: 'bg-red-100 text-red-700'
        }[c.status] || 'bg-gray-100 text-gray-700';

        const displayTitle = safeText(c.title || c.name || 'Untitled');

        return `
            <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-border-light hover:shadow-md transition-shadow">
                <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-primary text-[20px]">${c.type === 'nomination' ? 'person_add' : 'article'}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-serif font-semibold text-text-main truncate">${displayTitle}</h4>
                    <p class="text-sm text-text-secondary mt-1">${formatDate(c.createdAt)}</p>
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${safeText(c.status || 'draft')}</span>
            </div>
        `;
    }).join('');
}

function renderNominations() {
    const el = qs('nominations-list');
    if (!el) return;

    if (!profileData.nominations.length) {
        el.innerHTML = `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-5xl text-text-secondary/40 mb-4 block">person_add</span>
                <h3 class="font-serif text-lg font-semibold text-text-main mb-2" data-i18n="profile.noNominationsYet">No nominations yet</h3>
                <p class="text-text-secondary text-sm mb-4">Nominate a remarkable woman to be featured on Womencypedia.</p>
                <a href="nominate.html" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">add</span> Nominate
                </a>
            </div>
        `;
        return;
    }

    el.innerHTML = profileData.nominations.map(n => {
        const safeName = safeText(n.name || n.title || 'Unnamed');
        const statusColor = {
            approved: 'bg-green-100 text-green-700',
            pending: 'bg-blue-100 text-blue-700',
            rejected: 'bg-red-100 text-red-700'
        }[n.status] || 'bg-gray-100 text-gray-700';

        return `
            <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-border-light hover:shadow-md transition-shadow">
                <div class="size-10 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-accent-teal text-[20px]">person_add</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-serif font-semibold text-text-main truncate">${safeName}</h4>
                    <p class="text-sm text-text-secondary mt-1">${formatDate(n.createdAt)}</p>
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${safeText(n.status || 'pending')}</span>
            </div>
        `;
    }).join('');
}

function renderSaved() {
    const el = qs('saved-list');
    if (!el) return;

    if (!profileData.saved.length) {
        el.innerHTML = `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-5xl text-text-secondary/40 mb-4 block">bookmark_border</span>
                <h3 class="font-serif text-lg font-semibold text-text-main mb-2">No saved items</h3>
                <p class="text-text-secondary text-sm mb-4">Bookmark biographies to save them here.</p>
                <a href="browse.html" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">explore</span>
                    Browse Biographies
                </a>
            </div>
        `;
        return;
    }

    el.innerHTML = profileData.saved.map(s => {
        const attrs = s.attributes || s;
        const safeName = safeText(attrs.name || 'Unnamed');
        const safeRegion = safeText(attrs.region || '');
        const safeEra = safeText(attrs.era || '');
        const safeSlug = encodeURIComponent(String(attrs.slug || s.id));

        let imageUrl = null;
        if (attrs.image?.url) {
            imageUrl = attrs.image.url.startsWith('http')
                ? attrs.image.url
                : `${ProfileAPI.base}${attrs.image.url}`;
        }

        return `
            <a href="biography.html?slug=${safeSlug}" class="flex items-center gap-4 p-4 bg-white rounded-xl border border-border-light hover:shadow-md transition-shadow group">
                <div class="size-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10">
                    ${imageUrl
                ? `<img src="${safeText(imageUrl)}" alt="${safeName}" class="w-full h-full object-cover">`
                : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-primary/40">person</span></div>`
            }
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-serif font-semibold text-text-main truncate group-hover:text-primary transition-colors">${safeName}</h4>
                    <p class="text-sm text-text-secondary">${safeRegion}${safeRegion && safeEra ? ' • ' : ''}${safeEra}</p>
                </div>
                <span class="material-symbols-outlined text-text-secondary/40 group-hover:text-primary transition-colors">chevron_right</span>
            </a>
        `;
    }).join('');
}

/**
 * Check and award badges based on user activity
 * This function should be called after user actions (contributions, reviews, etc.)
 */
async function checkAndAwardBadges() {
    try {
        const token = localStorage.getItem('womencypedia_access_token');
        if (!token) return;

        const response = await fetch(`${ProfileAPI.base}/api/badges/check`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.newBadges && result.newBadges.length > 0) {
                // Show notification for new badges
                result.newBadges.forEach(badge => {
                    showBadgeNotification(badge);
                });
                // Reload badges display
                await loadBadges();
                renderBadges();
                renderStats();
            }
        }
    } catch (error) {
        console.warn('[Profile] Badge check failed:', error.message);
    }
}

/**
 * Show a notification when a new badge is earned
 */
function showBadgeNotification(badge) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-white border border-border-light rounded-xl shadow-lg p-4 z-50';
    notification.style.cssText = 'animation: slideIn .3s ease-out; transform: translateX(0)';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="size-12 rounded-full bg-accent-gold/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-accent-gold text-2xl">${badge.icon || 'workspace_premium'}</span>
            </div>
            <div>
                <h4 class="font-bold text-text-main">New Badge Earned!</h4>
                <p class="text-sm text-text-secondary">${safeText(badge.name)}</p>
            </div>
        </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity .3s';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function renderBadges() {
    const el = qs('badges-grid');
    if (!el) return;

    if (!profileData.badges.length) {
        el.innerHTML = `
            <div class="col-span-full text-center py-12">
                <span class="material-symbols-outlined text-5xl text-text-secondary/40 mb-4 block">workspace_premium</span>
                <h3 class="font-serif text-lg font-semibold text-text-main mb-2">No badges yet</h3>
                <p class="text-text-secondary text-sm mb-4">Start contributing to earn recognition badges.</p>
                <a href="share-story.html" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                    Share Your Story
                </a>
            </div>
        `;
        return;
    }

    el.innerHTML = profileData.badges.map(badge => {
        const attrs = badge.attributes || badge;
        const safeName = safeText(attrs.name || 'Unnamed Badge');
        const safeDescription = safeText(attrs.description || '');
        const icon = attrs.icon || 'workspace_premium';
        const color = attrs.color || 'primary';

        const colorClasses = {
            primary: 'bg-primary/10 text-primary',
            teal: 'bg-accent-teal/10 text-accent-teal',
            gold: 'bg-accent-gold/10 text-accent-gold',
            bronze: 'bg-amber-100 text-amber-700',
            silver: 'bg-gray-100 text-gray-600'
        }[color] || 'bg-primary/10 text-primary';

        return `
            <div class="bg-white rounded-xl p-6 border border-border-light flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left hover:shadow-md hover:border-primary/20 transition-all">
                <div class="size-14 rounded-full ${colorClasses} flex items-center justify-center">
                    <span class="material-symbols-outlined text-2xl">${icon}</span>
                </div>
                <div>
                    <h4 class="font-bold text-text-main">${safeName}</h4>
                    <p class="text-xs text-text-secondary">${safeDescription}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderProfileCompleteness() {
    const completenessEl = qs('profile-completeness');
    if (!completenessEl) return;

    let completed = 0;
    const total = 4;

    // Check avatar
    if (profileData.avatar) {
        completed++;
        updateCompletenessIcon('avatar-check', true);
    } else {
        updateCompletenessIcon('avatar-check', false);
    }

    // Check bio
    if (profileData.bio && profileData.bio.trim() && profileData.bio !== 'Member of the Womencypedia community.') {
        completed++;
        updateCompletenessIcon('bio-check', true);
    } else {
        updateCompletenessIcon('bio-check', false);
    }

    // Check location
    if (profileData.location && profileData.location.trim()) {
        completed++;
        updateCompletenessIcon('location-check', true);
    } else {
        updateCompletenessIcon('location-check', false);
    }

    // Check website
    if (profileData.website && profileData.website.trim()) {
        completed++;
        updateCompletenessIcon('website-check', true);
    } else {
        updateCompletenessIcon('website-check', false);
    }

    // Update progress bar
    const percentage = Math.round((completed / total) * 100);
    const barEl = qs('completeness-bar');
    const percentEl = qs('completeness-percentage');

    if (barEl) {
        barEl.style.width = `${percentage}%`;
        barEl.setAttribute('aria-valuenow', percentage);
    }
    if (percentEl) percentEl.textContent = `${percentage}%`;
}

function updateCompletenessIcon(iconId, completed) {
    const iconEl = qs(iconId);
    if (!iconEl) return;

    const circle = iconEl.querySelector('div');
    const symbol = iconEl.querySelector('span');

    if (completed) {
        circle.classList.remove('border-border-light');
        circle.classList.add('border-green-500', 'bg-green-50');
        symbol.classList.remove('text-border-light');
        symbol.classList.add('text-green-600');
    } else {
        circle.classList.remove('border-green-500', 'bg-green-50');
        circle.classList.add('border-border-light');
        symbol.classList.remove('text-green-600');
        symbol.classList.add('text-border-light');
    }
}

//////////////////////////////
// AVATAR UPLOAD
//////////////////////////////

// Called from profile.html's onchange="handleAvatarUpload(event)"
function handleAvatarUpload(event) {
    const file = event?.target?.files?.[0];
    if (file) {
        resizeAndUploadAvatar(file);
    }
}

async function resizeAndUploadAvatar(file) {
    try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            profileToast('Please upload a JPG, PNG, GIF, or WebP image.', 'warning');
            return;
        }

        // Check original file size
        if (file.size > 5 * 1024 * 1024) { // 5MB limit for original
            profileToast('Image must be under 5MB.', 'warning');
            return;
        }

        profileToast('Processing image...', 'info');

        // Resize image if needed
        const resizedFile = await resizeImage(file, 512, 512, 0.8); // Max 512x512, 80% quality

        uploadAvatar(resizedFile);

    } catch (err) {
        console.error('[Profile] Image resize failed:', err);
        profileToast('Failed to process image. Please try again.', 'error');
    }
}

async function resizeImage(file, maxWidth, maxHeight, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create new file with same name but compressed
                        const resizedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(resizedFile);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                file.type,
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

async function uploadAvatar(file) {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        profileToast('Please upload a JPG, PNG, GIF, or WebP image.', 'warning');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        profileToast('Image must be under 2MB.', 'warning');
        return;
    }

    const token = Auth?.getAccessToken?.();

    // Demo mode — save as base64 in localStorage
    if (!token) {
        const reader = new FileReader();
        reader.onload = e => {
            profileData.avatar = e.target.result;
            localStorage.setItem('demo_profile', JSON.stringify(profileData));
            renderAvatar();
            profileToast('Avatar updated (demo mode)', 'success');
        };
        return reader.readAsDataURL(file);
    }

    try {
        const fd = new FormData();
        fd.append('files', file);

        // Do NOT set Content-Type header for FormData — browser sets it with boundary
        const upload = await ProfileAPI.request(
            `${ProfileAPI.base}/api/upload`,
            {
                method: 'POST',
                headers: { ...ProfileAPI.getAuthHeaders() },
                body: fd
            }
        );

        const fileId = upload[0]?.id;
        if (!fileId) throw new Error('Upload returned no file');

        await ProfileAPI.request(
            `${ProfileAPI.base}/api/users/${profileData.id}`,
            {
                method: 'PUT',
                headers: {
                    ...ProfileAPI.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avatar: fileId })
            }
        );

        const uploadedUrl = upload[0].url;
        profileData.avatar = uploadedUrl?.startsWith('http') ? uploadedUrl : `${ProfileAPI.base}${uploadedUrl}`;
        renderAvatar();
        profileToast('Avatar updated successfully!', 'success');

    } catch (err) {
        console.error('[Profile] Avatar upload failed:', err.message);
        profileToast('Upload failed. Please try again.', 'error');
    }
}

//////////////////////////////
// EDIT PROFILE (Modal)
//////////////////////////////

function showEditModal() {
    const modal = qs('edit-profile-modal');
    if (!modal) return;

    // Prefill modal form with current data
    qs('modal-name').value = profileData.name || '';
    qs('modal-email').value = profileData.email || '';
    qs('modal-bio').value = profileData.bio || '';
    qs('modal-location').value = profileData.location || '';
    qs('modal-website').value = profileData.website || '';

    // Show modal
    modal.classList.remove('hidden');
    setTimeout(() => { qs('modal-name')?.focus(); }, 100);
}

function closeEditModal() {
    const modal = qs('edit-profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function saveProfile() {
    try {
        if (Auth?.isAuthenticated?.()) {
            await ProfileAPI.request(
                `${ProfileAPI.base}/api/users/${profileData.id}`,
                {
                    method: 'PUT',
                    headers: {
                        ...ProfileAPI.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: profileData.name,
                        bio: profileData.bio,
                        location: profileData.location,
                        website: profileData.website
                    })
                }
            );
        } else {
            localStorage.setItem('demo_profile', JSON.stringify(profileData));
        }

        // Clear cache after successful profile update
        ProfileAPI.invalidateCache('/api/users');

        renderUI();

    } catch (err) {
        console.error('[Profile] Save failed:', {
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
        throw err; // Re-throw so callers can handle
    }
}

//////////////////////////////
// UTIL
//////////////////////////////

function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Validate profile settings form inputs
 * @returns {Object} Validation result with valid boolean and error message
 */
function validateProfileForm() {
    const name = qs('settings-name')?.value?.trim();
    const bio = qs('settings-bio')?.value?.trim();
    const location = qs('settings-location')?.value?.trim();
    const website = qs('settings-website')?.value?.trim();

    return validateProfileData(name, bio, location, website);
}

/**
 * Validate modal form inputs
 * @returns {Object} {valid: boolean, message: string}
 */
function validateModalForm() {
    const name = qs('modal-name')?.value?.trim();
    const bio = qs('modal-bio')?.value?.trim();
    const location = qs('modal-location')?.value?.trim();
    const website = qs('modal-website')?.value?.trim();

    return validateProfileData(name, bio, location, website);
}

/**
 * Common validation logic for profile data
 * @param {string} name
 * @param {string} bio
 * @param {string} location
 * @param {string} website
 * @returns {Object} {valid: boolean, message: string}
 */
function validateProfileData(name, bio, location, website) {
    // Name validation
    if (name && name.length > MAX_NAME_LENGTH) {
        return { valid: false, message: `Name must be less than ${MAX_NAME_LENGTH} characters.` };
    }

    if (name && name.length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters.' };
    }

    // Bio validation
    if (bio && bio.length > MAX_BIO_LENGTH) {
        return { valid: false, message: `Bio must be less than ${MAX_BIO_LENGTH} characters.` };
    }

    // Location validation
    if (location && location.length > MAX_LOCATION_LENGTH) {
        return { valid: false, message: `Location must be less than ${MAX_LOCATION_LENGTH} characters.` };
    }

    // Website validation
    if (website && website.length > 0) {
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
            website = 'https://' + website;
        }
        try {
            new URL(website);
        } catch {
            return { valid: false, message: 'Please enter a valid website URL.' };
        }
    }

    return { valid: true };
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {Object} {valid: boolean, message: string}
 */
function validatePassword(password) {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        return { valid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` };
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return { valid: false, message: `Password must be less than ${MAX_PASSWORD_LENGTH} characters long.` };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number.' };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (weakPasswords.includes(password.toLowerCase())) {
        return { valid: false, message: 'Please choose a stronger password.' };
    }

    return { valid: true };
}

function formatDate(date) {
    if (!date) return '';
    try {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return '';
    }
}

/**
 * Show loading skeleton for profile card
 */
function showSkeleton() {
    qs('profile-card')?.classList.add('animate-pulse');
}

/**
 * Hide loading skeleton for profile card
 */
function hideSkeleton() {
    qs('profile-card')?.classList.remove('animate-pulse');
}

/**
 * Utility for managing loading states on forms
 * @param {HTMLFormElement} form - The form element
 * @param {boolean} loading - Whether to show loading state
 * @param {string} loadingText - Text to show on submit button while loading
 */
function setFormLoadingState(form, loading, loadingText = 'Loading...') {
    if (!form) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const inputs = form.querySelectorAll('input, textarea, select');

    if (loading) {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent || submitBtn.innerHTML;
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin mr-2">refresh</span>${loadingText}`;
        }
        inputs.forEach(input => input.disabled = true);
    } else {
        if (submitBtn) {
            submitBtn.disabled = false;
            if (submitBtn.dataset.originalText) {
                submitBtn.innerHTML = submitBtn.dataset.originalText;
                delete submitBtn.dataset.originalText;
            }
        }
        inputs.forEach(input => input.disabled = false);
    }
}

function initTabs() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => showTab(btn.dataset.tab));
    });
}

/**
 * Show a specific tab by id — callable from HTML onclick
 */
function showTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('[data-tab-content]')
        .forEach(c => c.style.display = 'none');

    // Show requested tab content
    const target = qs(tabId);
    if (target) target.style.display = 'block';

    // Update tab button styling
    document.querySelectorAll('[data-tab]').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        // Reset all to inactive first
        btn.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-lavender-soft/30');
        btn.classList.remove('text-text-secondary');

        if (isActive) {
            btn.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-lavender-soft/30');
        } else {
            btn.classList.add('text-text-secondary');
        }
    });
}

//////////////////////////////
// AUTH ACTIONS
//////////////////////////////

function handleLogout() {
    if (!confirm('Are you sure you want to sign out?')) return;
    try {
        if (typeof Auth !== 'undefined' && Auth.logout) {
            Auth.logout();
        } else {
            localStorage.removeItem('womencypedia_access_token');
            localStorage.removeItem('womencypedia_refresh_token');
            localStorage.removeItem('womencypedia_user');
        }
    } catch { }
    window.location.href = 'index.html';
}

function confirmDeleteAccount() {
    if (!confirm('This will PERMANENTLY delete your account and all data. This cannot be undone. Are you absolutely sure?')) return;
    const typed = prompt('Type DELETE to confirm account deletion:');
    if (typed !== 'DELETE') {
        profileToast('Account deletion cancelled.', 'info');
        return;
    }

    const password = prompt('Enter your current password to confirm account deletion:');
    if (!password || password.trim() === '') {
        profileToast('Password is required to delete account.', 'warning');
        return;
    }

    ProfileAPI.request(`${ProfileAPI.base}/api/users/me/delete`, {
        method: 'POST',
        headers: {
            ...ProfileAPI.getAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: password.trim() })
    }).then(() => {
        profileToast('Account deleted.', 'success');
        setTimeout(handleLogout, 1500);
    }).catch((err) => {
        let errorMessage = err.message || 'Could not delete account. Please contact support.';
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            errorMessage = 'You don\'t have permission to delete this account. Please contact support.';
        }
        profileToast(`Could not delete account: ${errorMessage}`, 'error');
    });
}

function openPasswordModal() {
    const modal = qs('password-modal');
    if (!modal) return;

    // Clear form
    qs('password-form').reset();

    // Show modal
    modal.classList.remove('hidden');
    setTimeout(() => { qs('current-password')?.focus(); }, 100);

    // Add keyboard event listener for Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closePasswordModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Store the handler so we can remove it later
    modal._escapeHandler = handleEscape;
}

function closePasswordModal() {
    const modal = qs('password-modal');
    if (modal) {
        modal.classList.add('hidden');
        // Remove keyboard event listener
        if (modal._escapeHandler) {
            document.removeEventListener('keydown', modal._escapeHandler);
            modal._escapeHandler = null;
        }
    }
}

function handlePasswordSubmit(event) {
    event.preventDefault();

    const form = qs('password-form');
    const submitBtn = form?.querySelector('[type="submit"]');
    const currentPw = qs('current-password').value;
    const newPw = qs('new-password').value;
    const confirmPw = qs('confirm-password').value;

    // Validate current password
    if (!currentPw || currentPw.trim().length === 0) {
        profileToast('Please enter your current password.', 'warning');
        return;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPw);
    if (!passwordValidation.valid) {
        profileToast(passwordValidation.message, 'warning');
        return;
    }

    if (newPw !== confirmPw) {
        profileToast('Passwords do not match.', 'warning');
        return;
    }

    // Check if new password is different from current
    if (currentPw === newPw) {
        profileToast('New password must be different from current password.', 'warning');
        return;
    }

    // Show loading state
    const origText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span> Updating...';
    }
    if (form) {
        form.querySelectorAll('input').forEach(input => input.disabled = true);
    }

    ProfileAPI.request(`${ProfileAPI.base}/api/auth/change-password`, {
        method: 'POST',
        headers: {
            ...ProfileAPI.getAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            currentPassword: currentPw,
            password: newPw,
            passwordConfirmation: confirmPw
        })
    }).then(() => {
        profileToast('Password updated successfully!', 'success');
        closePasswordModal();
    }).catch((err) => {
        profileToast(err.message || 'Could not update password.', 'error');
        // Keep modal open on error so user can try again
    }).finally(() => {
        // Restore form state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
        }
        if (form) {
            form.querySelectorAll('input').forEach(input => input.disabled = false);
        }
    });
}

async function enable2FA() {
    try {
        // Check if 2FA plugin is available
        const response = await ProfileAPI.request(`${ProfileAPI.base}/api/auth/2fa/status`, {
            headers: ProfileAPI.getAuthHeaders()
        });

        if (!response.available) {
            hide2FAButton();
            profileToast('Two-Factor Authentication is not available on this server.', 'info');
            return;
        }

        // Generate 2FA secret and QR code
        const setupResponse = await ProfileAPI.request(`${ProfileAPI.base}/api/auth/2fa/setup`, {
            method: 'POST',
            headers: {
                ...ProfileAPI.getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });

        // Show QR code modal (simplified - in real implementation, show QR code)
        const code = prompt('Scan the QR code with your authenticator app and enter the verification code:');
        if (!code) return;

        // Verify and enable 2FA
        await ProfileAPI.request(`${ProfileAPI.base}/api/auth/2fa/enable`, {
            method: 'POST',
            headers: {
                ...ProfileAPI.getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code
            })
        });

        profileToast('Two-Factor Authentication enabled successfully!', 'success');
        update2FAButton(true);

    } catch (err) {
        console.error('[Profile] 2FA setup failed:', err);
        if (err.status === 404) {
            hide2FAButton();
            profileToast('Two-Factor Authentication is not available on this server.', 'info');
        } else {
            profileToast('Failed to enable 2FA. Please try again.', 'error');
        }
    }
}

function hide2FAButton() {
    const btn = qs('enable-2fa-btn');
    if (btn) btn.style.display = 'none';
}

function update2FAButton(enabled) {
    const btn = qs('enable-2fa-btn');
    if (!btn) return;

    if (enabled) {
        btn.textContent = 'Enabled';
        btn.disabled = true;
        btn.classList.add('bg-green-100', 'text-green-700', 'cursor-not-allowed');
        btn.classList.remove('bg-accent-teal/10', 'text-accent-teal', 'hover:bg-accent-teal/20');
    }
}

//////////////////////////////
// SETTINGS FORM
//////////////////////////////

function prefillSettingsForms() {
    const nameField = qs('settings-name');
    const emailField = qs('settings-email');
    const bioField = qs('settings-bio');
    const locField = qs('settings-location');
    const webField = qs('settings-website');

    if (nameField) nameField.value = profileData.name || '';
    if (emailField) emailField.value = profileData.email || '';
    if (bioField) bioField.value = profileData.bio || '';
    if (locField) locField.value = profileData.location || '';
    if (webField) webField.value = profileData.website || '';

    // Set hidden username for password form accessibility
    const usernameField = qs('password-username');
    if (usernameField) usernameField.value = profileData.email || '';
}

function setupSettingsForm() {
    const form = qs('edit-profile-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('[type="submit"]');
            const origText = submitBtn?.innerHTML;

            try {
                // Validate form inputs
                const validation = validateProfileForm();
                if (!validation.valid) {
                    profileToast(validation.message, 'warning');
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span> Saving...';
                }

                profileData.name = qs('settings-name')?.value?.trim() || profileData.name;
                profileData.bio = qs('settings-bio')?.value?.trim() || profileData.bio;
                profileData.location = qs('settings-location')?.value?.trim() || profileData.location;
                profileData.website = qs('settings-website')?.value?.trim() || profileData.website;

                await saveProfile();
                profileToast('Profile updated!', 'success');
            } catch {
                profileToast('Save failed. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origText;
                }
            }
        });
    }

    // Setup modal form
    const modalForm = qs('edit-profile-modal-form');
    if (modalForm) {
        modalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = modalForm.querySelector('[type="submit"]');
            const origText = submitBtn?.innerHTML;

            try {
                // Validate modal form inputs
                const validation = validateModalForm();
                if (!validation.valid) {
                    profileToast(validation.message, 'warning');
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span> Saving...';
                }

                profileData.name = qs('modal-name')?.value?.trim() || profileData.name;
                profileData.bio = qs('modal-bio')?.value?.trim() || profileData.bio;
                profileData.location = qs('modal-location')?.value?.trim() || profileData.location;
                profileData.website = qs('modal-website')?.value?.trim() || profileData.website;

                await saveProfile();
                profileToast('Profile updated!', 'success');
                closeEditModal();
            } catch {
                profileToast('Save failed. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origText;
                }
            }
        });
    }
}

function setup2FA() {
    const btn = qs('enable-2fa-btn');
    if (btn) {
        btn.addEventListener('click', enable2FA);
    }
}

function setupNotificationPreferences() {
    // Load preferences on page load
    loadNotificationPreferences();

    // Save preferences when toggles change
    const toggles = ['email-notifications', 'contribution-updates', 'weekly-digest'];
    toggles.forEach(id => {
        const toggle = qs(id);
        if (toggle) {
            toggle.addEventListener('change', () => {
                // Debounce saves to avoid too many API calls
                clearTimeout(toggle._saveTimeout);
                toggle._saveTimeout = setTimeout(saveNotificationPreferences, 1000);
            });
        }
    });
}

function setupSessions() {
    const btn = qs('view-sessions-btn');
    if (btn) {
        btn.addEventListener('click', viewSessions);
    }
}

async function viewSessions() {
    try {
        // Try to fetch sessions from Strapi (if custom endpoint exists)
        const response = await ProfileAPI.request(`${ProfileAPI.base}/api/users/me/sessions`, {
            headers: ProfileAPI.getAuthHeaders()
        });

        // If successful, show sessions (implementation would depend on API response)
        console.log('Sessions:', response);
        profileToast('Active sessions feature coming soon!', 'info');

    } catch (err) {
        // If endpoint doesn't exist (404), show message
        if (err.status === 404) {
            profileToast('Active sessions are not available with the current server configuration.', 'info');
        } else {
            profileToast('Unable to load active sessions.', 'error');
        }
    }
}

async function exportUserData() {
    try {
        profileToast('Preparing your data export...', 'info');

        // Try to call the export endpoint
        const response = await fetch(`${ProfileAPI.base}/api/users/me/export`, {
            method: 'GET',
            headers: ProfileAPI.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.status}`);
        }

        // Get the data as blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `womencypedia-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        profileToast('Data export downloaded successfully!', 'success');

    } catch (err) {
        console.error('[Profile] Data export failed:', err);
        if (err.message.includes('404')) {
            profileToast('Data export is not available with the current server configuration.', 'info');
        } else {
            profileToast('Failed to export data. Please try again.', 'error');
        }
    }
}

async function saveNotificationPreferences() {
    const preferences = {
        emailNotifications: qs('email-notifications')?.checked || false,
        contributionUpdates: qs('contribution-updates')?.checked || false,
        weeklyDigest: qs('weekly-digest')?.checked || false
    };

    try {
        await ProfileAPI.request(
            `${ProfileAPI.base}/api/users/me/preferences`,
            {
                method: 'PUT',
                headers: {
                    ...ProfileAPI.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notificationPreferences: preferences })
            }
        );

        profileToast('Notification preferences saved!', 'success');

    } catch (err) {
        console.error('[Profile] Save preferences failed:', err);
        // Don't show error for now to avoid spam - preferences can be saved later
    }
}

async function loadNotificationPreferences() {
    try {
        const response = await ProfileAPI.request(
            `${ProfileAPI.base}/api/users/me`,
            { headers: ProfileAPI.getAuthHeaders() }
        );

        const prefs = response.notificationPreferences || {};

        if (qs('email-notifications')) qs('email-notifications').checked = prefs.emailNotifications || false;
        if (qs('contribution-updates')) qs('contribution-updates').checked = prefs.contributionUpdates || false;
        if (qs('weekly-digest')) qs('weekly-digest').checked = prefs.weeklyDigest || false;

    } catch (err) {
        // Preferences not available, use defaults
        if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
            console.log('[Profile] User not authenticated, using default preferences');
        } else {
            console.log('[Profile] Could not load notification preferences:', err.message);
        }
    }
}

// Ensure functions are globally available for onclick handlers
// Global error monitoring and performance tracking
window.addEventListener('error', function(event) {
    console.error('[Profile] Unhandled error:', {
        message: event.error?.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
    });
    // Could send to error monitoring service here
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('[Profile] Unhandled promise rejection:', {
        reason: event.reason,
        timestamp: new Date().toISOString()
    });
    // Could send to error monitoring service here
});

// Performance monitoring
const performanceMonitor = {
    marks: new Map(),
    measures: [],

    startMark(name) {
        if ('performance' in window && performance.mark) {
            performance.mark(`${name}-start`);
            this.marks.set(name, Date.now());
        }
    },

    endMark(name) {
        if ('performance' in window && performance.mark && performance.measure) {
            try {
                performance.mark(`${name}-end`);
                performance.measure(name, `${name}-start`, `${name}-end`);
                const measure = performance.getEntriesByName(name)[0];
                console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
                this.measures.push({
                    name,
                    duration: measure.duration,
                    timestamp: Date.now()
                });
            } catch (e) {
                // Performance API not fully supported
            }
        }
    },

    getMetrics() {
        return {
            measures: this.measures,
            averageResponseTime: this.measures.length > 0 ?
                this.measures.reduce((sum, m) => sum + m.duration, 0) / this.measures.length : 0
        };
    }
};

// Make functions globally available for onclick handlers
window.exportUserData = exportUserData;
window.confirmDeleteAccount = confirmDeleteAccount;
window.handleLogout = handleLogout;
window.showEditModal = showEditModal;
window.closeEditModal = closeEditModal;
window.saveProfile = saveProfile;
window.handleAvatarUpload = handleAvatarUpload;
window.showTab = showTab;
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.handlePasswordSubmit = handlePasswordSubmit;