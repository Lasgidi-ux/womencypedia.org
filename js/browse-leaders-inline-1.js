// Mock data for demonstration
        const mockLeaders = [
            {
                id: 1,
                name: "Dr. Amina Mohammed",
                organizationName: "African Women in Agriculture",
                country: "Nigeria",
                continent: "Africa",
                sector: "Non-Profit",
                organizationType: "NGO",
                verified: true,
                verifiedDate: "2024-01-15",
                executiveSummary: "Empowering women farmers across Africa through sustainable agriculture programs and policy advocacy.",
                logo: null,
                featured: true
            },
            {
                id: 2,
                name: "Sarah Chen",
                organizationName: "TechWomen Foundation",
                country: "United States",
                continent: "North America",
                sector: "Technology",
                organizationType: "Foundation",
                verified: true,
                verifiedDate: "2024-02-20",
                executiveSummary: "Connecting women in technology across continents through mentorship and leadership programs.",
                logo: null,
                featured: true
            },
            {
                id: 3,
                name: "Dr. Fatou Sow",
                organizationName: "Women in Science Africa",
                country: "Senegal",
                continent: "Africa",
                sector: "Academic",
                organizationType: "Institution",
                verified: true,
                verifiedDate: "2024-03-10",
                executiveSummary: "Promoting women's participation in STEM fields through research grants and educational initiatives.",
                logo: null,
                featured: false
            },
            {
                id: 4,
                name: "Maria Rodriguez",
                organizationName: "Latin American Women's Network",
                country: "Mexico",
                continent: "North America",
                sector: "Human Rights",
                organizationType: "Association",
                verified: true,
                verifiedDate: "2024-01-25",
                executiveSummary: "Advocating for women's rights and leadership across Latin America through community organizing.",
                logo: null,
                featured: false
            },
            {
                id: 5,
                name: "Dr. Priya Sharma",
                organizationName: "Women Entrepreneurs Network",
                country: "India",
                continent: "Asia",
                sector: "Private Sector",
                organizationType: "Social Enterprise",
                verified: true,
                verifiedDate: "2024-04-05",
                executiveSummary: "Supporting women entrepreneurs with funding, mentorship, and market access across South Asia.",
                logo: null,
                featured: true
            },
            {
                id: 6,
                name: "Emma Williams",
                organizationName: "Global Health Women",
                country: "United Kingdom",
                continent: "Europe",
                sector: "Healthcare",
                organizationType: "NGO",
                verified: true,
                verifiedDate: "2024-02-28",
                executiveSummary: "Improving healthcare outcomes for women and children in developing countries through training and advocacy.",
                logo: null,
                featured: false
            }
        ];

        let allLeaders = [];
        let filteredLeaders = [];
        let displayCount = 9;

        // Initialize
        document.addEventListener('DOMContentLoaded', function () {
            loadLeaders();
        });

        async function loadLeaders() {
            const loadingState = document.getElementById('loading-state');
            const grid = document.getElementById('leaders-grid');
            const emptyState = document.getElementById('empty-state');

            try {
                // Try to fetch from API
                if (typeof CONFIG !== 'undefined' && CONFIG.USE_STRAPI) {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/leaders?verified=true&populate=*`);
                    if (response.ok) {
                        const data = await response.json();
                        allLeaders = data.data || [];
                    } else {
                        throw new Error('API not available');
                    }
                } else {
                    // Use mock data
                    allLeaders = mockLeaders;
                }
            } catch (error) {
                console.log('Using mock data:', error.message);
                allLeaders = mockLeaders;
            }

            filteredLeaders = [...allLeaders];
            renderLeaders();
        }

        function renderLeaders() {
            const loadingState = document.getElementById('loading-state');
            const grid = document.getElementById('leaders-grid');
            const emptyState = document.getElementById('empty-state');
            const resultsCount = document.getElementById('results-count');

            loadingState.classList.add('hidden');

            if (filteredLeaders.length === 0) {
                grid.classList.add('hidden');
                emptyState.classList.remove('hidden');
                resultsCount.textContent = '0';
                return;
            }

            emptyState.classList.add('hidden');
            grid.classList.remove('hidden');
            resultsCount.textContent = filteredLeaders.length;

            const leadersToShow = filteredLeaders.slice(0, displayCount);
            grid.innerHTML = leadersToShow.map(leader => createLeaderCard(leader)).join('');

            // Show/hide load more button
            const loadMoreBtn = document.getElementById('load-more');
            if (filteredLeaders.length > displayCount) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        }

        function createLeaderCard(leader) {
            const verifiedBadge = leader.verified ? `
                <span class="inline-flex items-center gap-1 bg-accent-teal/10 text-accent-teal text-xs font-bold px-2 py-1 rounded-full">
                    <span class="material-symbols-outlined text-[14px]">verified</span>
                    Verified
                </span>
            ` : '';

            return `
                <a href="leader-profile.html?id=${leader.id}" class="block bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg transition-shadow group">
                    <div class="h-32 bg-gradient-to-br from-primary/20 to-accent-teal/20 flex items-center justify-center">
                        <span class="material-symbols-outlined text-5xl text-primary/30">business</span>
                    </div>
                    <div class="p-5">
                        <div class="flex items-start justify-between gap-2 mb-3">
                            <h3 class="font-heading text-lg font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1" data-i18n="browse_leaders.leaderorganizationname">
                                ${leader.organizationName}
                            </h3>
                            ${verifiedBadge}
                        </div>
                        <p class="text-sm text-text-secondary mb-4 line-clamp-2">
                            ${leader.executiveSummary || 'No description available.'}
                        </p>
                        <div class="flex items-center gap-2 text-xs text-text-secondary">
                            <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">location_on</span>
                                ${leader.country}
                            </span>
                            <span class="text-border-light">|</span>
                            <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">category</span>
                                ${leader.sector}
                            </span>
                        </div>
                    </div>
                </a>
            `;
        }

        function filterLeaders() {
            const continent = document.getElementById('filter-continent').value;
            const sector = document.getElementById('filter-sector').value;
            const type = document.getElementById('filter-type').value;
            const verifiedOnly = document.getElementById('filter-verified').checked;
            const searchTerm = document.getElementById('main-search').value.toLowerCase();

            filteredLeaders = allLeaders.filter(leader => {
                if (continent && leader.continent !== continent) return false;
                if (sector && leader.sector !== sector) return false;
                if (type && leader.organizationType !== type) return false;
                if (verifiedOnly && !leader.verified) return false;
                if (searchTerm) {
                    const searchFields = [
                        leader.name,
                        leader.organizationName,
                        leader.country,
                        leader.sector,
                        leader.executiveSummary
                    ].join(' ').toLowerCase();
                    if (!searchFields.includes(searchTerm)) return false;
                }
                return true;
            });

            displayCount = 9;
            renderLeaders();
        }

        function clearFilters() {
            document.getElementById('filter-continent').value = '';
            document.getElementById('filter-sector').value = '';
            document.getElementById('filter-type').value = '';
            document.getElementById('filter-verified').checked = false;
            document.getElementById('main-search').value = '';

            filteredLeaders = [...allLeaders];
            displayCount = 9;
            renderLeaders();
        }

        function loadMore() {
            displayCount += 9;
            renderLeaders();
        }

        // Search input handler
        document.getElementById('main-search').addEventListener('input', debounce(filterLeaders, 300));

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }