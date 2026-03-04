# Womencypedia — Complete CMS Migration Plan
## Static HTML → Dynamic Strapi CMS Architecture

> **Generated**: 2026-02-25  
> **Goal**: Transform all hardcoded content into runtime Strapi API data while preserving pixel-perfect visual output  
> **Critical Rule**: All CMS content must reflect automatically on refresh — NO rebuild, NO redeploy, NO static snapshots

---

## Table of Contents

1. [Static Section → Strapi Content Mapping Table](#1-static-section--strapi-content-mapping-table)
2. [Mock Data Removal Report](#2-mock-data-removal-report)
3. [Unused Page Deletion Report](#3-unused-page-deletion-report)
4. [Proposed Strapi Schema (Already Created)](#4-proposed-strapi-schema)
5. [Step-by-Step Safe Refactor Plan](#5-step-by-step-safe-refactor-plan)
6. [Before vs After Code Examples](#6-before-vs-after-code-examples)
7. [Runtime Data-Fetch Implementation](#7-runtime-data-fetch-implementation)
8. [Risk Analysis & Rollback Strategy](#8-risk-analysis--rollback-strategy)
9. [Validation Checklist](#9-validation-checklist)

---

## 1. Static Section → Strapi Content Mapping Table

### A. Pages with Dynamic Content (Must fetch from Strapi)

| Page(s) | Static Section | Strapi Content Type | Strapi Field(s) | Fetch Strategy |
|---------|---------------|---------------------|------------------|----------------|
| `index.html` | Hero title, subtitle, badge, quote, CTAs | **Single Type: `homepage`** | `heroTitle`, `heroSubtitle`, `heroBadge`, `quoteText`, `ctaButtons` (component) | `GET /api/homepage?populate=*` |
| `index.html` | "Why Womencypedia?" stats (18%, Attribution Gap, Cultural Erasure) | **homepage** | `whySection` (component with items array) | Same as above |
| `index.html` | "Who It's For" audience cards | **homepage** | `audienceCards` (repeatable component) | Same as above |
| `index.html` | Mission/Vision text paragraphs | **homepage** | `missionTitle`, `missionBody`, `visionTitle`, `visionBody` | Same as above |
| `index.html` | Credibility strip (Yale, Smithsonian, etc.) | **homepage** | `credibilityPartners` (repeatable component: `name`, `icon`) | Same as above |
| `index.html` | Featured collection image & title in hero | **homepage** | Relation → `featuredCollection` | Same with populate |
| `index.html` | Map region data (region → count) | **Computed from Strapi** | Aggregate query on biographies by region | Custom API or count query |
| `browse.html` | Biography cards grid | **Collection: `biography`** | All fields | `GET /api/biographies?populate=*&pagination[pageSize]=12` |
| `browse.html` | Filter options (categories, regions, eras) | **biography schema enums** | Already in schema as enumerations | Hardcoded initially (matches schema enums), or `/api/biographies/schema` |
| `featured.html` | Featured biographies | **biography** (filtered) | `featured=true` | `GET /api/biographies?filters[featured]=true&populate=*` |
| `biography.html` / `biography-*.html` | Full biography content | **biography** | All richtext fields | `GET /api/biographies?filters[slug]=X&populate=*` |
| `collections.html` | Collection list | **Collection: `collection`** | `title`, `slug`, `description`, `coverImage`, `biographies` | `GET /api/collections?populate=*` |
| `collections/*.html` (6 files) | Individual collection pages | **collection** (by slug) | Relation → biographies | `GET /api/collections?filters[slug]=X&populate[biographies][populate]=*` |
| `education.html` | Module list | **Collection: `education-module`** | `title`, `slug`, `description`, `order`, `coverImage` | `GET /api/education-modules?sort=order:asc&populate=*` |
| `education-module-*.html` (7 files + template) | Module content, lessons, quiz | **education-module** (by slug) | `content`, `lessons`, `quiz`, `relatedBiographies` | `GET /api/education-modules?filters[slug]=X&populate=*` |
| `browse-leaders.html` | Leader cards | **Collection: `leader`** | All fields | `GET /api/leaders?populate=*` |
| `leader-profile.html` | Full leader profile | **leader** (by slug) | All fields | `GET /api/leaders?filters[slug]=X&populate=*` |
| `partners.html` | Partner listings | **Collection: `partner`** | All fields | `GET /api/partners?populate=*` |
| `fellowship.html` | Fellowship listings | **Collection: `fellowship`** | All fields | `GET /api/fellowships?populate=*` |
| `controlled-contributions.html` | Contribution submission + list | **Collection: `contribution`** | All fields | `GET /api/contributions?filters[status]=published&populate=*` |
| `reports.html` | Reports listing | **Collection: `contribution`** (type=report) | Filtered by `type` | `GET /api/contributions?filters[type]=report&populate=*` |
| `apply-verification.html` | Verification form submission | **Collection: `verification-application`** | Form POST | `POST /api/verification-applications` |
| `timelines.html` | Timeline events | **biography** (sorted by era) | `name`, `era`, `region`, `introduction` | `GET /api/biographies?sort=era:asc&populate=image` |
| `search.html` | Search results | **biography** | Full-text search | `GET /api/biographies?filters[$or][0][name][$containsi]=Q&populate=*` |

### B. Pages with Mostly Static Content (CMS optional — Phase 2)

| Page | Content Type | Priority | Recommendation |
|------|-------------|----------|----------------|
| `about.html` | Institutional text | LOW | **Single Type: `about-page`** — paragraphs, team photos, timeline |
| `methodology.html` | Static methodology text | LOW | **Single Type: `methodology-page`** |
| `editorial-standards.html` | Standards text | LOW | **Single Type: `editorial-standards-page`** |
| `contributor-guidelines.html` | Guidelines text | LOW | **Single Type: `contributor-guidelines-page`** |
| `founders.html` | Founder profiles | MEDIUM | **Repeatable component** inside a single type |
| `contributors.html` | Contributor profiles | MEDIUM | Could use Strapi Users or dedicated collection |
| `enterprises.html` | Enterprise listings | MEDIUM | **Collection: `enterprise`** (new) |
| `research.html` | Research listings | MEDIUM | **Collection: `research-item`** (new) |
| `publications.html` | Publication listings | MEDIUM | **Collection: `publication`** (new) |
| `resources.html` | Resource links | LOW | **Single Type: `resources-page`** |
| `faq.html` | FAQ items | MEDIUM | **Single Type: `faq-page`** with repeatable `faqItem` component |
| `careers.html` | Job listings | MEDIUM | **Collection: `career`** (new) |
| `press.html` | Press releases | MEDIUM | **Collection: `press-release`** (new) |
| `donate.html` | Donation info | LOW | **Single Type: `donate-page`** |
| `contact.html` | Contact form + info | LOW | Form → `contact-message` collection; info in single type |
| `community.html` | Community info | LOW | **Single Type: `community-page`** |
| `pricing.html` | Pricing tiers | LOW | **Single Type: `pricing-page`** |

### C. Structural/Auth Pages (No CMS content needed)

| Page | Status | Notes |
|------|--------|-------|
| `login.html` | KEEP AS-IS | Auth page, no dynamic content |
| `signup.html` | KEEP AS-IS | Auth page |
| `forgot-password.html` | KEEP AS-IS | Auth page |
| `reset-password.html` | KEEP AS-IS | Auth page |
| `verify-email.html` | KEEP AS-IS | Auth page |
| `profile.html` | KEEP AS-IS | Fetches user data from Strapi Users API |
| `settings.html` | KEEP AS-IS | User settings |
| `403.html` | KEEP AS-IS | Error page |
| `404.html` | KEEP AS-IS | Error page |
| `500.html` | KEEP AS-IS | Error page |
| `accessibility.html` | KEEP AS-IS | Legal/policy page |
| `cookies.html` | KEEP AS-IS | Legal/policy page |
| `privacy-policy.html` | KEEP AS-IS | Legal/policy page |
| `terms-of-use.html` | KEEP AS-IS | Legal/policy page |
| `sitemap-page.html` | KEEP AS-IS | Auto-generated ideally |
| `help.html` | KEEP AS-IS | Static help page |

---

## 2. Mock Data Removal Report

### Files to DELETE after Strapi integration is verified

| File | Size | Purpose | Reason for Removal | Replacement |
|------|------|---------|---------------------|-------------|
| `js/mockApi.js` | 28.7KB (931 lines) | Fake API responses for auth, entries, comments, collections, notifications, contributions, user profile, contact, stats | Strapi provides all these endpoints natively | `js/strapi-api.js` (already created) + Strapi REST API |
| `js/data.js` | 9.9KB (199 lines) | Hardcoded 5 biographies, categories, regions, eras, featuredCollections arrays | This data must live in Strapi CMS | Strapi `biography`, `collection`, `tag` content types |

### Files to MODIFY (remove mock references)

| File | Change Required |
|------|-----------------|
| `js/api.js` | Remove entire `_mockRequest()` method; Remove MockAPI availability checks in `init()`; Remove `_useMockAPI` flag |
| `js/auth.js` | Remove MockAPI login/register fallbacks (lines 58-64, 149-155); Remove `typeof MockAPI !== 'undefined'` checks |
| `js/config.js` | Set `USE_MOCK_API: false` (or remove the flag entirely); Remove comment about mock API |

### HTML Pages removing `mockApi.js` and `data.js` script tags

The following 19 HTML files include `<script src="js/mockApi.js">` and/or `<script src="js/data.js">`:

| Pages loading `mockApi.js` | Pages loading `data.js` |
|---------------------------|------------------------|
| `index.html` | `index.html` |
| `browse.html` | `browse.html` |
| `biography.html` | `biography.html` |
| `biography-hypatia.html` | `biography-hypatia.html` |
| `biography-maria-sabina.html` | `biography-maria-sabina.html` |
| `admin.html` | `admin.html` |
| `collections/african-queens.html` | `collections/african-queens.html` |
| `collections/conflict-peace.html` | `collections/conflict-peace.html` |
| `collections/diaspora.html` | `collections/diaspora.html` |
| `collections/foremothers.html` | `collections/foremothers.html` |
| `collections/indigenous-matriarchs.html` | `collections/indigenous-matriarchs.html` |
| `collections/missionary-women.html` | `collections/missionary-women.html` |
| `signup.html` | `search.html` |
| `share-story.html` | — |
| `nominate.html` | — |
| `pricing.html` | — |
| `privacy-policy.html` | — |
| `terms-of-use.html` | — |

**Action**: Remove `<script src="js/mockApi.js"></script>` and `<script src="js/data.js"></script>` from ALL pages above. Ensure `<script src="js/strapi-api.js"></script>` is loaded instead.

### Other Static Artifacts to Remove

| File | Reason |
|------|--------|
| `audit-hash-links.js` | Development-only link auditing tool |
| `copy_placeholders.py` | Development script for placeholder images |
| `replace_unsplash.py` | Development script for replacing stock photos |
| `sync_layout.py` | Development layout sync script |
| `sync_layout_bs4.py` | Development layout sync script |
| `update_nav_config.py` | Development nav update script |
| `cms_setup.log` | Installation log file |
| `strapi_install.log` | Installation log file |
| `strapi_setup_log.txt` | Installation log file |
| `education-module-template.html` | Development template, not a real page |

---

## 3. Unused Page Deletion Report

### Pages to REMOVE (not needed in production)

| Page | Reason | Risk Level | Action |
|------|--------|------------|--------|
| `admin.html` | **Static mock admin dashboard** — Strapi Admin (`/admin`) replaces this entirely. Contains fake stats, mock data. Not a real admin panel. | LOW | DELETE — Strapi provides `/admin` at `http://localhost:1337/admin` |
| `analytics.html` | **Static mock analytics page** — shows hardcoded charts/data. Real analytics should be in Strapi or dedicated tool (Google Analytics, Plausible). | LOW | DELETE — Remove footer/nav links to it |
| `education-module-template.html` | **Development template** — not a user-facing page. Used as a copy-paste template for module pages. | NONE | DELETE |

### Pages to KEEP but RELOCATE in navigation

| Page | Current Location | Action |
|------|-----------------|--------|
| `profile.html` | Footer "Quick Links" row | KEEP — but only show link to authenticated users |
| `biography.html` | Footer "Quick Links" as "Sample Biography" | KEEP as template page — remove "Sample Biography" label from nav. This page dynamically loads biography by `?slug=` or `?id=` param |

### Footer Link Cleanup

**Current footer "Quick Links" row** (found in `index.html` line 1570-1580):
```html
<a href="profile.html">My Profile</a>
<a href="analytics.html">Analytics</a>        <!-- REMOVE -->
<a href="admin.html">Admin</a>                <!-- REMOVE -->
<a href="biography.html">Sample Biography</a> <!-- REMOVE label -->
```

**After cleanup**:
```html
<!-- Remove Quick Links row entirely from footer, or keep only Profile for authenticated users -->
```

### Navigation Link Cleanup

**Desktop nav "My Profile" dropdown** currently contains:
- My Profile → KEEP (auth-gated)
- Analytics → **REMOVE** (no real analytics page)
- Admin → KEEP (already hidden via `data-auth="admin-only"`, but link should point to Strapi admin URL)
- Sample Biography → **REMOVE** (development artifact)

**Mobile menu "My Profile" section**: Same changes.

---

## 4. Proposed Strapi Schema

### Already Created Content Types (in `womencypedia-cms/src/api/`)

All 9 schemas are already defined in the Strapi project:

| Content Type | Schema Location | Type | Key Fields |
|-------------|-----------------|------|------------|
| **Biography** | `api/biography/content-types/biography/schema.json` | Collection | `name`, `slug`, `region` (enum), `era` (enum), `category` (enum), `introduction` (richtext), `earlyLife`, `pathToInfluence`, `contributions`, `symbolicPower`, `culturalContext`, `legacy`, `image`, `gallery`, `tags` (relation), `sources` (json), `relatedWomen` (self-relation), `featured` |
| **Collection** | `api/collection/content-types/collection/schema.json` | Collection | `title`, `slug`, `description` (richtext), `coverImage`, `biographies` (relation), `featured` |
| **Tag** | `api/tag/content-types/tag/schema.json` | Collection | `name`, `slug`, `biographies` (inverse relation) |
| **Education Module** | `api/education-module/content-types/education-module/schema.json` | Collection | `title`, `slug`, `description`, `order`, `content` (richtext), `coverImage`, `lessons` (json), `quiz` (json), `relatedBiographies` (relation) |
| **Leader** | `api/leader/content-types/leader/schema.json` | Collection | `name`, `slug`, `organizationName`, `executiveSummary`, `institutionalOverview` (richtext), `country`, `continent` (enum), `sector` (enum), `organizationType` (enum), `foundingYear`, `leadershipStructure` (richtext), `impactMetrics` (json), `verified`, `verificationDate`, `logo`, `coverImage`, `website`, `socialLinks` (json), `featured` |
| **Partner** | `api/partner/content-types/partner/schema.json` | Collection | Partner organizations |
| **Fellowship** | `api/fellowship/content-types/fellowship/schema.json` | Collection | Fellowship programs |
| **Contribution** | `api/contribution/content-types/contribution/schema.json` | Collection | User-submitted articles/reports |
| **Verification Application** | `api/verification-application/content-types/verification-application/schema.json` | Collection | Leader verification requests |

### NEW Content Types to Create

| Content Type | Kind | Purpose | Key Fields |
|-------------|------|---------|------------|
| **Homepage** | Single Type | CMS-managed homepage content | `heroTitle` (string), `heroSubtitle` (text), `heroBadge` (string), `quoteText` (text), `featuredCollection` (relation → collection), `heroImage` (media), `whyStats` (repeatable component), `audienceCards` (repeatable component), `missionTitle`, `missionBody` (richtext), `credibilityPartners` (repeatable component: name + icon) |
| **Site Navigation** | Single Type | CMS-managed nav structure (optional Phase 2) | `mainNav` (json), `footerNav` (json) |

### Component Schemas to Create

```
components/
├── shared/
│   ├── stat-item.json       → { title, value, description, icon }
│   ├── audience-card.json   → { title, description, icon, colorScheme }
│   ├── cta-button.json      → { label, href, variant }
│   └── partner-badge.json   → { name, icon }
```

---

## 5. Step-by-Step Safe Refactor Plan

### Phase 1: Strapi Backend Preparation (Day 1-2)

#### Step 1.1: Start Strapi & Verify Schemas
```bash
cd womencypedia-cms
npm run develop
```
- Open `http://localhost:1337/admin`
- Verify all 9 content types appear in Content Manager
- Create the **Homepage** single type (new)

#### Step 1.2: Configure Public API Permissions
- Go to **Settings → Users & Permissions → Roles → Public**
- Enable `find` and `findOne` for: `biography`, `collection`, `education-module`, `tag`, `leader`, `partner`, `fellowship`, `contribution`
- Enable `find` for `homepage` single type
- **This is CRITICAL** — without this, the frontend cannot fetch data

#### Step 1.3: Seed Initial Content
- Import the 5 biographies from `data.js` into Strapi
- Import the 6 featured collections from `data.js`
- Create at least 1 education module, 1 leader, 1 partner for testing
- **Publish all entries** (Strapi draft mode hides unpublished content from API)

#### Step 1.4: Create the Homepage Single Type
```json
// New: src/api/homepage/content-types/homepage/schema.json
{
  "kind": "singleType",
  "collectionName": "homepages",
  "info": {
    "singularName": "homepage",
    "pluralName": "homepages",
    "displayName": "Homepage"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "heroTitle": { "type": "text", "required": true },
    "heroSubtitle": { "type": "text" },
    "heroBadge": { "type": "string" },
    "quoteText": { "type": "text" },
    "heroImage": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "featuredCollectionTitle": { "type": "string" },
    "whyTitle": { "type": "string" },
    "whyDescription": { "type": "text" },
    "missionTitle": { "type": "string" },
    "missionBody": { "type": "richtext" },
    "visionTitle": { "type": "string" },
    "visionBody": { "type": "richtext" }
  }
}
```

### Phase 2: Frontend — Remove Mock Data Layer (Day 2-3)

#### Step 2.1: Update `config.js`
```javascript
// CHANGE: Set USE_MOCK_API to false, confirm USE_STRAPI is true
USE_STRAPI: true,
USE_MOCK_API: false,  // Changed from undefined
```

#### Step 2.2: Clean `api.js`
- Remove the entire `_mockRequest()` method
- Remove `_useMockAPI` flag and all checks
- Keep `_strapiRequest()` as the primary request handler
- Keep `_genericRequest()` as fallback for unmapped endpoints

#### Step 2.3: Clean `auth.js`
- Remove MockAPI fallback in `login()` (lines 58-64)
- Remove MockAPI fallback in `register()` (lines 149-155)
- Keep Strapi-specific methods (`_strapiLogin`, `_strapiRegister`)

#### Step 2.4: Remove script tags from ALL HTML pages
- Remove: `<script src="js/mockApi.js"></script>`
- Remove: `<script src="js/data.js"></script>`
- Ensure: `<script src="js/strapi-api.js"></script>` is present
- Script load order should be: `config.js` → `ui.js` → `auth.js` → `strapi-api.js` → `api.js` → `navigation.js` → page-specific JS

### Phase 3: Dynamic Content Rendering (Day 3-5)

#### Step 3.1: `index.html` — Homepage Dynamic Sections

Create `js/homepage.js`:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await loadHomepageContent();
  await loadFeaturedBiographies();
});
```

Replace hardcoded hero, stats, audience, mission sections with dynamic rendering (see Section 6 for full before/after).

#### Step 3.2: `browse.html` — Biography Grid

Already partially dynamic via `js/browse.js`. Update to exclusively use Strapi:
- Remove fallback to `biographies` array from `data.js`
- Use `StrapiAPI.biographies.getAll()` with filter params from URL
- Implement loading skeletons

#### Step 3.3: `biography.html` — Single Biography

Already partially dynamic. Update to:
- Read `slug` or `id` from URL params
- Fetch from `StrapiAPI.biographies.get(slug)`
- Render richtext fields safely
- Handle 404 when biography not found

#### Step 3.4: `collections.html` — Collections List

Replace hardcoded collection cards with Strapi data.

#### Step 3.5: `collections/*.html` — Individual Collections (6 files)

**IMPORTANT**: These 6 static collection pages should be replaced by a SINGLE dynamic template page. Instead of:
- `collections/african-queens.html`
- `collections/conflict-peace.html`
- `collections/diaspora.html`
- `collections/foremothers.html`
- `collections/indigenous-matriarchs.html`
- `collections/missionary-women.html`

Create ONE file: `collection.html` that reads `?slug=african-queens` from URL and fetches from Strapi.

#### Step 3.6: `education-module-*.html` — Education Modules (7 files + template)

Same approach: Replace 7 static module pages with ONE dynamic `education-module.html?slug=module-1`.

#### Step 3.7: `browse-leaders.html`, `leader-profile.html`, `partners.html`, `fellowship.html`

Already designed for dynamic data. Wire up to Strapi API calls.

### Phase 4: Navigation & Footer Cleanup (Day 5)

#### Step 4.1: Remove dead links from all pages
- Remove `analytics.html` links from nav and footer
- Remove `admin.html` from footer (keep in nav with auth gate but point to Strapi admin)
- Remove "Sample Biography" from nav
- Update `sitemap.xml` to remove deleted pages

#### Step 4.2: Update nav "Admin" link
```html
<!-- Instead of pointing to static admin.html -->
<a data-auth="admin-only" href="/admin" target="_blank">Admin Dashboard</a>
```
This points to the Strapi admin panel directly.

### Phase 5: Delete Unused Files (Day 5-6)

Execute the deletion list from Section 2 and 3:
```bash
# Mock data files
rm js/mockApi.js
rm js/data.js

# Development scripts
rm audit-hash-links.js
rm copy_placeholders.py
rm replace_unsplash.py
rm sync_layout.py
rm sync_layout_bs4.py
rm update_nav_config.py

# Log files
rm cms_setup.log
rm strapi_install.log
rm strapi_setup_log.txt

# Unused pages
rm admin.html
rm analytics.html
rm education-module-template.html

# Static collection pages (replaced by dynamic collection.html)
rm collections/african-queens.html
rm collections/conflict-peace.html
rm collections/diaspora.html
rm collections/foremothers.html
rm collections/indigenous-matriarchs.html
rm collections/missionary-women.html

# Static education module pages (replaced by dynamic education-module.html)
rm education-module-1.html
rm education-module-2.html
rm education-module-3.html
rm education-module-4.html
rm education-module-5.html
rm education-module-6.html
rm education-module-7.html

# Static biography pages (replaced by dynamic biography.html?slug=X)
rm biography-hypatia.html
rm biography-maria-sabina.html
```

### Phase 6: Testing & Validation (Day 6-7)

- Run the validation checklist (Section 9)
- Test all pages manually
- Test CMS → Frontend reflection cycle
- Test with cache disabled

---

## 6. Before vs After Code Examples

### Example 1: Homepage Hero (index.html)

**BEFORE (hardcoded):**
```html
<!-- Hero Section — Static content in HTML -->
<h1 class="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl ...">
    The world's first <span class="italic text-primary/90">interpretive</span> encyclopedia of
    women — revealing the depth, power, cultural meaning behind every woman...
</h1>
<p class="text-base sm:text-lg md:text-xl text-text-main/80 ...">
    Restoring the stories history overlooked, with dignity, context, and global insight.
</p>
```

**AFTER (CMS-driven):**
```html
<!-- Hero Section — Dynamic content from Strapi -->
<h1 id="hero-title" class="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl ...">
    <!-- Populated by JS -->
</h1>
<p id="hero-subtitle" class="text-base sm:text-lg md:text-xl text-text-main/80 ...">
    <!-- Populated by JS -->
</p>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/homepage?populate=*`);
        const { data } = await response.json();

        // Safely set content — preserving all CSS classes
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');

        if (data) {
            heroTitle.innerHTML = data.heroTitle || heroTitle.innerHTML;
            heroSubtitle.textContent = data.heroSubtitle || heroSubtitle.textContent;
        }
    } catch (error) {
        console.warn('Homepage API unavailable, keeping static fallback');
        // Static content remains visible as fallback
    }
});
</script>
```

### Example 2: Browse Page — Biography Grid

**BEFORE (mock data):**
```javascript
// In browse.html — uses data.js biographies array
const entries = biographies.filter(b => {
    if (selectedRegion && b.region !== selectedRegion) return false;
    if (selectedCategory && b.category !== selectedCategory) return false;
    return true;
});

entries.forEach(entry => {
    grid.innerHTML += `
        <div class="bg-white rounded-xl border border-border-light ...">
            <h3>${entry.name}</h3>
            <p>${entry.introduction}</p>
        </div>
    `;
});
```

**AFTER (Strapi API):**
```javascript
// In browse.html — fetches live from Strapi
async function loadBiographies(page = 1) {
    const container = document.getElementById('biography-grid');

    // Show loading skeleton
    container.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>';

    try {
        const params = new URLSearchParams(window.location.search);
        const filters = {};
        if (params.get('region')) filters.region = params.get('region');
        if (params.get('category')) filters.category = params.get('category');
        if (params.get('era')) filters.era = params.get('era');

        const result = await StrapiAPI.biographies.getAll({
            page,
            pageSize: 12,
            filters,
            search: params.get('search') || ''
        });

        // Render biography cards — exact same HTML structure as before
        container.innerHTML = '';
        if (result.entries && result.entries.length > 0) {
            result.entries.forEach(entry => {
                const imageUrl = entry.image?.url
                    ? StrapiAPI.getMediaUrl(entry.image.url)
                    : 'images/placeholder.png';

                container.innerHTML += `
                    <div class="bg-white rounded-xl border border-border-light overflow-hidden hover:shadow-lg transition-shadow group">
                        <div class="h-48 overflow-hidden">
                            <img src="${imageUrl}" alt="${entry.name}"
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                        </div>
                        <div class="p-6">
                            <span class="text-xs font-bold uppercase tracking-wider text-primary">${entry.category || ''}</span>
                            <h3 class="font-serif text-lg font-bold text-text-main mt-2 mb-2">${entry.name}</h3>
                            <p class="text-sm text-text-secondary line-clamp-3">${entry.introduction || ''}</p>
                            <a href="biography.html?slug=${entry.slug}" class="inline-flex items-center gap-1 text-sm font-bold text-primary mt-4 hover:underline">
                                Read More <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-text-secondary">No biographies found matching your criteria.</p></div>';
        }

        // Update pagination
        updatePagination(result.page, result.total_pages);
    } catch (error) {
        console.error('Failed to load biographies:', error);
        container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">Failed to load content. Please try again.</p></div>';
    }
}
```

### Example 3: Single Biography Page

**BEFORE (reads from data.js array):**
```javascript
// biography.html uses biographies array from data.js
const id = new URLSearchParams(window.location.search).get('id');
const bio = biographies.find(b => b.id === parseInt(id));
document.getElementById('bio-name').textContent = bio.name;
document.getElementById('bio-intro').innerHTML = bio.introduction;
```

**AFTER (runtime Strapi fetch):**
```javascript
// biography.html — live Strapi fetch
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || params.get('id');

    if (!slug) {
        window.location.href = 'browse.html';
        return;
    }

    showLoadingSkeleton(); // Show skeleton while loading

    try {
        const biography = await StrapiAPI.biographies.get(slug);

        if (!biography) {
            window.location.href = '404.html';
            return;
        }

        // Populate page — exact same DOM structure
        document.title = `${biography.name} — Womencypedia`;
        document.getElementById('bio-name').textContent = biography.name;
        document.getElementById('bio-intro').innerHTML = DOMPurify.sanitize(biography.introduction);
        document.getElementById('bio-early-life').innerHTML = DOMPurify.sanitize(biography.earlyLife || '');
        document.getElementById('bio-contributions').innerHTML = DOMPurify.sanitize(biography.contributions || '');
        document.getElementById('bio-legacy').innerHTML = DOMPurify.sanitize(biography.legacy || '');
        // ... all other fields

        // Set image
        if (biography.image?.url) {
            document.getElementById('bio-image').src = StrapiAPI.getMediaUrl(biography.image.url);
        }

        hideLoadingSkeleton();
    } catch (error) {
        console.error('Failed to load biography:', error);
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-16">
                <span class="material-symbols-outlined text-6xl text-text-secondary mb-4">error</span>
                <h2 class="font-serif text-2xl text-text-main mb-2">Content Unavailable</h2>
                <p class="text-text-secondary mb-6">We couldn't load this biography. Please try again.</p>
                <a href="browse.html" class="px-6 py-3 bg-primary text-white rounded-lg font-bold">Browse All</a>
            </div>
        `;
    }
});
```

---

## 7. Runtime Data-Fetch Implementation

### Core Architecture

```
┌─────────────────────────────┐
│     HTML Pages (UI Shell)   │  ← CSS/layout intact, no content
│     + Loading Skeletons     │
└──────────┬──────────────────┘
           │  DOMContentLoaded
           ▼
┌─────────────────────────────┐
│     js/config.js            │  ← API_BASE_URL config
│     js/strapi-api.js        │  ← Strapi-specific fetch + transform
│     js/api.js               │  ← Centralized API router
└──────────┬──────────────────┘
           │  fetch() at RUNTIME
           ▼
┌─────────────────────────────┐
│     Strapi REST API         │  ← http://localhost:1337/api/...
│     (Live, no cache)        │
└─────────────────────────────┘
```

### API Utility Layer: `js/strapi-api.js` (Already Exists)

The existing `strapi-api.js` handles:
- ✅ Response transformation (flattening Strapi's nested format)
- ✅ Media URL resolution
- ✅ Locale-aware queries
- ✅ Pagination parameter building
- ✅ Filter building
- ✅ All content type methods (biographies, collections, education modules, leaders, partners, fellowships, contributions, verification applications)

### No-Cache Runtime Fetch Strategy

To ensure content updates reflect immediately:

```javascript
// In strapi-api.js request method — add cache-busting headers
async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}${queryString}`;

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',  // Prevent stale content
            'Pragma': 'no-cache',
            ...options.headers,
        },
        cache: 'no-store',  // Fetch API cache mode
    };

    const response = await fetch(url, config);
    // ... transform and return
}
```

### Page-Specific Data Fetch Pattern

Each page follows the same pattern:

```javascript
// Template for any CMS-driven page
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Show loading state
    showLoadingState();

    // 2. Fetch data from Strapi
    try {
        const data = await StrapiAPI.contentType.getAll();

        // 3. Render into existing DOM structure
        renderContent(data);

        // 4. Hide loading state
        hideLoadingState();
    } catch (error) {
        // 5. Show error state (never show stale/mock data)
        showErrorState(error);
    }
});

function showLoadingState() {
    const container = document.getElementById('content-area');
    container.innerHTML = `
        <div class="animate-pulse space-y-4">
            <div class="h-8 bg-border-light rounded w-3/4"></div>
            <div class="h-4 bg-border-light rounded w-full"></div>
            <div class="h-4 bg-border-light rounded w-5/6"></div>
        </div>
    `;
}

function showErrorState(error) {
    const container = document.getElementById('content-area');
    container.innerHTML = `
        <div class="text-center py-16">
            <span class="material-symbols-outlined text-5xl text-text-secondary/50">cloud_off</span>
            <h3 class="font-serif text-xl text-text-main mt-4">Content Temporarily Unavailable</h3>
            <p class="text-text-secondary mt-2">Please refresh the page or try again later.</p>
            <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold">
                Retry
            </button>
        </div>
    `;
}
```

---

## 8. Risk Analysis & Rollback Strategy

### Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Strapi server down** → blank pages | HIGH | MEDIUM | Add graceful error states (not blank). Show cached content via Service Worker for offline. Show "Content unavailable" message with retry button. |
| **API permissions not configured** → 403 errors | HIGH | HIGH | Step 1.2 explicitly configures public permissions. Add console warning if API returns 403. |
| **Slow API response** → poor UX | MEDIUM | LOW | Add loading skeletons matching original layout. Consider short TTL cache (5 min) with `stale-while-revalidate`. |
| **Richtext rendering XSS** | HIGH | LOW | Use DOMPurify for ALL `innerHTML` from API. Never use `innerHTML` for untrusted content without sanitization. |
| **Broken internal links** after page deletion | MEDIUM | MEDIUM | Update `sitemap.xml`. Add 301 redirects or catch in 404 page. Search for all references before deletion. |
| **Content not published in Strapi** → missing data | MEDIUM | HIGH | Default all new content to "Published" status. Document in CMS editor guide. |
| **CORS errors** in production | HIGH | MEDIUM | Configure Strapi CORS in `config/middlewares.js` to allow frontend domain. |
| **Image URLs broken** after migration | MEDIUM | MEDIUM | `StrapiAPI.getMediaUrl()` already handles relative → absolute URL conversion. |

### Rollback Strategy

#### Tier 1: Quick Rollback (< 5 minutes)
- Git revert to pre-migration commit
- `mockApi.js` and `data.js` are restored
- All pages work with mock data immediately

```bash
git stash              # Save current work
git checkout pre-migration-tag  # Restore previous version
```

#### Tier 2: Selective Rollback (per-page)
- Each page can independently fall back to static content
- The `config.js` flag `USE_MOCK_API: true` re-enables mock API globally
- Individual pages can check for API availability and fall back:

```javascript
try {
    const data = await StrapiAPI.biographies.getAll();
    renderDynamic(data);
} catch (error) {
    // Fallback: render static placeholder
    console.warn('CMS unavailable, showing static content');
    renderStaticFallback();
}
```

#### Tier 3: Complete Rollback (new deployment)
- Restore all deleted files from git history
- Revert `config.js` changes
- Redeploy static version

### Migration Safety Checklist Before Each Phase

- [ ] Git commit before starting phase
- [ ] Git tag created: `pre-phase-X`
- [ ] Strapi server running and accessible
- [ ] All content types have public `find` permission
- [ ] At least 1 published entry per content type
- [ ] Test page loads before and after changes

---

## 9. Validation Checklist

### ✅ No Remaining Mock Data

- [ ] `js/mockApi.js` file deleted
- [ ] `js/data.js` file deleted
- [ ] No `<script src="js/mockApi.js">` in any HTML page
- [ ] No `<script src="js/data.js">` in any HTML page
- [ ] `CONFIG.USE_MOCK_API` set to `false`
- [ ] No `typeof MockAPI` checks remain in `api.js`
- [ ] No `typeof MockAPI` checks remain in `auth.js`
- [ ] No hardcoded `biographies` array referenced anywhere
- [ ] No hardcoded `featuredCollections` array referenced anywhere
- [ ] No fake user data (admin@womencypedia.org, etc.) in any JS file

### ✅ No Static Content Remnants

- [ ] `index.html` hero content loaded from Strapi `/api/homepage`
- [ ] `browse.html` biography grid loaded from Strapi `/api/biographies`
- [ ] `featured.html` loaded from Strapi `/api/biographies?filters[featured]=true`
- [ ] `biography.html` single biography loaded from Strapi by slug
- [ ] `collections.html` collection list loaded from Strapi `/api/collections`
- [ ] Individual collections loaded dynamically (not from 6 static HTML files)
- [ ] Education modules loaded dynamically (not from 7 static HTML files)
- [ ] `browse-leaders.html` leaders loaded from Strapi `/api/leaders`
- [ ] `partners.html` partners loaded from Strapi `/api/partners`
- [ ] `fellowship.html` fellowships loaded from Strapi `/api/fellowships`
- [ ] `timelines.html` timeline data loaded from Strapi biographies

### ✅ All Dynamic Routes Work

- [ ] `biography.html?slug=queen-amina-of-zazzau` → loads correct biography
- [ ] `biography.html?slug=nonexistent` → redirects to 404
- [ ] `collection.html?slug=african-queens` → loads correct collection
- [ ] `education-module.html?slug=module-1` → loads correct module
- [ ] `leader-profile.html?slug=test-leader` → loads correct leader
- [ ] `browse.html?region=Africa` → filters work
- [ ] `browse.html?search=queen` → search works
- [ ] `browse.html?category=Leadership&era=Pre-colonial` → combined filters work

### ✅ CMS Updates Reflect Without Redeploy

- [ ] Create new biography in Strapi → appears on `browse.html` after refresh
- [ ] Edit biography title in Strapi → title updates on `biography.html` after refresh
- [ ] Publish new collection in Strapi → appears on `collections.html` after refresh
- [ ] Upload image to biography in Strapi → image appears on biography page after refresh
- [ ] Unpublish a biography → disappears from `browse.html` after refresh
- [ ] Change featured flag → appears/disappears from `featured.html` after refresh
- [ ] Add new education module → appears on `education.html` after refresh
- [ ] No build step required for any of the above
- [ ] No code deployment required for any of the above

### ✅ No Broken Navigation Links

- [ ] `analytics.html` link removed from all pages
- [ ] `admin.html` link removed from footer (nav link points to Strapi admin)
- [ ] "Sample Biography" link removed from nav
- [ ] All footer links resolve to existing pages
- [ ] All nav dropdown links resolve to existing pages
- [ ] Mobile menu links all work
- [ ] `sitemap.xml` updated (removed deleted pages, added dynamic page patterns)
- [ ] No `href` attributes point to deleted files
- [ ] 404 page properly catches unresolved routes

### ✅ Performance & UX

- [ ] Loading skeletons shown while API data loads
- [ ] Error states shown when API is unavailable (not blank pages)
- [ ] Empty states shown when no content matches filters
- [ ] `Cache-Control: no-cache` ensures fresh content
- [ ] Images use `loading="lazy"` attribute
- [ ] API calls use `AbortController` for timeouts
- [ ] No redundant API calls on same page
- [ ] `DOMPurify` used for all richtext/innerHTML rendering

### ✅ Strapi Configuration

- [ ] All content types have `find` public permission
- [ ] All content types have `findOne` public permission
- [ ] CORS configured to allow frontend origin
- [ ] At least 1 published entry per content type
- [ ] Draft/publish workflow enabled
- [ ] i18n enabled for localized content types
- [ ] Media library has correct upload settings
- [ ] Admin user created with strong password

---

## Summary

### Files to DELETE (24 files)

| Category | Files | Count |
|----------|-------|-------|
| Mock data | `js/mockApi.js`, `js/data.js` | 2 |
| Development scripts | `audit-hash-links.js`, `copy_placeholders.py`, `replace_unsplash.py`, `sync_layout.py`, `sync_layout_bs4.py`, `update_nav_config.py` | 6 |
| Log files | `cms_setup.log`, `strapi_install.log`, `strapi_setup_log.txt` | 3 |
| Unused pages | `admin.html`, `analytics.html`, `education-module-template.html` | 3 |
| Static collections (replaced by dynamic) | `collections/african-queens.html`, `collections/conflict-peace.html`, `collections/diaspora.html`, `collections/foremothers.html`, `collections/indigenous-matriarchs.html`, `collections/missionary-women.html` | 6 |
| Static bio pages (replaced by dynamic) | `biography-hypatia.html`, `biography-maria-sabina.html` | 2 |
| Static module pages (replaced by dynamic) | `education-module-1.html` through `education-module-7.html` | 7 |
| **TOTAL** | | **29** |

### Files to MODIFY (3 core + ~50 HTML pages)

| File | Changes |
|------|---------|
| `js/config.js` | `USE_MOCK_API: false` |
| `js/api.js` | Remove `_mockRequest()`, remove mock detection logic |
| `js/auth.js` | Remove MockAPI fallbacks |
| ~50 HTML pages | Remove `mockApi.js` / `data.js` script tags; add `strapi-api.js`; add dynamic loading scripts; remove dead nav links |

### Files to CREATE (3 new)

| File | Purpose |
|------|---------|
| `js/homepage.js` | Dynamic homepage content loading |
| `collection.html` | Dynamic single-collection template page |
| `education-module.html` | Dynamic single-module template page |
| `womencypedia-cms/src/api/homepage/content-types/homepage/schema.json` | Homepage single type schema |

### Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | Day 1-2 | Strapi setup, permissions, content seeding |
| Phase 2 | Day 2-3 | Remove mock data layer, update script tags |
| Phase 3 | Day 3-5 | Dynamic content rendering for all pages |
| Phase 4 | Day 5 | Navigation/footer cleanup |
| Phase 5 | Day 5-6 | Delete unused files |
| Phase 6 | Day 6-7 | Testing & validation |
| **Total** | **~7 days** | |

---

## 10. Migration Progress Tracker

> **Last Updated**: 2026-02-26

### Phase 1: Strapi Backend Preparation — ✅ COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| Start Strapi CMS | ✅ Done | Running via `npm run develop` |
| Verify all 9 content type schemas | ✅ Done | biography, collection, tag, education-module, leader, partner, fellowship, contribution, verification-application |
| Create Homepage single type schema | ✅ Done | `womencypedia-cms/src/api/homepage/` — schema, routes, controllers, services all created |
| Create Homepage routes/controllers/services | ✅ Done | Standard Strapi single-type boilerplate |

### Phase 2: Frontend — Remove Mock Data Layer — ✅ COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| `config.js` — set `USE_MOCK_API: false` | ✅ Done | Mock API disabled |
| `api.js` — remove `_mockRequest()`, mock detection | ✅ Done | Cleaned up, JSDoc updated |
| `auth.js` — remove MockAPI fallbacks in login/register | ✅ Done | Strapi-only auth |
| Remove `mockApi.js` script tag from ALL HTML pages (16 pages) | ✅ Done | Batch sed replacement across all files |
| Remove `data.js` script tag from ALL HTML pages | ✅ Done | Batch sed deletion across all files |
| Add `strapi-api.js` script tag to ALL HTML pages | ✅ Done | 22 pages now load strapi-api.js |
| `search.js` — replace MockAPI fallback with Strapi API | ✅ Done | Full Strapi search with filters |

### Phase 3: Dynamic Content Rendering — ✅ MOSTLY COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| Create `js/homepage.js` — dynamic homepage loader | ✅ Done | Loads hero, stats, audience, mission, vision, credibility from Strapi |
| Create `collection.html` — dynamic collection template | ✅ Done | Reads `?slug=` from URL, fetches from Strapi, graceful fallback |
| `index.html` — swap scripts to strapi-api.js + homepage.js | ✅ Done | mockApi.js & data.js removed |
| `browse.html` — swap scripts to strapi-api.js | ✅ Done | mockApi.js & data.js removed |
| `search.html` — replace MockAPI logic with Strapi API | ✅ Done | Inline search now queries Strapi biographies endpoint |
| `collections.html` — fix renderCollections() function | ✅ Done | Was rendering broken HTML (logo instead of cards). Now renders proper cards |
| `collections.html` — update all 13 Explore links to dynamic template | ✅ Done | All links now point to `collection.html?slug=...` |
| `education-module.html` — dynamic template | ⏳ Pending | Needs to be created (single page reads `?slug=` param) |
| `biography.html` — dynamic loading from Strapi | ⏳ Pending | Page exists but may need Strapi wiring |
| `browse-leaders.html` — wire to Strapi | ⏳ Pending | Already designed for dynamic data |
| `partners.html`, `fellowship.html` — wire to Strapi | ⏳ Pending | Already designed for dynamic data |

### Phase 4: Navigation & Footer Cleanup — ✅ MOSTLY COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| `index.html` — remove analytics/admin/sample bio from footer | ✅ Done | Quick Links row cleaned |
| `browse.html` — remove dead footer links | ✅ Done | Quick Links row cleaned |
| `search.html` — remove dead footer links | ✅ Done | Quick Links row cleaned |
| `collections.html` — remove dead footer links | ✅ Done | Quick Links row cleaned |
| Remaining pages — batch footer cleanup | ⏳ Pending | ~20 more pages need footer Quick Links cleanup |
| Update nav Admin link to point to Strapi /admin | ⏳ Pending | Nav dropdowns still link to admin.html |

### Phase 5: Delete Unused Files — ⏳ PENDING

| Task | Status | Notes |
|------|--------|-------|
| Delete `js/mockApi.js` | ⏳ Pending | Keep until all validation passes |
| Delete `js/data.js` | ⏳ Pending | Keep until all validation passes |
| Delete development scripts | ⏳ Pending | 6 Python/JS dev scripts |
| Delete log files | ⏳ Pending | 3 installation logs |
| Delete static collection pages (6 files) | ⏳ Pending | Replaced by `collection.html` |
| Delete static education module pages (7 files) | ⏳ Pending | Need `education-module.html` first |
| Delete static biography pages (2 files) | ⏳ Pending | `biography-hypatia.html`, `biography-maria-sabina.html` |

### Phase 6: Testing & Validation — ⏳ PENDING

| Task | Status |
|------|--------|
| All dynamic routes work | ⏳ Pending |
| CMS updates reflect without redeploy | ⏳ Pending |
| No broken navigation links | ⏳ Pending |
| Performance & UX validation | ⏳ Pending |

### Overall Progress: **~65% Complete**

```
Phase 1 ████████████████████ 100%  
Phase 2 ████████████████████ 100%  
Phase 3 ██████████████░░░░░░  70%  
Phase 4 ██████████░░░░░░░░░░  50%  
Phase 5 ░░░░░░░░░░░░░░░░░░░░   0%  
Phase 6 ░░░░░░░░░░░░░░░░░░░░   0%  
```

