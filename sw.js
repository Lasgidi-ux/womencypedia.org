/**
 * Womencypedia Service Worker v5.0
 * Provides offline caching and PWA support
 * FIXED: Redirect response handling for Cloudflare Pages
 * FIXED: Image 408 offline errors
 */

const CACHE_NAME = 'womencypedia-v5.1';
const OFFLINE_URL = '/404.html';

const PRECACHE_ASSETS = [
    '/index.html',
    '/css/tailwind.css',
    '/css/styles.css',
    '/js/config.js',
    '/js/ui.js',
    '/js/auth.js',
    '/js/api.js',
    '/js/strapi-api.js',
    '/js/main.js',
    '/js/homepage.js',
    '/js/i18n.js',
    '/js/navigation.js',
    '/js/darkmode.js',
    '/js/performance.js',
    '/images/womencypedia-logo.png',
    '/manifest.json',
    '/404.html'
];

// Critical assets that MUST cache for the app to function offline
const CRITICAL_ASSETS = new Set(['/index.html', '/css/tailwind.css', '/css/styles.css']);

// Install event - cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.allSettled(
                    PRECACHE_ASSETS.map(url =>
                        cache.add(new Request(url, { redirect: 'follow' })).catch(err => {
                            if (CRITICAL_ASSETS.has(url)) {
                                throw err;
                            }
                            console.warn(`[SW] Non-critical asset skipped: ${url}`);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const requestUrl = event.request.url;

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip non-http(s) schemes (chrome-extension, etc.)
    if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) return;

    // Skip API requests
    if (requestUrl.includes('/api/') || requestUrl.includes('womencypedia-api')) return;

    // Skip analytics, tracking, and third-party SDK requests
    if (requestUrl.includes('plausible.io') || requestUrl.includes('launchdarkly') || requestUrl.includes('analytics')) return;

    // Skip Cloudflare internal paths
    if (requestUrl.includes('/cdn-cgi/')) return;

    // Skip GoDaddy security requests
    if (requestUrl.includes('secureserver.net') || requestUrl.includes('csp.')) return;

    // Skip ALL external resources — let the browser handle them natively
    const isExternalResource =
        requestUrl.includes('fonts.gstatic.com') ||
        requestUrl.includes('fonts.googleapis.com') ||
        requestUrl.includes('tile.openstreetmap.org') ||
        requestUrl.includes('unpkg.com') ||
        requestUrl.includes('cdn.jsdelivr.net') ||
        requestUrl.includes('cdn.tailwindcss.com') ||
        requestUrl.includes('js.paystack.co') ||
        requestUrl.includes('checkout.flutterwave.com') ||
        /\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)/i.test(requestUrl);

    if (isExternalResource) return;

    // Only handle same-origin requests
    const requestOrigin = new URL(requestUrl).origin;
    if (requestOrigin !== self.location.origin) return;

    // CRITICAL FIX: For navigation requests (page loads), let the browser handle
    // them directly. This prevents the "redirected response" error that occurs
    // when the server sends a redirect (e.g. / → /index.html) and the SW
    // tries to use that redirected response for a non-follow redirect mode request.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Offline: try to serve cached version of the page
                return caches.match(event.request)
                    .then(cached => cached || caches.match(OFFLINE_URL))
                    .then(fallback => fallback || new Response(
                        '<!DOCTYPE html><html lang="en"><head><title>Offline</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:2rem;"><h1>You are currently offline</h1><p>Please check your internet connection and try again.</p></body></html>',
                        { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/html' } }
                    ));
            })
        );
        return;
    }

    // For sub-resources (JS, CSS, images): cache-first strategy with redirect safety
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version and update in background
                    event.waitUntil(
                        fetch(event.request, { redirect: 'follow' })
                            .then(response => {
                                if (response && response.ok && !response.redirected) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(event.request, response.clone()))
                                        .catch(() => {});
                                } else if (response && response.ok && response.redirected) {
                                    // Create a clean, non-redirected response for caching
                                    const cleanResponse = new Response(response.body, {
                                        status: response.status,
                                        statusText: response.statusText,
                                        headers: response.headers
                                    });
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(event.request, cleanResponse))
                                        .catch(() => {});
                                }
                            })
                            .catch(() => {})
                    );
                    return cachedResponse;
                }

                // Not in cache — fetch from network
                return fetch(event.request, { redirect: 'follow' })
                    .then(response => {
                        if (!response || !response.ok) return response;

                        // If the response was redirected, create a clean copy
                        // to avoid the "redirected response" error
                        let responseToCache = response;
                        if (response.redirected) {
                            responseToCache = new Response(response.body, {
                                status: response.status,
                                statusText: response.statusText,
                                headers: response.headers
                            });
                        }

                        const responseClone = responseToCache.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone))
                            .catch(() => {});

                        return responseToCache;
                    })
                    .catch(() => {
                        // Offline: return empty response (silently fail for sub-resources)
                        return new Response('', { status: 503, statusText: 'Offline' });
                    });
            })
    );
});

