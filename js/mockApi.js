/**
 * Womencypedia Mock API Service
 * 
 * This module provides mock API responses when the backend is unavailable.
 * It simulates all documented API endpoints using local data.
 * 
 * To use real API: Set USE_MOCK_API = false in config
 * To use mock API: Set USE_MOCK_API = true in config (default when API unavailable)
 */

// Fallback arrays — data.js was migrated to Strapi CMS, so these are empty
// unless populated by another script
const biographies = typeof window !== 'undefined' && window.__mockBiographies ? window.__mockBiographies : [];
const featuredCollections = typeof window !== 'undefined' && window.__mockCollections ? window.__mockCollections : [];

const MockAPI = {
    // Simulated delay for realistic API behavior (ms)
    DEFAULT_DELAY: 300,

    // Track if API is available
    _apiAvailable: null,

    /**
     * Initialize mock API
     */
    init() {
        this._checkAPIAvailability();
    },

    /**
     * Check if real API is available
     */
    async _checkAPIAvailability() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`${CONFIG.API_BASE_URL}/`, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            this._apiAvailable = response.ok;
        } catch (error) {
            // Silently handle CORS, network, and timeout errors
            this._apiAvailable = false;
        }
    },

    /**
     * Get API availability status
     */
    isAPIAvailable() {
        return this._apiAvailable === true;
    },

    /**
     * Simulate network delay
     */
    _delay(ms = this.DEFAULT_DELAY) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Simulate API error
     */
    _error(message, status = 400) {
        const error = new Error(message);
        error.status = status;
        error.isMockError = true;
        return Promise.reject(error);
    },

    // ============================================
    // AUTHENTICATION MOCK API
    // ============================================

    auth: {
        /**
         * Mock user login
         */
        async login(email, password) {
            await MockAPI._delay(500);

            // Demo users for testing
            const demoUsers = {
                'admin@womencypedia.org': {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@womencypedia.org',
                    role: 'admin',
                    email_verified: true,
                    bio: 'Platform administrator',
                    location: 'Nigeria',
                    avatar: '/images/avatars/admin.jpg',
                    joinDate: '2024-01-15T00:00:00Z',
                    contributions_count: 15,
                    bookmarks_count: 25,
                    badges: [
                        { id: 1, name: 'Admin', icon: 'shield' },
                        { id: 2, name: 'Top Contributor', icon: 'star' }
                    ]
                },
                'contributor@womencypedia.org': {
                    id: 2,
                    name: 'Contributor User',
                    email: 'contributor@womencypedia.org',
                    role: 'contributor',
                    email_verified: true,
                    bio: 'Content contributor',
                    location: 'Kenya',
                    avatar: '/images/avatars/contributor.jpg',
                    joinDate: '2024-03-20T00:00:00Z',
                    contributions_count: 8,
                    bookmarks_count: 12,
                    badges: [
                        { id: 1, name: 'Contributor', icon: 'edit' }
                    ]
                },
                'user@example.com': {
                    id: 3,
                    name: 'Demo User',
                    email: 'user@example.com',
                    role: 'public',
                    email_verified: false,
                    bio: '',
                    location: '',
                    avatar: '',
                    joinDate: '2024-06-01T00:00:00Z',
                    contributions_count: 0,
                    bookmarks_count: 5,
                    badges: []
                }
            };

            // Check credentials
            if (!email || !password) {
                return MockAPI._error('Email and password are required', 400);
            }

            const user = demoUsers[email.toLowerCase()];
            if (!user) {
                // Create new user on the fly for demo
                const newUser = {
                    id: Date.now(),
                    name: email.split('@')[0],
                    email: email.toLowerCase(),
                    role: 'public',
                    email_verified: false,
                    bio: '',
                    location: '',
                    avatar: '',
                    joinDate: new Date().toISOString(),
                    contributions_count: 0,
                    bookmarks_count: 0,
                    badges: []
                };

                return {
                    message: 'Login successful',
                    access_token: 'mock_access_token_' + Date.now(),
                    refresh_token: 'mock_refresh_token_' + Date.now(),
                    user: newUser
                };
            }

            return {
                message: 'Login successful',
                access_token: 'mock_access_token_' + Date.now(),
                refresh_token: 'mock_refresh_token_' + Date.now(),
                user: user
            };
        },

        /**
         * Mock user registration
         */
        async register(userData) {
            await MockAPI._delay(800);

            const { name, email, password } = userData || {};

            if (!name || !email || !password) {
                return MockAPI._error('Name, email, and password are required', 400);
            }

            if (password.length < 6) {
                return MockAPI._error('Password must be at least 6 characters', 400);
            }

            const newUser = {
                id: Date.now(),
                name,
                email: email.toLowerCase(),
                role: 'contributor',
                email_verified: false
            };

            return {
                message: 'Registration successful. Please check your email to verify.',
                access_token: 'mock_access_token_' + Date.now(),
                refresh_token: 'mock_refresh_token_' + Date.now(),
                user: newUser
            };
        },

        /**
         * Mock logout
         */
        async logout() {
            await MockAPI._delay(200);
            return { message: 'Logged out successfully' };
        },

        /**
         * Mock token refresh
         */
        async refresh(refreshToken) {
            await MockAPI._delay(300);

            if (!refreshToken) {
                return MockAPI._error('Refresh token required', 401);
            }

            return {
                access_token: 'mock_access_token_' + Date.now(),
                refresh_token: 'mock_refresh_token_' + Date.now()
            };
        },

        /**
         * Mock get current user
         */
        async getMe() {
            await MockAPI._delay(200);

            // Get user from localStorage or return demo user
            const storedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
            if (storedUser) {
                return JSON.parse(storedUser);
            }

            return {
                id: 3,
                name: 'Demo User',
                email: 'user@example.com',
                role: 'public',
                email_verified: false,
                bio: '',
                location: '',
                avatar: '',
                joinDate: '2024-06-01T00:00:00Z',
                contributions_count: 0,
                bookmarks_count: 0,
                badges: []
            };
        },

        /**
         * Mock forgot password
         */
        async forgotPassword(email) {
            await MockAPI._delay(500);

            if (!email) {
                return MockAPI._error('Email is required', 400);
            }

            return { message: 'Password reset email sent' };
        },

        /**
         * Mock reset password
         */
        async resetPassword(token, newPassword) {
            await MockAPI._delay(500);

            return { message: 'Password reset successful' };
        }
    },

    // ============================================
    // ENTRIES (BIOGRAPHIES) MOCK API
    // ============================================

    entries: {
        /**
         * Get all entries with pagination/filtering
         */
        async getAll(params = {}) {
            await MockAPI._delay(300);

            const { page = 1, limit = 12, region, era, category, search } = params || {};

            let entries = [...biographies];

            // Apply filters
            if (region && region !== 'all') {
                entries = entries.filter(e => e.region === region);
            }
            if (era && era !== 'all') {
                entries = entries.filter(e => e.era === era);
            }
            if (category && category !== 'all') {
                entries = entries.filter(e => e.category === category);
            }
            if (search) {
                const searchLower = search.toLowerCase();
                entries = entries.filter(e =>
                    e.name.toLowerCase().includes(searchLower) ||
                    e.introduction.toLowerCase().includes(searchLower) ||
                    e.tags.some(t => t.toLowerCase().includes(searchLower))
                );
            }

            // Add mock images and status
            const entriesWithMeta = entries.map((entry, index) => ({
                ...entry,
                image: `/images/${entry.name.toLowerCase().replace(/\s+/g, '_')}.png`,
                slug: entry.name.toLowerCase().replace(/\s+/g, '-'),
                status: 'published',
                createdAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z'
            }));

            // Paginate
            const start = (page - 1) * limit;
            const end = start + limit;
            const paginatedEntries = entriesWithMeta.slice(start, end);

            return {
                entries: paginatedEntries,
                page: page,
                total_pages: Math.ceil(entries.length / limit),
                total: entries.length
            };
        },

        /**
         * Get single entry by ID
         */
        async getById(id) {
            await MockAPI._delay(200);

            const entry = biographies.find(e => e.id === parseInt(id));
            if (!entry) {
                return MockAPI._error('Entry not found', 404);
            }

            return {
                ...entry,
                image: `/images/${entry.name.toLowerCase().replace(/\s+/g, '_')}.png`,
                slug: entry.name.toLowerCase().replace(/\s+/g, '-'),
                status: 'published',
                createdAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z'
            };
        },

        /**
         * Get single entry by slug
         */
        async getBySlug(slug) {
            await MockAPI._delay(200);

            // Generate slug from name for comparison
            const entry = biographies.find(e =>
                e.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
            );

            if (!entry) {
                return MockAPI._error('Entry not found', 404);
            }

            return {
                ...entry,
                image: `/images/${entry.name.toLowerCase().replace(/\s+/g, '_')}.png`,
                slug: entry.name.toLowerCase().replace(/\s+/g, '-'),
                status: 'published',
                createdAt: '2026-01-15T00:00:00Z',
                updatedAt: '2026-01-15T00:00:00Z'
            };
        },

        /**
         * Search entries
         */
        async search(query, filters = {}) {
            return this.getAll({ ...filters, search: query });
        },

        /**
         * Create entry (admin)
         */
        async create(entryData) {
            await MockAPI._delay(500);

            const newEntry = {
                id: Date.now(),
                ...entryData,
                status: 'published',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            return newEntry;
        },

        /**
         * Update entry (admin)
         */
        async update(id, entryData) {
            await MockAPI._delay(400);

            return {
                id: parseInt(id),
                ...entryData,
                updatedAt: new Date().toISOString()
            };
        },

        /**
         * Delete entry (admin)
         */
        async delete(id) {
            await MockAPI._delay(300);
            return { message: 'Entry deleted successfully' };
        }
    },

    // ============================================
    // COMMENTS MOCK API
    // ============================================

    comments: {
        /**
         * Get comments for an entry
         */
        async getAll(entryId) {
            await MockAPI._delay(200);

            // Mock comments data
            const mockComments = [
                {
                    id: '1',
                    user: {
                        id: 2,
                        name: 'Sarah Johnson',
                        initials: 'SJ',
                        avatar: '/images/avatars/sarah.jpg'
                    },
                    content: 'This biography is incredibly inspiring! The way she overcame challenges is remarkable.',
                    likes: 12,
                    isLiked: false,
                    createdAt: '2026-01-15T10:30:00Z',
                    replies: [
                        {
                            id: '2',
                            user: { id: 3, name: 'Jane Doe', initials: 'JD', avatar: '/images/avatars/jane.jpg' },
                            content: 'I agree! The historical context is very well researched.',
                            likes: 3,
                            isLiked: false,
                            createdAt: '2026-01-15T11:00:00Z'
                        }
                    ]
                },
                {
                    id: '3',
                    user: {
                        id: 4,
                        name: 'Emily Chen',
                        initials: 'EC',
                        avatar: '/images/avatars/emily.jpg'
                    },
                    content: 'Thank you for sharing this story. It\'s important we remember these women.',
                    likes: 8,
                    isLiked: true,
                    createdAt: '2026-01-16T14:20:00Z',
                    replies: []
                }
            ];

            return {
                comments: mockComments,
                total: mockComments.length
            };
        },

        /**
         * Post a comment
         */
        async create(entryId, commentData) {
            await MockAPI._delay(300);

            const currentUser = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || '{}');

            return {
                id: Date.now().toString(),
                user: {
                    id: currentUser.id || 999,
                    name: currentUser.name || 'Anonymous',
                    initials: (currentUser.name || 'A').substring(0, 2).toUpperCase()
                },
                content: commentData.content,
                parentId: commentData.parentId || null,
                likes: 0,
                isLiked: false,
                createdAt: new Date().toISOString(),
                replies: []
            };
        },

        /**
         * Delete a comment
         */
        async delete(entryId, commentId) {
            await MockAPI._delay(200);
            return { message: 'Comment deleted successfully' };
        },

        /**
         * Like/unlike a comment
         */
        async toggleLike(entryId, commentId) {
            await MockAPI._delay(100);
            return { liked: true, likes: 1 };
        }
    },

    // ============================================
    // COLLECTIONS MOCK API
    // ============================================

    collections: {
        /**
         * Get all collections
         */
        async getAll() {
            await MockAPI._delay(200);

            return {
                collections: featuredCollections,
                total: featuredCollections.length
            };
        },

        /**
         * Get collection by ID
         */
        async getById(id) {
            await MockAPI._delay(200);

            const collection = featuredCollections.find(c => c.id === id);
            if (!collection) {
                return MockAPI._error('Collection not found', 404);
            }

            // Get biographies for this collection
            const collectionBiographies = biographies.filter(b =>
                collection.biographies.includes(b.id)
            );

            return {
                ...collection,
                biographies: collectionBiographies,
                total: collectionBiographies.length
            };
        },

        /**
         * Get saved/bookmarked entries
         */
        async getSaved() {
            await MockAPI._delay(200);

            const savedEntries = [
                {
                    id: 1,
                    entry_id: 1,
                    name: 'Mary Mitchell Slessor',
                    slug: 'mary-mitchell-slessor',
                    image: '/images/mary_slessor.png',
                    category: 'Spirituality & Faith',
                    preview: 'A Scottish missionary who became a cultural bridge...',
                    bookmarkedAt: '2026-01-20T10:00:00Z'
                },
                {
                    id: 2,
                    entry_id: 3,
                    name: 'Queen Amina of Zazzau',
                    slug: 'queen-amina-of-zazzau',
                    image: '/images/queen-amina.png',
                    category: 'Leadership',
                    preview: 'A warrior queen of the Zazzau Kingdom...',
                    bookmarkedAt: '2026-01-22T14:30:00Z'
                }
            ];

            return {
                items: savedEntries,
                total: savedEntries.length
            };
        },

        /**
         * Save an entry
         */
        async save(entryData) {
            await MockAPI._delay(200);

            return {
                id: Date.now(),
                ...entryData,
                bookmarkedAt: new Date().toISOString()
            };
        },

        /**
         * Remove saved entry
         */
        async remove(entryId) {
            await MockAPI._delay(200);
            return { message: 'Entry removed from saved' };
        }
    },

    // ============================================
    // NOTIFICATIONS MOCK API
    // ============================================

    notifications: {
        /**
         * Get all notifications
         */
        async getAll() {
            await MockAPI._delay(200);

            const notifications = [
                {
                    id: '1',
                    type: 'biography',
                    title: 'New Biography Published',
                    message: 'A new biography for Wangari Maathai has been published.',
                    link: 'biography.html?id=5',
                    read: false,
                    createdAt: '2026-01-15T10:30:00Z'
                },
                {
                    id: '2',
                    type: 'comment',
                    title: 'New Reply',
                    message: 'Someone replied to your comment on Queen Amina.',
                    link: 'biography.html?id=3#comment-2',
                    read: false,
                    createdAt: '2026-01-14T15:45:00Z'
                },
                {
                    id: '3',
                    type: 'system',
                    title: 'Welcome to Womencypedia',
                    message: 'Thank you for joining our community!',
                    link: 'index.html',
                    read: true,
                    createdAt: '2026-01-10T09:00:00Z'
                }
            ];

            return {
                notifications,
                unread_count: notifications.filter(n => !n.read).length
            };
        },

        /**
         * Mark notification as read
         */
        async markRead(id) {
            await MockAPI._delay(100);
            return { message: 'Notification marked as read' };
        },

        /**
         * Mark all as read
         */
        async markAllRead() {
            await MockAPI._delay(200);
            return { message: 'All notifications marked as read' };
        },

        /**
         * Delete notification
         */
        async delete(id) {
            await MockAPI._delay(200);
            return { message: 'Notification deleted' };
        }
    },

    // ============================================
    // CONTRIBUTIONS MOCK API
    // ============================================

    contributions: {
        /**
         * Submit nomination
         */
        async submitNomination(nominationData) {
            await MockAPI._delay(500);

            return {
                id: Date.now(),
                ...nominationData,
                status: 'pending',
                submittedAt: new Date().toISOString()
            };
        },

        /**
         * Submit story
         */
        async submitStory(storyData) {
            await MockAPI._delay(500);

            return {
                id: Date.now(),
                ...storyData,
                status: 'pending',
                submittedAt: new Date().toISOString()
            };
        },

        /**
         * Get pending contributions (admin)
         */
        async getPending(params = {}) {
            await MockAPI._delay(300);

            const pendingContributions = [
                {
                    id: 1,
                    type: 'nomination',
                    nomineeName: 'Ada Lovelace',
                    bio: 'First computer programmer...',
                    submitterName: 'Jane Doe',
                    submittedAt: '2026-01-15T00:00:00Z',
                    status: 'pending'
                },
                {
                    id: 2,
                    type: 'story',
                    subjectName: 'My Grandmother',
                    story: 'My grandmother was...',
                    submitterName: 'John Smith',
                    submittedAt: '2026-01-14T00:00:00Z',
                    status: 'pending'
                }
            ];

            return {
                contributions: pendingContributions,
                total: pendingContributions.length
            };
        },

        /**
         * Approve contribution (admin)
         */
        async approve(id) {
            await MockAPI._delay(300);
            return { message: 'Contribution approved' };
        },

        /**
         * Reject contribution (admin)
         */
        async reject(id, reason) {
            await MockAPI._delay(300);
            return { message: 'Contribution rejected' };
        }
    },

    // ============================================
    // USER PROFILE MOCK API
    // ============================================

    user: {
        /**
         * Get user profile
         */
        async getProfile() {
            await MockAPI._delay(200);

            const storedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
            if (storedUser) {
                return JSON.parse(storedUser);
            }

            return {
                id: 3,
                name: 'Demo User',
                email: 'user@example.com',
                role: 'public',
                email_verified: false,
                bio: '',
                location: '',
                avatar: '',
                joinDate: '2024-06-01T00:00:00Z',
                contributions_count: 0,
                bookmarks_count: 5,
                badges: []
            };
        },

        /**
         * Update profile
         */
        async updateProfile(profileData) {
            await MockAPI._delay(300);

            const updatedUser = {
                ...JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || '{}'),
                ...profileData
            };

            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
            return updatedUser;
        },

        /**
         * Get user settings
         */
        async getSettings() {
            await MockAPI._delay(200);

            return {
                notifications: {
                    email_new_biography: true,
                    email_nomination_update: true,
                    email_newsletter: false,
                    push_enabled: true
                },
                privacy: {
                    show_profile_public: true,
                    show_contributions: true,
                    show_bookmarks: false
                },
                display: {
                    theme: 'dark',
                    language: 'en'
                }
            };
        },

        /**
         * Update settings
         */
        async updateSettings(settingsData) {
            await MockAPI._delay(300);
            return settingsData;
        },

        /**
         * Delete account
         */
        async deleteAccount() {
            await MockAPI._delay(500);
            return { message: 'Account deleted successfully' };
        }
    },

    // ============================================
    // CONTACT MOCK API
    // ============================================

    contact: {
        /**
         * Submit contact form
         */
        async submit(contactData) {
            await MockAPI._delay(500);

            return {
                message: 'Thank you for your message. We will get back to you soon!',
                id: Date.now()
            };
        }
    },

    // ============================================
    // STATISTICS MOCK API
    // ============================================

    stats: {
        /**
         * Get dashboard stats (admin)
         */
        async getDashboard() {
            await MockAPI._delay(300);

            return {
                totalEntries: 150,
                totalUsers: 1250,
                totalContributions: 89,
                pendingContributions: 12,
                totalComments: 567,
                newUsersThisMonth: 45,
                viewsThisMonth: 12500,
                topEntries: [
                    { id: 1, name: 'Queen Amina of Zazzau', views: 1250 },
                    { id: 2, name: 'Wangari Maathai', views: 980 },
                    { id: 3, name: 'Hypatia of Alexandria', views: 756 }
                ]
            };
        },

        /**
         * Get public stats
         */
        async getPublic() {
            await MockAPI._delay(200);

            return {
                totalEntries: 150,
                totalCategories: 9,
                totalRegions: 9,
                featuredCollections: 6
            };
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MockAPI };
}
