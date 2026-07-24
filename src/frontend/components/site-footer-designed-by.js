class SiteFooterDesignedBy extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `
			<section class="w-full py-xl bg-surface-container border-t border-outline-variant" id="footer-designed-by">
				<div class="site-footer-designed-by__inner max-w-screen-xl mx-auto px-6 md:px-12 flex flex-col items-center text-center">
					<a class="site-footer-designed-by__link group flex flex-col items-center gap-md" href="https://decodekas.nl" rel="noopener noreferrer" target="_blank">
						<div class="w-20 h-20 rounded-2xl overflow-hidden bg-white flex items-center justify-center border-2 border-primary-container shadow-md group-hover:scale-110 transition-transform duration-500">
							<img alt="De Code Kas Logo" class="w-16 h-16 object-contain" src="https://decodekas.nl/images/logo/400/DeCodeKasLogo_max_400.png"/>
						</div>
						<div class="site-footer-designed-by__content flex flex-col gap-xs">
							<h2 class="text-headline-md font-extrabold text-primary">Vormgegeven &amp; Gebouwd door De Code Kas</h2>
							<p class="text-body-lg text-on-surface-variant">Wij bouwen digitale ervaringen die blijven plakken.</p>
							<span class="mt-md inline-flex items-center gap-2 text-primary font-bold hover:underline">
								Bezoek onze website
								<span class="material-symbols-outlined">arrow_forward</span>
							</span>
						</div>
					</a>
				</div>
			</section>
		`;
	}
}

customElements.define("site-footer-designed-by", SiteFooterDesignedBy);
