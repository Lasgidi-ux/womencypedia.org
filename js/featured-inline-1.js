// Strapi API Base URL - now uses CONFIG
var STRAPI_API_BASE = 'https://womencypedia-cms.onrender.com/api';
if (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) {
    STRAPI_API_BASE = CONFIG.API_BASE_URL + '/api';
}

// Helper function to get full image URL
function getImageUrl(imageData) {
    if (!imageData) return null;
    if (typeof imageData === 'string') return imageData;
    if (imageData.url) {
        if (imageData.url.startsWith('http')) return imageData.url;
        // Use CONFIG.API_BASE_URL directly (no /api suffix) for media URLs
        var baseUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
            ? CONFIG.API_BASE_URL
            : 'https://womencypedia-cms.onrender.com';
        return baseUrl + imageData.url;
    }
    return null;
}

// Fetch featured biographies from Strapi
async function fetchFeaturedBiographies() {
    console.log('🔍 [Featured] Starting fetchFeaturedBiographies');
    try {
        // Use fetchStrapi for proper token handling
        var endpoint = '/api/biographies?filters[featured][$eq]=true&populate=*&pagination[pageSize]=8';
        console.log('🔍 [Featured] Calling fetchStrapi with endpoint:', endpoint);
        var data = await fetchStrapi(endpoint);
        console.log('🔍 [Featured] Raw API response:', data);
        console.log('🔍 [Featured] Processed data:', data.data || []);
        return { data: data.data || [], error: null };
    } catch (error) {
        console.error('❌ [Featured] Failed to fetch featured biographies:', error.message);
        return { data: [], error: error.message };
    }
}

// Render featured biography card
function renderFeaturedCard(bio) {
    const attrs = bio.attributes || bio;
    const imageUrl = getImageUrl(attrs.image);
    const name = attrs.name || 'Unknown';
    const region = attrs.region || '';
    const era = attrs.era || '';
    const introduction = attrs.introduction || '';
    const slug = attrs.slug || '';

    return `
            <a href="biography.html?slug=${slug}" class="group bg-white rounded-xl overflow-hidden border border-border-light hover:shadow-lg transition-all">
                <div class="aspect-[4/3] ${imageUrl ? '' : 'bg-gradient-to-br from-primary/20 to-accent-gold/20 flex items-center justify-center'}">
                    ${imageUrl
                        ? '<img src="' + imageUrl + '" alt="' + name + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">'
                        : '<span class="material-symbols-outlined text-primary/30 text-5xl">person</span>'
                    }
                </div>
                <div class="p-4">
                    <span class="text-xs font-bold text-accent-teal uppercase">${era} • ${region}</span>
                    <h3 class="font-serif text-lg font-bold text-text-main mt-1 group-hover:text-primary">${name}</h3>
                    <p class="text-sm text-text-secondary mt-1 line-clamp-2">${introduction.substring(0, 100)}...</p>
                </div>
            </a>
        `;
}

// Initialize featured page
async function initFeatured() {
    // Find the grid container - use id first, then fallback to class selector
    const gridContainer = document.getElementById('featured-biographies-grid') ||
        document.querySelector('.grid[class*="grid-cols-4"]');
    if (!gridContainer) return;

    // Show loading state
    gridContainer.innerHTML = '<div class="col-span-full text-center py-8 text-text-secondary">Loading featured biographies...</div>';

    // Fetch featured bios
    const result = await fetchFeaturedBiographies();

    if (result.error) {
        gridContainer.innerHTML = '<div class="col-span-full text-center py-8 text-text-secondary">Unable to load featured biographies at this time. Please try again later.</div>';
    } else if (result.data.length > 0) {
        gridContainer.innerHTML = result.data.map(renderFeaturedCard).join('');
    } else {
        gridContainer.innerHTML = '<div class="col-span-full text-center py-8 text-text-secondary">No featured biographies available.</div>';
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 [Featured] DOMContentLoaded - initializing featured biographies');
    initFeatured();
});