/**
 * Womencypedia User Profile — PRO Enhanced Version
 * Cleaner architecture, safer, scalable, production-ready
 */

//////////////////////////////
// CONFIG + HELPERS
//////////////////////////////

const API = {
    base: CONFIG.API_BASE_URL,

    async request(url, options = {}) {
        try {
            const res = await fetch(url, {
                cache: 'no-store',
                ...options
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error?.message || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.error("API Error:", err.message);
            throw err;
        }
    },

    getAuthHeaders() {
        if (typeof Auth === 'undefined') return {};
        const token = Auth.getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
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
    stats: { contributions: 0, saved: 0, badges: 0, views: 0 },
    contributions: [],
    saved: [],
    badges: []
};

//////////////////////////////
// INIT
//////////////////////////////

document.addEventListener('DOMContentLoaded', async () => {
    initUI();
    await loadProfile();
});

function initUI() {
    initTabs();
    initAvatarUpload();
    setupEditProfile();
}

//////////////////////////////
// PROFILE LOAD
//////////////////////////////

async function loadProfile() {
    showSkeleton();

    try {
        if (!Auth?.isAuthenticated?.()) {
            return loadDemo();
        }

        const user = await API.request(
            `${API.base}/api/users/me?populate=*`,
            { headers: API.getAuthHeaders() }
        );

        hydrateUser(user);

        await Promise.all([
            loadStats(),
            loadContributions(),
            loadSaved(),
            loadBadges()
        ]);

    } catch (err) {
        console.warn("Falling back to demo:", err.message);
        loadDemo();
    }

    renderUI();
    hideSkeleton();
}

function hydrateUser(user) {
    const avatarUrl =
        user.avatar?.url ||
        user.avatar?.data?.attributes?.url;

    profileData = {
        ...profileData,
        id: user.id,
        name: user.username || user.email,
        email: user.email,
        role: user.role?.name || 'User',
        location: user.location || '',
        bio: user.bio || '',
        joinDate: formatDate(user.createdAt),
        avatar: avatarUrl
            ? avatarUrl.startsWith('http')
                ? avatarUrl
                : `${API.base}${avatarUrl}`
            : null
    };
}

//////////////////////////////
// LOAD DATA
//////////////////////////////

async function loadStats() {
    try {
        const res = await API.request(
            `${API.base}/api/contributions?filters[author][id][$eq]=${profileData.id}&pagination[pageSize]=1`,
            { headers: API.getAuthHeaders() }
        );

        profileData.stats.contributions = res.meta?.pagination?.total || 0;
    } catch { }
}

async function loadContributions() {
    try {
        const res = await API.request(
            `${API.base}/api/contributions?filters[author][id][$eq]=${profileData.id}&sort=createdAt:desc&pagination[pageSize]=5`,
            { headers: API.getAuthHeaders() }
        );

        profileData.contributions = res.data || [];
    } catch { }
}

async function loadSaved() {
    try {
        const res = await API.request(
            `${API.base}/api/users/me?populate=savedBiographies`,
            { headers: API.getAuthHeaders() }
        );

        profileData.saved = res.savedBiographies || [];
        profileData.stats.saved = profileData.saved.length;
    } catch { }
}

async function loadBadges() {
    try {
        const res = await API.request(
            `${API.base}/api/users/me?populate=badges`,
            { headers: API.getAuthHeaders() }
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
    renderUI();
    hideSkeleton();
}

//////////////////////////////
// RENDER
//////////////////////////////

function renderUI() {
    if (qs('profile-name')) qs('profile-name').textContent = profileData.name;
    if (qs('profile-email')) qs('profile-email').textContent = profileData.email;
    if (qs('profile-bio')) qs('profile-bio').textContent = profileData.bio;

    renderAvatar();
    renderStats();
    renderContributions();
    renderSaved();
    renderBadges();
}

function renderAvatar() {
    const el = qs('profile-avatar-container');
    if (!el) return;

    if (profileData.avatar) {
        el.innerHTML = `<img src="${profileData.avatar}" alt="${safeText(profileData.name)}" class="w-full h-full object-cover">`;
    } else {
        el.innerHTML = `<span class="text-3xl font-serif font-bold text-white">${getInitials(profileData.name)}</span>`;
    }
}

function renderStats() {
    if (qs('stat-contributions'))
        qs('stat-contributions').textContent = profileData.stats.contributions;

    if (qs('stat-saved'))
        qs('stat-saved').textContent = profileData.stats.saved;
}

function renderContributions() {
    const el = qs('contributions-list');
    if (!el) return;

    if (!profileData.contributions.length) {
        el.innerHTML = `
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

function renderSaved() {
    const el = qs('saved-list');
    if (!el) return;

    if (!profileData.saved.length) {
        el.innerHTML = `
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
                : `${API.base}${attrs.image.url}`;
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

        const response = await fetch(`${API_BASE_URL}/api/badges/check`, {
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
                loadUserBadges();
            }
        }
    } catch (error) {
        console.error('Error checking badges:', error);
    }
}

/**
 * Show a notification when a new badge is earned
 */
function showBadgeNotification(badge) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-white border border-border-light rounded-xl shadow-lg p-4 z-50 animate-slide-in';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="size-12 rounded-full bg-accent-gold/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-accent-gold text-2xl">${badge.icon || 'workspace_premium'}</span>
            </div>
            <div>
                <h4 class="font-bold text-text-main">New Badge Earned!</h4>
                <p class="text-sm text-text-secondary">${badge.name}</p>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function renderBadges() {
    const el = qs('badges-grid');
    if (!el) return;

    if (!profileData.badges.length) {
        el.innerHTML = `
            <div class="col-span-full text-center py-12">
                <span class="material-symbols-outlined text-5xl text-text-secondary/40 mb-4">workspace_premium</span>
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

//////////////////////////////
// AVATAR UPLOAD
//////////////////////////////

function initAvatarUpload() {
    const el = qs('profile-avatar-container');
    if (!el) return;

    el.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = e => uploadAvatar(e.target.files[0]);
        input.click();
    };
}

async function uploadAvatar(file) {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        return alert("Max 2MB");
    }

    const token = Auth?.getAccessToken?.();

    if (!token) {
        const reader = new FileReader();
        reader.onload = e => {
            profileData.avatar = e.target.result;
            localStorage.setItem('demo_profile', JSON.stringify(profileData));
            renderAvatar();
        };
        return reader.readAsDataURL(file);
    }

    try {
        const fd = new FormData();
        fd.append('files', file);

        const upload = await API.request(
            `${API.base}/api/upload`,
            {
                method: 'POST',
                headers: API.getAuthHeaders(),
                body: fd
            }
        );

        const fileId = upload[0].id;

        await API.request(
            `${API.base}/api/users/${profileData.id}`,
            {
                method: 'PUT',
                headers: {
                    ...API.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avatar: fileId })
            }
        );

        profileData.avatar = upload[0].url;
        renderAvatar();

    } catch (err) {
        alert("Upload failed");
    }
}

//////////////////////////////
// EDIT PROFILE
//////////////////////////////

function setupEditProfile() {
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes("Edit Profile")) {
            btn.onclick = showEditModal;
        }
    });
}

function showEditModal() {
    const name = prompt("Name", profileData.name);
    if (!name) return;

    profileData.name = name;
    saveProfile();
}

async function saveProfile() {
    try {
        if (Auth?.isAuthenticated?.()) {
            await API.request(
                `${API.base} /api/users / ${profileData.id} `,
                {
                    method: 'PUT',
                    headers: {
                        ...API.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profileData)
                }
            );
        } else {
            localStorage.setItem('demo_profile', JSON.stringify(profileData));
        }

        renderUI();

    } catch {
        alert("Save failed");
    }
}

//////////////////////////////
// UTIL
//////////////////////////////

function getInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function showSkeleton() {
    qs('profile-card')?.classList.add('animate-pulse');
}

function hideSkeleton() {
    qs('profile-card')?.classList.remove('animate-pulse');
}

function initTabs() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('[data-tab-content]')
                .forEach(c => c.style.display = 'none');

            qs(btn.dataset.tab).style.display = 'block';
        };
    });
}