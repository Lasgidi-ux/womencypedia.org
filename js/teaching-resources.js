/**
 * Teaching Resources Module
 * Handles dynamic loading of teaching resources from Strapi API
 */

// No static fallback - resources are loaded dynamically from Strapi

// HTML escape helper for XSS prevention
function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

// Get download URL for a resource
function getResourceDownloadUrl(resource) {
    if (!resource) return '#';

    // Handle Strapi data structure
    const attrs = resource.attributes || resource;

    // If resource has a file from Strapi, use it
    if (attrs.file && attrs.file.url) {
        if (typeof StrapiAPI !== 'undefined') {
            return StrapiAPI.teachingResources.getDownloadUrl(attrs);
        }
        return attrs.file.url;
    }

    // If resource has an external URL, use it
    if (attrs.externalUrl) {
        return attrs.externalUrl;
    }

    // For reading lists and other non-file resources, link to resources page
    return 'resources.html';
}

// Render teaching resource card from Strapi data
function renderTeachingResourceCard(resource) {
    const colors = {
        'lesson-plan': { bg: 'bg-primary/10', text: 'text-primary', icon: 'picture_as_pdf' },
        'presentation': { bg: 'bg-accent-teal/10', text: 'text-accent-teal', icon: 'slideshow' },
        'discussion-guide': { bg: 'bg-accent-gold/10', text: 'text-accent-gold', icon: 'quiz' },
        'reading-list': { bg: 'bg-primary/10', text: 'text-primary', icon: 'menu_book' },
        'assignment': { bg: 'bg-accent-teal/10', text: 'text-accent-teal', icon: 'assignment' },
        'video': { bg: 'bg-accent-gold/10', text: 'text-accent-gold', icon: 'video_library' }
    };

    // Map Strapi data structure
    const attrs = resource.attributes || resource;
    const resourceType = attrs.type || 'lesson-plan';
    const c = colors[resourceType] || colors['lesson-plan'];

    const title = escapeHtml(attrs.title || '');
    const description = escapeHtml(attrs.description || '');
    const icon = escapeHtml(attrs.icon || c.icon);
    const downloadText = escapeHtml(attrs.downloadText || getDownloadTextForType(resourceType));
    const downloadUrl = getResourceDownloadUrl(resource);

    // Determine if this is a video resource
    const isVideo = resourceType === 'video';
    const linkTarget = isVideo ? 'target="_blank" rel="noopener noreferrer"' : '';

    return `
        <div class="bg-white rounded-xl p-5 border border-border-light hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
                <div class="size-12 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined ${c.text} text-2xl">${icon}</span>
                </div>
                <div class="min-w-0">
                    <h3 class="font-serif text-base font-bold text-text-main mb-1">${title}</h3>
                    <p class="text-text-secondary text-xs leading-relaxed mb-3">${description}</p>
                    <a href="${downloadUrl}" ${linkTarget} class="text-primary text-xs font-bold hover:underline">${downloadText}</a>
                </div>
            </div>
        </div>
    `;
}

// Get appropriate download text based on resource type
function getDownloadTextForType(type) {
    const texts = {
        'lesson-plan': 'Download PDF →',
        'presentation': 'Download Slides →',
        'discussion-guide': 'Download Guide →',
        'reading-list': 'View List →',
        'assignment': 'Download Template →',
        'video': 'Watch Now →'
    };
    return texts[type] || 'Download →';
}

// Render teaching resources grid
function renderTeachingResources(resources, containerId = 'teaching-resources-grid') {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = resources.map(resource => renderTeachingResourceCard(resource)).join('');

    // Hide loading skeleton if exists
    const loading = document.getElementById('teaching-resources-loading');
    if (loading) {
        loading.classList.add('hidden');
    }

    // Show grid
    grid.classList.remove('hidden');
}

// Show error state for teaching resources
function showTeachingResourcesError(containerId = 'teaching-resources-grid', message = 'Unable to load teaching resources. Please try again.') {
    const grid = document.getElementById(containerId);
    const loading = document.getElementById('teaching-resources-loading');

    if (loading) loading.classList.add('hidden');
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <span class="material-symbols-outlined text-6xl text-text-secondary/40 mb-4">download</span>
                <h3 class="font-serif text-2xl font-bold text-text-main mb-3">Content Unavailable</h3>
                <p class="text-text-secondary mb-6">${escapeHtml(message)}</p>
                <button onclick="loadTeachingResources('${containerId}')" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">refresh</span>
                    Try Again
                </button>
            </div>
        `;
        grid.classList.remove('hidden');
    }
}

// Load teaching resources from Strapi API (no fallback)
async function loadTeachingResources(containerId = 'teaching-resources-grid') {
    const grid = document.getElementById(containerId);
    const loading = document.getElementById('teaching-resources-loading');

    try {
        if (typeof StrapiAPI === 'undefined') {
            throw new Error('API client not available');
        }

        // Show loading state
        if (loading) loading.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');

        const response = await StrapiAPI.teachingResources.getAll({
            sort: 'publishedAt:desc',
            pageSize: 6
        });

        if (response && response.entries && response.entries.length > 0) {
            renderTeachingResources(response.entries, containerId);
        } else {
            throw new Error('No teaching resources found');
        }
    } catch (error) {
        console.error('Failed to load teaching resources:', error);

        // Retry with exponential backoff for network errors
        const maxRetries = 3;
        if (typeof loadTeachingResources.retryCount === 'undefined') {
            loadTeachingResources.retryCount = {};
        }
        if (typeof loadTeachingResources.retryCount[containerId] === 'undefined') {
            loadTeachingResources.retryCount[containerId] = 0;
        }

        if (loadTeachingResources.retryCount[containerId] < maxRetries && (error.name === 'NetworkError' || error.message.includes('fetch'))) {
            const delay = Math.pow(2, loadTeachingResources.retryCount[containerId]) * 1000;
            console.log(`Retrying teaching resources load in ${delay}ms... (attempt ${loadTeachingResources.retryCount[containerId] + 1}/${maxRetries})`);

            loadTeachingResources.retryCount[containerId]++;
            setTimeout(() => {
                loadTeachingResources(containerId, loadTeachingResources.retryCount[containerId]);
            }, delay);
            return;
        }

        showTeachingResourcesError(containerId, error.message || 'Failed to load teaching resources');
    }
}

// Load featured teaching resources from Strapi API with retry
async function loadFeaturedTeachingResources(containerId = 'teaching-resources-grid', retryCount = 0) {
    const grid = document.getElementById(containerId);
    const loading = document.getElementById('teaching-resources-loading');
    const maxRetries = 2; // Fewer retries for optional featured content

    try {
        if (typeof StrapiAPI === 'undefined') {
            throw new Error('API client not available');
        }

        // Show loading state
        if (loading) loading.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');

        const response = await StrapiAPI.teachingResources.getAll({
            filters: { featured: true },
            sort: 'publishedAt:desc',
            pageSize: 3
        });

        if (response && response.entries && response.entries.length > 0) {
            renderTeachingResources(response.entries, containerId);
        } else {
            // If no featured resources, load regular resources
            await loadTeachingResources(containerId);
        }
    } catch (error) {
        console.error('Failed to load featured teaching resources:', error);

        // Retry with exponential backoff for network errors
        if (retryCount < maxRetries && (error.name === 'NetworkError' || error.message.includes('fetch'))) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying featured teaching resources load in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);

            setTimeout(() => {
                loadFeaturedTeachingResources(containerId, retryCount + 1);
            }, delay);
            return;
        }

        // Fallback to regular resources if featured fails
        await loadTeachingResources(containerId);
    }
}

// Load teaching resources by type
async function loadTeachingResourcesByType(type, containerId = 'teaching-resources-grid') {
    const grid = document.getElementById(containerId);
    const loading = document.getElementById('teaching-resources-loading');

    try {
        if (typeof StrapiAPI === 'undefined') {
            throw new Error('API client not available');
        }

        // Show loading state
        if (loading) loading.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');

        const response = await StrapiAPI.teachingResources.getByType(type);

        if (response && response.entries && response.entries.length > 0) {
            renderTeachingResources(response.entries, containerId);
        } else {
            throw new Error(`No ${type} resources found`);
        }
    } catch (error) {
        console.error(`Failed to load ${type} teaching resources:`, error);
        showTeachingResourcesError(containerId, error.message || `Failed to load ${type} resources`);
    }
}

// Initialize teaching resources on page load
function initTeachingResources(containerId = 'teaching-resources-grid') {
    document.addEventListener('DOMContentLoaded', function () {
        loadTeachingResources(containerId);
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadTeachingResources,
        loadFeaturedTeachingResources,
        loadTeachingResourcesByType,
        renderTeachingResources,
        showTeachingResourcesError,
        initTeachingResources
    };
}
