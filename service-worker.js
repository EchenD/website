/**
 * Portfolio Website Service Worker
 * Version: 1.1.0
 */

const CACHE_NAME = 'portfolio-cache-v1';
const UNITY_CACHE_NAME = 'unity-cache-v1';
const IMAGE_CACHE_NAME = 'image-cache-v1';

// Assets that should be cached immediately on install
const PRECACHE_ASSETS = [
    './index.html',
    './css/style.css',
    './js/main.js',
    './assets/images/placeholder.jpg'
];

// File patterns to cache when requested
const CACHEABLE_PATTERNS = [
    /\.js$/,
    /\.css$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.png$/,
    /\.svg$/,
    /\.webp$/,
    /\.gif$/,
    /\.ico$/,
    /\.json$/
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
    console.log('Service Worker installed');
});

self.addEventListener('activate', event => {
    // Clean up old caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith('portfolio-') &&
                        cacheName !== CACHE_NAME &&
                        cacheName !== UNITY_CACHE_NAME &&
                        cacheName !== IMAGE_CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => clients.claim())
    );
    console.log('Service Worker activated');
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Don't cache cross-origin requests
    if (url.origin !== self.location.origin) {
        event.respondWith(fetch(request));
        return;
    }

    // Handle image requests with a dedicated strategy
    if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(url.pathname)) {
        event.respondWith(handleImageRequest(request));
        return;
    }

    // Handle other cacheable assets
    if (CACHEABLE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then(response => {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(request, responseToCache);
                                });

                            return response;
                        })
                        .catch(error => {
                            console.error('Fetch failed:', error);
                            // Return a fallback for JS/CSS if needed
                            return caches.match('./index.html');
                        });
                })
        );
        return;
    }

    // Default fetch handling for everything else
    event.respondWith(
        fetch(request)
            .catch(() => {
                return caches.match(request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return index.html for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Resource not available offline');
                    });
            })
    );
});

// Special handling for image requests with fallback
async function handleImageRequest(request) {
    // Try from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // If not in cache, try to fetch
    try {
        const response = await fetch(request);

        // Cache successful responses
        if (response && response.status === 200) {
            const responseToCache = response.clone();
            const cache = await caches.open(IMAGE_CACHE_NAME);
            cache.put(request, responseToCache);
            return response;
        }

        // If response has an error status, throw to trigger fallback
        throw new Error(`Image fetch failed with status: ${response.status}`);
    } catch (error) {
        console.warn(`Failed to fetch image: ${request.url}`, error);
        // Return placeholder image
        return caches.match('./assets/images/placeholder.jpg')
            .then(placeholderResponse => {
                if (placeholderResponse) {
                    return placeholderResponse;
                }
                // If placeholder not in cache, create a fallback response
                return new Response(
                    'Image not available',
                    {
                        status: 200,
                        headers: new Headers({
                            'Content-Type': 'text/plain',
                            'X-Fallback': 'true'
                        })
                    }
                );
            });
    }
} 
