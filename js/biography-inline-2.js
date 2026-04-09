(function () {
            'use strict';

            // Simple HTML escape function to prevent XSS
            function escapeHtml(text) {
                if (!text) return '';
                var div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Handle both Strapi v4 (nested attributes) and v5 (flat) formats
            function unwrapAttributes(entry) {
                if (!entry) return null;
                if (entry.attributes) {
                    return { id: entry.id, ...entry.attributes };
                }
                return entry;
            }

            // Convert line breaks in Strapi text to HTML paragraphs
            function textToHtml(text) {
                if (!text) return '';
                return text.split(/\n+/).map(function (para) {
                    var trimmed = para.trim();
                    if (!trimmed) return '';
                    // Handle bullet points
                    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                        return '<li class="ml-4">' + escapeHtml(trimmed.replace(/^[•\-]\s*/, '')) + '</li>';
                    }
                    return '<p>' + escapeHtml(trimmed) + '</p>';
                }).join('');
            }

            // Get media URL, handling both relative and absolute URLs
            function getMediaUrl(url) {
                if (!url) return '';
                if (url.startsWith('http') || url.startsWith('//')) return url;
                return 'https://womencypedia-cms.onrender.com' + url;
            }

            // Get slug from URL
            const urlParams = new URLSearchParams(window.location.search);
            const slug = urlParams.get('slug');

            // Elements to update
            const elements = {
                title: document.querySelector('title'),
                metaDesc: document.querySelector('meta[name="description"]'),
                breadcrumbName: document.querySelector('#main-content nav span:last-child'),
                heroImage: document.querySelector('.aspect-\\[3\\/4\\] img'),
                name: document.querySelector('h1.font-serif'),
                subtitle: document.querySelector('h1.font-serif + p'),
                tags: document.querySelector('.flex.flex-wrap.gap-2'),
                quickFacts: document.querySelector('.grid.sm\\:grid-cols-2.gap-4'),
                summary: document.querySelector('[class*="border-accent-gold"]'),
                content: document.querySelector('article.prose')
            };

            // Loading state
            const loadingHTML = '<div class="flex items-center justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>';
            const errorHTML = '<div class="text-center py-12"><p class="text-text-secondary mb-4">Unable to load biography. Please try again later.</p><a href="browse.html" class="text-primary hover:underline">Browse All Biographies</a></div>';

            async function loadBiography() {
                if (!slug) {
                    
                    return;
                }

                

                try {
                    // Show loading state
                    if (elements.content) {
                        elements.content.innerHTML = loadingHTML;
                    }

                    // Fetch biography from Strapi using safe API client
                    const rawBio = await window.StrapiAPI.biographies.get(slug);

                    if (!rawBio) {
                        if (elements.content) {
                            elements.content.innerHTML = '<div class="text-center py-12"><p class="text-text-secondary mb-4">Biography not found for "' + escapeHtml(slug) + '".</p><a href="browse.html" class="text-primary hover:underline">Browse All Biographies</a></div>';
                        }
                        return;
                    }
                    const bio = rawBio;
                    

                    // Update page title
                    if (bio.name) {
                        document.title = bio.name + ' — Womencypedia';
                    }

                    // Update meta description
                    if (bio.introduction) {
                        var metaDesc = document.querySelector('meta[name="description"]');
                        if (metaDesc) {
                            metaDesc.setAttribute('content', bio.introduction.substring(0, 160));
                        }
                    }

                    // Update breadcrumb
                    if (elements.breadcrumbName && bio.name) {
                        elements.breadcrumbName.textContent = bio.name;
                    }

                    // Update hero image
                    if (elements.heroImage && bio.image) {
                        var imgData = bio.image.data ? bio.image.data : bio.image;
                        var imgAttrs = imgData.attributes || imgData;
                        var imgUrl = getMediaUrl(imgAttrs.url);
                        if (imgUrl) {
                            elements.heroImage.src = imgUrl;
                            elements.heroImage.alt = imgAttrs.alternativeText || bio.name || 'Portrait';
                        }
                    }

                    // Update name
                    if (elements.name && bio.name) {
                        elements.name.textContent = bio.name;
                    }

                    // Update subtitle
                    if (elements.subtitle && bio.domain) {
                        elements.subtitle.textContent = bio.domain;
                    }

                    // Update tags
                    if (elements.tags) {
                        var tagItems = [];
                        if (bio.era) {
                            tagItems.push('<span class="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs font-bold uppercase tracking-wider rounded-full">' + escapeHtml(bio.era) + '</span>');
                        }
                        if (bio.region) {
                            tagItems.push('<span class="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-full">' + escapeHtml(bio.region) + '</span>');
                        }
                        if (bio.category) {
                            tagItems.push('<span class="px-3 py-1 bg-accent-teal/20 text-accent-teal text-xs font-bold uppercase tracking-wider rounded-full">' + escapeHtml(bio.category) + '</span>');
                        }
                        if (bio.tags && Array.isArray(bio.tags)) {
                            bio.tags.forEach(function (tag) {
                                var tagObj = tag.attributes || tag;
                                if (tagObj.name) {
                                    tagItems.push('<span class="px-3 py-1 bg-lavender-soft text-text-secondary text-xs font-bold uppercase tracking-wider rounded-full">' + escapeHtml(tagObj.name) + '</span>');
                                }
                            });
                        }
                        if (tagItems.length > 0) {
                            elements.tags.innerHTML = tagItems.join('');
                        }
                    }

                    // Update quick facts
                    if (elements.quickFacts) {
                        var factsHtml = '';
                        if (bio.era) {
                            factsHtml += '<div class="bg-white rounded-xl p-4 border border-border-light"><span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Era</span><p class="font-serif text-lg font-bold text-text-main">' + escapeHtml(bio.era) + '</p></div>';
                        }
                        if (bio.region) {
                            factsHtml += '<div class="bg-white rounded-xl p-4 border border-border-light"><span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Region</span><p class="font-serif text-lg font-bold text-text-main">' + escapeHtml(bio.region) + '</p></div>';
                        }
                        if (bio.category) {
                            factsHtml += '<div class="bg-white rounded-xl p-4 border border-border-light"><span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Category</span><p class="font-serif text-lg font-bold text-text-main">' + escapeHtml(bio.category) + '</p></div>';
                        }
                        if (bio.domain) {
                            factsHtml += '<div class="bg-white rounded-xl p-4 border border-border-light"><span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Domain</span><p class="font-serif text-lg font-bold text-text-main">' + escapeHtml(bio.domain) + '</p></div>';
                        }
                        if (factsHtml) {
                            elements.quickFacts.innerHTML = factsHtml;
                        }
                    }

                    // Update summary
                    if (elements.summary && bio.introduction) {
                        elements.summary.innerHTML = '<p class="text-lg leading-relaxed m-0"><strong class="text-text-main">' + escapeHtml(bio.name || 'This woman') + '</strong> ' + escapeHtml(bio.introduction) + '</p>';
                    }

                    // Build full content
                    if (elements.content) {
                        var contentHtml = '';

                        if (bio.earlyLife) {
                            contentHtml += '<h2 id="early-life">Early Life</h2>' + textToHtml(bio.earlyLife);
                        }

                        if (bio.pathToInfluence) {
                            contentHtml += '<h2 id="path-to-influence">Path to Influence</h2>' + textToHtml(bio.pathToInfluence);
                        }

                        if (bio.contributions) {
                            contentHtml += '<h2 id="contributions">Contributions</h2>' + textToHtml(bio.contributions);
                        }

                        if (bio.culturalContext) {
                            contentHtml += '<h2 id="cultural-context">Cultural Context</h2>' + textToHtml(bio.culturalContext);
                        }

                        if (bio.symbolicPower) {
                            contentHtml += '<h2 id="symbolic-power">Symbolic Power</h2>' + textToHtml(bio.symbolicPower);
                        }

                        if (bio.legacy) {
                            contentHtml += '<h2 id="legacy">Legacy</h2>' + textToHtml(bio.legacy);
                        }

                        // Build sources section if available
                        if (bio.sources && Array.isArray(bio.sources) && bio.sources.length > 0) {
                            contentHtml += '<h2 id="references">References & Sources</h2><div class="bg-white rounded-xl p-8 border border-border-light"><ol class="space-y-4 text-sm text-text-secondary">';
                            bio.sources.forEach(function (source, i) {
                                contentHtml += '<li class="flex gap-3"><span class="text-accent-teal font-bold">[' + (i + 1) + ']</span><span>';
                                if (source.url) {
                                    contentHtml += '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener" class="text-primary hover:underline">' + escapeHtml(source.title || source.url) + '</a>';
                                } else {
                                    contentHtml += escapeHtml(source.title || 'Source');
                                }
                                contentHtml += '</span></li>';
                            });
                            contentHtml += '</ol></div>';
                        }

                        elements.content.innerHTML = contentHtml || '<p>Content coming soon...</p>';
                    }

                } catch (error) {

                    if (error.message.includes('API error: 403') || error.message.includes('API error: 500') || error.message.includes('Data not found')) {
                        // Treat as not found
                        if (elements.content) {
                            elements.content.innerHTML = '<div class="text-center py-12"><p class="text-text-secondary mb-4">Biography not found for "' + escapeHtml(slug) + '".</p><a href="browse.html" class="text-primary hover:underline">Browse All Biographies</a></div>';
                        }
                    } else {
                        if (elements.content) {
                            elements.content.innerHTML = errorHTML;
                        }
                    }
                }
            }

            // Run on page load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', loadBiography);
            } else {
                loadBiography();
            }
        })();