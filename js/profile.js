/**
 * Womencypedia User Profile — Enhanced with Strapi Real-Time Data
 *
 * Features:
 * - Fetches user data from Strapi /api/users/me?populate=*
 * - Shows real contributions count from Strapi
 * - Shows saved/bookmarked biographies
 * - Shows nomination history
 * - Avatar upload via Strapi Media Library
 * - Edit profile → PUT /api/users/:id
 * - i18n-aware date formatting
 */

// Profile data (hydrated from Strapi at runtime)
let profileData = {
    id: null,
    name: "Guest User",
    email: "",
    role: "Contributor",
    location: "",
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    avatar: null,
    bio: "Member of the Womencypedia community.",
    stats: {
        contributions: 0,
        saved: 0,
        badges: 0,
        profileViews: 0
    },
    badges: [],
    contributions: [],
    saved: [],
    nominations: []
};

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function () {
    initTabNavigation();
    initProfileDropdown();
    setupEditProfile();
    setupAvatarUpload();
    await loadUserProfile();
});

/**
 * Load user profile with full Strapi data
 */
async function loadUserProfile() {
    // Show skeleton loading state
    showProfileSkeleton();

    try {
        if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
            // Not authenticated — check for demo profile
            loadDemoProfile();
            return;
        }

        const token = Auth.getAccessToken();
        if (!token) {
            loadDemoProfile();
            return;
        }

        // Fetch authenticated user from Strapi with populated relations
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/me?populate=role,avatar`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.warn('Failed to fetch user profile, status:', response.status);
            if (response.status === 401) {
                // Token expired — clear and show guest
                Auth.logout && Auth.logout();
            }
            loadDemoProfile();
            return;
        }

        const user = await response.json();

        // Hydrate profile data
        profileData = {
            ...profileData,
            id: user.id,
            name: user.username || user.firstName || user.email || 'User',
            email: user.email || '',
            role: user.role?.name || user.role?.type || 'Contributor',
            location: user.location || user.city || '',
            joinDate: user.createdAt
                ? (typeof I18N !== 'undefined' ? I18N.formatDate(user.createdAt) : new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
                : profileData.joinDate,
            avatar: user.avatar?.url
                ? (user.avatar.url.startsWith('http') ? user.avatar.url : `${CONFIG.API_BASE_URL}${user.avatar.url}`)
                : null,
            bio: user.bio || user.about || 'Member of the Womencypedia community.',
        };

        // Fetch user contributions count
        await loadUserStats(token);

        // Fetch user's recent contributions
        await loadUserContributions(token);

        // Fetch user's saved/bookmarked items
        await loadUserSaved(token);

    } catch (error) {
        console.error('Error loading user profile:', error);
        loadDemoProfile();
    }

    // Update UI with profile data
    updateProfileUI();
    hideProfileSkeleton();
}

/**
 * Load user statistics from Strapi
 */
async function loadUserStats(token) {
    try {
        // Count contributions by this user
        const contribResponse = await fetch(
            `${CONFIG.API_BASE_URL}/api/contributions?filters[author][id][$eq]=${profileData.id}&pagination[pageSize]=1`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            }
        );

        if (contribResponse.ok) {
            const contribData = await contribResponse.json();
            profileData.stats.contributions = contribData.meta?.pagination?.total || 0;
        }

        // Count nominations by this user
        const nomResponse = await fetch(
            `${CONFIG.API_BASE_URL}/api/contributions?filters[author][id][$eq]=${profileData.id}&filters[type][$eq]=nomination&pagination[pageSize]=1`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            }
        );

        if (nomResponse.ok) {
            const nomData = await nomResponse.json();
            profileData.stats.nominations = nomData.meta?.pagination?.total || 0;
        }

    } catch (error) {
        console.warn('Could not load user stats:', error);
    }
}

/**
 * Load user's recent contributions
 */
async function loadUserContributions(token) {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/contributions?filters[author][id][$eq]=${profileData.id}&sort=createdAt:desc&pagination[pageSize]=5&populate=*`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            }
        );

        if (response.ok) {
            const data = await response.json();
            profileData.contributions = (data.data || []).map(item => ({
                id: item.id,
                ...(item.attributes || item)
            }));
        }
    } catch (error) {
        console.warn('Could not load contributions:', error);
    }
}

/**
 * Load user's saved/bookmarked biographies
 */
async function loadUserSaved(token) {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/users/me?populate=savedBiographies`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            }
        );

        if (response.ok) {
            const data = await response.json();
            const saved = data.savedBiographies || data.saved || [];
            profileData.saved = Array.isArray(saved) ? saved : [];
            profileData.stats.saved = profileData.saved.length;
        }
    } catch (error) {
        console.warn('Could not load saved items:', error);
    }
}

/**
 * Load demo profile from localStorage
 */
function loadDemoProfile() {
    const demoProfile = localStorage.getItem('womencypedia_demo_profile');
    if (demoProfile) {
        try {
            const parsed = JSON.parse(demoProfile);
            profileData = { ...profileData, ...parsed };
        } catch (e) {
            console.warn('Could not parse demo profile');
        }
    }
    updateProfileUI();
    hideProfileSkeleton();
}

/**
 * Show skeleton loading on profile card
 */
function showProfileSkeleton() {
    const card = document.getElementById('profile-card');
    if (card) {
        card.classList.add('animate-pulse');
    }
}

function hideProfileSkeleton() {
    const card = document.getElementById('profile-card');
    if (card) {
        card.classList.remove('animate-pulse');
    }
}

/**
 * Update the profile UI with data
 */
function updateProfileUI() {
    // Update name
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = profileData.name;

    // Update email
    const emailEl = document.getElementById('profile-email');
    if (emailEl) emailEl.textContent = profileData.email || 'No email provided';

    // Update bio
    const bioEl = document.getElementById('profile-bio');
    if (bioEl) bioEl.textContent = profileData.bio;

    // Update joined date
    const joinedEl = document.getElementById('profile-joined');
    if (joinedEl) {
        const label = typeof I18N !== 'undefined' ? I18N.t('memberSince') : 'Member since';
        joinedEl.textContent = `${label} ${profileData.joinDate}`;
    }

    // Update role badge
    const roleEl = document.getElementById('profile-role');
    if (roleEl && profileData.role) {
        roleEl.textContent = profileData.role;
        roleEl.classList.remove('hidden');
    }

    // Update location
    const locationEl = document.getElementById('profile-location');
    if (locationEl) {
        if (profileData.location) {
            locationEl.textContent = profileData.location;
            locationEl.closest('.profile-location-row')?.classList.remove('hidden');
        }
    }

    // Update avatar
    const avatarContainer = document.getElementById('profile-avatar-container');
    if (avatarContainer) {
        if (profileData.avatar) {
            avatarContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = profileData.avatar;
            img.alt = profileData.name;
            img.className = 'size-32 rounded-full object-cover border-4 border-white shadow-lg';
            avatarContainer.appendChild(img);
        } else {
            const initials = getInitials(profileData.name);
            avatarContainer.innerHTML = initials
                ? `<span class="text-3xl font-serif font-bold text-white">${initials}</span>`
                : `<span class="material-symbols-outlined text-4xl text-white/80">person</span>`;
        }
    }
    // Update stats
    updateStatsUI();

    // Render contributions tab
    renderContributionsTab();

    // Render saved tab
    renderSavedTab();
}

/**
 * Update stats cards
 */
function updateStatsUI() {
    const statEls = {
        contributions: document.getElementById('stat-contributions'),
        saved: document.getElementById('stat-saved'),
        badges: document.getElementById('stat-badges'),
        views: document.getElementById('stat-views')
    };

    if (statEls.contributions) statEls.contributions.textContent = formatNumber(profileData.stats.contributions);
    if (statEls.saved) statEls.saved.textContent = formatNumber(profileData.stats.saved);
    if (statEls.badges) statEls.badges.textContent = formatNumber(profileData.stats.badges);
    if (statEls.views) statEls.views.textContent = formatNumber(profileData.stats.profileViews);

    // Fallback: update by grid position if IDs not set
    if (!statEls.contributions) {
        const gridItems = document.querySelectorAll('.profile-stat-value');
        if (gridItems.length >= 4) {
            gridItems[0].textContent = formatNumber(profileData.stats.contributions);
            gridItems[1].textContent = formatNumber(profileData.stats.saved);
            gridItems[2].textContent = formatNumber(profileData.stats.badges);
            gridItems[3].textContent = formatNumber(profileData.stats.profileViews);
        }
    }
}

/**
 * Render contributions tab content
 */
function renderContributionsTab() {
    const container = document.getElementById('contributions-list');
    if (!container) return;

    if (profileData.contributions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-5xl text-text-secondary/40 mb-4">edit_note</span>
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

    container.innerHTML = profileData.contributions.map(contrib => {
        const date = typeof I18N !== 'undefined'
            ? I18N.formatDate(contrib.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })
            : getRelativeTime(contrib.createdAt);

        const statusColor = {
            published: 'bg-green-100 text-green-700',
            draft: 'bg-yellow-100 text-yellow-700',
            pending: 'bg-blue-100 text-blue-700',
            rejected: 'bg-red-100 text-red-700'
        }[contrib.status] || 'bg-gray-100 text-gray-700';

        // Escape user-controlled content to prevent XSS
        const safeType = typeof Security !== 'undefined' ? Security.escapeHtml(contrib.type) : (contrib.type || '');
        const safeTitle = typeof Security !== 'undefined' ? Security.escapeHtml(contrib.title) : (contrib.title || '');
        const safeName = typeof Security !== 'undefined' ? Security.escapeHtml(contrib.name) : (contrib.name || '');
        const safeStatus = typeof Security !== 'undefined' ? Security.escapeHtml(contrib.status) : (contrib.status || '');
        const displayTitle = safeTitle || safeName || 'Untitled';

        return `
            <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-border-light hover:shadow-md transition-shadow">
                <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-primary text-[20px]">${safeType === 'nomination' ? 'person_add' : 'article'}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-serif font-semibold text-text-main truncate">${displayTitle}</h4>
                    <p class="text-sm text-text-secondary mt-1">${date}</p>
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${safeStatus || 'draft'}</span>
            </div>
        `;
    }).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Render saved items tab
 */
function renderSavedTab() {
    const container = document.getElementById('saved-list');
    if (!container) return;

    if (profileData.saved.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-5xl text-text-secondary/40 mb-4">bookmark_border</span>
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

    // Whitelist of allowed image domains/patterns
    const allowedImagePatterns = [
        /^https?:\/\/[^\/]+\.strapi\.io\//i,
        /^https?:\/\/res\.cloudinary\.com\//i,
        /^https?:\/\/[^\/]+\.(jpg|jpeg|png|webp|gif)$/i,
        /^data:image\//i
    ];

    function isValidImageUrl(url) {
        if (!url) return false;
        return allowedImagePatterns.some(pattern => pattern.test(url));
    }

    container.innerHTML = profileData.saved.map(item => {
        const attrs = item.attributes || item;

        // Sanitize user-controlled text fields
        const safeName = escapeHtml(attrs.name || 'Unnamed');
        const safeRegion = escapeHtml(attrs.region || '');
        const safeEra = escapeHtml(attrs.era || '');

        // Validate and encode URL for slug
        const slug = attrs.slug || item.id;
        const safeSlug = encodeURIComponent(String(slug));

        // Validate image URL against whitelist
        let imageUrl = null;
        if (attrs.image?.url) {
            const rawUrl = attrs.image.url.startsWith('http')
                ? attrs.image.url
                : `${CONFIG.API_BASE_URL}${attrs.image.url}`;
            if (isValidImageUrl(rawUrl)) {
                imageUrl = rawUrl;
            }
        }

        // Escape alt text for image
        const safeAlt = escapeHtml(attrs.name || '');

        return `
            <a href="biography.html?slug=${safeSlug}" class="flex items-center gap-4 p-4 bg-white rounded-xl border border-border-light hover:shadow-md transition-shadow group">
                <div class="size-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10">
                    ${imageUrl
                ? `<img src="${escapeHtml(imageUrl)}" alt="${safeAlt}" class="w-full h-full object-cover">`
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
 * Setup avatar upload
 */
function setupAvatarUpload() {
    const avatarContainer = document.getElementById('profile-avatar-container');
    if (!avatarContainer) return;

    // Add upload overlay on hover
    avatarContainer.style.cursor = 'pointer';
    avatarContainer.title = 'Click to change avatar';

    avatarContainer.addEventListener('click', () => {
        if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Sign in to change your avatar', 'info');
            }
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('Image must be under 2MB', 'error');
                }
                return;
            }

            await uploadAvatar(file);
        };
        input.click();
    });
}

/**
 * Upload avatar to Strapi Media Library and update user
 */
async function uploadAvatar(file) {
    // Guard: Check Auth exists before calling getAccessToken
    if (typeof Auth === 'undefined') {
        console.warn('Auth is not defined, cannot upload avatar');
        return;
    }

    const token = Auth.getAccessToken();
    if (!token || !profileData.id) return;

    try {
        // Show uploading state
        const avatarContainer = document.getElementById('profile-avatar-container');
        if (avatarContainer) {
            avatarContainer.innerHTML = `<div class="flex items-center justify-center"><span class="material-symbols-outlined animate-spin text-white text-3xl">refresh</span></div>`;
        }

        // Upload file to Strapi
        const formData = new FormData();
        formData.append('files', file);
        formData.append('ref', 'plugin::users-permissions.user');
        formData.append('refId', profileData.id);
        formData.append('field', 'avatar');

        const uploadResponse = await fetch(`${CONFIG.API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (uploadResponse.ok) {
            const uploadedFiles = await uploadResponse.json();
            if (uploadedFiles.length > 0) {
                const newUrl = uploadedFiles[0].url;
                profileData.avatar = newUrl.startsWith('http') ? newUrl : `${CONFIG.API_BASE_URL}${newUrl}`;
                updateProfileUI();

                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('Avatar updated!', 'success');
                }
            }
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Failed to upload avatar: ' + error.message, 'error');
        }
        // Restore avatar
        updateProfileUI();
    }
}

// Get initials from name
function getInitials(name) {
    if (!name || name === 'Guest User') return null;
    // Trim and filter out empty segments to handle multiple/leading/trailing spaces
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Tab navigation
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('[data-tab]');

    // Fallback: look for buttons inside the tab container
    const fallbackButtons = tabButtons.length > 0 ? tabButtons :
        document.querySelectorAll('.bg-white.rounded-xl.border.border-border-light button');

    fallbackButtons.forEach(button => {
        button.addEventListener('click', function () {
            fallbackButtons.forEach(btn => {
                btn.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-lavender-soft/30');
                btn.classList.add('text-text-secondary');
            });

            this.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-lavender-soft/30');
            this.classList.remove('text-text-secondary');

            const tabName = this.dataset.tab || this.textContent.trim().toLowerCase();
            showTabContent(tabName);
        });
    });
}

function showTabContent(tabName) {
    const allContent = document.querySelectorAll('[data-tab-content]');
    // Fallback to id-based tabs
    const fallbackContent = allContent.length > 0 ? allContent : document.querySelectorAll('[id$="-tab"]');

    fallbackContent.forEach(content => {
        content.style.display = 'none';
    });

    // Try data-tab-content first, then id
    const selected = document.querySelector(`[data-tab-content="${tabName}"]`) ||
        document.getElementById(`${tabName}-tab`);
    if (selected) {
        selected.style.display = 'block';
    }
}

// Profile dropdown
function initProfileDropdown() {
    const dropdownButton = document.querySelector('#profile-dropdown button');
    if (!dropdownButton) return;

    dropdownButton.addEventListener('click', function () {
        let dropdown = document.querySelector('.profile-menu');
        if (dropdown) {
            dropdown.remove();
        } else {
            dropdown = createProfileMenu();
            this.parentElement.appendChild(dropdown);
        }
    });

    document.addEventListener('click', function (e) {
        if (!dropdownButton.contains(e.target)) {
            document.querySelector('.profile-menu')?.remove();
        }
    });
}

function createProfileMenu() {
    const menu = document.createElement('div');
    menu.className = 'profile-menu absolute bg-white rounded-xl shadow-lg border border-border-light py-2 min-w-[200px] z-50';

    const strapiAdminUrl = `${CONFIG.API_BASE_URL}/admin`;

    menu.innerHTML = `
        <a href="profile.html" class="flex items-center gap-3 px-4 py-2 hover:bg-lavender-soft/30 transition-colors">
            <span class="material-symbols-outlined text-text-secondary text-[20px]">person</span>
            <span class="text-sm font-medium text-text-main">My Profile</span>
        </a>
        <a href="${strapiAdminUrl}" target="_blank" class="flex items-center gap-3 px-4 py-2 hover:bg-lavender-soft/30 transition-colors" data-auth="admin-only">
            <span class="material-symbols-outlined text-text-secondary text-[20px]">dashboard</span>
            <span class="text-sm font-medium text-text-main">Admin Dashboard</span>
        </a>
        <a href="nominate.html" class="flex items-center gap-3 px-4 py-2 hover:bg-lavender-soft/30 transition-colors">
            <span class="material-symbols-outlined text-text-secondary text-[20px]">send</span>
            <span class="text-sm font-medium text-text-main">My Nominations</span>
        </a>
        <a href="browse.html" class="flex items-center gap-3 px-4 py-2 hover:bg-lavender-soft/30 transition-colors">
            <span class="material-symbols-outlined text-text-secondary text-[20px]">bookmark</span>
            <span class="text-sm font-medium text-text-main">Saved Items</span>
        </a>
        <hr class="my-2 border-border-light">
        <a href="settings.html" class="flex items-center gap-3 px-4 py-2 hover:bg-lavender-soft/30 transition-colors">
            <span class="material-symbols-outlined text-text-secondary text-[20px]">settings</span>
            <span class="text-sm font-medium text-text-main">Settings</span>
        </a>
        <button onclick="Auth && Auth.logout(); window.location.href='index.html';" class="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors">
            <span class="material-symbols-outlined text-red-600 text-[20px]">logout</span>
            <span class="text-sm font-medium">Sign Out</span>
        </button>
    `;

    return menu;
}

// Edit profile functionality
function setupEditProfile() {
    const editButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes("Edit Profile"));
    if (editButton) {
        editButton.removeAttribute('onclick');
        editButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showEditProfileModal();
        });
    }
}

function showEditProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4';
    modal.onclick = function (e) {
        if (e.target === modal) modal.remove();
    };

    const isAuthenticated = typeof Auth !== 'undefined' && Auth.isAuthenticated();
    const t = typeof I18N !== 'undefined' ? (k) => I18N.t(k) : (k) => k;

    // Escape user-controlled values to prevent XSS
    const safeName = escapeHtml(profileData.name);
    const safeEmail = escapeHtml(profileData.email);
    const safeLocation = escapeHtml(profileData.location || '');
    const safeBio = escapeHtml(profileData.bio);

    const authNotice = !isAuthenticated
        ? `<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <span class="material-symbols-outlined text-[16px] align-middle mr-1">info</span>
            You are not signed in. Changes will only be saved locally.
        </div>` : '';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
                <h2 class="font-serif text-2xl font-bold text-text-main">${t('editProfile')}</h2>
                <button onclick="this.closest('.fixed').remove()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            ${authNotice}
            <form id="edit-profile-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-text-main mb-2">Display Name</label>
                    <input type="text" id="edit-name" value="${safeName}"
                        class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main mb-2">Email</label>
                    <input type="email" id="edit-email" value="${safeEmail}" ${isAuthenticated ? '' : 'disabled'}
                        class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal disabled:bg-gray-100 disabled:cursor-not-allowed">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main mb-2">Location</label>
                    <input type="text" id="edit-location" value="${safeLocation}"
                        class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main mb-2">Bio</label>
                    <textarea id="edit-bio" rows="3"
                        class="w-full px-4 py-3 border border-border-light rounded-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal resize-none">${safeBio}</textarea>
                </div>
            </form>
            <div class="flex gap-4 mt-6">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 px-6 py-3 border border-border-light text-text-main font-medium rounded-lg hover:bg-gray-50 transition-colors">${t('cancel')}</button>
                <button onclick="saveProfile()" class="flex-1 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors">${t('saveChanges')}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function saveProfile() {
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const location = document.getElementById('edit-location').value;
    const bio = document.getElementById('edit-bio').value;

    const saveButton = document.querySelector('#edit-profile-form + div button:last-child');
    const originalText = saveButton.textContent;
    saveButton.textContent = typeof I18N !== 'undefined' ? I18N.t('loading') : 'Saving...';
    saveButton.disabled = true;

    try {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated() && profileData.id) {
            // Save to Strapi — PUT /api/users/:id
            const token = Auth.getAccessToken();
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/${profileData.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: name,
                    email: email,
                    location: location,
                    bio: bio
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to update profile');
            }

            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Profile updated successfully!', 'success');
            }
        } else {
            // Demo mode
            localStorage.setItem('womencypedia_demo_profile', JSON.stringify({ name, email, location, bio }));
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Profile saved locally (demo mode)', 'info');
            }
        }

        profileData.name = name;
        profileData.email = email;
        profileData.location = location;
        profileData.bio = bio;
        updateProfileUI();
        document.querySelector('.fixed')?.remove();

    } catch (error) {
        console.error('Error saving profile:', error);
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Failed to update profile: ' + error.message, 'error');
        }
    } finally {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    }
}

// Format numbers
function formatNumber(num) {
    if (typeof I18N !== 'undefined') return I18N.formatNumber(num);
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Get relative time
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);

    // Use Math.floor for accurate day calculation
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    // Special case: same-day differences show hours/minutes
    if (diffDays === 0) {
        if (diffHours === 0) {
            if (diffMinutes <= 1) return 'Just now';
            return `${diffMinutes} minutes ago`;
        }
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    if (typeof I18N !== 'undefined') {
        return I18N.formatDate(dateString, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Make functions available globally
window.showTab = function (tabName) { showTabContent(tabName); };
window.saveProfile = saveProfile;
