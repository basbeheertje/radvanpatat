(function (window) {
	const app = window.SnackRad;
	const config = app.config;

	function normaliseerHostnaam(hostname) {
		return String(hostname || "").trim().toLowerCase().replace(/^www\./, "");
	}

	/**
	 * Compares referrer and current hostnames without ports or the conventional
	 * `www` alias. An empty referrer represents a direct/external visit.
	 *
	 * @param {string} referrer
	 * @param {string} currentHref
	 * @returns {boolean}
	 */
	function heeftZelfdeDomeinVerwijzer(referrer, currentHref) {
		if (!referrer) {
			return false;
		}

		try {
			const referrerUrl = new URL(referrer);
			const currentUrl = new URL(currentHref);
			return normaliseerHostnaam(referrerUrl.hostname) === normaliseerHostnaam(currentUrl.hostname);
		} catch (error) {
			// Invalid or non-URL referrer values are untrusted and must not
			// suppress a prompt intended for external arrivals.
			return false;
		}
	}

	function leesCookieWaarde(cookieText, cookieName) {
		const prefix = `${encodeURIComponent(cookieName)}=`;
		const cookie = String(cookieText || "")
			.split(";")
			.map(function (part) {
				return part.trim();
			})
			.find(function (part) {
				return part.startsWith(prefix);
			});
		return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
	}

	function isRecenteTijdstempel(value, now) {
		const timestamp = Number.parseInt(value, 10);
		if (!Number.isFinite(timestamp)) {
			return false;
		}

		const age = now - timestamp;
		return age >= 0 && age < config.bezoekKeuzeGeldigheidMs;
	}

	function leesLokaleTijdstempel() {
		try {
			return window.localStorage.getItem(config.bezoekKeuzeOpslagSleutel) || "";
		} catch (error) {
			return "";
		}
	}

	/**
	 * Applies both eligibility rules: internal navigation suppresses the prompt,
	 * and an external/direct visitor sees it at most once per rolling 24 hours.
	 *
	 * @param {{referrer?: string, currentHref?: string, cookieText?: string, storedAt?: string, now?: number}} context
	 * @returns {boolean}
	 */
	function moetKeuzeTonen(context) {
		const waarden = context || {};
		const now = Number.isFinite(waarden.now) ? waarden.now : Date.now();
		const referrer = typeof waarden.referrer === "string" ? waarden.referrer : document.referrer;
		const currentHref = typeof waarden.currentHref === "string" ? waarden.currentHref : window.location.href;
		const cookieText = typeof waarden.cookieText === "string" ? waarden.cookieText : document.cookie;
		const storedAt = typeof waarden.storedAt === "string" ? waarden.storedAt : leesLokaleTijdstempel();

		if (heeftZelfdeDomeinVerwijzer(referrer, currentHref)) {
			return false;
		}

		const cookieTimestamp = leesCookieWaarde(cookieText, config.bezoekKeuzeCookieSleutel);
		return !isRecenteTijdstempel(cookieTimestamp, now) &&
			!isRecenteTijdstempel(storedAt, now);
	}

	/**
	 * Marks the moment the modal is shown, rather than the eventual answer, so
	 * refreshing an open prompt cannot show it repeatedly.
	 *
	 * @param {number} now
	 * @returns {void}
	 */
	function markeerKeuzeGetoond(now) {
		const timestamp = Number.isFinite(now) ? now : Date.now();
		const maxAgeSeconds = Math.floor(config.bezoekKeuzeGeldigheidMs / 1000);
		const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";

		try {
			document.cookie = [
				`${encodeURIComponent(config.bezoekKeuzeCookieSleutel)}=${encodeURIComponent(timestamp)}`,
				`Max-Age=${maxAgeSeconds}`,
				"Path=/",
				"SameSite=Lax"
			].join("; ") + secureAttribute;
		} catch (error) {
			// localStorage below remains a best-effort fallback when cookies are
			// disabled or unavailable in a local file context.
		}

		try {
			window.localStorage.setItem(config.bezoekKeuzeOpslagSleutel, String(timestamp));
		} catch (error) {
			// The prompt may reappear when all browser storage is disabled, but
			// the visitor must still be able to choose a mode for this visit.
		}
	}

	app.visitChoice = {
		heeftZelfdeDomeinVerwijzer: heeftZelfdeDomeinVerwijzer,
		moetKeuzeTonen: moetKeuzeTonen,
		markeerKeuzeGetoond: markeerKeuzeGetoond
	};
})(window);
