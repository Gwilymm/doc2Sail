import { Controller } from '@hotwired/stimulus';

/**
 * ThemeController: Handles theme initialization and toggling.
 * Replaces the old inline script for setting data-theme from localStorage.
 */
export default class extends Controller {
	static targets = [ "toggle" ];

	connect() {
		this.initTheme();
	}

	initTheme() {
		const html = document.documentElement;
		const themeToggle = this.hasToggleTarget ? this.toggleTarget : document.getElementById("themeToggle");
		const savedTheme = localStorage.getItem("theme") || "light";
		html.setAttribute("data-theme", savedTheme);
		if (themeToggle) {
			themeToggle.checked = savedTheme === "dark";
			themeToggle.addEventListener("change", this.toggleTheme.bind(this));
		}
	}

	toggleTheme(event) {
		const html = document.documentElement;
		const isDark = event?.target?.checked ?? false;
		const newTheme = isDark ? "dark" : "light";
		html.setAttribute("data-theme", newTheme);
		localStorage.setItem("theme", newTheme);
	}
}
