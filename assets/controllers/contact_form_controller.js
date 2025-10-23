// assets/controllers/contact_form_controller.js
import { Controller } from "@hotwired/stimulus"

// Contrôleur Stimulus pour le formulaire de contact
export default class extends Controller {
	static targets = [
		"form", "name", "email", "subject", "message", "messageCounter", "status"
	]

	static values = {
		maxMessageLength: Number,
		postUrl: String,
		csrfToken: String,
		transSuccess: String,
		transErrorGeneric: String,
		transErrorNetwork: String,
		transErrorInvalidEmail: String,
		transErrorNameTooLong: String,
		transErrorSubjectTooLong: String,
		transErrorShortMessage: String,
		transErrorMessageTooLong: String
	}

	connect() {
		// Initialisation du compteur de caractères
		this.updateCounter()
	}

	updateCounter() {
		const len = this.messageTarget.value.length
		this.messageCounterTarget.textContent = `${len}/${this.maxMessageLengthValue}`
		if (len > this.maxMessageLengthValue) {
			this.messageCounterTarget.classList.add('text-error')
		} else {
			this.messageCounterTarget.classList.remove('text-error')
		}
	}

	async submit(event) {
		event.preventDefault()
		this.statusTarget.textContent = ""

		// Récupération des valeurs
		const name = this.nameTarget.value
		const email = this.emailTarget.value
		const subject = this.subjectTarget.value
		const message = this.messageTarget.value

		// Vérifications côté client
		if (email && email.length > 254) {
			this.statusTarget.textContent = this.transErrorInvalidEmailValue
			return
		}
		if (name && name.length > 100) {
			this.statusTarget.textContent = this.transErrorNameTooLongValue
			return
		}
		if (subject && subject.length > 150) {
			this.statusTarget.textContent = this.transErrorSubjectTooLongValue
			return
		}
		if (!message || message.length < 5) {
			this.statusTarget.textContent = this.transErrorShortMessageValue
			return
		}
		if (message.length > this.maxMessageLengthValue) {
			this.statusTarget.textContent = this.transErrorMessageTooLongValue
			return
		}

		// Envoi du formulaire via fetch
		try {
			const res = await fetch(this.postUrlValue, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					email,
					subject,
					message,
					_csrf_token: this.csrfTokenValue
				})
			})
			const json = await res.json()
			if (json.success) {
				this.statusTarget.textContent = json.message || this.transSuccessValue
				this.nameTarget.value = ''
				this.emailTarget.value = ''
				this.subjectTarget.value = ''
				this.messageTarget.value = ''
				this.updateCounter()
			} else {
				this.statusTarget.textContent = json.error || this.transErrorGenericValue
			}
		} catch (err) {
			this.statusTarget.textContent = this.transErrorNetworkValue
		}
	}
}