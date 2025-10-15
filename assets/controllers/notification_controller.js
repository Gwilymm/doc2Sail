import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [ 'banner', 'message' ];
    static values = {
        topic: String,
        mercureUrl: String
    };

    connect() {
        console.log('Notification controller connected');
        console.log('Mercure URL:', this.mercureUrlValue);
        console.log('Topic:', this.topicValue);

        this.setupMercureConnection();
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            console.log('Mercure connection closed');
        }
    }

    setupMercureConnection() {
        try {
            const url = new URL(this.mercureUrlValue);
            url.searchParams.append('topic', this.topicValue);

            console.log('Connecting to:', url.toString());

            this.eventSource = new EventSource(url.toString());

            this.eventSource.onopen = () => {
                console.log('Mercure connection established');
            };

            this.eventSource.onmessage = (event) => {
                console.log('Mercure message received:', event.data);
                this.handleNotification(event.data);
            };

            this.eventSource.onerror = (error) => {
                console.error('Mercure connection error:', error);
            };
        } catch (error) {
            console.error('Failed to setup Mercure connection:', error);
        }
    }

    handleNotification(data) {
        console.log('Processing notification:', data);

        let messageData = data;
        if (typeof data === 'string') {
            try {
                messageData = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse notification data:', e);
                return;
            }
        }

        if (messageData.type === 'new_document') {
            const documentName = messageData.document?.name || 'Document';
            const category = messageData.document?.category || '';

            if (this.hasMessageTarget) {
                this.messageTarget.textContent = '"' + documentName + '" dans la catégorie ' + category;
            }

            this.showBanner();
            this.showBrowserNotification(documentName, category);
            this.playNotificationSound();
        }
    }

    showBanner() {
        console.log('showBanner called');
        console.log('hasBannerTarget:', this.hasBannerTarget);
        if (this.hasBannerTarget) {
            console.log('Banner element:', this.bannerTarget);
            this.bannerTarget.classList.remove('hidden');
            console.log('Banner displayed');
        } else {
            console.error('Banner target not found!');
        }
    }

    closeBanner() {
        if (this.hasBannerTarget) {
            this.bannerTarget.classList.add('hidden');
            console.log('Banner closed');
        }
    }

    async showBrowserNotification(documentName, category) {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return;
            }
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification('Nouveau document disponible', {
                body: '"' + documentName + '" dans ' + category,
                icon: '/icon-192.png',
                tag: 'new-document',
                renotify: true,
                vibrate: [ 200, 100, 200 ],
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                window.location.reload();
            };

            console.log('Browser notification displayed');
        }
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            console.log('Notification sound played');
        } catch (e) {
            console.warn('Could not play notification sound:', e);
        }
    }
}
