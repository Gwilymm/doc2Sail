import { Controller } from '@hotwired/stimulus';

/**
 * Controller for the public regatta page.
 *
 * Responsibilities moved from inline JS in the Twig template:
 * - Register the public service worker (`/sw-public.js`) with scope `/r/`
 * - Unregister old service workers that have an incorrect scope
 *
 * Exposed values (via `data-*-value` on the controller element):
 * - `swPathValue` (String) - path to the service worker file (default: `/sw-public.js`)
 * - `swScopeValue` (String) - registration scope (default: `/r/`)
 *
 * Notes:
 * - The install prompt behavior and category filtering are handled by existing
 *   `document_controller` and `document` Stimulus controller, so this controller
 *   only deals with service worker registration to avoid duplicating listeners.
 */

export default class extends Controller {
	static values = {
		swPath: { type: String, default: '/sw-public.js' },
		swScope: { type: String, default: '/r/' }
	};

	connect() {
		this.registerServiceWorker();
	}

	/**
	 * Register the public service worker and unregister older ones with wrong scope.
	 */
	async registerServiceWorker() {
		if (!('serviceWorker' in navigator)) {
			console.warn('⚠️ Service Worker non supporté');
			return;
		}

		// Wait for the page load to avoid racing with other registrations
		window.addEventListener('load', async () => {
			try {
				const registrations = await navigator.serviceWorker.getRegistrations();

				// Unregister registrations that are installed at root or other bad scopes
				registrations.forEach((reg) => {
					try {
						if (reg.scope.endsWith('/') && !reg.scope.endsWith(this.swScopeValue)) {
							console.log('🗑️ Suppression ancien SW:', reg.scope);
							reg.unregister().catch((e) => console.warn('Erreur désinscrire SW:', e));
						}
					} catch (e) {
						console.warn('Erreur lors du check des registrations:', e);
					}
				});

				// Register the new public service worker with the desired scope
				const registration = await navigator.serviceWorker.register(this.swPathValue, { scope: this.swScopeValue });

				console.log('✅ Service Worker Public enregistré:', registration.scope);
				console.log('📍 SW State:', registration.active ? 'actif' : 'en attente');

				// Try to update immediately
				if (typeof registration.update === 'function') {
					registration.update();
				}
			} catch (error) {
				console.error('❌ Erreur enregistrement SW Public:', error);
			}
		});
	}
}
