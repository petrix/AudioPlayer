'use strict';

const version = 'v1.23';
const staticCachePrefix = 'NRG-player';
const staticCacheName = staticCachePrefix + version;




self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            // cache all the static assets required for offline use.
            return cache.addAll([
                './',
                'index.html',
                'bundle.js',
                'manifest.json',

                'impulse/feedback-spring.wav',
                'impulse/filter-telephone.wav',
                'impulse/kitchen-true-stereo.wav',
                'impulse/living-bedroomleveled.wav',
                'impulse/s2_r4_bd.wav',
                'impulse/spreader50-65.wav',
                'impulse/wildecho-old.wav',
                'impulse/wildecho.wav',
                'impulse/zing-long-stereo.wav',
                'impulse/zoot.wav',

                'favicon.ico',
                'favicons/android-icon-192x192.png',
                'favicons/web_hi_res_512.png',

                'css/jura-font/Jura-Bold.eot',
                'css/jura-font/Jura-Bold.svg',
                'css/jura-font/Jura-Bold.ttf',
                'css/jura-font/Jura-Bold.woff',
                'css/jura-font/Jura-Bold.woff2',

                'css/jura-font/Jura-Light.eot',
                'css/jura-font/Jura-Light.svg',
                'css/jura-font/Jura-Light.ttf',
                'css/jura-font/Jura-Light.woff',
                'css/jura-font/Jura-Light.woff2',

                'css/jura-font/Jura-Medium.eot',
                'css/jura-font/Jura-Medium.svg',
                'css/jura-font/Jura-Medium.ttf',
                'css/jura-font/Jura-Medium.woff',
                'css/jura-font/Jura-Medium.woff2',

                'css/jura-font/Jura-Regular.eot',
                'css/jura-font/Jura-Regular.svg',
                'css/jura-font/Jura-Regular.ttf',
                'css/jura-font/Jura-Regular.woff',
                'css/jura-font/Jura-Regular.woff2',

                'css/jura-font/Jura-SemiBold.eot',
                'css/jura-font/Jura-SemiBold.svg',
                'css/jura-font/Jura-SemiBold.ttf',
                'css/jura-font/Jura-SemiBold.woff',
                'css/jura-font/Jura-SemiBold.woff2',

                'css/jura-font/stylesheet.css'



            ]);
        }).then(() => {
            // activate the new service worker immediately, without waiting for next load.
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            // remove any old caches once the new service worker is activated.
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName.startsWith(staticCachePrefix) && cacheName !== staticCacheName;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // tell service worker to take control of any open pages.
            self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {

    let request = event.request;
    let url = new URL(request.url);

    // only deal with requests on the same domain.
    if (url.origin !== location.origin) {
        return;
    }

    // for non-GET requests, go to the network.
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // for everything else look to the cahce first,
    // then fall back to the network.
    event.respondWith(
        caches.match(request).then(response => {
            return response || fetch(request);
        })
    );
});
