/* ================= CONFIG ================= */

let currentPage = 1
let pageSize = 9

let filters = {}
let searchQuery = ""

let dynamicFilters = {
    eras: [],
    regions: [],
    categories: []
}

let browseLogicErrorCount = 0
const BROWSE_MAX_API_ERRORS = 3


/* ================= API HELPERS ================= */

/**
 * Normalise a Strapi v4 or v5 item to a flat object.
 * v4: { id, attributes: { name, slug, ... } }
 * v5: { id, name, slug, ... }
 */
function normaliseItem(item) {
    if (!item) return null;
    const attrs = item.attributes || item;
    return { id: item.id, ...attrs };
}

/**
 * Fetch helper that uses the global fetchStrapi if available,
 * otherwise falls back to plain fetch.
 */
async function browseFetch(endpoint, params = {}) {
    const baseUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://womencypedia-cms.onrender.com';
    const url = new URL(`${baseUrl}/api/${endpoint}`);

    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    // Only delegate to fetchStrapi for biographies (it auto-adds populate[]=image&tags).
    // Other endpoints (e.g. collections) may not have those relations and will 400.
    const isBiographies = endpoint === 'biographies';
    if (isBiographies && typeof fetchStrapi !== 'undefined') {
        return fetchStrapi(`/api/${endpoint}?${url.searchParams.toString()}`);
    }

    // Direct fetch for non-biography endpoints
    const headers = { 'Content-Type': 'application/json' };
    if (typeof CONFIG !== 'undefined' && CONFIG.API_TOKEN) {
        headers['Authorization'] = `Bearer ${CONFIG.API_TOKEN}`;
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }
    return res.json();
}


/* ================= LOAD FILTER OPTIONS ================= */

async function loadFilterOptions() {

    try {

        // Collections may not have a 'type' field in this schema, so load
        // filter values from the biography enum fields instead.
        // If collections endpoint works, use it; otherwise degrade gracefully.

        // Try to load eras/regions/categories from the available API
        // Since biographies use enum fields, we can just populate the dropdowns
        // with known values from the schema

        const knownEras = [
            { name: 'Ancient', slug: 'Ancient' },
            { name: 'Pre-colonial', slug: 'Pre-colonial' },
            { name: 'Colonial', slug: 'Colonial' },
            { name: 'Post-colonial', slug: 'Post-colonial' },
            { name: 'Contemporary', slug: 'Contemporary' }
        ];

        const knownRegions = [
            { name: 'Africa', slug: 'Africa' },
            { name: 'Europe', slug: 'Europe' },
            { name: 'Asia', slug: 'Asia' },
            { name: 'Middle East', slug: 'Middle East' },
            { name: 'North America', slug: 'North America' },
            { name: 'South America', slug: 'South America' },
            { name: 'Oceania', slug: 'Oceania' },
            { name: 'Global', slug: 'Global' }
        ];

        const knownCategories = [
            { name: 'Leadership', slug: 'Leadership' },
            { name: 'Culture & Arts', slug: 'Culture & Arts' },
            { name: 'Spirituality & Faith', slug: 'Spirituality & Faith' },
            { name: 'Politics & Governance', slug: 'Politics & Governance' },
            { name: 'Science & Innovation', slug: 'Science & Innovation' },
            { name: 'Community Builders', slug: 'Community Builders' },
            { name: 'Activism & Justice', slug: 'Activism & Justice' },
            { name: 'Education', slug: 'Education' },
            { name: 'Diaspora Stories', slug: 'Diaspora Stories' },
            // Enterprise categories
            { name: 'Trade & Commerce', slug: 'Trade & Commerce' },
            { name: 'Agriculture & Food', slug: 'Agriculture & Food' },
            { name: 'Manufacturing', slug: 'Manufacturing' },
            { name: 'Healthcare & Medicine', slug: 'Healthcare & Medicine' },
            { name: 'Finance & Banking', slug: 'Finance & Banking' },
            { name: 'Arts & Crafts', slug: 'Arts & Crafts' },
            { name: 'Technology', slug: 'Technology' }
        ];

        dynamicFilters.eras = knownEras;
        dynamicFilters.regions = knownRegions;
        dynamicFilters.categories = knownCategories;

        populateDropdown("eraFilter", dynamicFilters.eras, "Era");
        populateDropdown("regionFilter", dynamicFilters.regions, "Region");
        populateDropdown("categoryFilter", dynamicFilters.categories, "Category");
    }

    catch (e) {

        console.warn('Failed to load filter options:', e.message);

        const filterElements = ['eraFilter', 'regionFilter', 'categoryFilter'];

        filterElements.forEach(id => {

            const el = document.getElementById(id);

            if (el) {

                el.disabled = true;

                el.innerHTML = '<option value="">Filters unavailable</option>';

            }

        });

    }

}



/* ================= DROPDOWN ================= */

function populateDropdown(id, data, label) {

    const el = document.getElementById(id)

    if (!el) return


    el.innerHTML = `<option value="">${label}</option>`


    data.forEach(item => {

        el.innerHTML += `
        <option value="${item.slug}">
        ${item.name}
        </option>
        `

    })

}



/* ================= LOAD ENTRIES ================= */

async function loadEntries() {
    console.log('🔍 [Browse] Starting loadEntries, page:', currentPage, 'filters:', filters, 'search:', searchQuery);

    try {
        console.log('🔍 [Browse] Calling browseFetch for biographies...');

        const params = {
            "pagination[page]": currentPage,
            "pagination[pageSize]": pageSize,
            "sort": "name:asc",
            "populate": "image"
        };

        if (searchQuery) {
            params["filters[name][$containsi]"] = searchQuery;
        }

        if (filters.era) {
            params["filters[era][$eq]"] = filters.era.slug;
        }

        if (filters.region) {
            params["filters[region][$eq]"] = filters.region.slug;
        }

        if (filters.category) {
            params["filters[category][$eq]"] = filters.category.slug;
        }

        const res = await browseFetch("biographies", params);

        console.log('🔍 [Browse] API Response received:', res);

        // Handle both v4 and v5 formats
        const entries = (res.data || []).map(item => {
            const attrs = item.attributes || item;
            let imageUrl = null;

            // v4 media: image.data.attributes.url
            if (attrs.image && attrs.image.data && attrs.image.data.attributes) {
                const baseUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://womencypedia-cms.onrender.com';
                imageUrl = baseUrl + attrs.image.data.attributes.url;
            }
            // v5 media: image.url
            else if (attrs.image && attrs.image.url) {
                imageUrl = attrs.image.url.startsWith('http')
                    ? attrs.image.url
                    : (typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://womencypedia-cms.onrender.com') + attrs.image.url;
            }

            return {
                id: item.id,
                name: attrs.name || '',
                summary: attrs.introduction ? attrs.introduction.substring(0, 150) : (attrs.summary || ''),
                image: imageUrl ? { url: imageUrl } : null,
                slug: attrs.slug || '',
                era: attrs.era || '',
                region: attrs.region || '',
                category: attrs.category || ''
            };
        });

        const pagination = res.meta?.pagination || {
            page: currentPage,
            pageCount: 1,
            total: entries.length
        };

        console.log('🔍 [Browse] Found', entries.length, 'entries');

        renderEntries(entries, "entries-grid");
        updatePagination(pagination);
    }

    catch (e) {

        console.error('❌ [Browse] Failed to load biographies from Strapi:', e.message);

        const gridEl = document.getElementById("entries-grid");

        if (gridEl) {

            gridEl.innerHTML = `
                <div class="col-span-full text-center py-8 text-text-secondary">
                    <p>Unable to load biographies at this time.</p>
                    <p class="text-sm mt-2">Please try again later.</p>
                    <button onclick="loadEntries()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                        Retry
                    </button>
                </div>
            `;

        }

        updatePagination({ page: 1, pageCount: 1, total: 0 });

    }

}





/* ================= RENDER ================= */

function renderEntries(entries, containerId) {

    const el = document.getElementById(containerId)

    if (!el) return


    if (!entries.length) {

        el.innerHTML = `
        <p class="col-span-full text-center text-gray-500">
        No results found
        </p>
        `

        return

    }


    el.innerHTML = entries.map(item => {

        const image = item.image?.url ||
            (CONFIG.API_BASE_URL + '/images/placeholder-biography.jpg')

        return `
        <a href="biography.html?slug=${encodeURIComponent(item.slug || '')}"
        class="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group">
        <div
        class="h-48 bg-cover bg-center"
        style="background-image:url('${image}')">
        </div>

        <div class="p-4">
        <h3 class="font-serif font-semibold text-text-main group-hover:text-primary transition-colors">
        ${item.name}
        </h3>

        <p class="text-sm text-text-secondary mt-1 line-clamp-2">
        ${item.summary || ""}
        </p>

        </div>
        </a>
        `

    }).join("")

}



/* ================= FILTER ================= */

function applyFilters() {

    filters = {}

    const era = document.getElementById("eraFilter")?.value

    const region = document.getElementById("regionFilter")?.value

    const category = document.getElementById("categoryFilter")?.value


    if (era) filters.era = { slug: era }

    if (region) filters.region = { slug: region }

    if (category) filters.category = { slug: category }


    currentPage = 1

    loadEntries()

}



function resetFilters() {

    filters = {}

    searchQuery = ""

    currentPage = 1

    const searchEl = document.getElementById("searchInput");
    if (searchEl) searchEl.value = "";

    const eraEl = document.getElementById("eraFilter");
    if (eraEl) eraEl.value = "";

    const regionEl = document.getElementById("regionFilter");
    if (regionEl) regionEl.value = "";

    const categoryEl = document.getElementById("categoryFilter");
    if (categoryEl) categoryEl.value = "";

    loadEntries()

}



/* ================= SEARCH ================= */

function applySearch() {

    const searchEl = document.getElementById("searchInput");
    searchQuery = searchEl ? searchEl.value : "";

    currentPage = 1

    loadEntries()

}



/* ================= PAGINATION ================= */

function changePage(direction) {

    currentPage += direction

    if (currentPage < 1) currentPage = 1

    loadEntries()

}



function updatePagination(meta) {

    const pageInfo = document.getElementById("pageInfo");
    if (pageInfo) {
        pageInfo.innerText = `Page ${meta.page} of ${meta.pageCount}`;
    }

    const prevBtn = document.getElementById("prevPage");
    if (prevBtn) prevBtn.disabled = meta.page === 1;

    const nextBtn = document.getElementById("nextPage");
    if (nextBtn) nextBtn.disabled = meta.page === meta.pageCount;

}



/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log('🔍 [Browse] DOMContentLoaded - initializing browse functionality');
    loadFilterOptions()
    loadEntries()
})