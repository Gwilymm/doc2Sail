import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
	static values = {
		regattaToken: String
	};

	connect() {
		console.log('Push subscription controller connected');
		this.checkSubscriptionStatus();
	}

	async checkSubscriptionStatus() {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			console.warn('Push notifications not supported');
			this.element.style.display = 'none';
			return;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();

			if (subscription) {
				this.updateUI(true);
			} else {
				this.updateUI(false);
			}
		} catch (error) {
			console.error('Failed to check subscription status:', error);
		}
	}

	async subscribe() {
		console.log('Subscribing to push notifications...');

		try {
			// Demander la permission
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				alert('Permission de notification refusée');
				return;
			}

			// Récupérer la clé publique VAPID
			const response = await fetch('/api/push/public-key');
			const { publicKey } = await response.json();

			// S'abonner aux notifications push
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: this.urlBase64ToUint8Array(publicKey)
			});

			// Envoyer l'abonnement au serveur
			const subscribeResponse = await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...subscription.toJSON(),
					regattaToken: this.regattaTokenValue
				})
			});

			if (subscribeResponse.ok) {
				console.log('Push subscription successful');
				this.updateUI(true);
				this.showToast('Notifications activées !', 'success');
			} else {
				throw new Error('Failed to subscribe on server');
			}
		} catch (error) {
			console.error('Failed to subscribe:', error);
			this.showToast('Erreur lors de l\'activation des notifications', 'error');
		}
	}

	async unsubscribe() {
		console.log('Unsubscribing from push notifications...');

		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();

			if (subscription) {
				// Se désabonner
				await subscription.unsubscribe();

				// Informer le serveur
				await fetch('/api/push/unsubscribe', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						endpoint: subscription.endpoint
					})
				});

				console.log('Push unsubscription successful');
				this.updateUI(false);
				this.showToast('Notifications désactivées', 'info');
			}
		} catch (error) {
			console.error('Failed to unsubscribe:', error);
			this.showToast('Erreur lors de la désactivation', 'error');
		}
	}

	updateUI(isSubscribed) {
		const button = this.element.querySelector('button');
		if (!button) return;

		if (isSubscribed) {
			button.textContent = '🔕 Désactiver les notifications';
			button.classList.remove('btn-primary');
			button.classList.add('btn-outline');
			button.onclick = () => this.unsubscribe();
		} else {
			button.textContent = '🔔 Activer les notifications';
			button.classList.remove('btn-outline');
			button.classList.add('btn-primary');
			button.onclick = () => this.subscribe();
		}
	}

	showToast(message, type = 'info') {
		const toast = document.createElement('div');
		toast.className = `alert alert-${type} shadow-lg`;
		toast.innerHTML = `
            <div>
                <span>${message}</span>
            </div>
        `;

		const container = document.getElementById('toastContainer');
		if (container) {
			container.appendChild(toast);
			setTimeout(() => toast.remove(), 3000);
		}
	}

	urlBase64ToUint8Array(base64String) {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)
			.replace(/\-/g, '+')
			.replace(/_/g, '/');

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[ i ] = rawData.charCodeAt(i);
		}
		return outputArray;
	}
}
