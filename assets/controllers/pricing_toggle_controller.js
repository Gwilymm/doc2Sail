import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
	static targets = [ 'toggle', 'price', 'period', 'annualNote' ]

	connect() {
		// initialize state: monthly by default
		this.isAnnual = false
		console.log('pricing-toggle controller connected', this.element)
		this.updatePrices()
	}

	// Called when one of the radio inputs changes
	toggle(event) {
		console.log('pricing-toggle change event', event.currentTarget, event.currentTarget.getAttribute('aria-label'))
		const value = event.currentTarget.getAttribute('aria-label') || ''
		this.isAnnual = /annuel/i.test(value)
		this.updatePrices()
	}

	updatePrices() {
		this.priceTargets.forEach(el => {
			const monthly = el.dataset.monthly
			const annual = el.dataset.annual
			if (!monthly || !annual) return

			if (this.isAnnual) {
				el.textContent = annual
			} else {
				el.textContent = monthly
			}
		})

		this.periodTargets.forEach(el => {
			el.textContent = this.isAnnual ? '/an' : '/mois'
		})

		this.annualNoteTargets.forEach(el => {
			el.style.display = this.isAnnual ? 'none' : ''
		})
	}
}
s