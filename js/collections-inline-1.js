// Static fallback collections data
        const fallbackCollections = [
            {
                slug: 'foremothers',
                title: 'Foremothers of Empires',
                description: 'Women whose influence shaped kingdoms, defined dynasties, and altered the course of civilizations through political strategy or cultural patronage.',
                image: 'images/foremothers.png'
            },
            {
                slug: 'missionary-women',
                title: 'Missionary Women & Cross-Cultural Encounters',
                description: 'Women who navigated cultural boundaries, challenged patriarchal structures, and preserved indigenous knowledge.',
                image: 'images/missionary.png'
            },
            {
                slug: 'indigenous-matriarchs',
                title: 'Indigenous Matriarchs',
                description: 'Custodians of cultural memory, spiritual authority, and communal identity rooted in land stewardship and ritual knowledge.',
                image: 'images/indigenous.png'
            },
            {
                slug: 'african-queens',
                title: 'African Queens & Kingdom Mothers',
                description: 'Sovereigns, strategists, and state-builders whose power reshaped continents and shaped the destiny of nations.',
                image: 'images/african-queens.png'
            },
            {
                slug: 'diaspora',
                title: 'Women of the Diaspora',
                description: 'Journeys of resilience, reinvention, and cultural transformation across borders and generations.',
                image: 'images/diaspora.png'
            },
            {
                slug: 'conflict-peace',
                title: 'Women in Conflict & Peacebuilding',
                description: 'Courage, negotiation, protection, and the reimagining of survival and community rebuilding.',
                image: 'images/conflict-peace.png'
            },
            {
                slug: 'science-innovation',
                title: 'Science & Innovation',
                description: 'Women who expanded human knowledge, pioneered discoveries, and challenged scientific paradigms.',
                image: 'images/science_curie.png'
            },
            {
                slug: 'arts-creativity',
                title: 'Arts & Creativity',
                description: 'Visionary artists, musicians, writers, and performers who transformed cultural landscapes.',
                image: 'images/oral_angelou.png'
            },
            {
                slug: 'migration-movement',
                title: 'Migration & Movement',
                description: 'Women who crossed borders, led migrations, and built new communities across continents.',
                image: 'images/migration_baker.png'
            },
            {
                slug: 'faith-spirituality',
                title: 'Faith & Spirituality',
                description: 'Spiritual leaders, mystics, and reformers who shaped religious traditions and spiritual practices.',
                image: 'images/faith_hildegard.png'
            },
            {
                slug: 'education-literacy',
                title: 'Education & Literacy Pioneers',
                description: 'Women who opened schools, created curricula, and fought for access to knowledge.',
                image: 'images/environment_maathai.png'
            },
            {
                slug: 'environmental-stewardship',
                title: 'Environmental Stewardship',
                description: 'Women who protected land, led conservation movements, and championed sustainability.',
                image: 'images/environment_maathai.png'
            }
        ];

        // Get media URL helper
        function getCollectionImageUrl(collection) {
            if (collection.coverImage && collection.coverImage.url) {
                return collection.coverImage.url;
            }
            // Map slug to fallback image
            const fallback = fallbackCollections.find(f => f.slug === collection.slug);
            return fallback ? fallback.image : 'images/womencypedia-logo.png';
        }

        // Render collections from API data
        function renderCollections(collections) {
            const grid = document.getElementById('collections-grid');
            if (!grid) return;

            grid.innerHTML = collections.map((collection, index) => {
                const imageUrl = getCollectionImageUrl(collection);
                const slug = collection.slug || collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return `
                <article class="group bg-white rounded-lg overflow-hidden border border-border-light hover:border-accent-gold/50 hover:shadow-lg transition-all">
                    <div class="relative h-56 overflow-hidden">
                        <span class="absolute top-4 left-4 z-10 size-8 bg-accent-gold text-white rounded-full flex items-center justify-center text-sm font-bold">${index + 1}</span>
                        <img src="${imageUrl}" alt="${collection.title}"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    <div class="p-6">
                        <h3 class="font-serif text-xl font-bold text-text-main mb-2" data-i18n="collections.collectiontitle">${collection.title}</h3>
                        <p class="text-sm text-text-secondary mb-4">${collection.description || ''}</p>
                        <a href="collection.html?slug=${slug}"
                            class="inline-flex items-center gap-1 text-sm font-semibold text-accent-teal hover:text-accent-teal/80">Explore
                            <span class="material-symbols-outlined text-[16px]">arrow_forward</span></a>
                    </div>
                </article>
            `;
            }).join('');

            // Hide loading, show grid
            document.getElementById('collections-loading').classList.add('hidden');
            grid.classList.remove('hidden');
        }

        // Show fallback static collections
        function showFallbackCollections() {
            const fallback = document.getElementById('collections-fallback');
            if (!fallback) return;

            // Hide loading, show fallback
            document.getElementById('collections-loading').classList.add('hidden');
            fallback.classList.remove('hidden');
        }

        // Load collections from Strapi API
        async function loadCollections() {
            try {
                // Try Strapi API first
                if (typeof StrapiAPI !== 'undefined' && CONFIG.USE_STRAPI) {
                    const response = await StrapiAPI.collections.getAll();
                    if (response && response.entries && response.entries.length > 0) {
                        renderCollections(response.entries);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Strapi API not available, using fallback:', error.message);
            }

            // If API fails, use fallback
            showFallbackCollections();
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function () {
            loadCollections();
        });