/**
 * Real-time updates module for Womencypedia
 * Handles live synchronization of comments, bookmarks, and notifications
 */

const Realtime = {
    _isConnected: false,
    _pollInterval: null,
    _lastCommentCheck: {},
    _pollFrequency: 30000, // 30 seconds

    /**
     * Initialize real-time updates
     */
    init() {
        // Start polling for updates
        this.startPolling();

        // Listen for page visibility changes to optimize polling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pausePolling();
            } else {
                this.resumePolling();
            }
        });

        console.log('[Realtime] Initialized');
    },

    /**
     * Start polling for updates
     */
    startPolling() {
        if (this._pollInterval) return;

        this._pollInterval = setInterval(() => {
            this.checkForUpdates();
        }, this._pollFrequency);

        this._isConnected = true;
        console.log('[Realtime] Polling started');
    },

    /**
     * Pause polling (when page is hidden)
     */
    pausePolling() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = null;
            this._isConnected = false;
            console.log('[Realtime] Polling paused');
        }
    },

    /**
     * Resume polling
     */
    resumePolling() {
        if (!this._pollInterval && !document.hidden) {
            this.startPolling();
        }
    },

    /**
     * Check for updates on current page
     */
    async checkForUpdates() {
        try {
            // Check for comment updates on biography pages
            if (this.isBiographyPage()) {
                await this.checkCommentUpdates();
            }

            // Check for bookmark sync if authenticated
            if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
                await this.checkBookmarkSync();
            }
        } catch (error) {
            console.log('[Realtime] Update check failed:', error.message);
        }
    },

    /**
     * Check if current page is a biography page
     */
    isBiographyPage() {
        return window.location.pathname.includes('biography.html') ||
            document.querySelector('[data-entry-id]') !== null;
    },

    /**
     * Check for new comments on current biography
     */
    async checkCommentUpdates() {
        const entryId = this.getCurrentEntryId();
        if (!entryId) return;

        try {
            if (!window.StrapiAPI) return;

            const response = await window.StrapiAPI.comments.getByBiography(entryId);
            const latestComments = response.entries || response.data || [];

            // Compare with current comments
            const currentCommentCount = this.getCurrentCommentCount(entryId);
            if (latestComments.length > currentCommentCount) {
                console.log(`[Realtime] ${latestComments.length - currentCommentCount} new comments found`);

                // Update comments and show notification
                if (typeof Comments !== 'undefined') {
                    Comments._comments[entryId] = latestComments;
                    this.showNewCommentsNotification(latestComments.length - currentCommentCount);
                }
            }
        } catch (error) {
            console.log('[Realtime] Comment check failed:', error.message);
        }
    },

    /**
     * Check for bookmark synchronization
     */
    async checkBookmarkSync() {
        try {
            if (!window.StrapiAPI) return;

            const response = await window.StrapiAPI.request('/api/user-bookmarks');
            const serverBookmarks = response.entries || [];

            if (typeof Bookmarks !== 'undefined') {
                const localBookmarks = Bookmarks.getAll();
                const serverIds = serverBookmarks.map(b => b.id);
                const localIds = localBookmarks.map(b => b.id);

                // Check for server-side changes
                const newOnServer = serverBookmarks.filter(b => !localIds.includes(b.id));
                const removedOnServer = localBookmarks.filter(b => !serverIds.includes(b.id));

                if (newOnServer.length > 0 || removedOnServer.length > 0) {
                    console.log('[Realtime] Bookmark sync needed');
                    Bookmarks._bookmarks = serverBookmarks;
                    Bookmarks.saveToLocalStorage();
                    Bookmarks.updateAllBookmarkButtons();

                    if (newOnServer.length > 0) {
                        this.showBookmarkSyncNotification(newOnServer.length);
                    }
                }
            }
        } catch (error) {
            console.log('[Realtime] Bookmark sync check failed:', error.message);
        }
    },

    /**
     * Get current entry ID from page
     */
    getCurrentEntryId() {
        // Try URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        if (slug) return slug;

        // Try data attribute
        const container = document.querySelector('[data-entry-id]');
        return container ? container.dataset.entryId : null;
    },

    /**
     * Get current comment count for entry
     */
    getCurrentCommentCount(entryId) {
        if (typeof Comments !== 'undefined' && Comments._comments[entryId]) {
            return Comments._comments[entryId].length;
        }
        return 0;
    },

    /**
     * Show notification for new comments
     */
    showNewCommentsNotification(count) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(`${count} new comment${count > 1 ? 's' : ''} available. Refresh to view.`, 'info');
        }

        // Add visual indicator
        this.addRealtimeIndicator('comments');
    },

    /**
     * Show notification for bookmark sync
     */
    showBookmarkSyncNotification(count) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(`Bookmarks synced. ${count} new bookmark${count > 1 ? 's' : ''} added.`, 'success');
        }
    },

    /**
     * Add real-time indicator to page
     */
    addRealtimeIndicator(type) {
        let indicator = document.querySelector('.realtime-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'realtime-indicator fixed top-4 right-4 z-50';
            document.body.appendChild(indicator);
        }

        const badge = document.createElement('div');
        badge.className = 'bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse';
        badge.textContent = `🔄 ${type === 'comments' ? 'New comments' : 'Synced'}`;

        indicator.appendChild(badge);

        // Remove after 5 seconds
        setTimeout(() => {
            if (badge.parentNode) {
                badge.remove();
            }
        }, 5000);
    },

    /**
     * Force immediate update check
     */
    forceUpdateCheck() {
        this.checkForUpdates();
    },

    /**
     * Update polling frequency
     */
    setPollFrequency(frequency) {
        this._pollFrequency = frequency;
        this.pausePolling();
        this.startPolling();
    },

    /**
     * Cleanup on page unload
     */
    destroy() {
        this.pausePolling();
        console.log('[Realtime] Destroyed');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Realtime.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Realtime.destroy();
});