// assets/controllers/fab_controller.js
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
	static values = { regattaId: Number }

	connect() {
		this._actionLock = false;
	}

	lockAction(duration = 600) {
		if (this._actionLock) return false;
		this._actionLock = true;
		setTimeout(() => (this._actionLock = false), duration);
		return true;
	}

	hideOptions() {
		// DaisyUI gère l’ouverture, donc on ferme en forçant le blur sur le bouton principal
		const mainBtn = this.element.querySelector('[data-fab-toggle]');
		if (mainBtn) mainBtn.blur();
	}

	showQRCode(event) {
		if (!this.lockAction()) return;
		event?.preventDefault();
		this.hideOptions();

		const id = this.regattaIdValue;
		if (!id) return;

		if (typeof loadQRCodeModal === "function") {
			loadQRCodeModal("regatta", id);
		} else {
			window.open(`/qrcode/image/regatta/${id}`, "_blank", "noopener,noreferrer");
		}
	}

	sharePublic(event) {
		if (!this.lockAction()) return;
		event?.preventDefault();
		this.hideOptions();

		const id = this.regattaIdValue;
		if (!id) return;

		if (typeof loadQRCodeModal === "function") {
			loadQRCodeModal("regatta", id);
		} else {
			window.open(`/qrcode/image/regatta/${id}`, "_blank", "noopener,noreferrer");
		}
	}

	invite(event) {
		if (!this.lockAction()) return;
		event?.preventDefault();
		this.hideOptions();

		const modal = document.getElementById("inviteCoOwnerModal");
		if (modal && typeof modal.showModal === "function") {
			modal.showModal();
		}
	}
}
