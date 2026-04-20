// Get collection slug from URL
        const urlParams = new URLSearchParams(window.location.search);
        const COLLECTION_SLUG = urlParams.get('slug');

        if (!COLLECTION_SLUG) {
            // No slug provided — redirect to collections index
            window.location.href = 'collections.html';
        }

        async function loadCollection() {
            const loadingState = document.getElementById('loading-state');
            const errorState = document.getElementById('error-state');
            const entriesGrid = document.getElementById('entries-grid');
            const emptyState = document.getElementById('empty-state');
            const entryCount = document.getElementById('entry-count');
            const titleEl = document.getElementById('collection-title');
            const descEl = document.getElementById('collection-description');

            // Show loading
            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            entriesGrid.classList.add('hidden');
            emptyState.classList.add('hidden');

            try {
                // Fetch collection from Strapi by slug
                const url = `${CONFIG.API_BASE_URL}/api/collections?filters[slug][$eq]=${encodeURIComponent(COLLECTION_SLUG)}&populate[biographies][populate]=image,tags&populate=coverImage`;
                const response = await fetch(url, {
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) throw new Error('API returned ' + response.status);

                const result = await response.json();
                const collections = result.data;

                if (!collections || collections.length === 0) {
                    // Collection not found
                    loadingState.classList.add('hidden');
                    titleEl.textContent = 'Collection Not Found';
                    descEl.textContent = 'The collection you are looking for does not exist.';
                    emptyState.classList.remove('hidden');
                    return;
                }

                // Get the first matching collection
                const col = collections[0];
                const attrs = col.attributes || col;

                // Update page metadata
                document.title = `${attrs.title} — Womencypedia Collections`;
                titleEl.textContent = attrs.title;

                // Handle rich text description (strip HTML for display)
                if (attrs.description) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = attrs.description;
                    descEl.textContent = tempDiv.textContent || tempDiv.innerText;
                }

                // Update OG meta
                const ogTitle = document.querySelector('meta[property="og:title"]');
                if (ogTitle) ogTitle.content = `${attrs.title} — Womencypedia`;

                // Extract biographies from the relation
                let entries = [];
                if (attrs.biographies) {
                    if (attrs.biographies.data) {
                        // Strapi v4 format
                        entries = attrs.biographies.data.map(item => ({
                            id: item.id,
                            ...(item.attributes || item)
                        }));
                    } else if (Array.isArray(attrs.biographies)) {
                        entries = attrs.biographies;
                    }
                }

                loadingState.classList.add('hidden');
                entryCount.textContent = entries.length;

                if (entries.length === 0) {
                    emptyState.classList.remove('hidden');
                    return;
                }

                renderEntries(entries);
                entriesGrid.classList.remove('hidden');

            } catch (error) {
                
                loadingState.classList.add('hidden');
                errorState.classList.remove('hidden');
            }

            // Also load related collections
            loadRelatedCollections();
        }

        function getMediaUrl(media) {
            if (!media) return CONFIG.API_BASE_URL + '/images/placeholder-biography.jpg';
            const mediaData = media.data ? (media.data.attributes || media.data) : media;
            const url = mediaData.url || (mediaData.formats && (mediaData.formats.medium?.url || mediaData.formats.small?.url));
            if (!url) return CONFIG.API_BASE_URL + '/images/placeholder-biography.jpg';
            if (url.startsWith('/')) {
                return CONFIG.API_BASE_URL + url;
            }
            return url;
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = String(text);
            return div.innerHTML;
        }

        function renderEntries(entries) {
            const grid = document.getElementById('entries-grid');
            grid.innerHTML = entries.map(entry => {
                const imageUrl = getMediaUrl(entry.image);
                const tags = entry.tags
                    ? (entry.tags.data ? entry.tags.data.map(t => (t.attributes || t).name) : entry.tags.map(t => t.name || t))
                    : [];

                return `
                    <a href="biography.html?slug=${encodeURIComponent(entry.slug || '')}&id=${entry.id}"
                       class="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
                        <div class="h-48 bg-gradient-to-br from-accent-gold/20 to-primary/10 flex items-center justify-center overflow-hidden">
                            ${imageUrl !== 'images/placeholder-biography.jpg'
                        ? `<img src="${imageUrl}" alt="${escapeHtml(entry.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">`
                        : `<span class="material-symbols-outlined text-primary/30 text-6xl">person</span>`}
                        </div>
                        <div class="p-6">
                            <h3 class="font-serif text-lg font-bold text-text-main group-hover:text-primary transition-colors mb-2" data-i18n="collection.escapehtmlentryname">
                                ${escapeHtml(entry.name)}
                            </h3>
                            <p class="text-text-secondary text-sm line-clamp-2 mb-4">
                                ${escapeHtml(entry.introduction ? entry.introduction.replace(/<[^>]*>/g, '').substring(0, 150) : 'Discover this remarkable woman\'s story.')}
                            </p>
                            <div class="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                                ${entry.region ? `<span class="px-2 py-1 bg-primary/10 text-primary rounded-full">${escapeHtml(entry.region)}</span>` : ''}
                                ${entry.era ? `<span class="px-2 py-1 bg-accent-gold/10 text-accent-gold rounded-full">${escapeHtml(entry.era)}</span>` : ''}
                                ${tags.slice(0, 2).map(t => `<span class="px-2 py-1 bg-lavender-soft text-text-secondary rounded-full">${escapeHtml(t)}</span>`).join('')}
                            </div>
                        </div>
                    </a>
                `;
            }).join('');
        }

        async function loadRelatedCollections() {
            const container = document.getElementById('related-collections-grid');
            try {
                const url = `${CONFIG.API_BASE_URL}/api/collections?filters[slug][$ne]=${encodeURIComponent(COLLECTION_SLUG)}&pagination[pageSize]=5&populate=coverImage`;
                const response = await fetch(url, {
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) return;

                const result = await response.json();
                const collections = result.data || [];

                if (collections.length === 0) return;

                const icons = ['history', 'diversity_3', 'gavel', 'public', 'church', 'auto_awesome', 'school'];
                const colors = ['text-primary', 'text-accent-teal', 'text-accent-gold', 'text-primary', 'text-lavender', 'text-accent-gold', 'text-accent-teal'];

                container.innerHTML = collections.map((col, i) => {
                    const attrs = col.attributes || col;
                    return `
                        <a href="collection.html?slug=${encodeURIComponent(attrs.slug)}"
                           class="bg-white rounded-xl p-4 border border-border-light hover:shadow-md hover:border-primary/30 transition-all text-center group">
                            <span class="material-symbols-outlined ${colors[i % colors.length]} text-2xl mb-2 group-hover:scale-110 transition-transform block">${icons[i % icons.length]}</span>
                            <span class="font-medium text-sm text-text-main">${escapeHtml(attrs.title)}</span>
                        </a>
                    `;
                }).join('');

            } catch (error) {
                
            }
        }

        // Load on page load
        document.addEventListener('DOMContentLoaded', loadCollection);