class BrandingSticker extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `
			<a class="branding-sticker hidden lg:flex fixed bottom-8 left-6 xl:left-10 z-40 bg-white p-4 rounded-2xl border-2 border-primary-container items-center gap-4 max-w-[280px] group cursor-pointer" href="https://decodekas.nl" rel="noopener noreferrer" target="_blank">
				<div class="relative">
					<div class="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-lowest flex items-center justify-center border-2 border-primary-container group-hover:bg-primary-fixed transition-colors">
						<img alt="De Code Kas Logo" class="w-12 h-12 object-contain" src="https://decodekas.nl/images/logo/400/DeCodeKasLogo_max_400.png"/>
					</div>
					<div class="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm rotate-12">
						BOUWER
					</div>
				</div>
				<div class="flex flex-col">
					<span class="text-[10px] font-bold text-tertiary uppercase tracking-wider">Maatwerk software</span>
					<span class="font-headline-md text-primary text-lg leading-tight">De Code Kas</span>
					<div class="flex items-center gap-1 mt-1 text-on-surface-variant group-hover:text-primary transition-colors">
						<span class="text-[12px] font-medium">Bezoek de website</span>
						<span class="material-symbols-outlined text-sm">arrow_forward</span>
					</div>
				</div>
			</a>
		`;
	}
}

customElements.define("branding-sticker", BrandingSticker);
