import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
	connect() {
		this._openButtons = Array.from(document.querySelectorAll('[data-open-dialog]'));
		this._closeButtons = Array.from(document.querySelectorAll('[data-close-dialog]'));
		this._openButtons.forEach(btn => {
			btn.addEventListener('click', this._openHandler);
		});
		this._closeButtons.forEach(btn => {
			btn.addEventListener('click', this._closeHandler);
		});
		this._openCreateDialogFromQuery();
	}

	disconnect() {
		this._openButtons?.forEach(btn => btn.removeEventListener('click', this._openHandler));
		this._closeButtons?.forEach(btn => btn.removeEventListener('click', this._closeHandler));
	}

	_openHandler = (event) => {
		const target = event.currentTarget.dataset.openDialog;
		if (!target) return;
		const dialog = document.querySelector(target);
		if (!dialog) return;
		if (typeof dialog.showModal === 'function') dialog.showModal();
	}

	_closeHandler = (event) => {
		const target = event.currentTarget.dataset.closeDialog || event.currentTarget.dataset.openDialog;
		if (!target) return;
		const dialog = document.querySelector(target);
		if (!dialog) return;
		if (typeof dialog.close === 'function') dialog.close();
	}

	_openCreateDialogFromQuery() {
		const params = new URLSearchParams(window.location.search);
		if (params.get('create') !== '1') return;

		const dialog = document.querySelector('#createRegattaModal');
		if (!dialog || typeof dialog.showModal !== 'function') return;

		dialog.showModal();
		params.delete('create');
		const query = params.toString();
		const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
		window.history.replaceState({}, '', nextUrl);
	}
}
