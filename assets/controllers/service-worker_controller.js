import { Controller } from '@hotwired/stimulus';

/**
 * Gère l'enregistrement et la mise à jour du Service Worker public.
 * Ce contrôleur s'assure que les anciens Service Workers avec des scopes incorrects sont
 * supprimés avant d'enregistrer le nouveau, garantissant une portée de cache propre.
 */
export default class extends Controller {
  connect() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        this.unregisterOldServiceWorkers().then(() => {
          this.registerNewServiceWorker();
        });
      });
    } else {
      console.warn('⚠️ Service Worker is not supported in this browser.');
    }
  }

  /**
   * Finds and unregisters any previous Service Workers that may have been
   * registered with an incorrect scope (e.g., '/', '/public/').
   * @returns {Promise<void>}
   */
  async unregisterOldServiceWorkers() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Unregister SW with a scope of '/' but not '/r/' which is the correct one.
        if (registration.scope.endsWith('/') && !registration.scope.endsWith('/r/')) {
          console.log('🗑️ Unregistering old Service Worker with scope:', registration.scope);
          await registration.unregister();
        }
      }
    } catch (error) {
      console.error('❌ Error while unregistering old Service Workers:', error);
    }
  }

  /**
   * Registers the new public Service Worker with the correct scope ('/r/')
   * and triggers an update check.
   */
  async registerNewServiceWorker() {
    try {
      // Register the new SW with the correct scope
      const registration = await navigator.serviceWorker.register('/sw-public.js', { scope: '/r/' });
      console.log('✅ Public Service Worker registered successfully with scope:', registration.scope);

      // Check the state of the Service Worker
      console.log('📍 SW State:', registration.active ? 'active' : 'pending');

      // Force an update check for the Service Worker
      registration.update();

    } catch (error) {
      console.error('❌ Error registering public Service Worker:', error);
    }
  }
}
