// Search state
        let searchState = {
            query: '',
            era: '',
            region: '',
            category: '',
            page: 1,
            perPage: 12,
            totalResults: 0,
            results: []
        };

        // Initialize search page
        document.addEventListener('DOMContentLoaded', function () {
            // Get search query from URL
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q') || urlParams.get('search') || '';

            // Set search input value
            const searchInput = document.getElementById('search-input');
            if (searchInput && query) {
                searchInput.value = query;
                searchState.query = query;
                performSearch();
            }

            // Search input event
            if (searchInput) {
                searchInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        searchState.query = this.value.trim();
                        searchState.page = 1;
                        updateURL();
                        performSearch();
                    }
                });
            }

            // Filter change events
            document.getElementById('filter-era').addEventListener('change', function () {
                searchState.era = this.value;
                searchState.page = 1;
                performSearch();
            });
            document.getElementById('filter-region').addEventListener('change', function () {
                searchState.region = this.value;
                searchState.page = 1;
                performSearch();
            });
            document.getElementById('filter-category').addEventListener('change', function () {
                searchState.category = this.value;
                searchState.page = 1;
                performSearch();
            });

            // Clear filters
            document.getElementById('clear-filters').addEventListener('click', function () {
                searchState.era = '';
                searchState.region = '';
                searchState.category = '';
                searchState.page = 1;
                document.getElementById('filter-era').value = '';
                document.getElementById('filter-region').value = '';
                document.getElementById('filter-category').value = '';
                performSearch();
            });

            // Pagination events
            document.getElementById('prev-page').addEventListener('click', function () {
                if (searchState.page > 1) {
                    searchState.page--;
                    performSearch();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
            document.getElementById('next-page').addEventListener('click', function () {
                const totalPages = Math.ceil(searchState.totalResults / searchState.perPage);
                if (searchState.page < totalPages) {
                    searchState.page++;
                    performSearch();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        // Update URL with search params
        function updateURL() {
            const url = new URL(window.location);
            if (searchState.query) {
                url.searchParams.set('q', searchState.query);
            } else {
                url.searchParams.delete('q');
            }
            window.history.replaceState({}, '', url);
        }

        // Perform search
        async function performSearch() {
            const loadingState = document.getElementById('loading-state');
            const emptyState = document.getElementById('empty-state');
            const resultsGrid = document.getElementById('results-grid');
            const pagination = document.getElementById('pagination');
            const resultsCount = document.getElementById('results-count');

            // Show loading state
            loadingState.classList.remove('hidden');
            emptyState.classList.add('hidden');
            resultsGrid.innerHTML = '';
            pagination.classList.add('hidden');

            try {
                // Search via Strapi API
                let results = [];
                try {
                    let url = `${CONFIG.API_BASE_URL}/api/biographies?populate=image,tags&pagination[page]=${searchState.page}&pagination[pageSize]=${searchState.perPage}`;
                    if (searchState.query) {
                        url += `&filters[$or][0][name][$containsi]=${encodeURIComponent(searchState.query)}`;
                        url += `&filters[$or][1][introduction][$containsi]=${encodeURIComponent(searchState.query)}`;
                    }
                    if (searchState.era) {
                        url += `&filters[era][$eq]=${encodeURIComponent(searchState.era)}`;
                    }
                    if (searchState.region) {
                        url += `&filters[region][$eq]=${encodeURIComponent(searchState.region)}`;
                    }
                    if (searchState.category) {
                        url += `&filters[category][$eq]=${encodeURIComponent(searchState.category)}`;
                    }

                    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
                    if (response.ok) {
                        const result = await response.json();
                        results = (result.data || []).map(item => {
                            const attrs = item.attributes || item;
                            return { id: item.id, ...attrs };
                        });
                        searchState.totalResults = result.meta?.pagination?.total || results.length;
                    } else {
                        // Fallback to sample data
                        results = filterResults(getSampleData());
                        searchState.totalResults = results.length;
                    }
                } catch (e) {
                    
                    results = filterResults(getSampleData());
                    searchState.totalResults = results.length;
                }

                // Update state
                searchState.totalResults = results.length;

                // Paginate results
                const startIndex = (searchState.page - 1) * searchState.perPage;
                const paginatedResults = results.slice(startIndex, startIndex + searchState.perPage);
                searchState.results = paginatedResults;

                // Hide loading
                loadingState.classList.add('hidden');

                // Update results count
                if (searchState.query || searchState.era || searchState.region || searchState.category) {
                    resultsCount.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''}`;
                } else {
                    resultsCount.textContent = 'Enter a search term to find biographies, stories, and more.';
                }

                // Show results or empty state
                if (paginatedResults.length > 0) {
                    renderResults(paginatedResults);
                    if (results.length > searchState.perPage) {
                        renderPagination();
                        pagination.classList.remove('hidden');
                    }
                } else {
                    emptyState.classList.remove('hidden');
                }

            } catch (error) {
                
                loadingState.classList.add('hidden');
                emptyState.classList.remove('hidden');
            }
        }

        // Filter results based on search criteria
        function filterResults(entries) {
            return entries.filter(entry => {
                // Text search
                if (searchState.query) {
                    const query = searchState.query.toLowerCase();
                    const matchesText =
                        (entry.name && entry.name.toLowerCase().includes(query)) ||
                        (entry.title && entry.title.toLowerCase().includes(query)) ||
                        (entry.introduction && entry.introduction.toLowerCase().includes(query)) ||
                        (entry.region && entry.region.toLowerCase().includes(query)) ||
                        (entry.category && entry.category.toLowerCase().includes(query));
                    if (!matchesText) return false;
                }

                // Era filter
                if (searchState.era && entry.era !== searchState.era) {
                    return false;
                }

                // Region filter
                if (searchState.region && entry.region !== searchState.region) {
                    return false;
                }

                // Category filter
                if (searchState.category && entry.category !== searchState.category) {
                    return false;
                }

                return true;
            });
        }

        // Render search results
        function renderResults(results) {
            const resultsGrid = document.getElementById('results-grid');

            resultsGrid.innerHTML = results.map(entry => `
                <a href="biography.html?id=${entry.id}" class="search-result-card block bg-white rounded-xl border border-border-light overflow-hidden">
                    <div class="aspect-[4/3] bg-primary/10 relative overflow-hidden">
                        ${entry.image
                    ? `<img src="${Security.escapeHtml(entry.image)}" alt="${Security.escapeHtml(entry.name)}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center">
                                <span class="material-symbols-outlined text-4xl text-primary/40">person</span>
                               </div>`
                }
                        ${entry.category ? `
                            <span class="absolute top-3 left-3 px-2 py-1 bg-white/90 rounded text-xs font-medium text-text-main">
                                ${Security.escapeHtml(entry.category)}
                            </span>
                        ` : ''}
                    </div>
                    <div class="p-4">
                        <h3 class="font-heading text-lg font-semibold text-text-main mb-1" data-i18n="search.entrynameEntrytitle">${Security.escapeHtml(entry.name || entry.title)}</h3>
                        ${entry.region || entry.era ? `
                            <p class="text-sm text-text-secondary mb-2">
                                ${Security.escapeHtml(entry.region || '')}${entry.region && entry.era ? ' • ' : ''}${Security.escapeHtml(entry.era || '')}
                            </p>
                        ` : ''}
                        ${entry.introduction ? `
                            <p class="text-sm text-text-secondary line-clamp-2">${Security.escapeHtml(entry.introduction.substring(0, 120))}...</p>
                        ` : ''}
                    </div>
                </a>
            `).join('');
        }

        // Render pagination
        function renderPagination() {
            const totalPages = Math.ceil(searchState.totalResults / searchState.perPage);
            const pageNumbers = document.getElementById('page-numbers');
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');

            // Update prev/next buttons
            prevBtn.disabled = searchState.page === 1;
            nextBtn.disabled = searchState.page === totalPages;

            // Generate page numbers
            let pages = [];
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= searchState.page - 1 && i <= searchState.page + 1)) {
                    pages.push(i);
                } else if (pages[pages.length - 1] !== '...') {
                    pages.push('...');
                }
            }

            pageNumbers.innerHTML = pages.map(page => {
                if (page === '...') {
                    return `<span class="px-2 text-text-secondary">...</span>`;
                }
                return `
                    <button onclick="goToPage(${page})" 
                        class="size-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                        ${page === searchState.page
                        ? 'bg-primary text-white'
                        : 'hover:bg-primary/10 text-text-main'}">
                        ${page}
                    </button>
                `;
            }).join('');
        }

        // Go to specific page
        function goToPage(page) {
            searchState.page = page;
            performSearch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Sample data for demo
        function getSampleData() {
            return [
                { id: 1, name: 'Queen Amina of Zazzau', region: 'africa', era: '16th Century', category: 'leadership', introduction: 'Legendary warrior queen who expanded the Zazzau kingdom and built fortified walls across Hausaland.' },
                { id: 2, name: 'Hypatia of Alexandria', region: 'africa', era: 'ancient', category: 'stem', introduction: 'Ancient Greek mathematician, astronomer, and philosopher in Egypt, head of the Neoplatonic school in Alexandria.' },
                { id: 3, name: 'Maria Sabina', region: 'americas', era: '20th Century', category: 'activism', introduction: 'Mazatec curandera and poet who preserved indigenous spiritual traditions.' },
                { id: 4, name: 'Ada Lovelace', region: 'europe', era: '19th', category: 'stem', introduction: 'English mathematician and writer, known for her work on Charles Babbage\'s proposed mechanical general-purpose computer.' },
                { id: 5, name: 'Frida Kahlo', region: 'americas', era: '20th Century', category: 'arts', introduction: 'Mexican artist known for her portraits, pain and passion using vibrant colors.' },
                { id: 6, name: 'Wangari Maathai', region: 'africa', era: 'contemporary', category: 'activism', introduction: 'Kenyan environmental activist and Nobel Peace Prize laureate, founder of the Green Belt Movement.' }
            ];
        }