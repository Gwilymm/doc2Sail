import { Controller } from '@hotwired/stimulus';

// Small debounce helper to avoid adding lodash as a dependency
function debounce(fn, wait = 150) {
	let t;
	return (...args) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), wait);
	};
}

export default class extends Controller {
	static targets = [ 'canvas' ];
	static values = { url: String };

	async connect() {
		// Dynamic import of the runtime module from the public pdfjs build
		try {
			// Import the bundled vendor build from assets so webpack can resolve it
			const mod = await import('../vendor/pdfjs-dist/pdfjs-dist.index.js');
			this.pdfjsLib = mod.default || mod;
		} catch (e) {
			console.error('Failed to load PDF.js runtime', e);
			this._showError(e);
			return;
		}

		this.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';

		this.canvas = this.canvasTarget;
		this.ctx = this.canvas.getContext('2d');
		this.pdfDoc = null;
		this.pageNum = 1;
		this.scale = this.isMobile() ? 'fit' : 1.2;
		this.devicePixelRatio = window.devicePixelRatio || 1;

		this.rendering = false;
		this.loadingEl = this._createLoading();
		this.errorEl = null;

		this._onResize = debounce(() => this._renderPage(this.pageNum), 150);
		window.addEventListener('resize', this._onResize);

		this._initUI();
		this.loadPdf(this.urlValue).catch(err => this._showError(err));
	}

	disconnect() {
		window.removeEventListener('resize', this._onResize);
	}

	isMobile() {
		return window.matchMedia('(max-width: 640px)').matches;
	}

	async loadPdf(url) {
		this._showLoading(true);
		try {
			const loadingTask = this.pdfjsLib.getDocument({ url });
			this.pdfDoc = await loadingTask.promise;
			this._showLoading(false);
			this._renderPage(this.pageNum);
			this._updatePageControls();
		} catch (e) {
			this._showLoading(false);
			throw e;
		}
	}

	async _renderPage(num) {
		if (!this.pdfDoc) return;
		if (this.rendering) return;
		this.rendering = true;

		try {
			const page = await this.pdfDoc.getPage(num);

			// compute scale
			let scale = 1;
			const viewport = page.getViewport({ scale: 1 });
			const containerWidth = Math.min(window.innerWidth, document.documentElement.clientWidth) - 32; // padding

			if (this.scale === 'fit') {
				scale = containerWidth / viewport.width;
			} else {
				scale = this.scale;
			}

			const pixelRatio = this.devicePixelRatio || 1;
			const scaledViewport = page.getViewport({ scale: scale * pixelRatio });

			// set canvas size accounting for DPR
			this.canvas.width = Math.floor(scaledViewport.width);
			this.canvas.height = Math.floor(scaledViewport.height);
			this.canvas.style.width = Math.floor(scaledViewport.width / pixelRatio) + 'px';
			this.canvas.style.height = Math.floor(scaledViewport.height / pixelRatio) + 'px';

			const renderContext = {
				canvasContext: this.ctx,
				viewport: page.getViewport({ scale: scale * pixelRatio })
			};

			const renderTask = page.render(renderContext);
			await renderTask.promise;
		} finally {
			this.rendering = false;
		}
	}

	_initUI() {
		// create a small control bar above the canvas
		const wrapper = document.createElement('div');
		wrapper.className = 'flex items-center justify-center gap-2 mt-4';

		const btn = (text, cls, handler) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.innerHTML = text;
			b.className = cls + ' btn-sm';
			b.addEventListener('click', handler.bind(this));
			return b;
		};

		this.prevBtn = btn('◀', 'btn btn-ghost', this._onPrev);
		this.nextBtn = btn('▶', 'btn btn-ghost', this._onNext);
		this.zoomInBtn = btn('+', 'btn btn-ghost', this._onZoomIn);
		this.zoomOutBtn = btn('-', 'btn btn-ghost', this._onZoomOut);
		this.fitBtn = btn('↔', 'btn btn-ghost', this._onFit);
		this.fullscreenBtn = btn('⤢', 'btn btn-ghost', this._onFullscreen);

		this.pageLabel = document.createElement('span');
		this.pageLabel.className = 'text-sm text-base-content/70 px-2';

		wrapper.appendChild(this.prevBtn);
		wrapper.appendChild(this.pageLabel);
		wrapper.appendChild(this.nextBtn);
		wrapper.appendChild(this.zoomOutBtn);
		wrapper.appendChild(this.zoomInBtn);
		wrapper.appendChild(this.fitBtn);
		wrapper.appendChild(this.fullscreenBtn);

		this.canvas.parentNode.insertBefore(wrapper, this.canvas.nextSibling);
	}

	_updatePageControls() {
		if (!this.pdfDoc) return;
		this.pageLabel.textContent = `${this.pageNum} / ${this.pdfDoc.numPages}`;
		this.prevBtn.disabled = this.pageNum <= 1;
		this.nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages;
	}

	_onPrev() {
		if (this.pageNum <= 1) return;
		this.pageNum--;
		this._updatePageControls();
		this._renderPage(this.pageNum);
	}

	_onNext() {
		if (!this.pdfDoc || this.pageNum >= this.pdfDoc.numPages) return;
		this.pageNum++;
		this._updatePageControls();
		this._renderPage(this.pageNum);
	}

	_onZoomIn() {
		if (this.scale === 'fit') this.scale = 1;
		this.scale = Math.min(4, (this.scale === 'fit' ? 1 : this.scale) + 0.25);
		this._renderPage(this.pageNum);
	}

	_onZoomOut() {
		if (this.scale === 'fit') this.scale = 1;
		this.scale = Math.max(0.25, (this.scale === 'fit' ? 1 : this.scale) - 0.25);
		this._renderPage(this.pageNum);
	}

	_onFit() {
		this.scale = 'fit';
		this._renderPage(this.pageNum);
	}

	_onFullscreen() {
		const el = this.canvas.closest('section') || this.canvas.parentNode;
		if (!document.fullscreenElement) {
			el.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	_createLoading() {
		const el = document.createElement('div');
		el.className = 'flex items-center justify-center h-24';
		el.innerHTML = '<div class="loading loading-ring loading-lg"></div>';
		this.canvas.parentNode.insertBefore(el, this.canvas);
		el.style.display = 'none';
		return el;
	}

	_showLoading(show) {
		if (!this.loadingEl) return;
		this.loadingEl.style.display = show ? 'block' : 'none';
	}

	_showError(err) {
		console.error(err);
		if (this.errorEl) return;
		const el = document.createElement('div');
		el.className = 'alert alert-error mt-4';
		el.textContent = 'Impossible de charger le document PDF.';
		this.canvas.parentNode.insertBefore(el, this.canvas);
		this.errorEl = el;
	}
}
