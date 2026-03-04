/**
 * Womencypedia Strapi API Service
 * 
 * Provides Strapi-specific functionality including:
 * - Response transformation (flattening nested Strapi responses)
 * - Locale-aware API calls
 * - Media URL handling
 * - Query parameter building
 */

// Guard: prevent redeclaration if loaded via both script tag and bundle
if (typeof StrapiAPI === 'undefined') {
    var StrapiAPI = {
        /**
         * Transform Strapi response format to match frontend expectations
         * @param {Object} response - Raw Strapi response
         * @param {string} contentType - Content type name (e.g., 'biographies')
         * @returns {Object} Transformed response
         */
        transformResponse(response, contentType) {
            // Handle error responses
            if (response.error) {
                return {
                    error: true,
                    message: response.error.message || 'An error occurred',
                    status: response.error.status || 500
                };
            }

            // Handle single item response
            if (response.data && !Array.isArray(response.data)) {
                return this.transformItem(response.data);
            }

            // Handle collection response
            if (response.data && Array.isArray(response.data)) {
                return {
                    entries: response.data.map(item => this.transformItem(item)),
                    page: response.meta?.pagination?.page || 1,
                    pageSize: response.meta?.pagination?.pageSize || CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
                    total_pages: response.meta?.pagination?.pageCount || 1,
                    total: response.meta?.pagination?.total || response.data.length
                };
            }

            // Handle non-standard responses
            return response;
        },

        /**
         * Transform a single Strapi item
         * @param {Object} item - Strapi data item
         * @returns {Object} Transformed item
         */
        transformItem(item) {
            if (!item) return null;

            // In Strapi v5, the response is flattened by default (no 'attributes' wrapper)
            // We'll support both v4 (with attributes) and v5 for safety
            const id = item.id;
            const documentId = item.documentId || null;
            const attrs = item.attributes || item;

            return {
                id,
                documentId,
                ...this.flattenAttributes(attrs),
                // Handle relations
                ...this.extractRelations(item)
            };
        },

        /**
         * Flatten nested attributes object
         * @param {Object} attrs - Attributes object
         * @returns {Object} Flattened object
         */
        flattenAttributes(attrs) {
            const result = {};

            for (const [key, value] of Object.entries(attrs)) {
                // Skip internal fields
                if (key === 'createdAt' || key === 'updatedAt' || key === 'publishedAt') {
                    result[key] = value;
                    continue;
                }

                // Handle relation data (already processed)
                if (key === 'localizations') continue;

                // Handle media
                if (value && typeof value === 'object') {
                    if (value.data !== undefined) {
                        // Single relation
                        if (!Array.isArray(value.data) && value.data !== null) {
                            result[key] = this.transformMedia(value.data);
                        } else if (Array.isArray(value.data)) {
                            // Multiple relations
                            result[key] = value.data.map(item => this.transformMedia(item));
                        } else {
                            result[key] = null;
                        }
                    } else if (value.url) {
                        // Media object (v5 flattened media shape)
                        result[key] = this.transformMedia(value);
                    } else if (Array.isArray(value) && value.length > 0 && value[0].url) {
                        // Array of media objects (v5)
                        result[key] = value.map(item => this.transformMedia(item));
                    } else {
                        result[key] = value;
                    }
                } else {
                    result[key] = value;
                }
            }

            return result;
        },

        extractRelations(item) {
            const relations = {};

            // In v5, relation data is attached directly to the item object, not in `attributes.data`
            const attrs = item.attributes || item;

            for (const [key, value] of Object.entries(attrs)) {
                // Skip non-objects
                if (!value || typeof value !== 'object') continue;

                // Handle nested v4 style { data: ... }
                if (value.data !== undefined) {
                    if (Array.isArray(value.data)) {
                        relations[key] = value.data.map(rel => ({
                            id: rel.id,
                            ...this.flattenAttributes(rel.attributes || rel)
                        }));
                    } else if (value.data !== null) {
                        relations[key] = {
                            id: value.data.id,
                            ...this.flattenAttributes(value.data.attributes || value.data)
                        };
                    }
                }
                // Handle flattened v5 style array of relations
                else if (Array.isArray(value)) {
                    relations[key] = value.map(rel => ({
                        id: rel.id,
                        ...this.flattenAttributes(rel.attributes || rel)
                    }));
                }
                // Handle flattened v5 style single relation object
                else if (value.id) {
                    relations[key] = {
                        id: value.id,
                        ...this.flattenAttributes(value.attributes || value)
                    };
                }
            }

            return relations;
        },

        /**
         * Transform media object
         * @param {Object} media - Strapi media object
         * @returns {Object} Transformed media
         */
        transformMedia(media) {
            if (!media) return null;

            // Handle existing media format
            if (media.url) {
                return {
                    id: media.id,
                    url: this.getMediaUrl(media.url),
                    alternativeText: media.alternativeText || media.name,
                    caption: media.caption,
                    width: media.width,
                    height: media.height,
                    formats: media.formats ? {
                        thumbnail: media.formats.thumbnail ? this.getMediaUrl(media.formats.thumbnail.url) : null,
                        small: media.formats.small ? this.getMediaUrl(media.formats.small.url) : null,
                        medium: media.formats.medium ? this.getMediaUrl(media.formats.medium.url) : null,
                        large: media.formats.large ? this.getMediaUrl(media.formats.large.url) : null
                    } : null
                };
            }

            return media;
        },

        /**
         * Get full media URL
         * @param {string} url - Relative or absolute URL
         * @returns {string} Full URL
         */
        getMediaUrl(url) {
            if (!url) return null;
            if (url.startsWith('http') || url.startsWith('//')) {
                return url;
            }
            return `${CONFIG.API_BASE_URL}${url}`;
        },

        /**
         * Build query string for Strapi API
         * @param {Object} params - Query parameters
         * @returns {string} Query string
         */
        buildQueryString(params = {}) {
            const queryParams = [];

            // Add locale
            if (params.locale) {
                queryParams.push(`locale=${params.locale}`);
            }

            // Add populate
            if (params.populate !== false) {
                queryParams.push('populate=*');
            }

            // Add pagination
            if (params.page) {
                queryParams.push(`pagination[page]=${params.page}`);
            }
            if (params.pageSize) {
                queryParams.push(`pagination[pageSize]=${params.pageSize}`);
            }

            // Add filters
            if (params.filters) {
                for (const [key, value] of Object.entries(params.filters)) {
                    if (value !== undefined && value !== null) {
                        queryParams.push(`filters[${key}][$eq]=${value}`);
                    }
                }
            }

            // Add sorting
            if (params.sort) {
                const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';
                queryParams.push(`sort[0]=${params.sort}:${sortOrder}`);
            }

            // Add search
            if (params.search) {
                queryParams.push(`filters[$or][0][name][$containsi]=${params.search}`);
                queryParams.push(`filters[$or][1][introduction][$containsi]=${params.search}`);
            }

            return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        },

        /**
         * Make a Strapi API request with automatic transformation
         * @param {string} endpoint - API endpoint
         * @param {Object} options - Request options
         * @returns {Promise<Object>} Transformed response
         */
        async request(endpoint, options = {}) {
            const locale = options.locale || this.getLocale();

            // Build query string
            const queryString = this.buildQueryString({
                locale: locale,
                populate: options.populate !== false,
                ...options.queryParams
            });

            const url = `${CONFIG.API_BASE_URL}${endpoint}${queryString}`;

            const defaultHeaders = {
                'Content-Type': 'application/json',
            };

            // Add authorization header
            const token = Auth.getAccessToken();
            if (token) {
                defaultHeaders['Authorization'] = `Bearer ${token}`;
            }

            const config = {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
            };

            try {
                const response = await fetch(url, config);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error?.message || data.message || 'API request failed');
                }

                return this.transformResponse(data, options.contentType);
            } catch (error) {
                console.error('StrapiAPI request error:', error);
                throw error;
            }
        },

        /**
         * Get current locale for API requests
         * @returns {string} Current locale code
         */
        getLocale() {
            return typeof I18N !== 'undefined' ? I18N.currentLocale : 'en';
        },

        // ============================================
        // CONTENT API METHODS
        // ============================================

        biographies: {
            /**
             * Get all biographies
             * @param {Object} params - Query parameters
             * @returns {Promise<Object>} Transformed response
             */
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.BIOGRAPHIES, {
                    method: 'GET',
                    contentType: 'biographies',
                    queryParams: params
                });
            },

            /**
             * Get biography by ID or slug
             * @param {string|number} idOrSlug - ID or slug
             * @returns {Promise<Object>} Single biography
             */
            async get(idOrSlug) {
                // Check if it's a slug (contains letters)
                if (isNaN(idOrSlug)) {
                    const response = await StrapiAPI.request(
                        CONFIG.ENDPOINTS.STRAPI.BIOGRAPHY_BY_SLUG(idOrSlug),
                        { method: 'GET', contentType: 'biographies' }
                    );
                    return response.entries?.[0] || null;
                }

                return StrapiAPI.request(`${CONFIG.ENDPOINTS.STRAPI.BIOGRAPHIES}/${idOrSlug}`, {
                    method: 'GET',
                    contentType: 'biographies'
                });
            },

            /**
             * Get featured biographies
             * @param {number} limit - Number of items
             * @returns {Promise<Object>} Featured biographies
             */
            async getFeatured(limit = 6) {
                return StrapiAPI.request(
                    `${CONFIG.ENDPOINTS.STRAPI.BIOGRAPHIES_FEATURED}&pagination[pageSize]=${limit}`,
                    { method: 'GET', contentType: 'biographies' }
                );
            },

            /**
             * Get biographies by region
             * @param {string} region - Region name
             * @param {Object} params - Additional params
             * @returns {Promise<Object>} Biographies in region
             */
            async getByRegion(region, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.BIOGRAPHIES_BY_REGION(region),
                    { method: 'GET', contentType: 'biographies', queryParams: params }
                );
            },

            /**
             * Get biographies by category
             * @param {string} category - Category name
             * @param {Object} params - Additional params
             * @returns {Promise<Object>} Biographies in category
             */
            async getByCategory(category, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.BIOGRAPHIES_BY_CATEGORY(category),
                    { method: 'GET', contentType: 'biographies', queryParams: params }
                );
            },

            /**
             * Search biographies
             * @param {string} query - Search query
             * @param {Object} params - Additional params
             * @returns {Promise<Object>} Search results
             */
            async search(query, params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.BIOGRAPHIES, {
                    method: 'GET',
                    contentType: 'biographies',
                    queryParams: { ...params, search: query }
                });
            }
        },

        collections: {
            /**
             * Get all collections
             * @param {Object} params - Query parameters
             * @returns {Promise<Object>} Collections response
             */
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.COLLECTIONS, {
                    method: 'GET',
                    contentType: 'collections',
                    queryParams: params
                });
            },

            /**
             * Get collection by ID or slug
             * @param {string|number} idOrSlug - ID or slug
             * @returns {Promise<Object>} Single collection
             */
            async get(idOrSlug) {
                if (isNaN(idOrSlug)) {
                    const response = await StrapiAPI.request(
                        CONFIG.ENDPOINTS.STRAPI.COLLECTION_BY_SLUG(idOrSlug),
                        { method: 'GET', contentType: 'collections' }
                    );
                    return response.entries?.[0] || null;
                }

                return StrapiAPI.request(`${CONFIG.ENDPOINTS.STRAPI.COLLECTIONS}/${idOrSlug}`, {
                    method: 'GET',
                    contentType: 'collections'
                });
            },

            /**
             * Get featured collections
             * @param {number} limit - Number of items
             * @returns {Promise<Object>} Featured collections
             */
            async getFeatured(limit = 4) {
                return StrapiAPI.request(
                    `${CONFIG.ENDPOINTS.STRAPI.COLLECTIONS_FEATURED}&pagination[pageSize]=${limit}`,
                    { method: 'GET', contentType: 'collections' }
                );
            }
        },

        educationModules: {
            /**
             * Get all education modules
             * @param {Object} params - Query parameters
             * @returns {Promise<Object>} Modules response
             */
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.EDUCATION_MODULES, {
                    method: 'GET',
                    contentType: 'education-modules',
                    queryParams: params
                });
            },

            /**
             * Get module by slug
             * @param {string} slug - Module slug
             * @returns {Promise<Object>} Single module
             */
            async getBySlug(slug) {
                const response = await StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.EDUCATION_MODULE_BY_SLUG(slug),
                    { method: 'GET', contentType: 'education-modules' }
                );
                return response.entries?.[0] || null;
            }
        },

        tags: {
            /**
             * Get all tags
             * @param {Object} params - Query parameters
             * @returns {Promise<Object>} Tags response
             */
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.TAGS, {
                    method: 'GET',
                    contentType: 'tags',
                    queryParams: params
                });
            }
        },

        // ============================================
        // LEADERS (Institutional Registry)
        // ============================================

        leaders: {
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.LEADERS, {
                    method: 'GET',
                    contentType: 'leaders',
                    queryParams: params
                });
            },

            async get(idOrSlug) {
                if (isNaN(idOrSlug)) {
                    const response = await StrapiAPI.request(
                        CONFIG.ENDPOINTS.STRAPI.LEADER_BY_SLUG(idOrSlug),
                        { method: 'GET', contentType: 'leaders' }
                    );
                    return response.entries?.[0] || null;
                }
                return StrapiAPI.request(`${CONFIG.ENDPOINTS.STRAPI.LEADERS}/${idOrSlug}`, {
                    method: 'GET',
                    contentType: 'leaders'
                });
            },

            async getFeatured(limit = 6) {
                return StrapiAPI.request(
                    `${CONFIG.ENDPOINTS.STRAPI.LEADERS_FEATURED}&pagination[pageSize]=${limit}`,
                    { method: 'GET', contentType: 'leaders' }
                );
            },

            async getVerified(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.LEADERS_VERIFIED, {
                    method: 'GET',
                    contentType: 'leaders',
                    queryParams: params
                });
            },

            async getByCountry(country, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.LEADERS_BY_COUNTRY(country),
                    { method: 'GET', contentType: 'leaders', queryParams: params }
                );
            },

            async getByContinent(continent, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.LEADERS_BY_CONTINENT(continent),
                    { method: 'GET', contentType: 'leaders', queryParams: params }
                );
            },

            async getBySector(sector, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.LEADERS_BY_SECTOR(sector),
                    { method: 'GET', contentType: 'leaders', queryParams: params }
                );
            }
        },

        // ============================================
        // PARTNERS
        // ============================================

        partners: {
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.PARTNERS, {
                    method: 'GET',
                    contentType: 'partners',
                    queryParams: params
                });
            },

            async get(idOrSlug) {
                if (isNaN(idOrSlug)) {
                    const response = await StrapiAPI.request(
                        CONFIG.ENDPOINTS.STRAPI.PARTNER_BY_SLUG(idOrSlug),
                        { method: 'GET', contentType: 'partners' }
                    );
                    return response.entries?.[0] || null;
                }
                return StrapiAPI.request(`${CONFIG.ENDPOINTS.STRAPI.PARTNERS}/${idOrSlug}`, {
                    method: 'GET',
                    contentType: 'partners'
                });
            },

            async getFeatured(limit = 6) {
                return StrapiAPI.request(
                    `${CONFIG.ENDPOINTS.STRAPI.PARTNERS_FEATURED}&pagination[pageSize]=${limit}`,
                    { method: 'GET', contentType: 'partners' }
                );
            },

            async getByTier(tier, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.PARTNERS_BY_TIER(tier),
                    { method: 'GET', contentType: 'partners', queryParams: params }
                );
            }
        },

        // ============================================
        // FELLOWSHIPS
        // ============================================

        fellowships: {
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.FELLOWSHIPS, {
                    method: 'GET',
                    contentType: 'fellowships',
                    queryParams: params
                });
            },

            async get(idOrSlug) {
                if (isNaN(idOrSlug)) {
                    const response = await StrapiAPI.request(
                        CONFIG.ENDPOINTS.STRAPI.FELLOWSHIP_BY_SLUG(idOrSlug),
                        { method: 'GET', contentType: 'fellowships' }
                    );
                    return response.entries?.[0] || null;
                }
                return StrapiAPI.request(`${CONFIG.ENDPOINTS.STRAPI.FELLOWSHIPS}/${idOrSlug}`, {
                    method: 'GET',
                    contentType: 'fellowships'
                });
            },

            async getFeatured(limit = 6) {
                return StrapiAPI.request(
                    `${CONFIG.ENDPOINTS.STRAPI.FELLOWSHIPS_FEATURED}&pagination[pageSize]=${limit}`,
                    { method: 'GET', contentType: 'fellowships' }
                );
            },

            async getOpen(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.FELLOWSHIPS_OPEN, {
                    method: 'GET',
                    contentType: 'fellowships',
                    queryParams: params
                });
            },

            async getByType(type, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.FELLOWSHIPS_BY_TYPE(type),
                    { method: 'GET', contentType: 'fellowships', queryParams: params }
                );
            }
        },

        // ============================================
        // CONTRIBUTIONS
        // ============================================

        contributions: {
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.CONTRIBUTIONS, {
                    method: 'GET',
                    contentType: 'contributions',
                    queryParams: params
                });
            },

            async get(idOrSlug) {
                if (isNaN(idOrSlug)) {
                    const response = await StrapiAPI.request(
                        CONFIG.ENDPOINTS.STRAPI.CONTRIBUTION_BY_SLUG(idOrSlug),
                        { method: 'GET', contentType: 'contributions' }
                    );
                    return response.entries?.[0] || null;
                }
                return StrapiAPI.request(`${CONFIG.ENDPOINTS.STRAPI.CONTRIBUTIONS}/${idOrSlug}`, {
                    method: 'GET',
                    contentType: 'contributions'
                });
            },

            async getFeatured(limit = 6) {
                return StrapiAPI.request(
                    `${CONFIG.ENDPOINTS.STRAPI.CONTRIBUTIONS_FEATURED}&pagination[pageSize]=${limit}`,
                    { method: 'GET', contentType: 'contributions' }
                );
            },

            async getPublished(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.CONTRIBUTIONS_PUBLISHED, {
                    method: 'GET',
                    contentType: 'contributions',
                    queryParams: params
                });
            },

            async getByType(type, params = {}) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.CONTRIBUTIONS_BY_TYPE(type),
                    { method: 'GET', contentType: 'contributions', queryParams: params }
                );
            },

            async submit(contributionData) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.CONTRIBUTION_SUBMIT, {
                    method: 'POST',
                    contentType: 'contributions',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: contributionData })
                });
            }
        },

        // ============================================
        // VERIFICATION APPLICATIONS
        // ============================================

        verificationApplications: {
            async getAll(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.VERIFICATION_APPLICATIONS, {
                    method: 'GET',
                    contentType: 'verification-applications',
                    queryParams: params
                });
            },

            async get(id) {
                return StrapiAPI.request(
                    CONFIG.ENDPOINTS.STRAPI.VERIFICATION_APPLICATION_BY_ID(id),
                    { method: 'GET', contentType: 'verification-applications' }
                );
            },

            async getPending(params = {}) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.VERIFICATION_APPLICATIONS_PENDING, {
                    method: 'GET',
                    contentType: 'verification-applications',
                    queryParams: params
                });
            },

            async submit(applicationData) {
                return StrapiAPI.request(CONFIG.ENDPOINTS.STRAPI.VERIFICATION_APPLICATION_SUBMIT, {
                    method: 'POST',
                    contentType: 'verification-applications',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: applicationData })
                });
            }
        }
    };

    // Export for module usage
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StrapiAPI;
    }
} // End StrapiAPI guard
