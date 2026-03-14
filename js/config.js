/**
 * Womencypedia Frontend Configuration
 * 
 * This file contains all API configuration settings.
 * The API URL is environment-based for production safety.
 * 
 * Environment Configuration:
 * - Set window.API_STRAPI_URL in your HTML before loading this file
 * - Set window.API_BASE_URL as an alternative
 * - Falls back to production URL, then development localhost
 * 
 * Configuration Options:
 * - USE_STRAPI: Set to true to use Strapi CMS
 * - USE_MOCK_API: Set to true to force mock API, false to use real API, undefined to auto-detect
 */

// Environment-based API URL configuration
// Priority: 1. window.API_STRAPI_URL (JavaScript environment variable)
//           2. window.API_BASE_URL (alternative variable name)
//           3. Automatic detection based on current hostname
//           4. Production URL fallback
// Note: Added window check for SSR environment compatibility
const getApiBaseUrl = () => {
    // Check for explicit overrides first
    if (typeof window !== 'undefined') {
        if (window.API_STRAPI_URL) return window.API_STRAPI_URL;
        if (window.API_BASE_URL) return window.API_BASE_URL;

        // Auto-detect: if running on localhost, use local CMS
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
            return 'http://localhost:1337'; // Local development CMS
        }
    }
    return 'https://womencypedia-cms.onrender.com'; // Production CMS
};

const API_BASE_URL = getApiBaseUrl();

// API Token for authentication
// Priority: 1. window.API_TOKEN (JavaScript environment variable)
//           2. Hardcoded token (replace with your actual token)
// NOTE: For production, use environment variables or window.API_TOKEN
const API_TOKEN = (typeof window !== 'undefined' ? window.API_TOKEN : undefined) ||
    '';  // Add your token here: 'your-strapi-api-token-here'

const CONFIG = {
    // API Base URL - Environment configurable via window.API_STRAPI_URL or window.API_BASE_URL
    // Production: https://womencypedia-cms.onrender.com
    API_BASE_URL: API_BASE_URL,

    // API Token for authenticated requests
    // Leave empty string if Public role is enabled in Strapi
    // For production, set via window.API_TOKEN or use environment variables
    API_TOKEN: API_TOKEN,

    // Use Strapi CMS
    // Set to true to enable Strapi mode (transforms responses, uses Strapi endpoints)
    // Set to false to use custom backend
    // Strapi is the recommended CMS for this project
    USE_STRAPI: true,

    // Mock API is disabled by default — Strapi CMS is the primary data source
    // Set to true to use mock API when CMS is unavailable (auto-detected)
    // When CMS returns 404 or is unreachable, the frontend will automatically use mock data
    USE_MOCK_API: undefined, // undefined = auto-detect based on CMS availability

    // API Endpoints
    // Use STRAPI_ENDPOINTS when USE_STRAPI is true
    ENDPOINTS: {
        // Authentication (Strapi uses /api/auth/ prefix)
        AUTH: {
            LOGIN: '/api/auth/local',
            REGISTER: '/api/auth/local/register',
            LOGOUT: '/api/auth/logout',
            REFRESH: '/api/auth/local/refresh',
            ME: '/api/users/me',
            FORGOT_PASSWORD: '/api/auth/forgot-password',
            RESET_PASSWORD: '/api/auth/reset-password',
            CHANGE_PASSWORD: '/api/auth/change-password',
            // Social Login
            GOOGLE: '/api/auth/google',
            GOOGLE_CALLBACK: '/api/auth/google/callback',
            GITHUB: '/api/auth/github',
            GITHUB_CALLBACK: '/api/auth/github/callback'
        },

        // Strapi Content API endpoints (includes locale support)
        STRAPI: {
            // Biographies
            BIOGRAPHIES: '/api/biographies',
            BIOGRAPHY_BY_SLUG: (slug) => `/api/biographies?filters[slug][$eq]=${slug}`,
            BIOGRAPHIES_FEATURED: '/api/biographies?filters[featured][$eq]=true',
            BIOGRAPHIES_BY_REGION: (region) => `/api/biographies?filters[region][$eq]=${region}`,
            BIOGRAPHIES_BY_CATEGORY: (category) => `/api/biographies?filters[category][$eq]=${category}`,
            BIOGRAPHIES_BY_ERA: (era) => `/api/biographies?filters[era][$eq]=${era}`,

            // Collections
            COLLECTIONS: '/api/collections',
            COLLECTION_BY_SLUG: (slug) => `/api/collections?filters[slug][$eq]=${slug}`,
            COLLECTIONS_FEATURED: '/api/collections?filters[featured][$eq]=true',

            // Education Modules
            EDUCATION_MODULES: '/api/education-modules',
            EDUCATION_MODULE_BY_SLUG: (slug) => `/api/education-modules?filters[slug][$eq]=${slug}`,

            // Tags
            TAGS: '/api/tags',

            // Leaders (Institutional Registry)
            LEADERS: '/api/leaders',
            LEADER_BY_SLUG: (slug) => `/api/leaders?filters[slug][$eq]=${slug}`,
            LEADERS_FEATURED: '/api/leaders?filters[featured][$eq]=true&filters[verified][$eq]=true',
            LEADERS_BY_COUNTRY: (country) => `/api/leaders?filters[country][$eq]=${country}`,
            LEADERS_BY_CONTINENT: (continent) => `/api/leaders?filters[continent][$eq]=${continent}`,
            LEADERS_BY_SECTOR: (sector) => `/api/leaders?filters[sector][$eq]=${sector}`,
            LEADERS_VERIFIED: '/api/leaders?filters[verified][$eq]=true',

            // Verification Applications
            VERIFICATION_APPLICATIONS: '/api/verification-applications',
            VERIFICATION_APPLICATION_SUBMIT: '/api/verification-applications',
            VERIFICATION_APPLICATION_BY_ID: (id) => `/api/verification-applications/${id}`,
            VERIFICATION_APPLICATIONS_PENDING: '/api/verification-applications?filters[status][$eq]=pending',

            // Comments
            COMMENTS: '/api/comments',
            COMMENTS_BY_BIOGRAPHY: (biographyId) => `/api/comments?filters[biography][id][$eq]=${biographyId}`,
            COMMENT_BY_ID: (id) => `/api/comments/${id}`,

            // Notifications
            NOTIFICATIONS: '/api/notifications',
            NOTIFICATION_BY_ID: (id) => `/api/notifications/${id}`,

            // Saved Entries (Bookmarks)
            SAVED_ENTRIES: '/api/saved-entries',
            SAVED_ENTRY_BY_ID: (id) => `/api/saved-entries/${id}`,

            // Contributions (Articles, Case Studies, Reports)
            CONTRIBUTIONS: '/api/contributions',
            CONTRIBUTION_BY_SLUG: (slug) => `/api/contributions?filters[slug][$eq]=${slug}`,
            CONTRIBUTIONS_FEATURED: '/api/contributions?filters[featured][$eq]=true',
            CONTRIBUTIONS_PUBLISHED: '/api/contributions?filters[status][$eq]=published',
            CONTRIBUTIONS_BY_TYPE: (type) => `/api/contributions?filters[type][$eq]=${type}`,
            CONTRIBUTION_SUBMIT: '/api/contributions',

            // Partners
            PARTNERS: '/api/partners',
            PARTNER_BY_SLUG: (slug) => `/api/partners?filters[slug][$eq]=${slug}`,
            PARTNERS_FEATURED: '/api/partners?filters[featured][$eq]=true',
            PARTNERS_BY_TIER: (tier) => `/api/partners?filters[tier][$eq]=${tier}`,

            // Fellowships
            FELLOWSHIPS: '/api/fellowships',
            FELLOWSHIP_BY_SLUG: (slug) => `/api/fellowships?filters[slug][$eq]=${slug}`,
            FELLOWSHIPS_FEATURED: '/api/fellowships?filters[featured][$eq]=true',
            FELLOWSHIPS_OPEN: '/api/fellowships?filters[status][$eq]=open',
            FELLOWSHIPS_BY_TYPE: (type) => `/api/fellowships?filters[fellowshipType][$eq]=${type}`,

            // Media
            MEDIA_UPLOAD: '/api/upload',
            MEDIA_URL: (url) => url.startsWith('http') ? url : `${CONFIG.API_BASE_URL}${url}`
        },

        // Entries (Biographies/Stories) - Legacy format for compatibility
        ENTRIES: {
            LIST: '/api/biographies',
            GET: (id) => `/api/biographies/${id}`,
            GET_BY_SLUG: (slug) => `/api/biographies?filters[slug][$eq]=${slug}`,
            CREATE: '/api/biographies',
            UPDATE: (id) => `/api/biographies/${id}`,
            DELETE: (id) => `/api/biographies/${id}`,
            SEARCH: '/api/biographies',
            FEATURED: '/api/biographies?filters[featured][$eq]=true'
        },

        // Tags - Legacy format
        TAGS: {
            LIST: '/api/tags',
            GET: (id) => `/api/tags/${id}`
        },

        // Education Modules - Legacy format
        EDUCATION_MODULES: {
            LIST: '/api/education-modules',
            GET: (id) => `/api/education-modules/${id}`,
            GET_BY_SLUG: (slug) => `/api/education-modules?filters[slug][$eq]=${slug}`
        },

        // Comments on entries
        COMMENTS: {
            LIST: (entryId) => `/api/biographies/${entryId}/comments`,
            CREATE: (entryId) => `/api/biographies/${entryId}/comments`,
            DELETE: (entryId, commentId) => `/api/biographies/${entryId}/comments/${commentId}`,
            LIKE: (entryId, commentId) => `/api/biographies/${entryId}/comments/${commentId}/like`
        },

        // Contributions (User submissions)
        CONTRIBUTIONS: {
            NOMINATIONS: '/api/nominations',
            STORIES: '/api/stories',
            PENDING: '/api/contributions?status=pending',
            APPROVE: (id) => `/api/contributions/${id}/approve`,
            REJECT: (id) => `/api/contributions/${id}/reject`
        },

        // Collections
        COLLECTIONS: {
            LIST: '/api/collections',
            GET: (id) => `/api/collections/${id}`,
            GET_BY_SLUG: (slug) => `/api/collections?filters[slug][$eq]=${slug}`,
            SAVED: '/api/saved-entries'
        },

        // Notifications
        NOTIFICATIONS: {
            LIST: '/api/notifications',
            MARK_READ: (id) => `/api/notifications/${id}`,
            MARK_ALL_READ: '/api/notifications/read-all',
            DELETE: (id) => `/api/notifications/${id}`,
            CLEAR_ALL: '/api/notifications'
        },

        // User profile & settings
        USER: {
            PROFILE: '/api/users/me',
            UPDATE_PROFILE: '/api/users/me',
            SETTINGS: '/api/user-settings',
            UPDATE_SETTINGS: '/api/user-settings',
            DELETE_ACCOUNT: '/api/users/me'
        },

        // Contact
        CONTACT: {
            SUBMIT: '/api/contact-submissions'
        },

        // Statistics
        STATS: {
            DASHBOARD: '/api/stats/dashboard',
            PUBLIC: '/api/stats/public'
        },

        // Saved Entries (Bookmarks)
        SAVED_ENTRIES: {
            LIST: '/api/saved-entries',
            SAVE: '/api/saved-entries',
            REMOVE: (biographyId) => `/api/saved-entries/${biographyId}`,
            CLEAR: '/api/saved-entries'
        }
    },

    // Token storage keys
    STORAGE_KEYS: {
        ACCESS_TOKEN: 'womencypedia_access_token',
        REFRESH_TOKEN: 'womencypedia_refresh_token',
        USER: 'womencypedia_user'
    },

    // User roles
    ROLES: {
        ADMIN: 'admin',
        CONTRIBUTOR: 'contributor',
        PUBLIC: 'public'
    },

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 12,
        MAX_PAGE_SIZE: 50
    },

    // Request settings
    REQUEST: {
        TIMEOUT: 30000, // 30 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1 second
    },

    // Strapi URL alias (used by donate.js and other modules)
    STRAPI_URL: API_BASE_URL,

    // Strapi Admin Panel URL
    STRAPI_ADMIN_URL: API_BASE_URL + '/admin',

    // Payment Gateway Keys
    // Replace with your live keys in production
    // For Paystack: https://dashboard.paystack.com/#/settings/developers
    // For Flutterwave: https://app.flutterwave.com/dashboard/settings/apis
    PAYSTACK_PUBLIC_KEY: (typeof window !== 'undefined' ? window.PAYSTACK_PUBLIC_KEY : undefined) || '',
    FLUTTERWAVE_PUBLIC_KEY: (typeof window !== 'undefined' ? window.FLUTTERWAVE_PUBLIC_KEY : undefined) || '',
    PAYSTACK_MONTHLY_PLAN: (typeof window !== 'undefined' ? window.PAYSTACK_MONTHLY_PLAN : undefined) || ''
};

// Freeze configuration to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.ENDPOINTS.AUTH);
Object.freeze(CONFIG.ENDPOINTS.STRAPI);
Object.freeze(CONFIG.ENDPOINTS.ENTRIES);
Object.freeze(CONFIG.ENDPOINTS.COMMENTS);
Object.freeze(CONFIG.ENDPOINTS.CONTRIBUTIONS);
Object.freeze(CONFIG.ENDPOINTS.COLLECTIONS);
Object.freeze(CONFIG.ENDPOINTS.TAGS);
Object.freeze(CONFIG.ENDPOINTS.EDUCATION_MODULES);
Object.freeze(CONFIG.ENDPOINTS.NOTIFICATIONS);
Object.freeze(CONFIG.ENDPOINTS.USER);
Object.freeze(CONFIG.ENDPOINTS.CONTACT);
Object.freeze(CONFIG.ENDPOINTS.STATS);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.ROLES);
Object.freeze(CONFIG.PAGINATION);
Object.freeze(CONFIG.REQUEST);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
