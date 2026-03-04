# Womencypedia Frontend - Production Readiness Audit Report

**Date:** February 22, 2026  
**Mode:** Architect Review  
**Objective:** Production Readiness for Strapi Backend Integration

---

## Executive Summary

This comprehensive audit identifies **critical architectural issues**, **integration failures**, **UI/UX inconsistencies**, **authentication flaws**, and provides a **prioritized fix roadmap** for production deployment with a Strapi headless CMS backend.

**Key Findings:**
- **CRITICAL**: Dark mode is non-functional (toggleDarkMode function missing)
- **CRITICAL**: 172 occurrences of dead dark mode classes across all HTML files
- **HIGH**: No page protection enforcement despite Auth.protectPage() existing
- **HIGH**: Static HTML content not aligned with Strapi dynamic endpoints
- **MEDIUM**: Hardcoded API base URL (localhost:1337)
- **MEDIUM**: 36+ backend endpoints missing or mismatched

---

## 1. Strapi Integration & Data Flow Audit

### 1.1 Current Configuration Status

| Component | Status | Location |
|-----------|--------|----------|
| API Base URL | ⚠️ Hardcoded | [`js/config.js:18`](js/config.js:18) |
| USE_STRAPI | ✅ Enabled | [`js/config.js:24`](js/config.js:24) |
| StrapiAPI Service | ✅ Implemented | [`js/strapi-api.js`](js/strapi-api.js) |
| API Router | ✅ Implemented | [`js/api.js`](js/api.js) |
| Response Transformation | ✅ Implemented | [`js/strapi-api.js:18`](js/strapi-api.js:18) |

### 1.2 API Endpoint Analysis

**Working Endpoints:**
- ✅ `GET /api/biographies` - Biographies list
- ✅ `GET /api/biographies?filters[slug][$eq]=X` - By slug
- ✅ `GET /api/collections` - Collections list
- ✅ `GET /api/education-modules` - Education modules
- ✅ `GET /api/tags` - Tags

**Missing/Mismatched Endpoints (per [MISSING_ENDPOINTS.md](MISSING_ENDPOINTS.md)):**

| Category | Backend Has | Frontend Needs | Gap |
|----------|-------------|----------------|-----|
| Auth | 5 | 14 | 9 missing |
| Entries | 5 | 6 | 1 missing + path fixes |
| Comments | 0 | 4 | 4 missing |
| Collections | 0 | 6 | 6 missing |
| Notifications | 0 | 5 | 5 missing |
| User Profile | 0 | 5 | 5 missing |
| **TOTAL** | **12** | **48** | **36 missing/broken** |

### 1.3 Critical Issues

1. **Hardcoded Base URL** - `http://localhost:1337` must be environment-based
2. **Missing Auth Endpoints** - No refresh token, verify-email, change-password implementation
3. **No Caching Strategy** - Every page load hits API directly
4. **Token Storage** - Using localStorage (security concern for production)

### 1.4 Scalability Recommendations

```javascript
// Recommended: Environment-based configuration
CONFIG.API_BASE_URL = process.env.API_STRAPI_URL || 'https://strapi.womencypedia.org';

// Recommended: Implement Redis-like caching for public content
const CACHE_TTL = {
    PUBLIC_CONTENT: 3600, // 1 hour
    USER_CONTENT: 300      // 5 minutes
};
```

---

## 2. Authentication & Profile Logic Enhancement

### 2.1 Authentication Architecture

| Feature | Status | Location |
|---------|--------|----------|
| JWT Token Storage | ⚠️ Insecure | [`js/auth.js:462`](js/auth.js:462) |
| Token Retrieval | ✅ Working | [`js/auth.js:445`](js/auth.js:445) |
| Refresh Token | ⚠️ Stub Only | [`js/auth.js:305`](js/auth.js:305) |
| Login (Strapi) | ✅ Working | [`js/auth.js:73`](js/auth.js:73) |
| Registration | ✅ Working | [`js/auth.js:161`](js/auth.js:161) |
| Logout | ✅ Working | [`js/auth.js:279`](js/auth.js:279) |
| Page Protection | ❌ Not Enforced | N/A |

### 2.2 Critical Authentication Issues

1. **No Page Protection Enforcement**
   - `Auth.protectPage()` exists in code but NOT actively used on any page
   - Pages like `profile.html`, `admin.html`, `nominate.html` are publicly accessible

2. **Token Storage Security**
   - Using `localStorage` - vulnerable to XSS attacks
   - **Recommendation**: Use httpOnly cookies for production

3. **Logout Button Visibility**
   - No contextual logout button on protected pages
   - Mobile menu shows profile link but no sign-out

4. **Profile Data Schema Alignment**
   - ✅ Correctly maps: `user.username`, `user.email`, `user.role`
   - ✅ Handles Strapi v4/v5 response format
   - ⚠️ Missing: Extended profile fields (bio, location, avatar)

### 2.3 Hydration & Auth State Issues

- **Issue**: No server-side rendering - client must re-fetch auth state on each page load
- **Impact**: Brief "logged out" flash on page load for authenticated users
- **Fix**: Implement auth state pre-check in HTML head

---

## 3. UI Consistency & Brand System Alignment

### 3.1 Brand Color System (Extracted from [tailwind.config.js](tailwind.config.js))

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **primary** | `#e8a6a6` | Main brand color, CTAs |
| **primary-hover** | `#D98F8F` | Button hover states |
| **accent-gold** | `#D4AF37` | Premium highlights |
| **accent-teal** | `#4DB6AC` | Secondary actions |
| **lavender** | `#C8A2C8` | Decorative elements |
| **lavender-soft** | `#EDE3F1` | Soft backgrounds |
| **background-cream** | `#F5F5F0` | Page backgrounds |
| **background-dark** | `#1f1313` | ❌ Should be removed |
| **text-main** | `#191010` | Primary text |
| **text-secondary** | `#6B6B6B` | Secondary text |
| **border-light** | `#DDD8CF` | Borders and dividers |
| **divider** | `#B48CB8` | Section dividers |

### 3.2 Typography

| Font | Usage | Source |
|------|-------|--------|
| **Playfair Display** | Headlines, serif | Google Fonts |
| **Lato** | Body text, sans-serif | Google Fonts |

### 3.3 Dark Mode Issues (CRITICAL)

**Problem**: Dark mode is **broken** - called but not implemented!

| Issue | Details |
|-------|---------|
| **Missing Function** | `toggleDarkMode()` called in HTML but NOT defined in any JS file |
| **172 Dead Classes** | All `dark:` Tailwind classes are non-functional |
| **Tailwind Config** | `darkMode: "class"` enabled but unused |
| **CSS Bloat** | pricing.html contains unused dark mode CSS rules |
| **Toggle Button** | Present in nav but does nothing |

**Files affected by dead dark mode classes:**
- index.html, browse.html, featured.html, collections.html
- biography.html, biography-hypatia.html, biography-maria-sabina.html
- All education modules, all static pages

### 3.4 Visual Inconsistencies Found

1. **Pricing Page**: Contains dark mode CSS rules not in other pages
2. **Mobile Menu**: Uses hardcoded path prefixes - potential for broken links
3. **Footer**: Need verification for consistency across all 40+ pages

---

## 4. Navigation, Layout & Structural Integrity

### 4.1 Navigation Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| Desktop Nav | ✅ Working | Correct links and active states |
| Mobile Menu | ✅ Working | Bottom sheet with accordion |
| Search Sheet | ✅ Working | Overlay search functionality |
| Scroll Behavior | ✅ Working | Hide on scroll down |
| Path Prefixes | ⚠️ Manual | Need automated solution |
| Auth State UI | ❌ Missing | No sign-in/out toggle |

### 4.2 Mobile Navigation Issues

1. **Hardcoded Path Detection** - [`js/navigation.js:57`](js/navigation.js:57)
   ```javascript
   const pathPrefix = window.location.pathname.includes('/collections/') ? '../' : '';
   ```
   This is fragile - should use a centralized path utility.

2. **No Auth-Aware Menu**
   - Profile link always shown
   - No conditional "Sign Out" option in mobile menu

### 4.3 Footer Consistency

- Need to verify footer content across all 40+ HTML files
- Footer may contain outdated links or inconsistent branding

---

## 5. Codebase Error Detection & Refactoring

### 5.1 Unused Components & Dead Code

| Component | Issue | Recommendation |
|-----------|-------|----------------|
| `toggleDarkMode` | Called but undefined | Remove all dark mode code |
| Dark mode CSS | 172+ dead classes | Remove from all HTML files |
| pricing.html dark CSS | Unused rules | Remove |
| CONFIG frozen objects | Good practice | Keep |

### 5.2 State Management Issues

1. **No Global State Management** - Each page re-fetches data independently
2. **No Loading States** - Some pages lack skeleton loaders
3. **No Error Boundaries** - Failed API calls show generic errors

### 5.3 Performance Bottlenecks

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| No Lazy Loading | High | Implement IntersectionObserver for images |
| No CDN | High | Move to CDN for static assets |
| No Compression | Medium | Enable gzip/brotli on server |
| No Service Worker | Medium | Add offline support |

### 5.4 Async Handling Issues

- No global error handler for uncaught Promise rejections
- No retry logic for failed API calls (beyond config)
- No request cancellation on page navigation

---

## 6. HTML Pages → Strapi Dynamic Alignment

### 6.1 Strapi Schema (Biography)

Located at: [`womencypedia-cms/src/api/biography/content-types/biography/schema.json`](womencypedia-cms/src/api/biography/content-types/biography/schema.json)

```json
{
  "attributes": {
    "name": "string (required)",
    "slug": "uid (required)",
    "region": "enum: Africa, Europe, Asia, Middle East, ...",
    "era": "enum: Ancient, Pre-colonial, Colonial, ...",
    "category": "enum: Leadership, Culture & Arts, ...",
    "domain": "string",
    "introduction": "richtext (required)",
    "earlyLife": "richtext",
    "pathToInfluence": "richtext",
    "contributions": "richtext",
    "symbolicPower": "richtext",
    "culturalContext": "richtext",
    "legacy": "richtext",
    "image": "media (single)",
    "gallery": "media (multiple)",
    "tags": "relation (manyToMany)",
    "sources": "json",
    "relatedWomen": "relation (self)",
    "relatedMovements": "json",
    "relatedDynasties": "json",
    "featured": "boolean"
  }
}
```

### 6.2 Static HTML Files Requiring Dynamic Conversion

| Current File | Should Fetch From | Status |
|--------------|-------------------|--------|
| [`biography.html`](biography.html) | `/api/biographies?filters[slug]=...` | ❌ Static |
| [`biography-hypatia.html`](biography-hypatia.html) | `/api/biographies?filters[slug]=hypatia` | ❌ Static |
| [`biography-maria-sabina.html`](biography-maria-sabina.html) | `/api/biographies?filters[slug]=maria-sabina` | ❌ Static |
| [`education-module-1.html`](education-module-1.html) | `/api/education-modules?filters[slug]=...` | ❌ Static |
| [`collections/african-queens.html`](collections/african-queens.html) | `/api/collections?filters[slug]=african-queens` | ❌ Static |

### 6.3 Schema Mapping Issues

**Current HTML uses hardcoded data:**
- Static images in `/images/` folder
- Hardcoded biography content
- No dynamic region/era/category filtering

**Required Changes:**
1. Create dynamic biography template (`biography.html?slug=queen-amina`)
2. Implement slug-based routing
3. Add loading states for API fetches
4. Handle "Biography not found" gracefully

---

## 7. Production Readiness Checklist

### 7.1 Critical (Must Fix Before Launch)

| # | Item | Status | Priority |
|---|------|--------|----------|
| 1 | Remove all dark mode code (172+ classes) | ❌ | CRITICAL |
| 2 | Implement `toggleDarkMode` function OR remove toggle buttons | ❌ | CRITICAL |
| 3 | Fix hardcoded API base URL | ❌ | CRITICAL |
| 4 | Add page protection to protected routes | ❌ | CRITICAL |
| 5 | Convert static HTML to dynamic Strapi fetching | ❌ | CRITICAL |
| 6 | Implement proper token storage (httpOnly cookies) | ❌ | HIGH |

### 7.2 High Priority

| # | Item | Status |
|---|------|--------|
| 7 | Add logout button to mobile menu |
| 8 | Implement auth state pre-check to prevent flash |
| 9 | Add loading skeletons to content pages |
| 10 | Implement caching strategy for public content |
| 11 | Add global error handling |
| 12 | Verify footer consistency across all pages |

### 7.3 Medium Priority

| # | Item | Status |
|---|------|--------|
| 13 | Add service worker for offline support |
| 14 | Implement lazy loading for images |
| 15 | Add retry logic for failed API calls |
| 16 | Implement proper SEO meta tags |
| 17 | Add sitemap.xml generation |

### 7.4 Low Priority

| # | Item | Status |
|---|------|--------|
| 18 | Add analytics tracking |
| 19 | Implement social sharing |
| 20 | Add comment system |

---

## 8. Prioritized Fix Roadmap

### Phase 1: Critical Fixes (Week 1)

```
[TASK 1.1] Remove Dark Mode Entirely
├── Remove darkMode: "class" from tailwind.config.js
├── Remove all dark: CSS classes from all HTML files (172 occurrences)
├── Remove toggleDarkMode buttons from navigation
├── Remove dark mode CSS rules from pricing.html
└── Verify: No "dark:" classes in codebase

[TASK 1.2] Fix API Configuration
├── Change hardcoded URL to environment variable
├── Update js/config.js: API_BASE_URL
├── Test with production Strapi instance
└── Document required environment variables

[TASK 1.3] Implement Page Protection
├── Add Auth.protectPage() to profile.html
├── Add Auth.protectPage() to admin.html (admin role)
├── Add Auth.protectPage() to analytics.html
├── Add Auth.protectPage() to nominate.html
├── Add Auth.protectPage() to share-story.html
└── Create 403.html access denied page
```

### Phase 2: Strapi Integration (Week 2)

```
[TASK 2.1] Dynamic Biography Pages
├── Create unified biography template
├── Implement slug-based routing (?slug=queen-amina)
├── Update StrapiAPI.biographies.get(slug) calls
├── Add loading states and error handling
└── Test with sample Strapi data

[TASK 2.2] Dynamic Collections
├── Update collections.html to fetch from API
├── Make collection subpages dynamic
├── Implement collection filtering
└── Add collection cards to homepage

[TASK 2.3] Dynamic Education Modules
├── Fetch education modules from Strapi
├── Make education-module-*.html dynamic
└── Update education.html hub page
```

### Phase 3: Authentication Enhancement (Week 3)

```
[TASK 3.1] Secure Token Storage
├── Implement httpOnly cookie storage
├── Update Auth module for cookie-based tokens
└── Test cross-domain auth if needed

[TASK 3.2] Auth UI Improvements
├── Add contextual sign-out button to all pages
├── Add auth state pre-check to prevent flash
├── Implement persistent login
└── Add session timeout handling

[TASK 3.3] Profile Enhancements
├── Align profile fields with Strapi user schema
├── Add avatar upload functionality
├── Add extended profile fields (bio, location)
└── Implement profile editing
```

### Phase 4: Performance & Polish (Week 4)

```
[TASK 4.1] Performance Optimization
├── Implement image lazy loading
├── Add service worker for caching
├── Implement API response caching
└── Add loading skeletons

[TASK 4.2] UI Consistency
├── Verify footer consistency
├── Fix mobile navigation path prefixes
├── Add consistent error messages
└── Standardize form validation

[TASK 4.3] Testing & Documentation
├── Test all user flows
├── Document API endpoints
├── Create deployment guide
└── Set up monitoring
```

---

## Assumptions

1. **Strapi Backend**: Assumes Strapi instance is accessible and content types match the schema in `womencypedia-cms/`
2. **Build Process**: Tailwind CSS is compiled - changes to config require rebuild
3. **Deployment**: Frontend will be hosted on same domain as Strapi or configured for CORS
4. **Browser Support**: Modern browsers only (no IE11)
5. **Authentication**: Using Strapi's built-in JWT authentication (not OAuth)

---

## Summary

This audit reveals a **well-structured codebase** with solid foundations in authentication, API handling, and UI components. However, critical issues around **dark mode implementation** and **static-to-dynamic content conversion** must be addressed before production launch.

The **most urgent fixes** are:
1. Remove all dark mode code (non-functional and creates confusion)
2. Convert static HTML pages to fetch from Strapi dynamically
3. Enforce page protection on authenticated routes
4. Fix hardcoded API configuration

Following this roadmap will ensure production readiness with a fully functional Strapi integration.

---

*Report generated by Architect Review Mode*
*Next steps: User approval required to proceed with implementation*
