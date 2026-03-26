/**
 * Teaching Resources Module
 * Handles dynamic loading of teaching resources from Strapi API
 */

// Fallback static teaching resources
const fallbackTeachingResources = [
    {
        slug: 'lesson-plan-ancient-queens',
        title: 'Lesson Plan: Ancient Queens',
        description: 'Complete lesson plan for teaching about Cleopatra, Hatshepsut, and Zenobia.',
        type: 'lesson-plan',
        icon: 'picture_as_pdf',
        color: 'primary',
        downloadText: 'Download PDF →',
        file: null
    },
    {
        slug: 'presentation-symbolic-power',
        title: 'Presentation: Symbolic Power',
        description: 'Slide deck introducing symbolic power analysis for undergraduate courses.',
        type: 'presentation',
        icon: 'slideshow',
        color: 'accent-teal',
        downloadText: 'Download Slides →',
        file: null
    },
    {
        slug: 'discussion-guide-oral-traditions',
        title: 'Discussion Guide: Oral Traditions',
        description: 'Discussion questions and activities for teaching about oral history preservation.',
        type: 'discussion-guide',
        icon: 'quiz',
        color: 'accent-gold',
        downloadText: 'Download Guide →',
        file: null
    },
    {
        slug: 'reading-list-womens-history',
        title: 'Reading List: Women\'s History',
        description: 'Curated bibliography of essential works on global women\'s history.',
        type: 'reading-list',
        icon: 'menu_book',
        color: 'primary',
        downloadText: 'View List →',
        file: null
    },
    {
        slug: 'assignment-biography-project',
        title: 'Assignment: Biography Project',
        description: 'Template and rubric for student biography research projects.',
        type: 'assignment',
        icon: 'assignment',
        color: 'accent-teal',
        downloadText: 'Download Template →',
        file: null
    },
    {
        slug: 'video-lecture-series',
        title: 'Video Lecture Series',
        description: 'Recorded lectures on interpretive biography methodology.',
        type: 'video',
        icon: 'video_library',
        color: 'accent-gold',
        downloadText: 'Watch Now →',
        file: null
    }
];

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
    if (!resource) return 'resources.html';

    // If resource has a file from Strapi, use it
    if (resource.file && resource.file.url) {
        if (typeof StrapiAPI !== 'undefined') {
            return StrapiAPI.getMediaURL(resource.file.url);
        }
        return resource.file.url;
    }

    // Fallback to resources page
    return 'resources.html';
}

// Render teaching resource card
function renderTeachingResourceCard(resource) {
    const colors = {
        'primary': { bg: 'bg-primary/10', text: 'text-primary' },
        'accent-teal': { bg: 'bg-accent-teal/10', text: 'text-accent-teal' },
        'accent-gold': { bg: 'bg-accent-gold/10', text: 'text-accent-gold' }
    };
    const c = colors[resource.color] || colors['primary'];

    const title = escapeHtml(resource.title || '');
    const description = escapeHtml(resource.description || '');
    const icon = escapeHtml(resource.icon || 'picture_as_pdf');
    const downloadText = escapeHtml(resource.downloadText || 'Download →');
    const downloadUrl = getResourceDownloadUrl(resource);

    // Determine if this is a video resource
    const isVideo = resource.type === 'video';
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

// Show fallback static teaching resources
function showFallbackTeachingResources(containerId = 'teaching-resources-grid') {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    // Hide loading skeleton if exists
    const loading = document.getElementById('teaching-resources-loading');
    if (loading) {
        loading.classList.add('hidden');
    }

    // Render fallback resources
    grid.innerHTML = fallbackTeachingResources.map(resource => renderTeachingResourceCard(resource)).join('');
    grid.classList.remove('hidden');
}

// Load teaching resources from Strapi API
async function loadTeachingResources(containerId = 'teaching-resources-grid') {
    try {
        // Try Strapi API first - use contributions endpoint since teaching-resources doesn't exist
        if (typeof StrapiAPI !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.USE_STRAPI) {
            // Use contributions endpoint with article type as a proxy for teaching resources
            const response = await StrapiAPI.contributions.getAll({
                filters: { type: { $eq: 'article' } },
                pagination: { pageSize: 6 }
            });
            if (response && response.entries && response.entries.length > 0) {
                renderTeachingResources(response.entries, containerId);
                return;
            }
        }
    } catch (error) {
        console.warn('Strapi API not available for teaching resources, using fallback:', error.message);
    }

    // If API fails, use fallback
    showFallbackTeachingResources(containerId);
}

// Load teaching resources by type
async function loadTeachingResourcesByType(type, containerId = 'teaching-resources-grid') {
    try {
        if (typeof StrapiAPI !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.USE_STRAPI) {
            // Use contributions endpoint with article type as a proxy for teaching resources
            const response = await StrapiAPI.contributions.getAll({
                filters: { type: { $eq: 'article' } },
                pagination: { pageSize: 6 }
            });
            if (response && response.entries && response.entries.length > 0) {
                renderTeachingResources(response.entries, containerId);
                return;
            }
        }
    } catch (error) {
        console.warn(`Strapi API not available for teaching resources type ${type}, using fallback:`, error.message);
    }

    // Filter fallback resources by type
    const filtered = fallbackTeachingResources.filter(r => r.type === type);
    if (filtered.length > 0) {
        renderTeachingResources(filtered, containerId);
    } else {
        showFallbackTeachingResources(containerId);
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
        loadTeachingResourcesByType,
        renderTeachingResources,
        showFallbackTeachingResources,
        initTeachingResources,
        fallbackTeachingResources
    };
}
