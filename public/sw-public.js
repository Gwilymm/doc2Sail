const CACHE_VERSION = 'doc2sail-public-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DOCUMENTS_CACHE = `${CACHE_VERSION}-documents`;
const IMAGES_CACHE = `${CACHE_VERSION}-images`;

// Assets statiques à mettre en cache immédiatement
const STATIC_ASSETS = [
	'/build/app.css',
	'/build/app.js',
	'/build/runtime.js'
];

// ==========================================
// INSTALLATION
// ==========================================
self.addEventListener('install', (event) => {
	console.log('📦 [SW Public] Installation...');

	event.waitUntil(
		caches.open(STATIC_CACHE)
			.then(cache => {
				console.log('✅ [SW Public] Cache des assets statiques');
				return cache.addAll(STATIC_ASSETS);
			})
			.catch(err => console.warn('⚠️ [SW Public] Erreur cache statique:', err))
	);

	// Activer immédiatement
	self.skipWaiting();
});

// ==========================================
// ACTIVATION
// ==========================================
self.addEventListener('activate', (event) => {
	console.log('🚀 [SW Public] Activation');

	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					// Supprimer les anciens caches
					if (cacheName.startsWith('doc2sail-public-') &&
						!cacheName.startsWith(CACHE_VERSION)) {
						console.log('🗑️ [SW Public] Suppression ancien cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);

	// Prendre le contrôle immédiatement
	return self.clients.claim();
});

// ==========================================
// FETCH - Stratégie Cache First pour documents
// ==========================================
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Ignorer les requêtes non-GET
	if (request.method !== 'GET') {
		return;
	}

	// Documents uploadés : Cache First
	if (url.pathname.startsWith('/uploads/documents/')) {
		event.respondWith(
			caches.match(request).then(cachedResponse => {
				if (cachedResponse) {
					console.log('📦 [SW Public] Document depuis cache:', url.pathname);
					return cachedResponse;
				}

				return fetch(request).then(response => {
					// Mettre en cache pour consultation hors ligne
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(DOCUMENTS_CACHE).then(cache => {
							cache.put(request, responseToCache);
							console.log('💾 [SW Public] Document mis en cache:', url.pathname);
						});
					}
					return response;
				});
			})
		);
		return;
	}

	// Images : Cache First
	if (request.destination === 'image') {
		event.respondWith(
			caches.match(request).then(cachedResponse => {
				return cachedResponse || fetch(request).then(response => {
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(IMAGES_CACHE).then(cache => {
							cache.put(request, responseToCache);
						});
					}
					return response;
				});
			})
		);
		return;
	}

	// Assets CSS/JS : Cache First
	if (url.pathname.startsWith('/build/')) {
		event.respondWith(
			caches.match(request).then(cachedResponse => {
				return cachedResponse || fetch(request).then(response => {
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(STATIC_CACHE).then(cache => {
							cache.put(request, responseToCache);
						});
					}
					return response;
				});
			})
		);
		return;
	}

	// Page publique : Network First avec fallback cache
	if (url.pathname.startsWith('/r/')) {
		event.respondWith(
			fetch(request)
				.then(response => {
					// Mettre en cache la page
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(STATIC_CACHE).then(cache => {
							cache.put(request, responseToCache);
						});
					}
					return response;
				})
				.catch(() => {
					// Si pas de réseau, utiliser le cache
					return caches.match(request).then(cachedResponse => {
						if (cachedResponse) {
							console.log('📦 [SW Public] Page depuis cache (hors ligne)');
							return cachedResponse;
						}
						// Retourner une page d'erreur hors ligne
						return new Response(
							'<html><body><h1>Mode hors ligne</h1><p>Cette page n\'est pas disponible hors ligne.</p></body></html>',
							{ headers: { 'Content-Type': 'text/html' } }
						);
					});
				})
		);
		return;
	}

	// Toutes les autres requêtes : Network First
	event.respondWith(
		fetch(request).catch(() => caches.match(request))
	);
});

// ==========================================
// MESSAGE - Communication avec la page
// ==========================================
self.addEventListener('message', (event) => {
	console.log('📨 [SW Public] Message reçu:', event.data);

	if (event.data.type === 'CACHE_DOCUMENTS') {
		// Lancer le téléchargement de tous les documents
		const { documents, regattaToken } = event.data;
		cacheAllDocuments(documents, regattaToken)
			.then(() => {
				// Notifier la page que c'est terminé
				if (event.ports && event.ports[ 0 ]) {
					event.ports[ 0 ].postMessage({
						type: 'CACHE_COMPLETE',
						success: true
					});
				}
			})
			.catch(error => {
				console.error('❌ [SW Public] Erreur cache documents:', error);
				if (event.ports && event.ports[ 0 ]) {
					event.ports[ 0 ].postMessage({
						type: 'CACHE_COMPLETE',
						success: false,
						error: error.message
					});
				}
			});
	}

	if (event.data.type === 'GET_CACHE_STATUS') {
		// Retourner le statut du cache
		getCacheStatus(event.data.regattaToken)
			.then(status => {
				if (event.ports && event.ports[ 0 ]) {
					event.ports[ 0 ].postMessage({
						type: 'CACHE_STATUS',
						status
					});
				}
			});
	}

	if (event.data.type === 'CLEAR_CACHE') {
		// Vider le cache pour cette régate
		clearRegattaCache(event.data.regattaToken)
			.then(() => {
				if (event.ports && event.ports[ 0 ]) {
					event.ports[ 0 ].postMessage({
						type: 'CACHE_CLEARED',
						success: true
					});
				}
			});
	}
});

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Télécharger et mettre en cache tous les documents
 */
async function cacheAllDocuments(documents, regattaToken) {
	console.log(`📥 [SW Public] Téléchargement de ${documents.length} documents...`);

	const cache = await caches.open(DOCUMENTS_CACHE);
	const urlsToCache = [];

	// Préparer les URLs des documents
	documents.forEach(doc => {
		if (doc.filePath) {
			urlsToCache.push(doc.filePath);
		}
		if (doc.viewUrl) {
			urlsToCache.push(doc.viewUrl);
		}
		if (doc.downloadUrl) {
			urlsToCache.push(doc.downloadUrl);
		}
	});

	// Télécharger tous les documents en parallèle (par batch de 5)
	const batchSize = 5;
	for (let i = 0; i < urlsToCache.length; i += batchSize) {
		const batch = urlsToCache.slice(i, i + batchSize);
		await Promise.all(
			batch.map(url =>
				fetch(url)
					.then(response => {
						if (response && response.status === 200) {
							return cache.put(url, response);
						}
					})
					.catch(err => {
						console.warn(`⚠️ [SW Public] Erreur téléchargement ${url}:`, err);
					})
			)
		);

		// Notifier la progression
		const progress = Math.min(i + batchSize, urlsToCache.length);
		self.clients.matchAll().then(clients => {
			clients.forEach(client => {
				client.postMessage({
					type: 'CACHE_PROGRESS',
					current: progress,
					total: urlsToCache.length
				});
			});
		});
	}

	// Sauvegarder les métadonnées dans le cache
	const metadata = {
		regattaToken,
		documents,
		cachedAt: new Date().toISOString(),
		version: CACHE_VERSION
	};

	await cache.put(
		`/cache-metadata-${regattaToken}`,
		new Response(JSON.stringify(metadata), {
			headers: { 'Content-Type': 'application/json' }
		})
	);

	console.log('✅ [SW Public] Tous les documents sont en cache');
}

/**
 * Obtenir le statut du cache
 */
async function getCacheStatus(regattaToken) {
	try {
		const cache = await caches.open(DOCUMENTS_CACHE);
		const metadataResponse = await cache.match(`/cache-metadata-${regattaToken}`);

		if (metadataResponse) {
			const metadata = await metadataResponse.json();
			return {
				cached: true,
				documentCount: metadata.documents.length,
				cachedAt: metadata.cachedAt,
				version: metadata.version
			};
		}

		return { cached: false };
	} catch (error) {
		console.error('❌ [SW Public] Erreur statut cache:', error);
		return { cached: false, error: error.message };
	}
}

/**
 * Vider le cache pour une régate
 */
async function clearRegattaCache(regattaToken) {
	const cache = await caches.open(DOCUMENTS_CACHE);
	const keys = await cache.keys();

	// Supprimer les entrées liées à cette régate
	await Promise.all(
		keys.map(request => {
			const url = request.url;
			if (url.includes(regattaToken) || url.includes(`metadata-${regattaToken}`)) {
				return cache.delete(request);
			}
		})
	);

	console.log(`🗑️ [SW Public] Cache vidé pour régate ${regattaToken}`);
}

// ==========================================
// NOTIFICATIONS PUSH
// ==========================================

/**
 * Gestion de l'événement push
 */
self.addEventListener('push', (event) => {
	console.log('📨 [SW Public] Push notification received');

	let data = {
		title: 'Nouveau document',
		body: 'Un nouveau document est disponible',
		icon: '/icon-192.png',
		badge: '/icon-72.png',
		data: {}
	};

	if (event.data) {
		try {
			data = event.data.json();
			console.log('📨 [SW Public] Push data:', data);
		} catch (e) {
			console.warn('⚠️ [SW Public] Failed to parse push data:', e);
		}
	}

	const notificationOptions = {
		body: data.body,
		icon: data.icon || '/icon-192.png',
		badge: data.badge || '/icon-72.png',
		vibrate: [ 200, 100, 200 ],
		data: data.data || {},
		tag: 'new-document',
		renotify: true,
		requireInteraction: false,
		actions: [
			{
				action: 'open',
				title: 'Voir',
			},
			{
				action: 'close',
				title: 'Fermer',
			}
		]
	};

	event.waitUntil(
		self.registration.showNotification(data.title, notificationOptions)
	);
});

/**
 * Gestion du clic sur la notification
 */
self.addEventListener('notificationclick', (event) => {
	console.log('🔔 [SW Public] Notification clicked:', event.action);

	event.notification.close();

	if (event.action === 'close') {
		return;
	}

	// Ouvrir ou focus la fenêtre de l'app
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true })
			.then(clientList => {
				// Si une fenêtre est déjà ouverte, la focus
				for (const client of clientList) {
					if (client.url.includes('/r/') && 'focus' in client) {
						return client.focus();
					}
				}
				// Sinon ouvrir une nouvelle fenêtre
				if (clients.openWindow) {
					const url = event.notification.data?.url || '/';
					return clients.openWindow(url);
				}
			})
	);
});

/**
 * Gestion de la fermeture de la notification
 */
self.addEventListener('notificationclose', (event) => {
	console.log('🚫 [SW Public] Notification closed');
});
