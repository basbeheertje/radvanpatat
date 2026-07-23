class SiteHeader extends HTMLElement {
	constructor() {
		super();
		this.mobileMenuOpen = false;
		this.handleClick = this.handleClick.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	connectedCallback() {
		if (!this.dataset.listenersBound) {
			this.addEventListener("click", this.handleClick);
			document.addEventListener("keydown", this.handleKeyDown);
			this.dataset.listenersBound = "true";
		}

		this.render();
	}

	disconnectedCallback() {
		this.removeEventListener("click", this.handleClick);
		document.removeEventListener("keydown", this.handleKeyDown);
		document.body.classList.remove("site-mobile-menu-open");
		delete this.dataset.listenersBound;
	}

	getConfig() {
		return {
			logoHref: this.getAttribute("logo-href") || "./index.html",
			radHref: this.getAttribute("rad-href") || "./index.html",
			groupHref: this.getAttribute("group-href") || "./group.html",
			helpHref: this.getAttribute("help-href") || "./help.html",
			activeNav: this.getAttribute("active-nav") || "",
			shareMode: this.getAttribute("share-mode") || "button",
			shareHref: this.getAttribute("share-href") || "./index.html",
			ctaMode: this.getAttribute("cta-mode") || "button",
			ctaHref: this.getAttribute("cta-href") || "./index.html",
			ctaLabel: this.getAttribute("cta-label") || "Snack toevoegen",
		};
	}

	/**
	 * The mobile drawer shares the same navigation contract as the desktop header,
	 * but its open state lives inside this custom element so every page can reuse
	 * the same header without page-specific overlay wiring.
	 *
	 * @param {boolean} isOpen
	 * @returns {void}
	 */
	setMobileMenuOpen(isOpen) {
		this.mobileMenuOpen = Boolean(isOpen);
		document.body.classList.toggle("site-mobile-menu-open", this.mobileMenuOpen);
		this.render();
	}

	/**
	 * Reuse the already-bound desktop controls for share and CTA actions so the
	 * mobile menu does not need a second copy of business logic on index.html.
	 *
	 * @param {string} elementId
	 * @returns {void}
	 */
	triggerExistingAction(elementId) {
		const target = this.querySelector(`#${elementId}`);
		if (target instanceof HTMLElement) {
			target.click();
		}
	}

	handleClick(event) {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		if (target.closest("[data-site-header-menu-toggle]")) {
			this.setMobileMenuOpen(!this.mobileMenuOpen);
			return;
		}

		if (
			target.closest("[data-site-header-menu-close]") ||
			target.matches("[data-site-header-menu-overlay]")
		) {
			this.setMobileMenuOpen(false);
			return;
		}

		if (target.closest("[data-site-header-share-action]")) {
			this.setMobileMenuOpen(false);
			this.triggerExistingAction("header-share-knop");
			return;
		}

		if (target.closest("[data-site-header-cta-action]")) {
			this.setMobileMenuOpen(false);
			this.triggerExistingAction("header-snack-toevoegen-knop");
			return;
		}

		if (target.closest("[data-site-header-mobile-link]")) {
			this.setMobileMenuOpen(false);
		}
	}

	handleKeyDown(event) {
		if (event.key === "Escape" && this.mobileMenuOpen) {
			this.setMobileMenuOpen(false);
		}
	}

	render() {
		const {
			logoHref,
			radHref,
			groupHref,
			helpHref,
			activeNav,
			shareMode,
			shareHref,
			ctaMode,
			ctaHref,
			ctaLabel,
		} = this.getConfig();

		const radClasses = activeNav === "rad"
			? "text-primary border-b-2 border-primary font-bold pb-2"
			: "text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200";
		const helpClasses = activeNav === "help"
			? "text-primary border-b-2 border-primary font-bold pb-2"
			: "text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200";
		const groupClasses = activeNav === "group"
			? "text-primary border-b-2 border-primary font-bold pb-2"
			: "text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200";
		const mobileMenuStateLabel = this.mobileMenuOpen ? "Sluit menu" : "Open menu";
		const radCurrent = activeNav === "rad" ? ' aria-current="page"' : "";
		const groupCurrent = activeNav === "group" ? ' aria-current="page"' : "";
		const helpCurrent = activeNav === "help" ? ' aria-current="page"' : "";

		const desktopShareMarkup = shareMode === "hidden"
			? ""
			: shareMode === "link"
				? `<a class="text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200" href="${shareHref}">Delen</a>`
				: `<button class="text-on-surface-variant font-medium pb-2 hover:text-primary transition-colors duration-200" id="header-share-knop" type="button">Delen</button>`;

		const desktopCtaMarkup = ctaMode === "hidden"
			? ""
			: ctaMode === "link"
				? `<a class="site-header__cta bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold shadow-[0_4px_0_0_#5e4200] hover:bg-primary hover:text-white transition-all active:translate-y-1 active:shadow-none inline-flex items-center justify-center" href="${ctaHref}">${ctaLabel}</a>`
				: `<button class="site-header__cta bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold shadow-[0_4px_0_0_#5e4200] hover:bg-primary hover:text-white transition-all active:translate-y-1 active:shadow-none" id="header-snack-toevoegen-knop" type="button">${ctaLabel}</button>`;

		const mobileShareMarkup = shareMode === "hidden"
			? ""
			: shareMode === "link"
				? `<a class="site-header__mobile-link" data-site-header-mobile-link href="${shareHref}">Delen</a>`
				: `<button class="site-header__mobile-link" data-site-header-share-action type="button">Delen</button>`;

		// Only expose CTA links in the mobile menu. Button CTAs on index are
		// intentionally hidden on mobile to keep the header focused on navigation.
		const mobileCtaMarkup = ctaMode === "link"
			? `<a class="site-header__mobile-link site-header__mobile-link--accent" data-site-header-mobile-link href="${ctaHref}">${ctaLabel}</a>`
			: "";

		this.innerHTML = `
			<header class="w-full h-20 bg-surface border-b-2 border-outline-variant shadow-sm sticky top-0 z-[100]">
				<div class="site-header__inner flex justify-between items-center px-6 md:px-12 max-w-screen-2xl mx-auto h-full">
					<a class="header-logo-link font-headline-md text-headline-md font-extrabold text-primary flex items-center gap-2" href="${logoHref}">
						<img alt="Rad van Patat Logo" class="h-12 w-auto object-contain" src="./assets/images/brand/rad-van-patat-logo.png"/>
					</a>
					<nav class="hidden lg:flex gap-md items-center h-full">
						<a class="${radClasses}" href="${radHref}"${radCurrent}>Rad</a>
						<a class="${groupClasses}" href="${groupHref}"${groupCurrent}>Groepsrad</a>
						${desktopShareMarkup}
						<a class="${helpClasses}" href="${helpHref}"${helpCurrent}>Help</a>
					</nav>
					<div class="site-header__actions hidden lg:flex items-center gap-md">
						${desktopCtaMarkup}
					</div>
					<button aria-expanded="${this.mobileMenuOpen ? "true" : "false"}" aria-label="${mobileMenuStateLabel}" class="site-header__menu-toggle lg:hidden w-12 h-12 rounded-full border-2 border-outline-variant bg-surface-container text-primary flex items-center justify-center" data-site-header-menu-toggle type="button">
						<span class="material-symbols-outlined" aria-hidden="true">${this.mobileMenuOpen ? "close" : "menu"}</span>
					</button>
				</div>
			</header>
			<div class="site-header__mobile-overlay ${this.mobileMenuOpen ? "flex" : "hidden"} lg:hidden" data-site-header-menu-overlay>
				<div aria-labelledby="site-header-mobile-title" aria-modal="true" class="site-header__mobile-panel" role="dialog">
					<div class="site-header__mobile-brand">
						<a class="header-logo-link" data-site-header-mobile-link href="${logoHref}">
							<img alt="Rad van Patat Logo" class="h-14 w-auto object-contain" src="./assets/images/brand/rad-van-patat-logo.png"/>
						</a>
						<p class="site-header__mobile-eyebrow" id="site-header-mobile-title">Menu</p>
					</div>
					<nav class="site-header__mobile-nav" aria-label="Mobiele navigatie">
						<a class="site-header__mobile-link ${activeNav === "rad" ? "site-header__mobile-link--active" : ""}" data-site-header-mobile-link href="${radHref}"${radCurrent}>Rad</a>
						<a class="site-header__mobile-link ${activeNav === "group" ? "site-header__mobile-link--active" : ""}" data-site-header-mobile-link href="${groupHref}"${groupCurrent}>Groepsrad</a>
						${mobileShareMarkup}
						<a class="site-header__mobile-link ${activeNav === "help" ? "site-header__mobile-link--active" : ""}" data-site-header-mobile-link href="${helpHref}"${helpCurrent}>Help</a>
						${mobileCtaMarkup}
					</nav>
					<div class="site-header__mobile-footer">
						<button class="site-header__mobile-close" data-site-header-menu-close type="button">Sluiten</button>
					</div>
				</div>
			</div>
		`;
	}
}

customElements.define("site-header", SiteHeader);
