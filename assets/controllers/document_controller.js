import { Controller } from '@hotwired/stimulus';

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
	static values = {
		regattaId: Number,
		defaultCategory: String
	};

	connect() {
		console.log('Document controller connected');
		if (this.hasRegattaIdValue) {
			console.log('Regatta ID:', this.regattaIdValue);
		}

		this.selectedFile = null;
		this.setupDropZone();
		this.setupSearch();
		this.setupDeleteButtons();
		this.setupInstallButton();
		this.applyDefaultCategory();
		this.toggleCategorySections();
	}

	setupDropZone() {
		const dropZone = document.getElementById('dropZone');
		const fileInput = document.getElementById('fileInput');

		if (!dropZone || !fileInput) {
			console.log('Drop zone not found - probably on consultation page');
			return;
		}

		dropZone.addEventListener('click', () => fileInput.click());

		dropZone.addEventListener('dragover', (event) => {
			event.preventDefault();
			dropZone.classList.add('border-primary', 'bg-primary/5');
		});

		dropZone.addEventListener('dragleave', () => {
			dropZone.classList.remove('border-primary', 'bg-primary/5');
		});

		dropZone.addEventListener('drop', (event) => {
			event.preventDefault();
			dropZone.classList.remove('border-primary', 'bg-primary/5');

			const files = event.dataTransfer.files;
			if (files.length > 0) {
				this.handleFileSelect(files[ 0 ]);
			}
		});

		fileInput.addEventListener('change', (event) => {
			if (event.target.files.length > 0) {
				this.handleFileSelect(event.target.files[ 0 ]);
			}
		});

		const uploadBtn = document.getElementById('uploadBtn');
		const cancelBtn = document.getElementById('cancelBtn');

		if (uploadBtn) {
			uploadBtn.addEventListener('click', () => this.uploadFile());
		}

		if (cancelBtn) {
			cancelBtn.addEventListener('click', () => this.cancelUpload());
		}
	}

	handleFileSelect(file) {
		this.selectedFile = file;

		const uploadForm = document.getElementById('uploadForm');
		if (uploadForm) {
			uploadForm.classList.remove('hidden');
		}

		const nameInput = document.getElementById('documentName');
		if (nameInput && !nameInput.value) {
			nameInput.value = file.name;
		}

		this.showToast(`Fichier sélectionné: ${file.name}`, 'info');
	}

	async uploadFile() {
		if (!this.selectedFile) {
			this.showToast('Aucun fichier sélectionné', 'error');
			return;
		}

		const nameInput = document.getElementById('documentName');
		const descriptionInput = document.getElementById('documentDescription');
		const categoryInput = document.getElementById('documentCategory');

		const name = nameInput ? nameInput.value.trim() : '';
		const description = descriptionInput ? descriptionInput.value : '';
		const category = categoryInput ? categoryInput.value.trim() : '';

		if (!name) {
			this.showToast('Le nom du document est obligatoire', 'error');
			return;
		}

		if (!category) {
			this.showToast('La catégorie est obligatoire', 'error');
			return;
		}

		const formData = new FormData();
		formData.append('file', this.selectedFile);
		formData.append('name', name);
		formData.append('description', description);
		formData.append('category', category);

		if (this.hasRegattaIdValue) {
			formData.append('regatta_id', this.regattaIdValue);
		}

		const uploadBtn = document.getElementById('uploadBtn');
		if (uploadBtn) {
			uploadBtn.classList.add('loading');
			uploadBtn.disabled = true;
		}

		try {
			const response = await fetch('/document/upload', {
				method: 'POST',
				body: formData
			});
			const data = await response.json();

			if (response.ok && data.success) {
				this.showToast('Document uploadé avec succès!', 'success');
				this.resetForm();
				setTimeout(() => window.location.reload(), 1000);
			} else {
				this.showToast(data.error || 'Erreur lors de l\'upload', 'error');
			}
		} catch (error) {
			console.error('Upload error:', error);
			this.showToast('Erreur de connexion', 'error');
		} finally {
			if (uploadBtn) {
				uploadBtn.classList.remove('loading');
				uploadBtn.disabled = false;
			}
		}
	}

	cancelUpload() {
		this.resetForm();
	}

	resetForm() {
		this.selectedFile = null;
		const fileInput = document.getElementById('fileInput');
		const nameInput = document.getElementById('documentName');
		const descInput = document.getElementById('documentDescription');
		const categoryInput = document.getElementById('documentCategory');
		const uploadForm = document.getElementById('uploadForm');

		if (fileInput) fileInput.value = '';
		if (nameInput) nameInput.value = '';
		if (descInput) descInput.value = '';
		if (categoryInput) {
			const fallback = this.hasDefaultCategoryValue ? this.defaultCategoryValue : '';
			categoryInput.value = fallback;
		}
		if (uploadForm) uploadForm.classList.add('hidden');
	}

	setupSearch() {
		const searchInput = document.getElementById('searchInput');
		if (!searchInput) return;

		let debounceTimer;
		searchInput.addEventListener('input', (event) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.searchDocuments(event.target.value);
			}, 300);
		});
	}

	searchDocuments(query) {
		const cards = document.querySelectorAll('.document-card');
		const normalizedQuery = query.trim().toLowerCase();

		if (!normalizedQuery) {
			cards.forEach(card => card.classList.remove('hidden'));
			this.toggleCategorySections();
			return;
		}

		cards.forEach(card => {
			const name = card.querySelector('.card-title')?.textContent.toLowerCase() ?? '';
			const description = card.querySelector('p')?.textContent.toLowerCase() ?? '';

			if (name.includes(normalizedQuery) || description.includes(normalizedQuery)) {
				card.classList.remove('hidden');
			} else {
				card.classList.add('hidden');
			}
		});

		this.toggleCategorySections();
	}

	setupDeleteButtons() {
		document.addEventListener('click', async (event) => {
			const trigger = event.target.closest('.delete-btn');
			if (!trigger) {
				return;
			}

			event.preventDefault();
			const documentId = trigger.dataset.documentId;

			if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
				await this.deleteDocument(documentId);
			}
		});
	}

	async deleteDocument(documentId) {
		try {
			const response = await fetch(`/document/${documentId}/delete`, {
				method: 'POST'
			});
			const data = await response.json();

			if (response.ok && data.success) {
				this.showToast('Document supprimé', 'success');
				const card = document.querySelector(`[data-document-id="${documentId}"]`);
				if (card) {
					card.remove();
				}
				this.toggleCategorySections();
			} else {
				this.showToast(data.error || 'Erreur lors de la suppression', 'error');
			}
		} catch (error) {
			this.showToast('Erreur de connexion', 'error');
			console.error(error);
		}
	}

	setupInstallButton() {
		let deferredPrompt;
		const installBtn = document.getElementById('installBtn');
		if (!installBtn) return;

		window.addEventListener('beforeinstallprompt', (event) => {
			event.preventDefault();
			deferredPrompt = event;
			installBtn.classList.remove('hidden');
		});

		installBtn.addEventListener('click', async () => {
			if (!deferredPrompt) {
				return;
			}

			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			console.log(`User response: ${outcome}`);
			deferredPrompt = null;
			installBtn.classList.add('hidden');
		});

		window.addEventListener('appinstalled', () => {
			this.showToast('App installée avec succès!', 'success');
			installBtn.classList.add('hidden');
		});
	}

	showToast(message, type = 'info') {
		const container = document.getElementById('toastContainer');
		if (!container) {
			return;
		}

		const toast = document.createElement('div');
		const alertClass = {
			success: 'alert-success',
			error: 'alert-error',
			info: 'alert-info',
			warning: 'alert-warning'
		}[ type ] || 'alert-info';

		toast.className = `alert ${alertClass} shadow-lg`;
		toast.innerHTML = `
			<div>
				<span>${message}</span>
			</div>
		`;

		container.appendChild(toast);

		setTimeout(() => {
			toast.remove();
		}, 3000);
	}

	toggleCategorySections() {
		const sections = document.querySelectorAll('.category-section');
		let visibleCount = 0;

		sections.forEach(section => {
			const visibleCards = Array.from(section.querySelectorAll('.document-card'))
				.filter(card => !card.classList.contains('hidden'));

			if (visibleCards.length === 0) {
				section.classList.add('hidden');
			} else {
				section.classList.remove('hidden');
				visibleCount += visibleCards.length;
			}
		});

		const totalCards = document.querySelectorAll('.document-card').length;
		const countBadge = document.getElementById('documentCount');
		if (countBadge) {
			const value = sections.length === 0 ? totalCards : visibleCount;
			countBadge.textContent = value;
		}

		const emptyState = document.getElementById('documentsEmptyState');
		if (emptyState) {
			if (totalCards === 0) {
				emptyState.classList.remove('hidden');
			} else {
				emptyState.classList.toggle('hidden', visibleCount !== 0);
			}
		}
	}

	applyDefaultCategory() {
		const categoryInput = document.getElementById('documentCategory');
		if (categoryInput && this.hasDefaultCategoryValue && !categoryInput.value) {
			categoryInput.value = this.defaultCategoryValue;
		}
	}
}
				const { outcome } = await deferredPrompt.userChoice;
				console.log(`User response: ${outcome}`);
				deferredPrompt = null;
				installBtn.classList.add('hidden');
			}
		});

		window.addEventListener('appinstalled', () => {
			this.showToast('App installée avec succès!', 'success');
			installBtn.classList.add('hidden');
		});
	}

	showToast(message, type = 'info') {
		const container = document.getElementById('toastContainer');
		if (!container) return;

		const toast = document.createElement('div');

		const alertClass = {
			success: 'alert-success',
			error: 'alert-error',
			info: 'alert-info',
			warning: 'alert-warning'
		}[ type ] || 'alert-info';

		toast.className = `alert ${alertClass} shadow-lg`;
		toast.innerHTML = `
            <div>
                <span>${message}</span>
            </div>
        `;

		container.appendChild(toast);

		setTimeout(() => {
			toast.remove();
		}, 3000);
	}
}
