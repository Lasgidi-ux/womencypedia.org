/**
 * Womencypedia Notifications Module
 * Handles user notifications, real-time updates, and notification preferences
 */

const Notifications = {
    // Notification types
    TYPES: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error',
        BIOGRAPHY: 'biography',
        NOMINATION: 'nomination',
        COMMENT: 'comment',
        SYSTEM: 'system'
    },

    // Notification state
    _notifications: [],
    _unreadCount: 0,
    _isLoaded: false,
    _pollingInterval: null,

    /**
     * Initialize notifications module
     */
    init() {
        this.loadNotifications();
        this.setupPolling();
        this.updateBadge();
        this.renderNotificationBell();
    },

    /**
     * Load notifications from API or localStorage
     */
    async loadNotifications() {
        try {
            // Try to load from API first
            if (Auth.isAuthenticated()) {
                const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NOTIFICATIONS.LIST}`, {
                    headers: {
                        'Authorization': `Bearer ${Auth.getAccessToken()}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Strapi v5 returns { data: [...] } format
                    this._notifications = data.data || data.notifications || [];
                    this._unreadCount = this._notifications.filter(n => !n.read).length;
                    this._isLoaded = true;
                    this.saveToLocalStorage();
                    this.updateBadge();
                    return;
                }
            }
        } catch (error) {
            
        }

        // Fallback to localStorage
        this.loadFromLocalStorage();
    },

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('womencypedia_notifications');
            if (stored) {
                const data = JSON.parse(stored);
                this._notifications = data.notifications || [];
                this._unreadCount = this._notifications.filter(n => !n.read).length;
            }
        } catch (error) {
            
            this._notifications = [];
            this._unreadCount = 0;
        }
        this._isLoaded = true;
    },

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('womencypedia_notifications', JSON.stringify({
                notifications: this._notifications,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            
        }
    },

    /**
     * Setup polling for new notifications
     */
    setupPolling() {
        // Poll every 60 seconds for new notifications
        this._pollingInterval = setInterval(() => {
            if (Auth.isAuthenticated()) {
                this.loadNotifications();
            }
        }, 60000);
    },

    /**
     * Stop polling
     */
    stopPolling() {
        if (this._pollingInterval) {
            clearInterval(this._pollingInterval);
            this._pollingInterval = null;
        }
    },

    /**
     * Get all notifications
     * @returns {Array} List of notifications
     */
    getAll() {
        return this._notifications;
    },

    /**
     * Get unread notifications
     * @returns {Array} List of unread notifications
     */
    getUnread() {
        return this._notifications.filter(n => !n.read);
    },

    /**
     * Get unread count
     * @returns {number} Unread notification count
     */
    getUnreadCount() {
        return this._unreadCount;
    },

    /**
     * Add a new notification
     * @param {Object} notification - Notification data
     */
    async add(notification) {
        const newNotification = {
            id: notification.id || Date.now().toString(),
            type: notification.type || this.TYPES.INFO,
            title: notification.title,
            message: notification.message,
            link: notification.link || null,
            read: false,
            createdAt: notification.createdAt || new Date().toISOString()
        };

        this._notifications.unshift(newNotification);
        this._unreadCount++;
        this.saveToLocalStorage();
        this.updateBadge();

        // Show toast notification
        this.showToast(newNotification);

        return newNotification;
    },

    /**
     * Mark notification as read
     * @param {string} id - Notification ID
     */
    async markAsRead(id) {
        const notification = this._notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this._unreadCount = Math.max(0, this._unreadCount - 1);
            this.saveToLocalStorage();
            this.updateBadge();

            // Sync with API
            try {
                if (Auth.isAuthenticated()) {
                    await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(id)}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${Auth.getAccessToken()}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ data: { read: true } })
                    });
                }
            } catch (error) {
                
            }
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        this._notifications.forEach(n => n.read = true);
        this._unreadCount = 0;
        this.saveToLocalStorage();
        this.updateBadge();

        // Sync with API — Strapi v5 has no bulk /read-all endpoint.
        // Iterate over each unread notification and PUT individually.
        try {
            if (Auth.isAuthenticated()) {
                const token = Auth.getAccessToken();
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch current notifications from Strapi to get real IDs
                const res = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NOTIFICATIONS.LIST}?filters[read][$eq]=false`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    const unread = data.data || [];
                    await Promise.all(unread.map(n =>
                        fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(n.id)}`, {
                            method: 'PUT',
                            headers,
                            body: JSON.stringify({ data: { read: true } })
                        })
                    ));
                }
            }
        } catch (error) {
            // Silently fail — local state already updated
        }
    },

    /**
     * Delete a notification
     * @param {string} id - Notification ID
     */
    async delete(id) {
        const index = this._notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            const notification = this._notifications[index];
            if (!notification.read) {
                this._unreadCount = Math.max(0, this._unreadCount - 1);
            }
            this._notifications.splice(index, 1);
            this.saveToLocalStorage();
            this.updateBadge();

            // Sync with API
            try {
                if (Auth.isAuthenticated()) {
                    await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(id)}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${Auth.getAccessToken()}`
                        }
                    });
                }
            } catch (error) {
                
            }
        }
    },

    /**
     * Clear all notifications
     */
    async clearAll() {
        this._notifications = [];
        this._unreadCount = 0;
        this.saveToLocalStorage();
        this.updateBadge();

        // Sync with API — Strapi v5 doesn't support bulk DELETE on collection root.
        // Fetch all, then delete each individually.
        try {
            if (Auth.isAuthenticated()) {
                const token = Auth.getAccessToken();
                const headers = { 'Authorization': `Bearer ${token}` };

                const res = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NOTIFICATIONS.LIST}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    const all = data.data || [];
                    await Promise.all(all.map(n =>
                        fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(n.id)}`, {
                            method: 'DELETE',
                            headers
                        })
                    ));
                }
            }
        } catch (error) {
            // Silently fail — local state already cleared
        }
    },

    /**
     * Update notification badge
     */
    updateBadge() {
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (this._unreadCount > 0) {
                badge.textContent = this._unreadCount > 99 ? '99+' : this._unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
    },

    /**
     * Show toast notification
     * @param {Object} notification - Notification to show
     */
    showToast(notification) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            const typeMap = {
                [this.TYPES.SUCCESS]: 'success',
                [this.TYPES.ERROR]: 'error',
                [this.TYPES.WARNING]: 'warning',
                [this.TYPES.INFO]: 'info'
            };
            UI.showToast(notification.message, typeMap[notification.type] || 'info');
        }
    },

    /**
     * Render notification bell in header
     */
    renderNotificationBell() {
        const bellContainers = document.querySelectorAll('.notification-bell-container');
        bellContainers.forEach(container => {
            container.innerHTML = `
                <button class="relative p-2 text-gray-400 hover:text-white transition-colors" onclick="Notifications.toggleDropdown(this)">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <span class="notification-badge absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center ${this._unreadCount === 0 ? 'hidden' : ''}">${this._unreadCount}</span>
                </button>
                <div class="notification-dropdown hidden absolute right-0 mt-2 w-80 bg-dark-800 rounded-xl shadow-xl border border-white/10 overflow-hidden z-50">
                    ${this.renderDropdownContent()}
                </div>
            `;
        });
    },

    /**
     * Render dropdown content
     */
    renderDropdownContent() {
        const notifications = this._notifications.slice(0, 5);

        let content = `
            <div class="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 class="font-semibold text-white">Notifications</h3>
                ${this._unreadCount > 0 ? '<button onclick="Notifications.markAllAsRead()" class="text-sm text-pink-400 hover:text-pink-300">Mark all read</button>' : ''}
            </div>
        `;

        if (notifications.length === 0) {
            content += `
                <div class="p-8 text-center">
                    <svg class="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <p class="text-gray-400">No notifications yet</p>
                </div>
            `;
        } else {
            content += '<div class="max-h-80 overflow-y-auto">';
            notifications.forEach(n => {
                const icon = this.getTypeIcon(n.type);
                const timeAgo = this.getTimeAgo(n.createdAt);
                content += `
                    <div class="p-4 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-pink-500/5' : ''}" onclick="Notifications.handleClick('${n.id}', '${n.link || ''}')">
                        <div class="flex gap-3">
                            <div class="flex-shrink-0">${icon}</div>
                            <div class="flex-grow min-w-0">
                                <p class="text-white text-sm font-medium truncate">${n.title}</p>
                                <p class="text-gray-400 text-sm line-clamp-2">${n.message}</p>
                                <p class="text-gray-500 text-xs mt-1">${timeAgo}</p>
                            </div>
                            ${!n.read ? '<span class="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></span>' : ''}
                        </div>
                    </div>
                `;
            });
            content += '</div>';
        }

        content += `
            <div class="p-3 border-t border-white/10">
                <a href="settings.html#notifications" class="block text-center text-sm text-pink-400 hover:text-pink-300">View all notifications</a>
            </div>
        `;

        return content;
    },

    /**
     * Get icon for notification type
     */
    getTypeIcon(type) {
        const icons = {
            [this.TYPES.SUCCESS]: '<div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"><svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>',
            [this.TYPES.ERROR]: '<div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"><svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>',
            [this.TYPES.WARNING]: '<div class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center"><svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>',
            [this.TYPES.BIOGRAPHY]: '<div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>',
            [this.TYPES.NOMINATION]: '<div class="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center"><svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg></div>',
            [this.TYPES.COMMENT]: '<div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></div>'
        };
        return icons[type] || '<div class="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>';
    },

    /**
     * Get time ago string
     */
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    },

    /**
     * Toggle dropdown
     */
    toggleDropdown(button) {
        const dropdown = button.nextElementSibling;
        const isHidden = dropdown.classList.contains('hidden');

        // Close all other dropdowns
        document.querySelectorAll('.notification-dropdown').forEach(d => d.classList.add('hidden'));

        if (isHidden) {
            dropdown.innerHTML = this.renderDropdownContent();
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
    },

    /**
     * Handle notification click
     */
    handleClick(id, link) {
        this.markAsRead(id);
        if (link) {
            window.location.href = link;
        }
    },

    /**
     * Request push notification permission
     */
    async requestPushPermission() {
        if (!('Notification' in window)) {
            
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    /**
     * Show browser notification
     */
    showBrowserNotification(title, options = {}) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: 'images/womencypedia-logo.png',
                badge: 'images/womencypedia-logo.png',
                ...options
            });

            notification.onclick = function () {
                window.focus();
                if (options.link) {
                    window.location.href = options.link;
                }
                notification.close();
            };
        }
    }
};

// Initialize notifications when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
});
