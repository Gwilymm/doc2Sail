import { Controller } from '@hotwired/stimulus';

export default class extends Controller {

	async delete(event) {
		event.preventDefault();
		const btn = event.currentTarget;
		const id = btn.dataset.regattaId;
		const name = btn.dataset.regattaName || '';
		if (!id) return;

		if (!confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) return;

		try {
			const locale = document.documentElement.lang || 'fr';
			const response = await fetch(`/${locale}/regatta/${id}/delete`, { method: 'POST' });
			const data = await response.json();
			if (response.ok && data.success) {
				this._showToast(data.message || 'Régate supprimée', 'success');
				setTimeout(() => location.reload(), 1000);
			} else {
				this._showToast(data.error || 'Erreur lors de la suppression', 'error');
			}
		} catch (err) {
			console.error('Deletion failed', err);
			this._showToast('Erreur de connexion', 'error');
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

	async submitCreateRegatta(event) {
		event.preventDefault();
		const form = event.currentTarget || document.getElementById('createRegattaForm');
		if (!form) {
			console.error('Create regatta form not found');
			return;
		}
		const formData = new FormData(form);
		const payload = {
			name: formData.get('name'),
			startDate: formData.get('startDate'),
			endDate: formData.get('endDate'),
			description: formData.get('description')
		};

		try {
			const locale = document.documentElement.lang || 'fr';
			const response = await fetch(`/${locale}/regatta/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const result = await response.json();
			if (response.ok && result.success) {
				this._showToast(result.message || 'Régate créée', 'success');
				const dialog = document.getElementById('createRegattaModal');
				if (dialog && typeof dialog.close === 'function') dialog.close();
				form.reset();
				setTimeout(() => location.reload(), 1000);
			} else {
				this._showToast(result.error || 'Erreur lors de la création', 'error');
			}
		} catch (err) {
			console.error(err);
			this._showToast('Erreur de connexion', 'error');
		}
	}
}
