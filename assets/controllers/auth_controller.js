import { Controller } from '@hotwired/stimulus';

export default class extends Controller {

	copyToken(event) {
		event.preventDefault();
		const targetId = event.currentTarget?.dataset?.targetId;
		if (!targetId) {
			console.warn('No targetId provided to auth#copyToken');
			return;
		}

		const el = document.getElementById(targetId);
		if (!el) {
			console.warn('Target element not found for id', targetId);
			return;
		}

		const text = el.value || el.textContent || el.innerText || '';
		if (!text) {
			console.warn('No text to copy for element', targetId);
			return;
		}

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(() => {
				this._showToast('Token copié dans le presse-papier', 'success');
			}).catch(err => {
				console.error('Copy failed', err);
				this._showToast('Impossible de copier', 'error');
			});
		} else {
			// Fallback
			const textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			try {
				document.execCommand('copy');
				this._showToast('Token copié dans le presse-papier', 'success');
			} catch (e) {
				console.error('Clipboard fallback failed', e);
				this._showToast('Impossible de copier', 'error');
			}
			document.body.removeChild(textarea);
		}
	}

	_showToast(message, type = 'info') {
		const container = document.getElementById('toast-container') || document.getElementById('toastContainer');
		if (!container) {
			alert(message);
			return;
		}
		const toast = document.createElement('div');
		toast.className = `alert alert-${type} shadow-lg`;
		toast.innerHTML = `<span>${message}</span>`;
		container.appendChild(toast);
		setTimeout(() => toast.remove(), 3000);
	}
}
