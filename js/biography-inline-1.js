// Current biography data
        let currentBio = null;
        let useStrapiAPI = true;

        // Show loading skeleton
        function showLoadingSkeleton() {
            const main = document.querySelector('main');
            if (!main) return;

            main.innerHTML = `
                <div class="animate-pulse">
                    <!-- Header skeleton -->
                    <div class="bg-white border-b border-border-light">
                        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <div class="flex flex-col lg:flex-row gap-8">
                                <div class="w-full lg:w-1/3">
                                    <div class="aspect-[3/4] rounded-2xl bg-lavender-soft"></div>
                                </div>
                                <div class="w-full lg:w-2/3">
                                    <div class="h-4 w-32 bg-lavender-soft rounded mb-4"></div>
                                    <div class="h-12 w-96 bg-lavender-soft rounded mb-4"></div>
                                    <div class="h-6 w-64 bg-lavender-soft rounded mb-8"></div>
                                    <div class="h-4 w-full bg-lavender-soft rounded mb-2"></div>
                                    <div class="h-4 w-full bg-lavender-soft rounded mb-2"></div>
                                    <div class="h-4 w-3/4 bg-lavender-soft rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Content skeleton -->
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div class="lg:col-span-2">
                                <div class="h-8 w-48 bg-lavender-soft rounded mb-6"></div>
                                <div class="space-y-3">
                                    <div class="h-4 w-full bg-lavender-soft rounded"></div>
                                    <div class="h-4 w-full bg-lavender-soft rounded"></div>
                                    <div class="h-4 w-full bg-lavender-soft rounded"></div>
                                    <div class="h-4 w-3/4 bg-lavender-soft rounded"></div>
                                </div>
                            </div>
                            <div class="lg:col-span-1">
                                <div class="h-64 bg-lavender-soft rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show error/not found state
        function showNotFound() {
            const main = document.querySelector('main');
            if (!main) {
                window.location.href = 'browse.html';
                return;
            }
            main.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div class="size-20 rounded-full bg-lavender-soft/50 flex items-center justify-center mb-6">
                        <span class="material-symbols-outlined text-text-secondary/50 text-4xl">person_off</span>
                    </div>
                    <h1 class="font-serif text-2xl font-bold text-text-main mb-4" data-i18n="biography.biographyNotFound">Biography Not Found</h1>
                    <p class="text-text-secondary mb-8">The biography you're looking for doesn't exist or has been removed.</p>
                    <a href="browse.html" class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                        Browse All Entries
                    </a>
                </div>
            `;
        }

        // Show API error state
        function showError(message) {
            const main = document.querySelector('main');
            if (!main) {
                window.location.href = 'browse.html';
                return;
            }
            main.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div class="size-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                        <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    </div>
                    <h1 class="font-serif text-2xl font-bold text-text-main mb-4" data-i18n="biography.unableToLoadBiography">Unable to Load Biography</h1>
                    <p class="text-text-secondary mb-2">${message || 'There was a problem loading this biography.'}</p>
                    <p class="text-text-secondary mb-8">Please try again later.</p>
                    <div class="flex gap-4">
                        <button onclick="window.location.reload()" class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                            Try Again
                        </button>
                        <a href="browse.html" class="px-6 py-3 bg-accent-teal text-white font-bold rounded-lg hover:bg-accent-teal/90 transition-colors">
                            Browse All Entries
                        </a>
                    </div>
                </div>
            `;
        }

        // Load biography based on URL slug parameter
        document.addEventListener('DOMContentLoaded', async function () {
            const urlParams = new URLSearchParams(window.location.search);
            const slug = urlParams.get('slug');

            if (!slug) {
                // No slug provided - redirect to browse page
                window.location.href = 'browse.html';
                return;
            }

            showLoadingSkeleton();
            await loadBiography(slug);

            // Check if admin and show edit button
            setupAdminFeatures();
        });

        async function loadBiography(slug) {
            try {
                // Try Strapi API first
                if (useStrapiAPI && typeof StrapiAPI !== 'undefined') {
                    currentBio = await StrapiAPI.biographies.get(slug);
                }

                // If not found via Strapi, try legacy API using request method
                if (!currentBio && typeof API !== 'undefined') {
                    try {
                        const response = await API.request(`/api/biographies?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`, { method: 'GET' });
                        if (response && response.entries && response.entries.length > 0) {
                            currentBio = response.entries[0];
                        }
                    } catch (apiError) {
                        console.warn('Legacy API not available:', apiError.message);
                    }
                }
            } catch (error) {
                console.warn('API not available, using static data:', error.message);
                useStrapiAPI = false;

                // Fallback to static data
                currentBio = typeof biographies !== 'undefined'
                    ? biographies.find(b => b.slug === slug || b.name.toLowerCase().replace(/\s+/g, '-') === slug)
                    : null;
            }

            if (!currentBio) {
                console.error('Biography not found for slug:', slug);
                showNotFound();
                return;
            }

            // Update page title and meta
            document.title = `${currentBio.name} — Womencypedia`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.content = `Read the complete biography of ${currentBio.name}. ${currentBio.introduction || ''}`;
            }

            // Update canonical URL
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                canonical.href = `https://womencypedia.org/biography.html?slug=${slug}`;
            }

            // Update OG URL
            const ogUrl = document.querySelector('meta[property="og:url"]');
            if (ogUrl) {
                ogUrl.content = `https://womencypedia.org/biography.html?slug=${slug}`;
            }

            // Update page content
            updateBiographyHeader(currentBio);
            updateBiographyContent(currentBio);
            updateBiographySidebar(currentBio);
        }

        function updateBiographyHeader(bio) {
            // Update tags
            const tagsContainer = document.querySelector('.flex.flex-wrap.gap-2.mb-4');
            if (tagsContainer) {
                tagsContainer.innerHTML = `
                    <span class="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs font-bold uppercase tracking-wider rounded-full">${bio.era || ''}</span>
                    <span class="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-full">${bio.region || ''}</span>
                    <span class="px-3 py-1 bg-accent-teal/20 text-accent-teal text-xs font-bold uppercase tracking-wider rounded-full">${bio.category || ''}</span>
                `;
            }

            // Update name
            const nameElement = document.querySelector('h1.font-serif');
            if (nameElement) {
                nameElement.textContent = bio.name;
            }

            // Update subtitle
            const subtitleElement = document.querySelector('p.text-xl.text-text-secondary.italic');
            if (subtitleElement) {
                subtitleElement.textContent = bio.category || bio.domain || '';
            }

            // Update image
            const imageElement = document.querySelector('#bio-image, img[alt*="Portrait"]');
            if (imageElement && bio.image) {
                const imageUrl = bio.image.url || bio.image;
                imageElement.src = imageUrl;
                imageElement.alt = `Portrait of ${bio.name}`;
            }
        }

        function updateBiographyContent(bio) {
            const article = document.querySelector('article.prose');
            if (!article) return;

            // Update summary/introduction
            const summaryDiv = article.querySelector('.bg-lavender-soft\\/50');
            if (summaryDiv) {
                summaryDiv.innerHTML = `
                    <p class="text-lg leading-relaxed m-0">
                        <strong class="text-text-main">${bio.name}</strong> ${bio.introduction || ''}
                    </p>
                `;
            }

            // Update Early Life section
            const earlyLifeHeader = article.querySelector('h2#early-life');
            if (earlyLifeHeader && bio.earlyLife) {
                let earlyLifeContent = earlyLifeHeader.nextElementSibling;
                while (earlyLifeContent && earlyLifeContent.tagName !== 'H2') {
                    const next = earlyLifeContent.nextElementSibling;
                    if (earlyLifeContent.tagName !== 'H2') {
                        earlyLifeContent.remove();
                    }
                    earlyLifeContent = next;
                }
                // Insert new content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = bio.earlyLife;
                earlyLifeHeader.parentNode.insertBefore(tempDiv, earlyLifeHeader.nextSibling);
            }

            // Update Path to Influence section
            const pathHeader = article.querySelector('h2#symbolic-power');
            if (pathHeader && bio.pathToInfluence) {
                let pathContent = pathHeader.nextElementSibling;
                while (pathContent && pathContent.tagName !== 'H2') {
                    const next = pathContent.nextElementSibling;
                    if (pathContent.tagName !== 'H2') {
                        pathContent.remove();
                    }
                    pathContent = next;
                }
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = bio.pathToInfluence;
                pathHeader.parentNode.insertBefore(tempDiv, pathHeader.nextSibling);
            }

            // Update Legacy section
            const legacyHeader = article.querySelector('h2#legacy-memory');
            if (legacyHeader && bio.legacy) {
                let legacyContent = legacyHeader.nextElementSibling;
                while (legacyContent && legacyContent.tagName !== 'H2' && legacyContent.tagName !== 'FOOTER') {
                    const next = legacyContent.nextElementSibling;
                    if (legacyContent.tagName !== 'H2' && legacyContent.tagName !== 'FOOTER') {
                        legacyContent.remove();
                    }
                    legacyContent = next;
                }
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = bio.legacy;
                legacyHeader.parentNode.insertBefore(tempDiv, legacyHeader.nextSibling);
            }

            // For dynamic content loading when API provides full content
            if (bio.fullContent) {
                article.innerHTML = bio.fullContent;
            }
        }

        function updateBiographySidebar(bio) {
            // Update related entries
            const relatedContainer = document.querySelector('.space-y-3');
            if (relatedContainer && bio.relatedWomen && bio.relatedWomen.length > 0) {
                const relatedPromises = bio.relatedWomen.map(async id => {
                    let relatedBio;
                    try {
                        if (useStrapiAPI && typeof StrapiAPI !== 'undefined') {
                            relatedBio = await StrapiAPI.biographies.get(id);
                        } else if (typeof API !== 'undefined') {
                            try {
                                const response = await API.request(`/api/biographies?filters[slug][$eq]=${encodeURIComponent(id)}&populate=*`, { method: 'GET' });
                                if (response && response.entries && response.entries.length > 0) {
                                    relatedBio = response.entries[0];
                                }
                            } catch (e) {
                                // Ignore and use static fallback
                            }
                        }
                    } catch {
                        relatedBio = typeof biographies !== 'undefined'
                            ? biographies.find(b => b.id === id || b.slug === id)
                            : null;
                    }
                    return relatedBio;
                });

                Promise.all(relatedPromises).then(relatedBios => {
                    relatedContainer.innerHTML = relatedBios.filter(b => b).map(relatedBio => `
                        <a href="biography.html?slug=${relatedBio.slug}" class="flex items-center gap-3 group">
                            <div class="size-12 rounded-lg bg-white flex items-center justify-center">
                                ${relatedBio.image
                            ? `<img src="${relatedBio.image.url || relatedBio.image}" alt="" class="size-12 rounded-lg object-cover">`
                            : '<span class="material-symbols-outlined text-primary/50">person</span>'}
                            </div>
                            <div>
                                <p class="font-bold text-sm text-text-main group-hover:text-primary">${relatedBio.name}</p>
                                <p class="text-xs text-text-secondary">Related biography</p>
                            </div>
                        </a>
                    `).join('');
                });
            }

            // Update keywords
            const keywordsContainer = document.querySelector('.flex.flex-wrap.gap-2');
            if (keywordsContainer && bio.tags && bio.tags.length > 0) {
                keywordsContainer.innerHTML = bio.tags.map(tag => `
                    <span class="px-3 py-1 bg-background-cream text-text-secondary text-xs rounded-full border border-border-light">${tag}</span>
                `).join('');
            }

            // Update references
            const referencesList = document.querySelector('ol.space-y-4');
            if (referencesList && bio.sources && bio.sources.length > 0) {
                referencesList.innerHTML = bio.sources.map((source, index) => `
                    <li class="flex gap-3">
                        <span class="text-accent-teal font-bold">[${index + 1}]</span>
                        <span>${source.title} ${source.author ? `by ${source.author}` : ''} ${source.year ? `(${source.year})` : ''}. ${source.citation || ''}</span>
                    </li>
                `).join('');
            }
        }

        function setupAdminFeatures() {
            // Check if user is admin
            const isAdmin = typeof Auth !== 'undefined' && Auth.isAdmin();

            if (isAdmin && currentBio) {
                // Add edit button to header actions
                const actionsContainer = document.querySelector('.flex.flex-wrap.gap-3');
                if (actionsContainer) {
                    const editButton = document.createElement('a');
                    editButton.href = `#edit-${currentBio.id || currentBio.documentId}`;
                    editButton.className = 'admin-edit-btn flex items-center gap-2 px-5 py-2.5 bg-accent-teal text-white rounded-lg font-bold text-sm hover:bg-accent-teal/90';
                    editButton.innerHTML = `
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                        Edit Entry
                    `;
                    actionsContainer.insertBefore(editButton, actionsContainer.firstChild);
                }
            }
        }