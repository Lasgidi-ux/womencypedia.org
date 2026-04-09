/**
 * Womencypedia API Service - FINAL FIXED & PRODUCTION READY
 * 
 * Centralized API client for all backend communications.
 * Uses Strapi CMS as the primary data source.
 * Fixed: submitStory now works directly with /api/contributions
 * Guaranteed window.API availability
 */

class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

const LegacyAPI = {
    // Use CONFIG for dynamic base URL to match environment configuration
    get baseURL() {
        return typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL ? CONFIG.API_BASE_URL : "https://womencypedia-cms.onrender.com";
    },

    // ============================================
    // CORE SUBMIT STORY - FIXED & WORKING
    // ============================================
    async submitStory(formData) {
        try {
            const token = localStorage.getItem("womencypedia_access_token");

            const response = await fetch(`${this.baseURL}/api/contributions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({
                    data: {
                        storyType: formData.storyType || "other",
                        subjectName: formData.subjectName,
                        relationship: formData.relationship || "",
                        storyRegion: formData.storyRegion || "",
                        theme: formData.theme,
                        story: formData.story,
                        lessons: formData.lessons || "",
                        contactName: formData.contactName,
                        contactEmail: formData.contactEmail,
                        permissionGranted: formData.permission === true
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            const result = await response.json();
            
            return result;
        } catch (err) {
            
            throw err;
        }
    },

    // ============================================
    // EXISTING METHODS (kept for other pages)
    // ============================================

    _useStrapi: true,

    async init() {
        this._useStrapi = typeof CONFIG !== 'undefined' && CONFIG.USE_STRAPI === true;
        console.log('[API] Initialized with _useStrapi:', this._useStrapi);
    },

    isUsingStrapi() {
        return this._useStrapi;
    },

    async request(endpoint, options = {}) {
        if (this._useStrapi && typeof StrapiAPI !== 'undefined') {
            return this._strapiRequest(endpoint, options);
        }
        return this._genericRequest(endpoint, options);
    },

    async _strapiRequest(endpoint, options = {}) {
        if (typeof StrapiAPI === 'undefined') {
            return this._genericRequest(endpoint, options);
        }

        const endpointParts = endpoint.split('/').filter(p => p);
        const method = options.method || 'GET';

        // Contributions (kept for GET)
        if (endpoint.startsWith('/api/contributions')) {
            if (endpoint === '/api/contributions' && method === 'GET') {
                // StrapiAPI doesn't have contributions.getAll(), use generic request
                return this._genericRequest(endpoint, options);
            }
        }

        // All other existing endpoints remain unchanged
        return this._genericRequest(endpoint, options);
    },

    async _genericRequest(endpoint, options = {}) {
        const url = `${typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL ? CONFIG.API_BASE_URL : this.baseURL}${endpoint}`;

        const defaultHeaders = { 'Content-Type': 'application/json' };
        const token = (typeof Auth !== 'undefined' && Auth.getAccessToken && Auth.getAccessToken()) || localStorage.getItem("womencypedia_access_token");
        if (token) defaultHeaders.Authorization = `Bearer ${token}`;

        const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new APIError(data.message || 'Request failed', response.status, data);
            }
            return data;
        } catch (error) {
            throw new APIError(error.message || 'Network error', 0, error);
        }
    },

    async handleApiError(error, context = 'API request') {
        
        return {
            error: true,
            message: error.message || 'An unexpected error occurred.',
            status: error.status || 500
        };
    }
};

// CRITICAL: Protect existing API methods (from strapi-api.js) while exposing new methods.
if (!window.API) {
    window.API = LegacyAPI;
} else {
    // Only add methods that don't conflict, notably submitStory!
    window.API.submitStory = LegacyAPI.submitStory.bind(LegacyAPI);
    if (!window.API.init) window.API.init = LegacyAPI.init.bind(LegacyAPI);
    if (!window.API.isUsingStrapi) window.API.isUsingStrapi = LegacyAPI.isUsingStrapi.bind(LegacyAPI);
    if (!window.API.handleApiError) window.API.handleApiError = LegacyAPI.handleApiError.bind(LegacyAPI);

    // CRITICAL: Preserve biographies and collections objects from StrapiAPI
    // These are required by browse-logic.js and other pages
    if (window.StrapiAPI) {
        if (!window.API.biographies && window.StrapiAPI.biographies) {
            window.API.biographies = window.StrapiAPI.biographies;
        }
        if (!window.API.collections && window.StrapiAPI.collections) {
            window.API.collections = window.StrapiAPI.collections;
        }
        if (!window.API.leaders && window.StrapiAPI.leaders) {
            window.API.leaders = window.StrapiAPI.leaders;
        }
        if (!window.API.contributions && window.StrapiAPI.contributions) {
            window.API.contributions = window.StrapiAPI.contributions;
        }
        if (!window.API.comments && window.StrapiAPI.comments) {
            window.API.comments = window.StrapiAPI.comments;
        }
        if (!window.API.educationModules && window.StrapiAPI.educationModules) {
            window.API.educationModules = window.StrapiAPI.educationModules;
        }
        if (!window.API.notifications && window.StrapiAPI.notifications) {
            window.API.notifications = window.StrapiAPI.notifications;
        }
    }

    // We do NOT override window.API.request or window.API._strapiRequest because that breaks StrapiAPI objects!
}

console.log("[API] LegacyAPI merged successfully");
