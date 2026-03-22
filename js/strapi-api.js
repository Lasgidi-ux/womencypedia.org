/**
 * Modern Strapi API Service (ES Module Version)
 * Clean, scalable, production-ready
 */

class StrapiAPIClient {
  constructor({ baseURL, apiToken = null, getAccessToken = null }) {
    this.baseURL = baseURL;
    this.apiToken = apiToken;
    this.getAccessToken = getAccessToken;
  }

  // =========================
  // CORE REQUEST METHOD
  // =========================
  async request(endpoint, options = {}) {
    const queryString = this.buildQueryString(options.query || {});
    const url = `${this.baseURL}${endpoint}${queryString}`;

    const token =
      (this.getAccessToken && this.getAccessToken()) || this.apiToken;

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body,
    });

    const data = await res.json();

    if (!res.ok) {
      throw {
        message: data?.error?.message || "API request failed",
        status: res.status,
        raw: data,
      };
    }

    return this.transformResponse(data);
  }

  // =========================
  // RESPONSE TRANSFORM
  // =========================
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

    const attrs = item.attributes || item;

    return {
      id: item.id,
      ...this.flatten(attrs),
    };
  }

  flatten(obj) {
    const result = {};

    for (const key in obj) {
      const value = obj[key];

      if (value?.data !== undefined) {
        result[key] = this.handleRelation(value.data);
      } else if (value?.url) {
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
    return {
      id: media.id,
      url: this.getMediaURL(media.url),
      width: media.width,
      height: media.height,
      alt: media.alternativeText || media.name,
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
        query.append("populate", params.populate);
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
      // Don't send populate by default - API rejects populate=* with "Invalid key sources"
      const { populate, ...rest } = params;
      return this.request("/api/biographies", { query: rest });
    },

    get: async (idOrSlug) => {
      if (this.isSlug(idOrSlug)) {
        const res = await this.request(
          `/api/biographies?filters[slug][$eq]=${idOrSlug}`
        );
        return res.entries?.[0] || null;
      }
      return this.request(`/api/biographies/${idOrSlug}`);
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

  notifications = {
    getAll: () => this.request("/api/notifications"),

    markAsRead: (id) =>
      this.request(`/api/notifications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ data: { read: true } }),
      }),
  };
}

// =========================
// GLOBAL EXPORT INSTANCE
// =========================

const strapiAPI = new StrapiAPIClient({
  baseURL: typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : "https://womencypedia-cms.onrender.com",
  getAccessToken: () => typeof Auth !== 'undefined' ? Auth.getAccessToken() : localStorage.getItem("womencypedia_access_token"),
});

if (typeof window !== 'undefined') {
  window.StrapiAPI = strapiAPI;
  window.API = strapiAPI;
}
