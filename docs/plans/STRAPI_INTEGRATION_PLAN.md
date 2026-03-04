# Womencypedia Strapi CMS Integration Plan

## Executive Summary

This plan addresses the product review findings and maps each issue to either:
- ✅ **Solved by Strapi** - CMS handles it natively
- ⚠️ **Partial Solution** - Strapi helps but frontend changes needed
- 🔧 **Frontend Fix Required** - Not a CMS concern

---

## Review Findings Analysis

### 🚨 CRITICAL (P0) Issues

| # | Risk | Strapi Solution | Frontend Action |
|---|------|-----------------|-----------------|
| 1 | **XSS vulnerability** - 36+ innerHTML assignments | ⚠️ **Partial** - Strapi sanitizes content on input, but frontend still renders with innerHTML | Add DOMPurify to all innerHTML calls in `ui.js`, `search.js`, `comments.js`, `notifications.js`, `timeline.js`, `profile.js` |
| 2 | **JWT in localStorage** | ✅ **Solved** - Strapi uses HttpOnly cookies option or secure JWT flow | Update `auth.js` to use Strapi's auth flow |
| 3 | **Auth.protectPage() not called** | 🔧 **Frontend Fix** - Not a CMS issue | Add `Auth.protectPage()` to `admin.html`, `profile.html`, `analytics.html`, `settings.html` |
| 4 | **No CSRF protection** | ✅ **Solved** - Strapi has built-in CSRF protection | Configure Strapi CSRF settings |

### ⚠️ HIGH (P1) Issues

| # | Risk | Strapi Solution | Frontend Action |
|---|------|-----------------|-----------------|
| 5 | **60+ HTML pages with copy-pasted nav** | 🔧 **Frontend Fix** - Consider migration to Astro or implement HTML partials | Implement templating system (11ty, Handlebars, or migrate to Astro) |
| 6 | **Backend returns 404** | ✅ **SOLVED** - Strapi replaces the non-functional backend | Update `config.js` API_BASE_URL |
| 7 | **No lazy loading on images** | ⚠️ **Partial** - Strapi provides optimized image URLs | Add `loading="lazy"` to all images, implement responsive images |
| 8 | **Zero test coverage** | 🔧 **Frontend Fix** - Add Jest + testing utilities | Create test foundation for `auth.js`, `api.js`, `forms.js` |

### ⚠️ MEDIUM (P2) Issues

| # | Risk | Strapi Solution | Frontend Action |
|---|------|-----------------|-----------------|
| 9 | **Duplicate JS initialization** | 🔧 **Frontend Fix** - Consolidate `main.js` + `navigation.js` | Remove duplicate function definitions |
| 10 | **Inline styles/scripts in HTML** | 🔧 **Frontend Fix** - Extract to external files | Move inline CSS/JS to external files for CSP compatibility |
| 11 | **No form validation** | ⚠️ **Partial** - Strapi validates on backend | Add client-side validation, password strength checker |

---

## Strapi Content Types Architecture

### Biography Content Type

```yaml
# api/biography/content-types/biography/schema.json
{
  "kind": "collectionType",
  "collectionName": "biographies",
  "info": {
    "singularName": "biography",
    "pluralName": "biographies",
    "displayName": "Biography",
    "description": "Interpretive biographies of remarkable women"
  },
  "options": {
    "draftAndPublish": true,
    "i18n": true
  },
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "region": {
      "type": "enumeration",
      "enum": ["Africa", "Europe", "Asia", "Middle East", "North America", "South America", "Oceania", "Global"],
      "required": true
    },
    "era": {
      "type": "enumeration", 
      "enum": ["Ancient", "Pre-colonial", "Colonial", "Post-colonial", "Contemporary"],
      "required": true
    },
    "category": {
      "type": "enumeration",
      "enum": ["Leadership", "Culture & Arts", "Spirituality & Faith", "Politics & Governance", "Science & Innovation", "Community Builders", "Activism & Justice", "Education", "Diaspora Stories"],
      "required": true
    },
    "domain": { "type": "string" },
    "introduction": { "type": "richtext", "required": true },
    "earlyLife": { "type": "richtext" },
    "pathToInfluence": { "type": "richtext" },
    "contributions": { "type": "richtext" },
    "symbolicPower": { "type": "richtext" },
    "culturalContext": { "type": "richtext" },
    "legacy": { "type": "richtext" },
    "image": { 
      "type": "media", 
      "multiple": false,
      "required": false,
      "allowedTypes": ["images"]
    },
    "gallery": {
      "type": "media",
      "multiple": true,
      "required": false,
      "allowedTypes": ["images"]
    },
    "tags": {
      "type": "relation",
      "relation": "many-to-many",
      "target": "api::tag.tag"
    },
    "sources": { "type": "json" },
    "relatedWomen": {
      "type": "relation",
      "relation": "many-to-many",
      "target": "api::biography.biography"
    },
    "relatedMovements": { "type": "json" },
    "relatedDynasties": { "type": "json" },
    "featured": { "type": "boolean", "default": false },
    "publishedAt": { "type": "datetime" },
    "createdAt": { "type": "datetime" },
    "updatedAt": { "type": "datetime" },
    "createdBy": { "type": "relation", "relation": "oneToOne", "target": "admin::user" }
  }
}
```

### Collection Content Type

```yaml
# api/collection/content-types/collection/schema.json
{
  "kind": "collectionType",
  "collectionName": "collections",
  "info": {
    "singularName": "collection",
    "pluralName": "collections",
    "displayName": "Collection"
  },
  "options": {
    "draftAndPublish": true,
    "i18n": true
  },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "description": { "type": "richtext" },
    "coverImage": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "biographies": {
      "type": "relation",
      "relation": "many-to-many",
      "target": "api::biography.biography"
    },
    "featured": { "type": "boolean", "default": false }
  }
}
```

### Tag Content Type

```yaml
# api/tag/content-types/tag/schema.json
{
  "kind": "collectionType",
  "collectionName": "tags",
  "info": {
    "singularName": "tag",
    "pluralName": "tags",
    "displayName": "Tag"
  },
  "options": {
    "i18n": true
  },
  "attributes": {
    "name": { "type": "string", "required": true, "unique": true },
    "slug": { "type": "uid", "targetField": "name" },
    "biographies": {
      "type": "relation",
      "relation": "many-to-many",
      "target": "api::biography.biography",
      "inversedBy": "tags"
    }
  }
}
```

### Education Module Content Type

```yaml
# api/education-module/content-types/education-module/schema.json
{
  "kind": "collectionType",
  "collectionName": "education_modules",
  "info": {
    "singularName": "education-module",
    "pluralName": "education-modules",
    "displayName": "Education Module"
  },
  "options": {
    "draftAndPublish": true,
    "i18n": true
  },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "description": { "type": "text" },
    "order": { "type": "integer", "default": 1 },
    "content": { "type": "richtext" },
    "coverImage": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "lessons": { "type": "json" },
    "quiz": { "type": "json" },
    "relatedBiographies": {
      "type": "relation",
      "relation": "many-to-many",
      "target": "api::biography.biography"
    }
  }
}
```

---

## i18n Infrastructure Implementation

### Strapi i18n Configuration

```javascript
// config/plugins.js
module.exports = {
  i18n: {
    enabled: true,
    config: {
      locales: [
        'en',    // English (default)
        'fr',    // French - West/Central Africa
        'pt',    // Portuguese - Lusophone Africa
        'sw',    // Swahili - East Africa
        'ha',    // Hausa - West Africa
        'yo',    // Yoruba - Nigeria
        'ar',    // Arabic - North Africa
        'es',    // Spanish - International
        'zh',    // Chinese - International
        'hi'     // Hindi - International
      ],
      defaultLocale: 'en',
    },
  },
};
```

### Frontend i18n Architecture

```javascript
// js/i18n.js - NEW FILE

const I18N = {
  currentLocale: 'en',
  supportedLocales: ['en', 'fr', 'pt', 'sw', 'ha', 'yo', 'ar', 'es', 'zh', 'hi'],
  
  // Translation storage
  translations: {},
  
  /**
   * Initialize i18n system
   */
  async init() {
    // Get stored preference or browser language
    const stored = localStorage.getItem('womencypedia_locale');
    const browserLang = navigator.language.split('-')[0];
    
    this.currentLocale = stored || 
      (this.supportedLocales.includes(browserLang) ? browserLang : 'en');
    
    await this.loadTranslations(this.currentLocale);
    this.applyTranslations();
  },
  
  /**
   * Load translations for a locale
   */
  async loadTranslations(locale) {
    try {
      const response = await fetch(`/locales/${locale}.json`);
      this.translations = await response.json();
    } catch (error) {
      console.warn(`Translations not found for ${locale}, falling back to English`);
      if (locale !== 'en') {
        await this.loadTranslations('en');
      }
    }
  },
  
  /**
   * Get translation by key
   */
  t(key, params = {}) {
    let text = this.translations[key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  },
  
  /**
   * Change locale
   */
  async setLocale(locale) {
    if (!this.supportedLocales.includes(locale)) return;
    
    this.currentLocale = locale;
    localStorage.setItem('womencypedia_locale', locale);
    await this.loadTranslations(locale);
    this.applyTranslations();
    
    // Dispatch event for components to re-render
    window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale } }));
  },
  
  /**
   * Apply translations to DOM elements with data-i18n attribute
   */
  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18N;
}
```

### API Integration with Locale

```javascript
// Update js/api.js - Add locale parameter

const API = {
  // ... existing code ...
  
  /**
   * Get current locale for API requests
   */
  getLocale() {
    return typeof I18N !== 'undefined' ? I18N.currentLocale : 'en';
  },
  
  entries: {
    async getAll(params = {}) {
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
        locale: params.locale || API.getLocale(),  // Add locale
        populate: '*',  // Strapi needs this for relations
        ...params
      };
      return API.get('/biographies', queryParams);
    },
    
    async getById(id, locale) {
      return API.get(`/biographies/${id}`, {
        locale: locale || API.getLocale(),
        populate: '*'
      });
    }
  }
};
```

### Strapi Response Transformer

```javascript
// Add to js/api.js

/**
 * Transform Strapi response format to match frontend expectations
 */
function transformStrapiResponse(response) {
  // Handle single item
  if (response.data && !Array.isArray(response.data)) {
    return {
      id: response.data.id,
      ...flattenAttributes(response.data.attributes)
    };
  }
  
  // Handle collection
  if (response.data && Array.isArray(response.data)) {
    return {
      entries: response.data.map(item => ({
        id: item.id,
        ...flattenAttributes(item.attributes)
      })),
      page: response.meta?.pagination?.page || 1,
      total_pages: response.meta?.pagination?.pageCount || 1,
      total: response.meta?.pagination?.total || response.data.length
    };
  }
  
  return response;
}

/**
 * Flatten nested attributes object
 */
function flattenAttributes(attrs) {
  const result = {};
  
  for (const [key, value] of Object.entries(attrs)) {
    // Handle relation data
    if (value?.data) {
      if (Array.isArray(value.data)) {
        result[key] = value.data.map(item => ({
          id: item.id,
          ...flattenAttributes(item.attributes)
        }));
      } else {
        result[key] = {
          id: value.data.id,
          ...flattenAttributes(value.data.attributes)
        };
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}
```

---

## Implementation Roadmap

### Phase 1: Strapi Setup (Week 1)

```mermaid
flowchart LR
    A[Install Strapi] --> B[Create Content Types]
    B --> C[Configure i18n]
    C --> D[Set Up Roles]
    D --> E[Import Existing Data]
```

**Tasks:**
1. Install Strapi v4: `npx create-strapi-app@latest womencypedia-cms`
2. Create Biography, Collection, Tag, Education Module content types
3. Enable i18n plugin with 10 locales
4. Configure roles: Admin, Editor, Translator, Contributor
5. Import 5 existing biographies from `data.js`

### Phase 2: Frontend Integration (Week 2)

```mermaid
flowchart LR
    A[Update API Layer] --> B[Add Response Transformer]
    B --> C[Implement i18n.js]
    C --> D[Update All API Calls]
    D --> E[Test All Pages]
```

**Tasks:**
1. Update `config.js` with Strapi URL
2. Add Strapi response transformer to `api.js`
3. Create `i18n.js` module
4. Update all API calls to include locale parameter
5. Add locale switcher UI component

### Phase 3: Security Fixes (Week 2-3)

**Tasks:**
1. Add DOMPurify to all innerHTML assignments
2. Implement `Auth.protectPage()` on protected pages
3. Configure Strapi CSRF settings
4. Move JWT to HttpOnly cookies (Strapi config)
5. Add CSP headers

### Phase 4: Performance & UX (Week 3)

**Tasks:**
1. Add `loading="lazy"` to all images
2. Implement skeleton loaders for API calls
3. Defer non-critical JavaScript
4. Add responsive images with Strapi image API

---

## Strapi Endpoints Mapping

| Current Endpoint | Strapi Endpoint | Notes |
|-----------------|-----------------|-------|
| `GET /entries` | `GET /api/biographies?populate=*&locale=en` | Add populate for relations |
| `GET /entries/:id` | `GET /api/biographies/:id?populate=*&locale=en` | |
| `POST /entries` | `POST /api/biographies` | Admin only |
| `PUT /entries/:id` | `PUT /api/biographies/:id` | Admin only |
| `DELETE /entries/:id` | `DELETE /api/biographies/:id` | Admin only |
| `GET /entries/search` | `GET /api/biographies?filters[name][$contains]=query` | Strapi filter syntax |
| `GET /collections` | `GET /api/collections?populate=*&locale=en` | |
| `GET /collections/:id` | `GET /api/collections/:id?populate=*&locale=en` | |
| `POST /auth/login` | `POST /api/auth/local` | Strapi auth |
| `POST /auth/register` | `POST /api/auth/local/register` | |
| `GET /auth/me` | `GET /api/users/me?populate=role` | |
| `POST /contributions/nominations` | `POST /api/nominations` | Create nominations CT |

---

## Summary: What Strapi Solves

### ✅ Fully Solved by Strapi

| Issue | How Strapi Solves It |
|-------|---------------------|
| Backend 404 | Replaces non-functional backend completely |
| CSRF Protection | Built-in CSRF middleware |
| JWT Auth | Secure JWT implementation with HttpOnly cookie option |
| Content Management | Visual admin UI for all content |
| Image Optimization | Built-in image transformations |
| API Generation | Auto-generated REST API |
| Role-Based Access | Built-in RBAC system |
| i18n | Native internationalization support |
| Draft/Publish | Content workflow built-in |

### ⚠️ Partially Solved (Frontend Changes Needed)

| Issue | Strapi Part | Frontend Part |
|-------|-------------|---------------|
| XSS | Sanitizes input | DOMPurify on output |
| Form Validation | Backend validation | Client-side validation |
| Lazy Loading | Optimized URLs | `loading="lazy"` attribute |

### 🔧 Frontend Only (Not CMS Related)

| Issue | Action Required |
|-------|-----------------|
| 60+ HTML pages | Migrate to Astro or implement partials |
| Duplicate JS | Consolidate `main.js` + `navigation.js` |
| Auth.protectPage() | Add calls to protected pages |
| Test coverage | Add Jest + tests |
| Inline styles/scripts | Extract to external files |

---

## Next Steps

1. **Immediate**: Switch to Code mode to implement Strapi integration
2. **Week 1**: Set up Strapi and create content types
3. **Week 2**: Integrate frontend with Strapi API
4. **Week 3**: Implement security fixes and i18n
