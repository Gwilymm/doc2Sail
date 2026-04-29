import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
	static targets = ['details'];

	connect() {
		this.handleDocumentClick = this.handleDocumentClick.bind(this);
		this.handleKeydown = this.handleKeydown.bind(this);

		document.addEventListener('click', this.handleDocumentClick);
		document.addEventListener('keydown', this.handleKeydown);
	}

	disconnect() {
		document.removeEventListener('click', this.handleDocumentClick);
		document.removeEventListener('keydown', this.handleKeydown);
	}

	handleDocumentClick(event) {
		if (!this.hasDetailsTarget || !this.detailsTarget.open) {
			return;
		}

		if (this.element.contains(event.target)) {
			return;
		}

		this.close();
	}

	handleKeydown(event) {
		if (event.key === 'Escape') {
			this.close();
		}
	}

	close() {
		if (this.hasDetailsTarget) {
			this.detailsTarget.open = false;
		}
	}
}
