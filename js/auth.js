/**
 * Womencypedia Authentication Module
 * 
 * Handles user authentication, JWT token management, and role-based access control.
 */

const Auth = {
    // Current user state
    _currentUser: null,

    // Rate limiting for brute-force protection
    _loginAttempts: 0,
    _lastAttemptTime: 0,
    _lockoutUntil: 0,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 5 * 60 * 1000, // 5 minutes
    ATTEMPT_WINDOW: 15 * 60 * 1000,  // 15 minutes

    /**
     * Initialize authentication state from stored tokens
     */
    init() {
        const storedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        if (storedUser) {
            try {
                this._currentUser = JSON.parse(storedUser);
                this.updateUIForAuthState();
            } catch (e) {
                this.clearStorage();
            }
        }

        // Set up UI event listeners
        this.setupAuthUI();
    },

    /**
     * Handle mock API login success
     * @param {Object} data - response data
     */
    _handleLoginSuccess(data) {
        if (data.access_token) {
            this.setTokens(data.access_token, data.refresh_token);
        } else if (data.jwt) {
            this.setTokens(data.jwt, null);
        }

        const user = data.user || { email: '', name: '', role: 'contributor' };
        this._currentUser = user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
        this.updateUIForAuthState();
    },

    /**
     * Check if login is rate-limited
     * @returns {Object} {limited: boolean, remainingSeconds: number}
     */
    _checkRateLimit() {
        const now = Date.now();

        // Restore lockout from sessionStorage (survives page refreshes)
        const storedLockout = sessionStorage.getItem('womencypedia_login_lockout');
        if (storedLockout) {
            this._lockoutUntil = parseInt(storedLockout, 10);
        }

        // Check if currently locked out
        if (this._lockoutUntil > now) {
            const remainingMs = this._lockoutUntil - now;
            return { limited: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
        }

        // Reset attempt counter if outside the attempt window
        if (now - this._lastAttemptTime > this.ATTEMPT_WINDOW) {
            this._loginAttempts = 0;
        }

        return { limited: false, remainingSeconds: 0 };
    },

    /**
     * Record a failed login attempt
     */
    _recordFailedAttempt() {
        this._loginAttempts++;
        this._lastAttemptTime = Date.now();

        if (this._loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
            this._lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
            sessionStorage.setItem('womencypedia_login_lockout', this._lockoutUntil.toString());
            this._loginAttempts = 0;
            console.warn('[Auth] Too many failed login attempts. Locked out for 5 minutes.');
        }
    },

    /**
     * Reset login attempts on successful login
     */
    _resetRateLimit() {
        this._loginAttempts = 0;
        this._lastAttemptTime = 0;
        this._lockoutUntil = 0;
        sessionStorage.removeItem('womencypedia_login_lockout');
    },

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User data
     */
    async login(email, password) {
        // Check rate limit before attempting login
        const rateCheck = this._checkRateLimit();
        if (rateCheck.limited) {
            const mins = Math.ceil(rateCheck.remainingSeconds / 60);
            throw new Error(`Too many failed login attempts. Please try again in ${mins} minute${mins > 1 ? 's' : ''}.`);
        }

        try {
            let result;
            // Use Strapi authentication
            if (CONFIG.USE_STRAPI) {
                result = await this._strapiLogin(email, password);
            } else {
                // Fallback to generic API request
                result = await this._genericLogin(email, password);
            }
            // Success — reset rate limiter
            this._resetRateLimit();
            return result;
        } catch (error) {
            // Record failed attempt
            this._recordFailedAttempt();
            throw error;
        }
    },

    /**
     * Strapi-specific login
     */
    async _strapiLogin(email, password) {
        try {
            // Strapi expects 'identifier' instead of 'username' or 'email' for login
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || 'Login failed');
            }

            const data = await response.json();

            // Store token (Strapi returns 'jwt')
            this.setTokens(data.jwt, null);

            // Store user data - normalize role from Strapi object to string
            const user = data.user || { email: email, role: 'contributor' };
            if (user.role && typeof user.role === 'object') {
                user.role = user.role.type || user.role.name || 'public';
            }
            this._currentUser = user;
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));

            // Update UI
            this.updateUIForAuthState();

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Generic login (non-Strapi backend)
     */
    async _genericLogin(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || 'Login failed');
            }

            const data = await response.json();
            this._handleLoginSuccess(data);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @param {string} userData.name - User's full name
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password
     * @returns {Promise<Object>} - User data
     */
    async register(userData) {
        // Use Strapi registration
        if (CONFIG.USE_STRAPI) {
            return this._strapiRegister(userData);
        }

        // Fallback to generic API request
        return this._genericRegister(userData);
    },

    /**
     * Strapi-specific registration
     */
    async _strapiRegister(userData) {
        try {
            // Strapi register expects username, email, password
            const backendData = {
                username: userData.name || userData.username || userData.email.split('@')[0],
                email: userData.email,
                password: userData.password
            };

            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || 'Registration failed');
            }

            const data = await response.json();

            // If auto-login after registration
            if (data.jwt) {
                this.setTokens(data.jwt, null);
                const user = data.user || { email: userData.email, name: userData.name, role: 'contributor' };
                this._currentUser = user;
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
                this.updateUIForAuthState();
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    /**
     * Generic registration (non-Strapi backend)
     */
    async _genericRegister(userData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || 'Registration failed');
            }

            const data = await response.json();
            this._handleLoginSuccess(data);
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    /**
     * Request password reset
     * @param {string} email - User email
     * @returns {Promise<Object>} - Response
     */
    async forgotPassword(email) {
        try {
            // Strapi uses 'email' in the body for forgot-password
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || 'Password reset request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },

    /**
     * Reset password with token
     * @param {string} token - Reset token from email
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} - Response
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: token, password: newPassword, passwordConfirmation: newPassword })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || 'Password reset failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            const token = this.getAccessToken();
            if (token) {
                // Strapi doesn't have a default logout endpoint, just clear client tokens
                // If you had a custom plugin or endpoint, you'd call it here

            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearStorage();
            this._currentUser = null;
            this.updateUIForAuthState();

            // Redirect to home if on admin page
            if (window.location.pathname.includes('admin')) {
                window.location.href = 'index.html';
            }
        }
    },

    /**
     * Refresh access token
     * @returns {Promise<boolean>} - Success status
     */
    async refreshToken() {
        // Strapi v5 does not ship with a refresh token mechanism out of the box.
        // Validate that the token still exists; if not, force logout.
        const token = this.getAccessToken();
        if (!token) {
            return false;
        }
        // Basic JWT expiration check (decode payload without verification)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                // Token expired
                this.clearStorage();
                return false;
            }
        } catch (e) {
            // If token can't be decoded, it's invalid
            return false;
        }
        return true;
    },

    /**
     * Get current user information
     * @returns {Promise<Object|null>} - User data or null
     */
    async getCurrentUser() {
        if (this._currentUser) {
            return this._currentUser;
        }

        const token = this.getAccessToken();
        if (!token) {
            return null;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.ME}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            // Normalize role from Strapi object to string
            if (data.role && typeof data.role === 'object') {
                data.role = data.role.type || data.role.name || 'public';
            }
            this._currentUser = data;
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @param {string} profileData.username - User's display name
     * @param {string} profileData.email - User email
     * @param {string} profileData.bio - User biography
     * @param {string} profileData.location - User location
     * @returns {Promise<Object>} - Updated user data
     */
    async updateProfile(profileData) {
        const token = this.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            // Build the update payload for Strapi
            // Strapi allows updating: username, email, password, and custom fields
            const updatePayload = {};

            if (profileData.username) updatePayload.username = profileData.username;
            if (profileData.email) updatePayload.email = profileData.email;
            if (profileData.bio) updatePayload.bio = profileData.bio;
            if (profileData.location) updatePayload.location = profileData.location;
            if (profileData.firstName) updatePayload.firstName = profileData.firstName;
            if (profileData.lastName) updatePayload.lastName = profileData.lastName;

            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.USER.UPDATE_PROFILE}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || error?.message || 'Profile update failed');
            }

            const data = await response.json();

            // Update local user state
            if (data) {
                this._currentUser = { ...this._currentUser, ...data };
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(this._currentUser));
                this.updateUIForAuthState();
            }

            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getAccessToken();
    },

    /**
     * Check if current user is admin
     * @returns {boolean}
     */
    isAdmin() {
        return this._currentUser?.role === CONFIG.ROLES.ADMIN;
    },

    /**
     * Check if current user is contributor
     * @returns {boolean}
     */
    isContributor() {
        return this._currentUser?.role === CONFIG.ROLES.CONTRIBUTOR || this.isAdmin();
    },

    /**
     * Get user role
     * @returns {string}
     */
    getRole() {
        return this._currentUser?.role || CONFIG.ROLES.PUBLIC;
    },

    /**
     * Get current user (synchronous)
     * @returns {Object|null} - User data or null
     */
    getUser() {
        return this._currentUser || null;
    },

    /**
     * Get access token
     * @returns {string|null}
     */
    getAccessToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    },

    /**
     * Get refresh token
     * @returns {string|null}
     */
    getRefreshToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    },

    /**
     * Set tokens
     * @param {string} accessToken 
     * @param {string} refreshToken 
     */
    setTokens(accessToken, refreshToken) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        if (refreshToken) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
    },

    /**
     * Clear all authentication storage
     */
    clearStorage() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    },

    /**
     * Update UI based on authentication state
     */
    updateUIForAuthState() {
        const isAuth = this.isAuthenticated();
        const isAdmin = this.isAdmin();

        // Update Sign In / Sign Out buttons
        const signInButtons = document.querySelectorAll('[data-auth="signin"]');
        const signOutButtons = document.querySelectorAll('[data-auth="signout"]');
        const userInfo = document.querySelectorAll('[data-auth="user-info"]');
        const adminLinks = document.querySelectorAll('[data-auth="admin-only"]');
        const contributorLinks = document.querySelectorAll('[data-auth="contributor-only"]');
        const adminFallback = document.querySelectorAll('[data-auth="require-admin-fallback"]');

        signInButtons.forEach(btn => {
            btn.style.display = isAuth ? 'none' : '';
        });

        signOutButtons.forEach(btn => {
            btn.style.display = isAuth ? '' : 'none';
        });

        userInfo.forEach(el => {
            el.style.display = isAuth ? '' : 'none';
            if (isAuth && this._currentUser) {
                el.textContent = this._currentUser.name || this._currentUser.email;
            }
        });

        adminLinks.forEach(link => {
            link.style.display = isAdmin ? '' : 'none';
        });

        contributorLinks.forEach(link => {
            link.style.display = this.isContributor() ? '' : 'none';
        });

        // Show admin fallback (access denied message) for non-admins
        adminFallback.forEach(el => {
            el.style.display = isAdmin ? 'none' : '';
        });

        // Show/hide admin edit buttons on pages
        const adminEditButtons = document.querySelectorAll('.admin-edit-btn');
        adminEditButtons.forEach(btn => {
            btn.style.display = isAdmin ? '' : 'none';
        });
    },

    /**
     * Set up authentication UI elements
     */
    setupAuthUI() {
        // Login modal handlers
        const loginModal = document.getElementById('login-modal');
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');

        // Sign in button click
        document.querySelectorAll('[data-auth="signin"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (loginModal) {
                    loginModal.classList.remove('hidden');
                }
            });
        });

        // Sign out button click
        document.querySelectorAll('[data-auth="signout"]').forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });

        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = loginForm.querySelector('[name="email"]').value;
                const password = loginForm.querySelector('[name="password"]').value;
                const submitBtn = loginForm.querySelector('[type="submit"]');

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Signing in...';

                try {
                    await this.login(email, password);
                    if (loginModal) {
                        loginModal.classList.add('hidden');
                    }
                    loginForm.reset();
                    if (loginError) {
                        loginError.classList.add('hidden');
                    }

                    // Show success message
                    UI.showToast('Logged in successfully!', 'success');

                    // Reload page to update content
                    window.location.reload();
                } catch (error) {
                    if (loginError) {
                        loginError.textContent = error.message;
                        loginError.classList.remove('hidden');
                    }
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Sign In';
                }
            });
        }

        // Close modal on outside click
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    loginModal.classList.add('hidden');
                }
            });
        }
    },

    /**
     * Protect a page - redirect to home if not authorized
     * @param {string} requiredRole - Required role to access page
     * @returns {boolean} - True if authorized
     */
    protectPage(requiredRole = CONFIG.ROLES.ADMIN) {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html?auth=required';
            return false;
        }

        // 'user' means any authenticated user — already checked above
        if (requiredRole === 'user' || requiredRole === 'authenticated') {
            return true;
        }

        if (requiredRole === CONFIG.ROLES.ADMIN && !this.isAdmin()) {
            window.location.href = '403.html';
            return false;
        }

        if (requiredRole === CONFIG.ROLES.CONTRIBUTOR && !this.isContributor()) {
            window.location.href = '403.html';
            return false;
        }

        return true;
    }
};

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();

    // Handle URL parameters for auth redirects
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    if (authParam === 'required') {
        // Show login modal with message
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.remove('hidden');
        }
        // Show toast message if UI is available
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Please sign in to access this page', 'warning');
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authParam === 'forbidden') {
        // Show access denied message
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('You do not have permission to access this page', 'error');
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authParam === 'logout') {
        // Confirm logout
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('You have been logged out successfully', 'success');
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
