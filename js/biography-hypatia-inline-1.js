// Current biography data
        let currentBio = null;
        let useAPI = true;

        // Load biography based on URL parameter
        document.addEventListener('DOMContentLoaded', async function () {
            const urlParams = new URLSearchParams(window.location.search);
            const bioId = parseInt(urlParams.get('id')) || 3; // Default to Hypatia of Alexandria

            // await loadBiography(bioId); // Disabled to preserve static content

            // Check if admin and show edit button
            setupAdminFeatures();
        });

        async function loadBiography(id) {
            try {
                // Try API first
                if (useAPI) {
                    currentBio = await API.entries.getById(id);
                }
            } catch (error) {
                console.warn('API not available, using static data:', error.message);
                useAPI = false;

                // Fallback to static data
                currentBio = typeof biographies !== 'undefined'
                    ? biographies.find(b => b.id === id)
                    : null;
            }

            if (!currentBio) {
                console.error('Biography not found');
                // Show error state
                const main = document.querySelector('main');
                if (main) {
                    main.innerHTML = `
                        <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                            <div class="size-20 rounded-full bg-lavender-soft/50 flex items-center justify-center mb-6">
                                <span class="material-symbols-outlined text-text-secondary/50 text-4xl">person_off</span>
                            </div>
                            <h1 class="font-serif text-2xl font-bold text-text-main mb-4" data-i18n="biography_hypatia.biographyNotFound">Biography Not Found</h1>
                            <p class="text-text-secondary mb-8">The biography you're looking for doesn't exist or has been removed.</p>
                            <a href="browse.html" class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                                Browse All Entries
                            </a>
                        </div>
                    `;
                }
                return;
            }

            // Update page title and meta
            document.title = `${currentBio.name} — Womencypedia`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.content = `Read the complete biography of ${currentBio.name}. ${currentBio.introduction || ''}`;
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
                    <span class="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs font-bold uppercase tracking-wider rounded-full">${bio.era}</span>
                    <span class="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-full">${bio.region}</span>
                    <span class="px-3 py-1 bg-accent-teal/20 text-accent-teal text-xs font-bold uppercase tracking-wider rounded-full">${bio.category}</span>
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
        }

        function updateBiographyContent(bio) {
            const article = document.querySelector('article.prose');
            if (!article) return;

            // Update summary
            const summaryDiv = article.querySelector('.bg-lavender-soft\\/50');
            if (summaryDiv) {
                summaryDiv.innerHTML = `
                    <p class="text-lg leading-relaxed m-0">
                        <strong class="text-text-main">${bio.name}</strong> ${bio.introduction || ''}
                    </p>
                `;
            }

            // For dynamic content loading when API provides full content
            if (bio.fullContent) {
                // Replace article content with full dynamic content
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
                        if (useAPI) {
                            relatedBio = await API.entries.getById(id);
                        }
                    } catch {
                        relatedBio = typeof biographies !== 'undefined'
                            ? biographies.find(b => b.id === id)
                            : null;
                    }
                    return relatedBio;
                });

                Promise.all(relatedPromises).then(relatedBios => {
                    relatedContainer.innerHTML = relatedBios.filter(b => b).map(relatedBio => `
                        <a href="biography.html?id=${relatedBio.id}" class="flex items-center gap-3 group">
                            <div class="size-12 rounded-lg bg-white flex items-center justify-center">
                                ${relatedBio.image
                            ? `<img src="${relatedBio.image}" alt="" class="size-12 rounded-lg object-cover">`
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
                    editButton.href = `#edit-${currentBio.id}`;
                    editButton.className = 'admin-edit-btn flex items-center gap-2 px-5 py-2.5 bg-accent-teal text-white rounded-lg font-bold text-sm hover:bg-accent-teal/90';
                    editButton.innerHTML = `
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                        Edit Entry
                    `;
                    actionsContainer.insertBefore(editButton, actionsContainer.firstChild);
                }
            }
        }