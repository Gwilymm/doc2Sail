import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
	connect() {
		// initialize filter state on connect
		this.filter()
	}

	filter() {
		const checkboxes = this.element.querySelectorAll('input[type="checkbox"]')
		const selectedCategories = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value)
		const showAll = selectedCategories.length === 0

		document.querySelectorAll('.category-section').forEach(section => {
			const heading = section.querySelector('h3')
			const category = heading ? heading.textContent.trim() : ''
			if (showAll) {
				section.style.display = 'block'
			} else {
				section.style.display = selectedCategories.includes(category) ? 'block' : 'none'
			}
		})
	}
}
