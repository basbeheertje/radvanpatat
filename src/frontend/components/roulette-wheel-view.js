class RouletteWheelView extends HTMLElement {
	/**
	 * Renders once because roulette-wheel.js mutates the rotor after connection;
	 * reconnecting must not discard its current segments or rotation.
	 *
	 * @returns {void}
	 */
	connectedCallback() {
		if (this.dataset.rendered === "true") {
			return;
		}

		this.dataset.rendered = "true";
		const showFloatingSnacks = this.hasAttribute("show-floating-snacks");
		const floatingSnacks = showFloatingSnacks
			? `
				<div class="absolute -right-4 md:-right-8 top-8 md:top-12 z-10 animate-snack-float bg-white p-2 rounded-xl shadow-lg border-2 border-primary-container w-24 h-24 md:w-28 md:h-28 hidden xl:block">
					<div class="w-full h-full rounded-lg overflow-hidden relative">
						<img alt="Frikandel" class="w-full h-full object-cover" src="./assets/images/snacks/frikandel.png"/>
						<div class="absolute -top-1 -right-1 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-label-sm text-label-sm border-2 border-white shadow-sm">Top</div>
					</div>
				</div>
				<div class="snack-float-delayed absolute -left-8 md:-left-12 bottom-12 md:bottom-20 z-10 animate-snack-float bg-white p-2 rounded-xl shadow-lg border-2 border-primary-container w-28 h-28 md:w-32 md:h-32 hidden xl:block">
					<div class="w-full h-full rounded-lg overflow-hidden relative">
						<img alt="Kaassoufflé" class="w-full h-full object-contain bg-white" src="./assets/images/snacks/kaassoufle.png"/>
						<div class="absolute -top-1 -right-1 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-label-sm text-label-sm border-2 border-white shadow-sm">Nu</div>
					</div>
				</div>
			`
			: "";

		// Keep all wheel IDs in one light-DOM component because roulette-wheel.js
		// intentionally owns one wheel per page and resolves these stable hooks.
		this.innerHTML = `
			<div class="roulette-wheel-spotlight"></div>
			<div class="roulette-wheel-shell">
				<div class="roulette-wheel-pointer" aria-hidden="true">
					<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
						<path d="M50 6 C71 6 86 21 86 40 C86 51 82 60 75 70 L56 112 C54 116 50 118 46 112 L25 70 C18 60 14 51 14 40 C14 21 29 6 50 6 Z" fill="#EF3E2F" stroke="#21170F" stroke-width="6" stroke-linejoin="round"/>
						<circle cx="50" cy="34" r="14" fill="#FFFFFF" stroke="#21170F" stroke-width="5"/>
					</svg>
				</div>
				<div class="roulette-wheel-stage">
					<div id="wheel-shell">
						<svg id="wheel-svg" viewBox="0 0 640 640" role="img" aria-labelledby="wheel-svg-title wheel-svg-desc">
							<title id="wheel-svg-title">Rad van Patat snackrad</title>
							<desc id="wheel-svg-desc">Een interactief roulettewiel in de stijl van het Rad van Patat-logo.</desc>
							<g id="wheel-rotor"></g>
							<circle id="wheel-hit-area" cx="320" cy="320" r="260" fill="transparent"></circle>
						</svg>
					</div>
				</div>
				${floatingSnacks}
			</div>
		`;
	}
}

customElements.define("roulette-wheel-view", RouletteWheelView);
