const COLLECTION_CATEGORY = 'Missionary Women';

        async function loadCollection() {
            const loadingState = document.getElementById('loading-state');
            const errorState = document.getElementById('error-state');
            const entriesGrid = document.getElementById('entries-grid');
            const emptyState = document.getElementById('empty-state');
            const entryCount = document.getElementById('entry-count');

            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            entriesGrid.classList.add('hidden');
            emptyState.classList.add('hidden');

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/archive/filter?category=${encodeURIComponent(COLLECTION_CATEGORY)}`);
                if (!response.ok) throw new Error('API error');
                const data = await response.json();
                const entries = data.entries || data || [];
                loadingState.classList.add('hidden');
                if (entries.length === 0) { emptyState.classList.remove('hidden'); entryCount.textContent = '0'; return; }
                entryCount.textContent = entries.length;
                renderEntries(entries);
                entriesGrid.classList.remove('hidden');
            } catch (error) {
                if (typeof DATA !== 'undefined' && DATA.entries) {
                    const filtered = DATA.entries.filter(e => e.category === COLLECTION_CATEGORY || (e.tags && e.tags.some(t => t.toLowerCase().includes('missionary') || t.toLowerCase().includes('religious'))));
                    loadingState.classList.add('hidden');
                    if (filtered.length === 0) { emptyState.classList.remove('hidden'); entryCount.textContent = '0'; }
                    else { entryCount.textContent = filtered.length; renderEntries(filtered); entriesGrid.classList.remove('hidden'); }
                } else { loadingState.classList.add('hidden'); errorState.classList.remove('hidden'); }
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
            document.getElementById('entries-grid').innerHTML = entries.map(entry => {
                const id = encodeURIComponent(entry.id || entry.entry_id || '');
                const name = escapeHtml(entry.full_name || entry.name || '');
                const bio = escapeHtml(entry.biography || entry.introduction || 'Learn about this remarkable woman.');
                const region = escapeHtml(entry.region || 'Global');
                const imageSrc = entry.image_url || entry.image || '';
                const imageHtml = imageSrc
                    ? `<img src="${escapeHtml(imageSrc)}" alt="${name}" class="w-full h-full object-cover">`
                    : `<span class="material-symbols-outlined text-divider/30 text-6xl">person</span>`;
                return `
                <a href="../biography.html?id=${id}" class="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg transition-all group">
                    <div class="h-48 bg-gradient-to-br from-lavender-soft/50 to-primary/10 flex items-center justify-center">
                        ${imageHtml}
                    </div>
                    <div class="p-6">
                        <h3 class="font-serif text-lg font-bold text-text-main group-hover:text-primary transition-colors mb-2">${name}</h3>
                        <p class="text-text-secondary text-sm line-clamp-2 mb-4">${bio}</p>
                        <span class="px-2 py-1 bg-lavender-soft text-divider text-xs rounded-full">${region}</span>
                    </div>
                </a>`;
            }).join('');
        }

        document.addEventListener('DOMContentLoaded', loadCollection);