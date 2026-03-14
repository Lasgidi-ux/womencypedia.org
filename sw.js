/**
 * Womencypedia Service Worker
 * Provides offline caching and PWA support
 */

const CACHE_NAME = 'womencypedia-v3';
const OFFLINE_URL = '404.html';

const PRECACHE_ASSETS = [
    '/',
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
    '/manifest.json'
];

// Critical assets that MUST cache for the app to function offline
const CRITICAL_ASSETS = new Set(['/', '/index.html', '/css/tailwind.css', '/css/styles.css']);

// Install event - cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Pass raw promises — let allSettled observe successes and failures
                return Promise.allSettled(
                    PRECACHE_ASSETS.map(url => cache.add(url))
                ).then(results => {
                    let criticalFailed = false;
                    results.forEach((result, i) => {
                        if (result.status === 'rejected') {
                            const url = PRECACHE_ASSETS[i];
                            if (CRITICAL_ASSETS.has(url)) {
                                console.error(`[SW] Critical asset failed to cache: ${url}`, result.reason);
                                criticalFailed = true;
                            } else {
                                console.warn(`[SW] Non-critical asset skipped: ${url}`);
                            }
                        }
                    });
                    if (criticalFailed) {
                        throw new Error('One or more critical assets failed to cache');
                    }
                });
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

    // Skip chrome-extension, browser-extension, and non-http(s) schemes
    if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) return;

    // Skip API requests
    if (requestUrl.includes('/api/') || requestUrl.includes('womencypedia-api')) return;

    // Skip analytics, tracking, and third-party SDK requests
    if (requestUrl.includes('plausible.io') || requestUrl.includes('launchdarkly') || requestUrl.includes('analytics')) return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version but also update cache in background
                    event.waitUntil(
                        fetch(event.request)
                            .then(response => {
                                if (response && response.ok && response.type !== 'opaque') {
                                    const responseClone = response.clone();
                                    caches.open(CACHE_NAME)
                                        .then(cache => {
                                            // Only cache same-origin or CORS-approved responses
                                            if (response.type === 'basic' || response.type === 'cors') {
                                                cache.put(event.request, responseClone);
                                            }
                                        })
                                        .catch(() => { /* ignore cache errors */ });
                                }
                            })
                            .catch(() => { /* ignore network errors for background update */ })
                    );
                    return cachedResponse;
                }

                // Not in cache - fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Only cache valid, same-origin responses
                        if (response && response.ok && response.type === 'basic') {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone))
                                .catch(() => { /* ignore cache errors */ });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        // Return an empty response for other failed requests
                        return new Response('', {
                            status: 408,
                            statusText: 'Offline'
                        });
                    });
            })
    );
});
