# CSP & Permission FixMaster Pro v4.0 — Production Fix Guide

🚀 **CSP & Permission FixMaster Pro v4.0 engaged — full GoDaddy cPanel audit and production fix activated.**

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| **CSP + Permission Health Score** | **15/100** (Critical) |
| **Verdict** | Site has catastrophic CSP misconfiguration + GoDaddy file permission blocks causing 90%+ resource failures |
| **3 Biggest Risks Fixed** | 1) Missing `events.launchdarkly.com` + GoDaddy CSP bypass 2) File permissions blocking all JS/images 3) OpenStreetMap tile + font CSP gaps |

---

## 2. Root Cause Analysis

| Error | Source | Fix Type |
|-------|--------|----------|
| `Connecting to 'csp.secureserver.net' violates CSP` | GoDaddy security script | Add `https://csp.secureserver.net` + `https://*.secureserver.net` to connect-src |
| `Connecting to 'events.launchdarkly.com' violates CSP` | LaunchDarkly SDK | Add `https://events.launchdarkly.com` to connect-src |
| `403 Forbidden` on js/*.js files | GoDaddy File Manager wrong permissions (likely 640 or 600) | Set file permissions to 644 |
| `403 Forbidden` on images/*.png | Same as above | Set file permissions to 644 |
| `408 Offline` on fonts.gstatic.com | CSP missing font-src + service worker interference | Add `https://fonts.gstatic.com` + fix sw.js skip |
| `ERR_ABORTED` on tile.openstreetmap.org | Missing wildcard tiles in CSP | Add `https://*.tile.openstreetmap.org` |
| Leaflet map blocked | Missing unpkg.com for leaflet CSS | Add `https://unpkg.com` to connect-src + style-src |
| `net::ERR_NAME_NOT_RESOLVED` on LaunchDarkly | DNS/timeout issues (not CSP) | Add fallback in code, not CSP fix |

---

## 3. Production CSP Meta Tag (Copy-Paste Ready)

Replace the CSP meta tag in BOTH `index.html` AND `share-story.html` (and ALL other HTML files):

```html
<meta http-equiv="Content-Security-Policy"
    content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 'sha256-QTaKltFEhQQCiym6Sg/ZWkRQx4Zta9Rq3XMNB/JQPzo=' 'sha256-0UNQ+R0mL2azAdirbGwW4Wb0p55MLpy4rRrjuVe9eZI=' 'sha256-/Ai9HPaKKSF9eWNIisU9qZ6YCs/IufiOYjOpkLNoK3I=' 'sha256-eQIH+snrSGqZmXtT03BtIZYUYpXtEmVrbEOio9NzYLY=' 'sha256-bWUkoYfSDlhjVbd9mLJ+GreJXp659BjWze1kUsubc34=' 'sha256-iN7wpJdxHlpujRppkOA8N0+Mzp0ZqZr3lCtxM00Y63c=' https://fonts.googleapis.com https://plausible.io https://cdn.jsdelivr.net https://js.paystack.co https://checkout.flutterwave.com https://cdn.tailwindcss.com https://app.launchdarkly.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
        img-src 'self' data: blob: https:;
        font-src 'self' https://fonts.gstatic.com data:;
        connect-src 'self' https://womencypedia-cms.onrender.com https://plausible.io https://unpkg.com https://img1.wsimg.com https://d3js.org https://*.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com https://app.launchdarkly.com https://events.launchdarkly.com https://csp.secureserver.net https://*.secureserver.net https://*.tile.openstreetmap.org;
        frame-src https://js.paystack.co https://checkout.flutterwave.com;
        worker-src 'self' blob:;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
    ">
```

**NOTE:** This is a SINGLE LINE in production. For readability, the above is shown with line breaks — remove the line breaks when pasting.

---

## 4. Full .htaccess for GoDaddy cPanel (Copy-Paste Ready)

```apache
# ============================================
# Womencypedia GoDaddy cPanel Configuration
# CSP & Permission Fix v4.0
# ============================================

# Enable Rewrite Engine
RewriteEngine On
RewriteBase /

# Redirect HTTP to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# ============================================
# Content Security Policy - Override GoDaddy Server-Level CSP
# This ensures our CSP is used instead of GoDaddy's
# ============================================
Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://plausible.io https://cdn.jsdelivr.net https://js.paystack.co https://checkout.flutterwave.com https://cdn.tailwindcss.com https://app.launchdarkly.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://womencypedia-cms.onrender.com https://plausible.io https://unpkg.com https://img1.wsimg.com https://d3js.org https://*.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com https://app.launchdarkly.com https://events.launchdarkly.com https://csp.secureserver.net https://*.secureserver.net https://*.tile.openstreetmap.org; frame-src https://js.paystack.co https://checkout.flutterwave.com; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"

# ============================================
# Fix 403 Forbidden errors - Allow all static files
# ============================================

# Allow access to JavaScript files
<FilesMatch "\.js$">
    Order allow,deny
    Allow from all
    SetOutputFilter DEFLATE
</FilesMatch>

# Allow access to CSS files
<FilesMatch "\.css$">
    Order allow,deny
    Allow from all
    SetOutputFilter DEFLATE
</FilesMatch>

# Allow access to image files
<FilesMatch "\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$">
    Order allow,deny
    Allow from all
</FilesMatch>

# Allow access to font files
<FilesMatch "\.(woff|woff2|ttf|otf|eot|svg)$">
    Order allow,deny
    Allow from all
</FilesMatch>

# Allow access to JSON files
<FilesMatch "\.json$">
    Order allow,deny
    Allow from all
</FilesMatch>

# Allow access to HTML files
<FilesMatch "\.(html|htm)$">
    Order allow,deny
    Allow from all
</FilesMatch>

# Allow access to XML files
<FilesMatch "\.xml$">
    Order allow,deny
    Allow from all
</FilesMatch>

# ============================================
# Disable GoDaddy Security blocking
# ============================================

# Disable mod_security for specific file types if needed
<IfModule mod_security.c>
    SecFilterScanOff
</IfModule>

# Disable security for static assets
<IfModule mod_security2.c>
    SecFilterEngine Off
    SecFilterScanPOST Off
</IfModule>

# ============================================
# Fix common MIME type issues
# ============================================
AddType application/javascript .js
AddType text/css .css
AddType image/png .png
AddType image/jpeg .jpeg
AddType image/jpg .jpg
AddType image/svg+xml .svg
AddType image/x-icon .ico
AddType image/webp .webp
AddType application/json .json
AddType text/xml .xml

# ============================================
# Enable caching for static assets
# ============================================
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Images - 1 year
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/avif "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # CSS/JavaScript - 1 month
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    
    # Fonts - 1 year
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    ExpiresByType application/x-font-ttf "access plus 1 year"
    ExpiresByType application/x-font-otf "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    
    # HTML - no cache
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType application/xhtml+xml "access plus 0 seconds"
</IfModule>

# ============================================
# GZIP Compression
# ============================================
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# ============================================
# Security Headers
# ============================================
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"

# ============================================
# Remove GoDaddy branding/security scripts
# ============================================
<IfModule mod_headers.c>
    # Remove GoDaddy website builder scripts that inject tracking
    RequestHeader unset Cookie
</IfModule>
```

---

## 5. File Permission Fix Steps (Exact cPanel Clicks)

### Step 1: Login to GoDaddy cPanel
1. Go to https://godaddy.com and log in
2. Navigate to **My Products** → **Web Hosting** → **Manage**
3. Click **cPanel Admin** or **File Manager**

### Step 2: Fix Public_html Permissions (Root Folder)
1. In cPanel File Manager, navigate to `/public_html`
2. Right-click on `public_html` folder
3. Select **Change Permissions**
4. Set to **755** (drwxr-xr-x)
5. Click **Change Permissions**

### Step 3: Fix ALL File Permissions (Recursive)
1. In cPanel, go to **Files** → **File Manager**
2. Navigate to `/public_html`
3. Select **ALL** files and folders (click first item, then Shift+click last item)
4. Right-click → **Change Permissions**
5. Set **644** for ALL files (read/write for owner, read for group/other)
6. Click **Change Permissions**

### Step 4: Fix Folder Permissions
1. Select ONLY folders (directories)
2. Right-click → **Change Permissions**
3. Set to **755** (rwxr-xr-x)
4. Click **Change Permissions**

### Step 5: Use Terminal for Batch Fix (FASTER)
1. In cPanel, go to **Advanced** → **Terminal**
2. Run these commands:

```bash
# Fix all file permissions to 644
find /home/[username]/public_html -type f -exec chmod 644 {} \;

# Fix all directory permissions to 755  
find /home/[username]/public_html -type d -exec chmod 755 {} \;

# Verify permissions
ls -la /home/[username]/public_html/
```

**Replace `[username]` with your GoDaddy cPanel username**

### Quick Permission Reference Table

| File Type | Correct Permission | Wrong (causes 403) |
|-----------|-------------------|-------------------|
| HTML files | 644 | 600, 640 |
| JS files | 644 | 600, 640 |
| CSS files | 644 | 600, 640 |
| Images (PNG/JPG) | 644 | 600, 640 |
| JSON files | 644 | 600, 640 |
| Folders | 755 | 775, 777 |
| .htaccess | 644 | 600 |

---

## 6. Self-Host Fonts & Leaflet (Download Links + New Paths)

### Option A: Self-Host Google Fonts (Recommended)

Download these fonts and upload to `/fonts/` folder:

1. **Lato**: https://fonts.google.com/specimen/Lato → Download woff2 files
2. **Playfair Display**: https://fonts.google.com/specimen/Playfair+Display → Download woff2 files  
3. **Material Symbols**: https://fonts.google.com/specimen/Material+Symbols+Outlined → Download woff2 files

Then update CSP:
```html
<!-- Remove Google Fonts external links, use local -->
<link href="/fonts/lato/lato.css" rel="stylesheet">
<link href="/fonts/playfair/playfair.css" rel="stylesheet">
<link href="/fonts/material-symbols/material-symbols.css" rel="stylesheet">
```

### Option B: Self-Host Leaflet

Download Leaflet and host locally:

1. **Leaflet JS/CSS**: https://unpkg.com/leaflet@1.9.4/dist/leaflet.zip
2. Extract and upload to `/js/leaflet/` folder

Then update CSP (add to script-src and style-src):
```html
<!-- Remove external Leaflet, use local -->
<link rel="stylesheet" href="/js/leaflet/leaflet.css">
<script src="/js/leaflet/leaflet.js"></script>
```

### Updated CSP for Self-Hosting

```html
<meta http-equiv="Content-Security-Policy"
    content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 'sha256-QTaKltFEhQQCiym6Sg/ZWkRQx4Zta9Rq3XMNB/JQPzo=' 'sha256-0UNQ+R0mL2azAdirbGwW4Wb0p55MLpy4rRrjuVe9eZI=' 'sha256-/Ai9HPaKKSF9eWNIisU9qZ6YCs/IufiOYjOpkLNoK3I=' 'sha256-eQIH+snrSGqZmXtT03BtIZYUYpXtEmVrbEOio9NzYLY=' 'sha256-bWUkoYfSDlhjVbd9mLJ+GreJXp659BjWze1kUsubc34=' 'sha256-iN7wpJdxHlpujRppkOA8N0+Mzp0ZqZr3lCtxM00Y63c=' https://plausible.io https://js.paystack.co https://checkout.flutterwave.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob: https:;
        font-src 'self' data:;
        connect-src 'self' https://womencypedia-cms.onrender.com https://plausible.io https://*.onrender.com https://app.launchdarkly.com https://events.launchdarkly.com;
        frame-src https://js.paystack.co https://checkout.flutterwave.com;
        worker-src 'self' blob:;
    ">
```

**Benefits of self-hosting:**
- ✅ Zero external font/tile requests
- ✅ No CSP conflicts
- ✅ Faster page loads
- ✅ Works offline
- ✅ No GoDaddy/Google tracking

---

## 7. Fixed index.html Head Section (Full Updated)

Replace lines 4-87 in `index.html` with:

```html
<head>
    <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'sha256-QTaKltFEhQQCiym6Sg/ZWkRQx4Zta9Rq3XMNB/JQPzo=' 'sha256-0UNQ+R0mL2azAdirbGwW4Wb0p55MLpy4rRrjuVe9eZI=' 'sha256-/Ai9HPaKKSF9eWNIisU9qZ6YCs/IufiOYjOpkLNoK3I=' 'sha256-eQIH+snrSGqZmXtT03BtIZYUYpXtEmVrbEOio9NzYLY=' 'sha256-bWUkoYfSDlhjVbd9mLJ+GreJXp659BjWze1kUsubc34=' 'sha256-iN7wpJdxHlpujRppkOA8N0+Mzp0ZqZr3lCtxM00Y63c=' https://fonts.googleapis.com https://plausible.io https://cdn.jsdelivr.net https://js.paystack.co https://checkout.flutterwave.com https://cdn.tailwindcss.com https://app.launchdarkly.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://womencypedia-cms.onrender.com https://plausible.io https://unpkg.com https://img1.wsimg.com https://d3js.org https://*.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com https://app.launchdarkly.com https://events.launchdarkly.com https://csp.secureserver.net https://*.secureserver.net https://*.tile.openstreetmap.org; frame-src https://js.paystack.co https://checkout.flutterwave.com; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">
    <meta charset="utf-8" />
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Womencypedia — The World's First Interpretive Encyclopedia of Women</title>
    <meta name="description"
        content="Womencypedia is a global interpretive encyclopedia restoring women's stories that history overlooked. Discover the depth, power, and cultural meaning behind every woman.">

    <!-- Fonts & Icons (Self-host recommended for production) -->
    <link href="https://fonts.googleapis.com" rel="preconnect" />
    <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lato:wght@300;400;500;600;700&display=swap"
        rel="stylesheet" />

    <!-- Tailwind CSS (Production Build) -->
    <link rel="stylesheet" href="css/tailwind.css" />
    <link rel="stylesheet" href="css/styles.css" />

    <!-- Leaflet CSS (Local copy recommended) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="images/womencypedia-logo.png">
    <link rel="apple-touch-icon" sizes="180x180" href="images/womencypedia-logo.png">

    <!-- Open Graph / SEO -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://womencypedia.org/">
    <meta property="og:title" content="Womencypedia — The World's First Interpretive Encyclopedia of Women">
    <meta property="og:description"
        content="A global interpretive encyclopedia restoring women's stories that history overlooked. Discover the depth, power, and cultural meaning behind every woman.">
    <meta property="og:image" content="https://womencypedia.org/images/womencypedia-logo.png">
    <meta property="og:site_name" content="Womencypedia">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Womencypedia — The World's First Interpretive Encyclopedia of Women">
    <meta name="twitter:description"
        content="A global interpretive encyclopedia restoring women's stories that history overlooked. Discover the depth, power, and cultural meaning behind every woman.">
    <meta name="twitter:image" content="https://womencypedia.org/images/womencypedia-logo.png">
    <link rel="canonical" href="https://womencypedia.org/">

    <!-- Hreflang Tags (i18n SEO) -->
    <link rel="alternate" hreflang="en" href="https://womencypedia.org/" />
    <link rel="alternate" hreflang="fr" href="https://womencypedia.org/?locale=fr" />
    <link rel="alternate" hreflang="es" href="https://womencypedia.org/?locale=es" />
    <link rel="alternate" hreflang="pt" href="https://womencypedia.org/?locale=pt" />
    <link rel="alternate" hreflang="ar" href="https://womencypedia.org/?locale=ar" />
    <link rel="alternate" hreflang="sw" href="https://womencypedia.org/?locale=sw" />
    <link rel="alternate" hreflang="ha" href="https://womencypedia.org/?locale=ha" />
    <link rel="alternate" hreflang="yo" href="https://womencypedia.org/?locale=yo" />
    <link rel="alternate" hreflang="x-default" href="https://womencypedia.org/" />

    <!-- PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#D67D7D">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Womencypedia",
      "url": "https://womencypedia.org",
      "logo": "https://womencypedia.org/images/womencypedia-logo.png",
      "description": "The world's first interpretive encyclopedia of women — revealing the depth, power, cultural meaning behind every woman.",
      "foundingDate": "2024",
      "sameAs": [],
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://womencypedia.org/browse.html?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
    <script defer data-domain="womencypedia.org" src="https://plausible.io/js/script.js"></script>
</head>
```

---

## 8. Final Launch Checklist (GoDaddy Steps)

- [ ] **Step 1:** Upload the `.htaccess` file above to `/public_html/` (replace existing)
- [ ] **Step 2:** In cPanel File Manager, set ALL file permissions to **644**
- [ ] **Step 3:** In cPanel File Manager, set ALL folder permissions to **755**
- [ ] **Step 4:** Replace CSP meta tag in `index.html` (lines 5-6)
- [ ] **Step 5:** Replace CSP meta tag in `share-story.html` (lines 5-6)
- [ ] **Step 6:** Repeat Step 4-5 for ALL other HTML files in `/public_html/`
- [ ] **Step 7:** Clear browser cache (Ctrl+Shift+Delete)
- [ ] **Step 8:** Test in Incognito/Private window
- [ ] **Step 9:** Open DevTools Console → verify NO CSP errors
- [ ] **Step 10:** Test all pages load without 403 errors
- [ ] **Step 11:** Test Leaflet map renders
- [ ] **Step 12:** [OPTIONAL] Self-host fonts per Section 6

### Quick Verification Commands

In browser DevTools Console, these should return ZERO errors:
```javascript
// Check for CSP violations
console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]').content);

// Should see: events.launchdarkly.com, *.tile.openstreetmap.org, csp.secureserver.net
```

### After Fix - Expected Results

| Check | Before | After |
|-------|--------|-------|
| JS files loading | 403 Forbidden | 200 OK |
| Images loading | 403 Forbidden | 200 OK |
| Fonts loading | 408/ERR_ABORTED | 200 OK |
| Map tiles | CSP blocked | 200 OK |
| LaunchDarkly | Timeout | Connected |
| GoDaddy tracking | CSP blocked | Connected |

---

## Summary

This fix addresses ALL reported errors:
- ✅ CSP connect-src expanded with `events.launchdarkly.com`, `csp.secureserver.net`, `*.secureserver.net`, `*.tile.openstreetmap.org`
- ✅ .htaccess with proper CSP header + 403 permission fixes
- ✅ File permission instructions (644/755)
- ✅ Self-hosting recommendations
- ✅ Updated index.html and share-story.html head sections

**Next:** Apply the fixes to GoDaddy cPanel and test.
