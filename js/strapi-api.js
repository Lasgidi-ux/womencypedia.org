/**
 * Modern Strapi API Service (ES Module Version)
 * Clean, scalable, production-ready
 */

class StrapiAPIClient {
  constructor({ baseURL, apiToken = null, getAccessToken = null }) {
    this.baseURL = baseURL;
    this.apiToken = apiToken;
    this.getAccessToken = getAccessToken;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // =========================
  // CORE REQUEST METHOD
  // =========================
  async request(endpoint, options = {}) {
    const query = options.query || {};
    // Add locale for i18n support
    if (!query.locale) {
      query.locale = 'en';
    }
    const queryString = this.buildQueryString(query);
    const url = `${this.baseURL}${endpoint}${queryString}`;
    const cacheKey = `${options.method || 'GET'}:${url}`;

    // Check cache for GET requests
    if ((options.method || 'GET') === 'GET' && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    const token =
      (this.getAccessToken && this.getAccessToken()) || this.apiToken;

    // Don't send auth for public GET requests to biographies and collections
    const isPublicGet = (options.method || 'GET') === 'GET' &&
      (endpoint.startsWith('/api/biographies') || endpoint.startsWith('/api/collections'));

    const headers = {
      "Content-Type": "application/json",
      ...(!isPublicGet && token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const res = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        throw {
          message: data?.error?.message || "API request failed",
          status: res.status,
          raw: data,
        };
      }

      const transformed = this.transformResponse(data);

      // Cache successful GET responses
      if ((options.method || 'GET') === 'GET') {
        this.cache.set(cacheKey, {
          data: transformed,
          timestamp: Date.now()
        });
      }

      return transformed;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw { message: 'Request timeout', status: 408 };
      }
      throw error;
    }
  }

  // =========================
  // RESPONSE TRANSFORM
  // =========================
  // Handles both Strapi v4 (nested attributes) and v5 (flat) responses
  transformResponse(response) {
    if (!response || !response.data) return response;

    if (Array.isArray(response.data)) {
      return {
        entries: response.data.map((item) => this.transformItem(item)),
        pagination: response.meta?.pagination || null,
      };
    }

    return this.transformItem(response.data);
  }

  transformItem(item) {
    if (!item) return null;

    // Strapi v5: data is flat (no .attributes wrapper)
    // Strapi v4: data is nested under .attributes
    const attrs = item.attributes || item;
    const flat = { id: item.id };

    for (const key of Object.keys(attrs)) {
      if (key === 'id') continue;
      const value = attrs[key];

      // Handle nested Strapi v4-style relations (data wrapper)
      if (value && typeof value === 'object' && value.data !== undefined) {
        flat[key] = this.handleRelation(value.data);
        // Handle Strapi v5 media objects (has url + provider/hash)
      } else if (value && typeof value === 'object' && !Array.isArray(value) && value.url && (value.hash || value.provider)) {
        flat[key] = this.transformMedia(value);
        // Handle arrays of media (gallery fields in v5)
      } else if (Array.isArray(value) && value.length > 0 && value[0]?.url && (value[0]?.hash || value[0]?.provider)) {
        flat[key] = value.map(m => this.transformMedia(m));
        // Handle arrays of related items in v5 (objects with id)
      } else if (Array.isArray(value) && value.length > 0 && value[0]?.id && !value[0]?.url) {
        flat[key] = value.map(rel => this.transformItem(rel));
      } else {
        flat[key] = value;
      }
    }

    return flat;
  }

  // Kept for backward compatibility — transformItem now handles flattening inline
  flatten(obj) {
    const result = {};

    for (const key in obj) {
      const value = obj[key];

      if (value?.data !== undefined) {
        result[key] = this.handleRelation(value.data);
      } else if (value && typeof value === 'object' && value.url && (value.hash || value.provider)) {
        result[key] = this.transformMedia(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  handleRelation(data) {
    if (Array.isArray(data)) {
      return data.map((item) => this.transformItem(item));
    }
    if (!data) return null;
    return this.transformItem(data);
  }

  transformMedia(media) {
    if (!media) return null;
    // v5 may nest formats differently
    const url = media.url || media.formats?.medium?.url || media.formats?.small?.url || media.formats?.thumbnail?.url;
    return {
      id: media.id,
      url: this.getMediaURL(url),
      width: media.width,
      height: media.height,
      alt: media.alternativeText || media.name,
      formats: media.formats || null,
    };
  }

  getMediaURL(url) {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${this.baseURL}${url}`;
  }

  // Alias for backward compatibility
  getMediaUrl(url) {
    return this.getMediaURL(url);
  }

  // =========================
  // QUERY BUILDER
  // =========================
  buildQueryString(params = {}) {
    const query = new URLSearchParams();

    // Only add populate if explicitly requested
    // Using populate=* can cause "Invalid key" errors if fields don't exist
    // Different endpoints have different populate requirements
    if (params.populate !== undefined) {
      if (params.populate === true || params.populate === "*") {
        query.append("populate", "*");
      } else if (typeof params.populate === "string") {
        // Split by comma and add multiple populate[] for Strapi v5
        const fields = params.populate.split(',').map(f => f.trim()).filter(f => f);
        fields.forEach((field, index) => {
          query.append(`populate[${index}]`, field);
        });
      }
    }

    if (params.page) {
      query.append("pagination[page]", params.page);
    }

    if (params.pageSize) {
      query.append("pagination[pageSize]", params.pageSize);
    }

    if (params.sort) {
      query.append(
        "sort[0]",
        `${params.sort}:${params.order || "asc"}`
      );
    }

    if (params.filters) {
      this.appendFilters(query, params.filters);
    }

    if (params.search) {
      query.append(
        "filters[$or][0][name][$containsi]",
        params.search
      );
      query.append(
        "filters[$or][1][description][$containsi]",
        params.search
      );
    }

    return query.toString() ? `?${query.toString()}` : "";
  }

  appendFilters(query, filters, path = "filters") {
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "object" && !Array.isArray(value)) {
        this.appendFilters(query, value, `${path}[${key}]`);
      } else {
        query.append(`${path}[${key}][$eq]`, value);
      }
    });
  }

  // =========================
  // HELPERS
  // =========================
  isSlug(value) {
    return isNaN(value);
  }

  // =========================
  // CONTENT METHODS
  // =========================

  biographies = {
    getAll: (params = {}) => {
      // Deep populate for list view: images and tags
      const { populate, ...rest } = params;
      const defaultPopulate = {
        populate: 'image,tags'
      };
      return this.request("/api/biographies", {
        query: { ...defaultPopulate, ...rest }
      });
    },

    get: async (idOrSlug) => {
      // Validate input
      if (!idOrSlug || typeof idOrSlug !== 'string') {
        throw new Error('Invalid biography identifier');
      }

      if (this.isSlug(idOrSlug)) {
        // Deep populate for single biography by slug
        const res = await this.request(
          `/api/biographies?filters[slug][$eq]=${encodeURIComponent(idOrSlug)}&populate[]=image&populate[]=tags&populate[]=sources`
        );
        return res.entries?.[0] || null;
      }
      return this.request(`/api/biographies/${encodeURIComponent(idOrSlug)}?populate[]=image&populate[]=tags&populate[]=sources`);
    },

      search: (query, params = {}) =>
        this.request("/api/biographies", {
          query: { ...params, search: query },
        }),
  };

    collections = {
      getAll: (params = {}) => {
        // Don't send populate by default - API may reject it
        const { populate, ...rest } = params;
        return this.request("/api/collections", { query: rest });
      },

      get: async (idOrSlug) => {
        if (this.isSlug(idOrSlug)) {
          const res = await this.request(
            `/api/collections?filters[slug][$eq]=${idOrSlug}`
          );
          return res.entries?.[0] || null;
        }
        return this.request(`/api/collections/${idOrSlug}`);
      },
    };

    leaders = {
      getAll: (params = {}) => {
        // Don't send populate by default - API may reject it
        const { populate, ...rest } = params;
        return this.request("/api/leaders", { query: rest });
      },

      get: async (idOrSlug) => {
        if (this.isSlug(idOrSlug)) {
          const res = await this.request(
            `/api/leaders?filters[slug][$eq]=${idOrSlug}`
          );
          return res.entries?.[0] || null;
        }
        return this.request(`/api/leaders/${idOrSlug}`);
      },
    };

    contributions = {
      submit: (data) =>
        this.request("/api/contributions", {
          method: "POST",
          body: JSON.stringify({ data }),
        }),
    };

    comments = {
      getByBiography: (id) =>
        this.request(
          `/api/comments?filters[biography][id][$eq]=${id}&populate=*`
        ),

      create: (data) =>
        this.request("/api/comments", {
          method: "POST",
          body: JSON.stringify({ data }),
        }),

      delete: (id) =>
        this.request(`/api/comments/${id}`, {
          method: "DELETE",
        }),

      like: (id) =>
        this.request(`/api/comments/${id}/like`, {
          method: "POST",
        }),
    };

    educationModules = {
      getAll: (params = {}) =>
        this.request("/api/education-modules", { query: params }),

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/education-modules?filters[slug][$eq]=${slug}`
        );
        return res.entries?.[0] || null;
      },
    };

    teachingResources = {
      getAll: (params = {}) => {
        const { populate, ...rest } = params;
        return this.request("/api/teaching-resources", { query: rest });
      },

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/teaching-resources?filters[slug][$eq]=${slug}`
        );
        return res.entries?.[0] || null;
      },

      getByType: (type) =>
        this.request(`/api/teaching-resources?filters[type][$eq]=${type}`),

      getDownloadUrl: (resource) => {
        if (!resource || !resource.file) return null;
        if (resource.file.url) {
          return this.getMediaURL(resource.file.url);
        }
        return null;
      },
    };

    readingLists = {
      getAll: (params = {}) => {
        const { populate, ...rest } = params;
        return this.request("/api/reading-lists", { query: rest });
      },

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/reading-lists?filters[slug][$eq]=${slug}&populate=books`
        );
        return res.entries?.[0] || null;
      },

      getByCategory: (category) =>
        this.request(`/api/reading-lists?filters[category][$eq]=${category}&populate=books`),
    };

    glossaries = {
      getAll: (params = {}) => {
        const { populate, ...rest } = params;
        return this.request("/api/glossaries", { query: rest });
      },

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/glossaries?filters[slug][$eq]=${slug}&populate=terms`
        );
        return res.entries?.[0] || null;
      },

      getTerms: (params = {}) => {
        return this.request("/api/glossaries", { query: params });
      },

      getTermBySlug: async (slug) => {
        const res = await this.request(
          `/api/glossaries?filters[slug][$eq]=${slug}`
        );
        return res.entries?.[0] || null;
      },
    };

    timelines = {
      getAll: (params = {}) => {
        const { populate, ...rest } = params;
        return this.request("/api/timelines", { query: rest });
      },

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/timelines?filters[slug][$eq]=${slug}&populate=events`
        );
        return res.entries?.[0] || null;
      },

      getEvents: (params = {}) => {
        return this.request("/api/timelines", { query: params });
      },
    };

    maps = {
      getAll: (params = {}) => {
        const { populate, ...rest } = params;
        return this.request("/api/interactive-maps", { query: rest });
      },

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/interactive-maps?filters[slug][$eq]=${slug}&populate=markers`
        );
        return res.entries?.[0] || null;
      },

      getByRegion: (region) =>
        this.request(`/api/interactive-maps?filters[region][$eq]=${region}&populate=markers`),
    };

    researchTools = {
      getAll: (params = {}) => {
        const { populate, ...rest } = params;
        return this.request("/api/research-tools", { query: rest });
      },

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/research-tools?filters[slug][$eq]=${slug}`
        );
        return res.entries?.[0] || null;
      },
    };

    downloadableResources = {
      getAll: (params = {}) => {
        const { populate, ...rest } = params;
        return this.request("/api/teaching-resources", { query: rest });
      },

      getBySlug: async (slug) => {
        const res = await this.request(
          `/api/teaching-resources?filters[slug][$eq]=${slug}&populate=file`
        );
        return res.entries?.[0] || null;
      },

      getByType: (type) =>
        this.request(`/api/teaching-resources?filters[type][$eq]=${type}&populate=file`),

      getDownloadUrl: (resource) => {
        if (!resource || !resource.file) return null;
        if (resource.file.url) {
          return this.getMediaURL(resource.file.url);
        }
        return null;
      },
    };

    notifications = {
      getAll: () => this.request("/api/notifications"),

      markAsRead: (id) =>
        this.request(`/api/notifications/${id}`, {
          method: "PUT",
          body: JSON.stringify({ data: { read: true } }),
        }),
    };

    contact = {
      submit: (data) =>
        this.request("/api/contact-submissions", {
          method: "POST",
          body: JSON.stringify({ data }),
        }),
    };

    userBookmarks = {
      getAll: () =>
        this.request("/api/user-bookmarks"),

      create: (data) =>
        this.request("/api/user-bookmarks", {
          method: "POST",
          body: JSON.stringify({ data }),
        }),

      delete: (id) =>
        this.request(`/api/user-bookmarks/${id}`, {
          method: "DELETE",
        }),

      clearAll: async () => {
        // Strapi v5 doesn't support DELETE on collection root (bulk delete).
        // Fetch all bookmarks, then delete each individually.
        const all = await this.request("/api/user-bookmarks");
        const entries = all.data || all.entries || [];
        if (entries.length === 0) return { deleted: 0 };
        await Promise.all(entries.map(b =>
          this.request(`/api/user-bookmarks/${b.id}`, { method: "DELETE" })
        ));
        return { deleted: entries.length };
      },
    };

    userHistory = {
      getAll: () =>
        this.request("/api/user-history"),

      sync: (data) =>
        this.request("/api/user-history/sync", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    };

    enterprises = {
      getAll: (params = {}) => {
        // Get all biographies with enterprise categories
        const enterpriseCategories = [
          'Trade & Commerce',
          'Agriculture & Food',
          'Manufacturing',
          'Healthcare & Medicine',
          'Finance & Banking',
          'Arts & Crafts',
          'Technology'
        ];

        const filters = enterpriseCategories.map(cat => `filters[category][$eq]=${encodeURIComponent(cat)}`).join('&');
        return this.request(`/api/biographies?${filters}&populate=*`, { query: params });
      },

      getByCategory: (category, params = {}) => {
        return this.request("/api/biographies", {
          query: { ...params, filters: { category: category } }
        });
      },

      getCategoryCount: async (category) => {
        const res = await this.request("/api/biographies", {
          query: { filters: { category: category }, pagination: { pageSize: 1 } }
        });
        return res.pagination?.total || 0;
      }
    };
  }

  // =========================
  // GLOBAL EXPORT INSTANCE
  // =========================

  const strapiAPI = new StrapiAPIClient({
    baseURL: typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : "https://womencypedia-cms.onrender.com",
    apiToken: typeof CONFIG !== 'undefined' ? CONFIG.API_TOKEN : '',
    getAccessToken: () => typeof Auth !== 'undefined' ? Auth.getAccessToken() : localStorage.getItem("womencypedia_access_token"),
  });

  if(typeof window !== 'undefined') {
  window.StrapiAPI = strapiAPI;
  window.API = strapiAPI;
}
