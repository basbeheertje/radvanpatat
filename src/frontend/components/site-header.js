class SiteHeader extends HTMLElement {
	connectedCallback() {
		const logoHref = this.getAttribute("logo-href") || "./index.html";
		const radHref = this.getAttribute("rad-href") || "./index.html";
		const helpHref = this.getAttribute("help-href") || "./help.html";
		const activeNav = this.getAttribute("active-nav") || "";
		const shareMode = this.getAttribute("share-mode") || "button";
		const shareHref = this.getAttribute("share-href") || "./index.html";
		const ctaMode = this.getAttribute("cta-mode") || "button";
		const ctaHref = this.getAttribute("cta-href") || "./index.html";
		const ctaLabel = this.getAttribute("cta-label") || "Snack toevoegen";

		const radClasses = activeNav === "rad"
			? "text-primary border-b-2 border-primary font-bold pb-2"
			: "text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200";
		const helpClasses = activeNav === "help"
			? "text-primary border-b-2 border-primary font-bold pb-2"
			: "text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200";

		const shareMarkup = shareMode === "hidden"
			? ""
			: shareMode === "link"
				? `<a class="text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200" href="${shareHref}">Delen</a>`
				: `<button class="text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200" id="header-share-knop" type="button">Delen</button>`;

		const ctaMarkup = ctaMode === "hidden"
			? ""
			: ctaMode === "link"
				? `<a class="site-header__cta bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold shadow-[0_4px_0_0_#5e4200] hover:bg-primary hover:text-white transition-all active:translate-y-1 active:shadow-none inline-flex items-center justify-center" href="${ctaHref}">${ctaLabel}</a>`
				: `<button class="site-header__cta bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold shadow-[0_4px_0_0_#5e4200] hover:bg-primary hover:text-white transition-all active:translate-y-1 active:shadow-none" id="header-snack-toevoegen-knop" type="button">${ctaLabel}</button>`;

		this.innerHTML = `
			<header class="w-full h-20 bg-surface border-b-2 border-outline-variant shadow-sm sticky top-0 z-[100]">
				<div class="site-header__inner flex justify-between items-center px-6 md:px-12 max-w-screen-2xl mx-auto h-full">
					<a class="header-logo-link font-headline-md text-headline-md font-extrabold text-primary flex items-center gap-2" href="${logoHref}">
						<img alt="Rad van Patat Logo" class="h-12 w-auto object-contain" src="./assets/images/brand/rad-van-patat-logo.png"/>
					</a>
					<nav class="hidden md:flex gap-md items-center h-full">
						<a class="${radClasses}" href="${radHref}">Rad</a>
						${shareMarkup}
						<a class="${helpClasses}" href="${helpHref}">Help</a>
					</nav>
					<div class="site-header__actions flex items-center gap-md">
						${ctaMarkup}
					</div>
				</div>
			</header>
		`;
	}
}

customElements.define("site-header", SiteHeader);
