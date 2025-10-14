const CACHE_NAME = 'doc2sail-v1';
const urlsToCache = [
	'/',
	'/admin',
	'/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
	console.log('🔧 Service Worker: Installation');
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				console.log('✅ Cache opened');
				return cache.addAll(urlsToCache);
			})
			.catch(err => console.warn('⚠️ Cache error:', err))
	);
	// Force le nouveau SW à prendre le contrôle immédiatement
	self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
	console.log('🚀 Service Worker: Activation');
	const cacheWhitelist = [ CACHE_NAME ];
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						console.log('🗑️ Suppression ancien cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	// Prendre le contrôle de toutes les pages immédiatement
	return self.clients.claim();
});

// Stratégie: Network First, puis Cache, puis offline page
self.addEventListener('fetch', (event) => {
	// Ignorer les requêtes non-GET
	if (event.request.method !== 'GET') {
		return;
	}

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Si la requête réussit, mettre en cache
				if (response && response.status === 200) {
					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});
				}
				return response;
			})
			.catch(() => {
				// Si le réseau échoue, utiliser le cache
				return caches.match(event.request).then((cachedResponse) => {
					if (cachedResponse) {
						console.log('📦 Depuis cache:', event.request.url);
						return cachedResponse;
					}
					// Si navigation, retourner la page d'accueil en cache
					if (event.request.mode === 'navigate') {
						return caches.match('/');
					}
				});
			})
	);
});

