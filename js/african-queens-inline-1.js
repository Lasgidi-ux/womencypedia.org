// Get slug from URL parameter or use default
        const urlParams = new URLSearchParams(window.location.search);
        const COLLECTION_SLUG = urlParams.get('slug') || 'african-queens';

        // Default collection data (fallback)
        const defaultCollection = {
            slug: 'african-queens',
            title: 'African Queens',
            description: 'Discover the remarkable stories of African queens, warrior monarchs, and female rulers who governed kingdoms, led armies, and shaped the continent\'s history for centuries.',
            region: 'Africa',
            category: 'African Queenship'
        };

        async function loadCollection() {
            const loadingState = document.getElementById('loading-state');
            const errorState = document.getElementById('error-state');
            const entriesGrid = document.getElementById('entries-grid');
            const emptyState = document.getElementById('empty-state');
            const entryCount = document.getElementById('entry-count');

            // Show loading
            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            entriesGrid.classList.add('hidden');
            emptyState.classList.add('hidden');

            let collectionData = defaultCollection;
            let entries = [];

            try {
                // Try Strapi API first
                if (typeof StrapiAPI !== 'undefined' && CONFIG.USE_STRAPI) {
                    // Get collection by slug
                    const collection = await StrapiAPI.collections.get(COLLECTION_SLUG);
                    if (collection) {
                        collectionData = {
                            slug: collection.slug || COLLECTION_SLUG,
                            title: collection.title || defaultCollection.title,
                            description: collection.description || defaultCollection.description,
                            coverImage: collection.coverImage
                        };

                        // Update page metadata
                        document.title = `${collectionData.title} — Womencypedia Collections`;

                        // Get women in this collection
                        if (collection.women && Array.isArray(collection.women)) {
                            entries = collection.women;
                        }
                    }
                }

                // If no entries from Strapi, try legacy API
                if (entries.length === 0) {
                    try {
                        const response = await fetch(`${CONFIG.API_BASE_URL}/archive/filter?region=${collectionData.region}&category=${collectionData.category}`);
                        if (response.ok) {
                            const data = await response.json();
                            entries = data.entries || data || [];
                        }
                    } catch (e) {
                        console.warn('Legacy API unavailable');
                    }
                }

                loadingState.classList.add('hidden');

                if (entries.length === 0) {
                    emptyState.classList.remove('hidden');
                    entryCount.textContent = '0';
                    return;
                }

                entryCount.textContent = entries.length;
                renderEntries(entries);
                entriesGrid.classList.remove('hidden');

            } catch (error) {
                console.log('API unavailable, using fallback data');
                // Use fallback static data
                if (typeof DATA !== 'undefined' && DATA.entries) {
                    const filteredEntries = DATA.entries.filter(e =>
                        e.region === collectionData.region ||
                        e.category === collectionData.category ||
                        (e.tags && e.tags.some(t => t.toLowerCase().includes('queen')))
                    );

                    loadingState.classList.add('hidden');

                    if (filteredEntries.length === 0) {
                        emptyState.classList.remove('hidden');
                        entryCount.textContent = '0';
                    } else {
                        entryCount.textContent = filteredEntries.length;
                        renderEntries(filteredEntries);
                        entriesGrid.classList.remove('hidden');
                    }
                } else {
                    loadingState.classList.add('hidden');
                    errorState.classList.remove('hidden');
                }
            }
        }

        function escapeHtml(text) {
            if (text == null) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderEntries(entries) {
            const grid = document.getElementById('entries-grid');
            grid.innerHTML = entries.map(entry => {
                const id = encodeURIComponent(entry.id || entry.entry_id || '');
                const name = escapeHtml(entry.full_name || entry.name || '');
                const bio = escapeHtml(entry.biography || entry.introduction || 'Learn about this remarkable woman\'s story.');
                const region = escapeHtml(entry.region || 'Africa');
                const category = entry.category ? escapeHtml(entry.category) : '';
                const imageSrc = entry.image_url || entry.image || '';
                const imageHtml = imageSrc
                    ? `<img src="${escapeHtml(imageSrc)}" alt="${name}" class="w-full h-full object-cover">`
                    : `<span class="material-symbols-outlined text-primary/30 text-6xl">person</span>`;
                const categoryHtml = category ? `<span class="px-2 py-1 bg-accent-gold/10 text-accent-gold rounded-full">${category}</span>` : '';
                return `
                <a href="../biography.html?id=${id}" 
                   class="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
                    <div class="h-48 bg-gradient-to-br from-accent-gold/20 to-primary/10 flex items-center justify-center">
                        ${imageHtml}
                    </div>
                    <div class="p-6">
                        <h3 class="font-serif text-lg font-bold text-text-main group-hover:text-primary transition-colors mb-2">
                            ${name}
                        </h3>
                        <p class="text-text-secondary text-sm line-clamp-2 mb-4">
                            ${bio}
                        </p>
                        <div class="flex items-center gap-2 text-xs text-text-secondary">
                            <span class="px-2 py-1 bg-primary/10 text-primary rounded-full">${region}</span>
                            ${categoryHtml}
                        </div>
                    </div>
                </a>`;
            }).join('');
        }

        // Load on page load
        document.addEventListener('DOMContentLoaded', loadCollection);