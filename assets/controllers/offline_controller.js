import { Controller } from '@hotwired/stimulus';

/**
 * Controller pour gérer le téléchargement hors ligne des documents
 * Utilisé sur la page publique de consultation
 */
export default class extends Controller {
	static values = {
		regattaToken: String,
		documents: Array
	};

	connect() {
		console.log('📱 Offline controller connecté');

		// Vérifier si Service Worker est supporté
		if (!('serviceWorker' in navigator)) {
			console.warn('⚠️ Service Worker non supporté');
			return;
		}

		// Attendre que le Service Worker soit prêt
		this.waitForServiceWorker();

		// Écouter les messages du Service Worker
		this.listenToServiceWorker();
	}

	/**
	 * Attendre que le Service Worker soit prêt
	 */
	async waitForServiceWorker() {
		try {
			// Attendre que le SW soit ready
			const registration = await navigator.serviceWorker.ready;
			console.log('✅ Service Worker prêt:', registration.scope);
			this.swRegistration = registration;
			this.serviceWorkerReady = true;

			// Vérifier le statut du cache
			setTimeout(() => {
				this.checkCacheStatus();
			}, 500);
		} catch (error) {
			console.error('❌ Erreur attente Service Worker:', error);
		}
	}

	/**
	 * Vérifier si les documents sont déjà en cache
	 */
	async checkCacheStatus() {
		if (!navigator.serviceWorker.controller) {
			console.log('⏳ En attente du Service Worker...');
			return;
		}

		try {
			const messageChannel = new MessageChannel();

			messageChannel.port1.onmessage = (event) => {
				const { status } = event.data;

				if (status.cached) {
					this.showCachedStatus(status);
				} else {
					this.showDownloadPrompt();
				}
			};

			navigator.serviceWorker.controller.postMessage(
				{
					type: 'GET_CACHE_STATUS',
					regattaToken: this.regattaTokenValue
				},
				[ messageChannel.port2 ]
			);
		} catch (error) {
			console.error('❌ Erreur vérification cache:', error);
		}
	}

	/**
	 * Lancer le téléchargement de tous les documents
	 */
	async downloadForOffline() {
		if (!navigator.serviceWorker.controller) {
			this.showToast('Service Worker non prêt, veuillez rafraîchir la page', 'warning');
			return;
		}

		try {
			// Afficher la modal de progression
			this.showProgressModal();

			const messageChannel = new MessageChannel();

			messageChannel.port1.onmessage = (event) => {
				if (event.data.type === 'CACHE_COMPLETE') {
					if (event.data.success) {
						this.hideProgressModal();
						this.showToast('✅ Documents prêts pour consultation hors ligne !', 'success');
						this.showCachedStatus({
							cached: true,
							documentCount: this.documentsValue.length,
							cachedAt: new Date().toISOString()
						});
					} else {
						this.hideProgressModal();
						this.showToast('❌ Erreur lors du téléchargement', 'error');
					}
				}
			};

		// Préparer les données des documents pour le SW
		const documents = this.documentsValue.map(doc => ({
			id: doc.id,
			filePath: doc.filePath
		}));			console.log(`📥 Lancement du téléchargement de ${documents.length} documents...`);

			navigator.serviceWorker.controller.postMessage(
				{
					type: 'CACHE_DOCUMENTS',
					documents: documents,
					regattaToken: this.regattaTokenValue
				},
				[ messageChannel.port2 ]
			);
		} catch (error) {
			console.error('❌ Erreur téléchargement:', error);
			this.hideProgressModal();
			this.showToast('Erreur lors du téléchargement', 'error');
		}
	}

	/**
	 * Vider le cache (réinitialiser)
	 */
	async clearCache() {
		if (!confirm('Voulez-vous supprimer les documents téléchargés ?')) {
			return;
		}

		try {
			const messageChannel = new MessageChannel();

			messageChannel.port1.onmessage = (event) => {
				if (event.data.success) {
					this.showToast('Cache vidé', 'success');
					this.showDownloadPrompt();
				}
			};

			navigator.serviceWorker.controller.postMessage(
				{
					type: 'CLEAR_CACHE',
					regattaToken: this.regattaTokenValue
				},
				[ messageChannel.port2 ]
			);
		} catch (error) {
			console.error('❌ Erreur suppression cache:', error);
		}
	}

	/**
	 * Écouter les messages du Service Worker (progression)
	 */
	listenToServiceWorker() {
		navigator.serviceWorker.addEventListener('message', (event) => {
			if (event.data.type === 'CACHE_PROGRESS') {
				this.updateProgress(event.data.current, event.data.total);
			}
		});
	}

	/**
	 * Afficher le prompt de téléchargement
	 */
	showDownloadPrompt() {
		const banner = document.getElementById('offlineBanner');
		if (banner) {
			banner.classList.remove('hidden');
		}
	}

	/**
	 * Afficher le statut "déjà en cache"
	 */
	showCachedStatus(status) {
		const banner = document.getElementById('offlineBanner');
		const cachedStatus = document.getElementById('cachedStatus');

		if (banner) {
			banner.classList.add('hidden');
		}

		if (cachedStatus) {
			cachedStatus.classList.remove('hidden');
			const date = new Date(status.cachedAt);
			cachedStatus.querySelector('#cacheDate').textContent = date.toLocaleDateString('fr-FR', {
				day: 'numeric',
				month: 'long',
				hour: '2-digit',
				minute: '2-digit'
			});
		}
	}

	/**
	 * Afficher la modal de progression
	 */
	showProgressModal() {
		const modal = document.getElementById('downloadModal');
		if (modal) {
			modal.showModal();
		}
	}

	/**
	 * Masquer la modal de progression
	 */
	hideProgressModal() {
		const modal = document.getElementById('downloadModal');
		if (modal) {
			modal.close();
		}
	}

	/**
	 * Mettre à jour la barre de progression
	 */
	updateProgress(current, total) {
		const progress = document.getElementById('downloadProgress');
		const text = document.getElementById('downloadProgressText');

		if (progress && text) {
			const percent = Math.round((current / total) * 100);
			progress.value = percent;
			text.textContent = `${current} / ${total} documents`;
		}
	}

	/**
	 * Afficher un toast
	 */
	showToast(message, type = 'info') {
		const toastContainer = document.getElementById('toastContainer');
		if (!toastContainer) return;

		const alertClass = {
			'success': 'alert-success',
			'error': 'alert-error',
			'warning': 'alert-warning',
			'info': 'alert-info'
		}[ type ] || 'alert-info';

		const toast = document.createElement('div');
		toast.className = `alert ${alertClass} shadow-lg`;
		toast.innerHTML = `
			<span>${message}</span>
		`;

		toastContainer.appendChild(toast);

		setTimeout(() => {
			toast.remove();
		}, 4000);
	}
}
