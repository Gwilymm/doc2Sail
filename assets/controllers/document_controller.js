import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
	static values = {
		regattaId: Number
	}

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
	}

	setupDropZone() {
		const dropZone = document.getElementById('dropZone');
		const fileInput = document.getElementById('fileInput');

		// Check if elements exist (admin page only)
		if (!dropZone || !fileInput) {
			console.log('Drop zone not found - probably on consultation page');
			return;
		}

		console.log('Setting up drop zone');

		// Click to select file
		dropZone.addEventListener('click', () => fileInput.click());

		// Drag and drop
		dropZone.addEventListener('dragover', (e) => {
			e.preventDefault();
			dropZone.classList.add('border-primary', 'bg-primary/5');
		});

		dropZone.addEventListener('dragleave', () => {
			dropZone.classList.remove('border-primary', 'bg-primary/5');
		});

		dropZone.addEventListener('drop', (e) => {
			e.preventDefault();
			dropZone.classList.remove('border-primary', 'bg-primary/5');

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				this.handleFileSelect(files[ 0 ]);
			}
		});

		// File input change
		fileInput.addEventListener('change', (e) => {
			if (e.target.files.length > 0) {
				this.handleFileSelect(e.target.files[ 0 ]);
			}
		});

		// Upload button
		const uploadBtn = document.getElementById('uploadBtn');
		const cancelBtn = document.getElementById('cancelBtn');

		if (uploadBtn) {
			uploadBtn.addEventListener('click', () => this.uploadFile());
		}

		// Cancel button
		if (cancelBtn) {
			cancelBtn.addEventListener('click', () => this.cancelUpload());
		}
	}

	handleFileSelect(file) {
		console.log('File selected:', file.name);
		this.selectedFile = file;

		// Show upload form
		const uploadForm = document.getElementById('uploadForm');
		if (uploadForm) {
			uploadForm.classList.remove('hidden');
		}

		// Pre-fill name with filename
		const nameInput = document.getElementById('documentName');
		if (nameInput && !nameInput.value) {
			nameInput.value = file.name;
		}

		this.showToast('Fichier sélectionné: ' + file.name, 'info');
	}

	async uploadFile() {
		console.log('Uploading file...');

		if (!this.selectedFile) {
			this.showToast('Aucun fichier sélectionné', 'error');
			return;
		}

		const name = document.getElementById('documentName').value;
		const description = document.getElementById('documentDescription').value;

		if (!name.trim()) {
			this.showToast('Le nom du document est obligatoire', 'error');
			return;
		}

		const formData = new FormData();
		formData.append('file', this.selectedFile);
		formData.append('name', name);
		formData.append('description', description);

		// Add regatta_id if present
		if (this.hasRegattaIdValue) {
			formData.append('regatta_id', this.regattaIdValue);
			console.log('Adding regatta_id to upload:', this.regattaIdValue);
		}

		const uploadBtn = document.getElementById('uploadBtn');
		uploadBtn.classList.add('loading');
		uploadBtn.disabled = true;

		try {
			console.log('Sending request to /document/upload');
			const response = await fetch('/document/upload', {
				method: 'POST',
				body: formData
			});

			console.log('Response status:', response.status);
			const data = await response.json();
			console.log('Response data:', data);

			if (response.ok && data.success) {
				this.showToast('Document uploadé avec succès!', 'success');
				this.resetForm();

				// Reload page to show new document
				setTimeout(() => window.location.reload(), 1000);
			} else {
				this.showToast(data.error || 'Erreur lors de l\'upload', 'error');
			}
		} catch (error) {
			console.error('Upload error:', error);
			this.showToast('Erreur de connexion', 'error');
		} finally {
			uploadBtn.classList.remove('loading');
			uploadBtn.disabled = false;
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
		const uploadForm = document.getElementById('uploadForm');

		if (fileInput) fileInput.value = '';
		if (nameInput) nameInput.value = '';
		if (descInput) descInput.value = '';
		if (uploadForm) uploadForm.classList.add('hidden');
	}

	setupSearch() {
		const searchInput = document.getElementById('searchInput');
		if (!searchInput) return;

		let debounceTimer;

		searchInput.addEventListener('input', (e) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.searchDocuments(e.target.value);
			}, 300);
		});
	}

	searchDocuments(query) {
		const cards = document.querySelectorAll('.document-card');

		if (!query.trim()) {
			cards.forEach(card => card.classList.remove('hidden'));
			return;
		}

		const searchTerm = query.toLowerCase();
		cards.forEach(card => {
			const name = card.querySelector('.card-title').textContent.toLowerCase();
			const descElement = card.querySelector('p');
			const description = descElement ? descElement.textContent.toLowerCase() : '';

			if (name.includes(searchTerm) || description.includes(searchTerm)) {
				card.classList.remove('hidden');
			} else {
				card.classList.add('hidden');
			}
		});
	}

	setupDeleteButtons() {
		document.addEventListener('click', async (e) => {
			if (e.target.closest('.delete-btn')) {
				e.preventDefault();
				const btn = e.target.closest('.delete-btn');
				const documentId = btn.dataset.documentId;

				if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
					await this.deleteDocument(documentId);
				}
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

				// Remove card from DOM
				const card = document.querySelector(`[data-document-id="${documentId}"]`);
				if (card) {
					card.remove();
				}

				// Reload if no more documents
				const remainingCards = document.querySelectorAll('.document-card');
				if (remainingCards.length === 0) {
					setTimeout(() => window.location.reload(), 500);
				}
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

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			installBtn.classList.remove('hidden');
		});

		installBtn.addEventListener('click', async () => {
			if (deferredPrompt) {
				deferredPrompt.prompt();
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
