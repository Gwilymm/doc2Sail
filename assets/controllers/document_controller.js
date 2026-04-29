import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
	static targets = [
		'categoryCheckbox',
		'categorySection',
		'inviteEmail',
		'publicUrl',
		'toastContainer'
	];

	static values = {
		regattaId: Number,
		defaultCategory: String,
		fileUrl: String
	};

	connect() {
		console.log('Document controller connected et mes couilles');
		if (this.hasRegattaIdValue) {
			console.log('Regatta ID:', this.regattaIdValue);
		}
		console.log("checkboxTargets:", this.categoryCheckboxTargets.length);
		console.log("sectionTargets:", this.categorySectionTargets.length);
		console.log("hasCategorySectionTarget:", this.hasCategorySectionTarget);
		console.log("hasCategoryCheckboxTarget:", this.hasCategoryCheckboxTarget);


		// toggleFullscreen moved to class method accessible by Stimulus actions

		this.selectedFile = null;
		this.setupDropZone();
		this.applyDefaultCategory();
		this.setupSearch();
		this.setupDeleteButtons();
		this.setupInstallButton();
		this.toggleCategorySections();
		this.filterCategories(); // Initialiser le filtre au chargement
	}

	toggleFullscreen(event) {
		event?.preventDefault();
		try {
			const el = document.getElementById('viewerFrame');
			const fileUrl = event?.currentTarget?.dataset?.documentFileUrlValue || this.fileUrlValue || null;
			if (el && el.requestFullscreen) {
				el.requestFullscreen();
				return;
			}
			if (el && el.webkitRequestFullscreen) {
				el.webkitRequestFullscreen();
				return;
			}
			if (fileUrl) {
				window.open(fileUrl, '_blank');
			}
		} catch (e) {
			console.error('Error toggling fullscreen', e);
		}
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

		// Vider le champ catégorie quand un nouveau fichier est sélectionné
		const categoryInput = document.getElementById('documentCategory');
		if (categoryInput) {
			categoryInput.value = '';
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

		// Client-side size check to avoid sending very large files and getting HTML error responses
		// Limit set to 100MB
		const MAX_SIZE = 100 * 1024 * 1024; // 100MB
		console.log('Selected file size:', this.selectedFile.size);
		console.log('Max allowed size:', MAX_SIZE);
		if (this.selectedFile.size > MAX_SIZE) {
			this.showToast('Fichier trop volumineux (max 100MB)', 'error');
			return;
		}

		const nameInput = document.getElementById('documentName');
		const descriptionInput = document.getElementById('documentDescription');
		const categoryInput = document.getElementById('documentCategory');

		const name = nameInput ? nameInput.value.trim() : '';
		const description = descriptionInput ? descriptionInput.value : '';
		let category = categoryInput ? categoryInput.value.trim() : '';

		if (!name) {
			this.showToast('Le nom du document est obligatoire', 'error');
			return;
		}

		// Si la catégorie est vide, utiliser la valeur par défaut
		if (!category) {
			category = this.hasDefaultCategoryValue ? this.defaultCategoryValue : 'Autre';
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
		const locale = document.documentElement.lang || 'fr';

		try {
			const response = await fetch(`/${locale}/document/upload`, {
				method: 'POST',
				body: formData
			});

			// Read raw text first to avoid JSON parse errors when nginx returns HTML (413 pages)
			const raw = await response.text();
			let data = null;
			try {
				data = raw ? JSON.parse(raw) : {};
			} catch (e) {
				// Not JSON (likely an HTML error page). We'll convert to a safe object.
				data = { success: false, error: raw };
			}

			console.log('Upload response:', response);

			if (response.status === 413) {
				// Payload too large: show a friendly, localized message
				this.showToast('Fichier trop volumineux (dépasse la limite autorisée).', 'error');
			} else if (response.ok && data && data.success) {
				this.showToast('Document uploadé avec succès!', 'success');
				this.resetForm();
				setTimeout(() => window.location.reload(), 1000);
			} else {
				const message = data && data.error ? data.error : (raw && raw.length ? (raw.length > 200 ? raw.slice(0, 200) + '...' : raw) : 'Erreur lors de l\'upload');
				this.showToast(message, 'error');
			}
		} catch (error) {
			console.error('Upload error mes couilles:', error);
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
			const locale = document.documentElement.lang || 'fr';
			const response = await fetch(`/${locale}/document/${documentId}/delete`, {
				method: 'POST'
			});
			console.log('Delete response:', response);
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
		let container;

		// Chercher le container de toast (peut avoir différents IDs)
		if (this.hasToastContainerTarget) {
			container = this.toastContainerTarget;
		} else {
			container = document.getElementById('toast-container') ||
				document.getElementById('toastContainer');
		}

		if (!container) {
			console.warn('Toast container not found, logging message:', message);
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
				<span>${this.escapeHtml(message)}</span>
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

	/**
	 * Filtre les sections de documents par catégorie
	 * Affiche seulement les sections dont la catégorie est cochée.
	 * Si aucune catégorie n'est cochée, toutes les sections sont affichées.
	 */
	filterCategories() {
		const selected = this.categoryCheckboxTargets
			.filter(cb => cb.checked)
			.map(cb => cb.dataset.category);

		console.log("Selected:", selected);

		const showAll = selected.length === 0;

		this.categorySectionTargets.forEach(section => {
			const category = section.dataset.category;
			console.log("Section:", category);

			const shouldShow = showAll || selected.includes(category);
			section.classList.toggle('hidden', !shouldShow);
		});
	}



	/**
	 * Charge et affiche la modal QR Code pour partager la régate
	 * @param {Event} event - L'événement de clic
	 */
	async loadQRCodeModal(event) {
		event?.preventDefault();

		const type = event.currentTarget.dataset.qrcodeType || 'regatta';
		const id = event.currentTarget.dataset.qrcodeId || this.regattaIdValue;

		if (!id) {
			console.error('No ID provided for QR code');
			return;
		}

		const locale = document.documentElement.lang || 'fr';
		const path = `/${locale}/qrcode/modal/${type}/${id}`;

		try {
			const response = await fetch(path);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const html = await response.text();

			// Supprimer l'ancienne modal si elle existe
			const container = document.getElementById('qrCodeModalContainer');
			if (container) {
				container.innerHTML = html;

				// Ouvrir la modal DaisyUI
				const modal = document.getElementById('qrCodeModal');
				if (modal && typeof modal.showModal === 'function') {
					modal.showModal();
				}
			}
		} catch (error) {
			console.error('Erreur lors du chargement du QR code:', error);
			this.showToast('Impossible de charger le QR code', 'error');
		}
	}

	/**
	 * Envoie une invitation à un co-propriétaire
	 * @param {Event} event - L'événement de soumission du formulaire
	 */
	async inviteCoOwner(event) {
		event.preventDefault();

		if (!this.hasInviteEmailTarget) {
			console.error('Invite email target not found');
			return;
		}

		const email = this.inviteEmailTarget.value.trim();

		// Validation de l'email
		if (!email || !email.includes('@')) {
			this.showToast('Veuillez entrer une adresse email valide', 'error');
			return;
		}

		if (!this.hasRegattaIdValue) {
			this.showToast('Erreur: ID de régate manquant', 'error');
			return;
		}

		try {
			const response = await fetch(`/regatta/${this.regattaIdValue}/invite`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: email })
			});

			const result = await response.json();

			if (result.success) {
				this.showToast(result.message, 'success');

				// Fermer la modal
				const modal = document.getElementById('inviteCoOwnerModal');
				if (modal && typeof modal.close === 'function') {
					modal.close();
				}

				// Réinitialiser le formulaire
				this.inviteEmailTarget.value = '';
			} else {
				this.showToast(result.error || "Erreur lors de l'envoi de l'invitation", 'error');

				if (result.debug_url) {
					console.log('Debug URL:', result.debug_url);
				}
			}
		} catch (error) {
			this.showToast("Erreur lors de l'envoi de l'invitation", 'error');
			console.error(error);
		}
	}

	/**
	 * Copie l'URL publique dans le presse-papier
	 * @param {Event} event - L'événement de clic
	 */
	async copyPublicUrl(event) {
		event?.preventDefault();

		if (!this.hasPublicUrlTarget) {
			console.error('Public URL target not found');
			return;
		}

		try {
			// Sélectionner le texte
			this.publicUrlTarget.select();

			// Utiliser l'API moderne Clipboard si disponible
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(this.publicUrlTarget.value);
			} else {
				// Fallback pour les navigateurs plus anciens
				document.execCommand('copy');
			}

			this.showToast('URL copiée dans le presse-papier!', 'success');
		} catch (error) {
			console.error('Erreur lors de la copie:', error);
			this.showToast('Erreur lors de la copie', 'error');
		}
	}

	/**
	 * Ferme la modal d'invitation
	 * @param {Event} event - L'événement de clic
	 */
	closeInviteModal(event) {
		event?.preventDefault();

		const modal = document.getElementById('inviteCoOwnerModal');
		if (modal && typeof modal.close === 'function') {
			modal.close();
		}
	}

	/**
	 * Échappe les caractères HTML pour éviter les injections XSS
	 * @param {string} text - Le texte à échapper
	 * @returns {string} Le texte échappé
	 */
	escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}
}
