(function (window) {
	const app = window.SnackRad = window.SnackRad || {};
	const MAX_EVENT_NAME_LENGTH = 40;
	const MAX_PARAMETER_NAME_LENGTH = 40;
	const MAX_PARAMETER_VALUE_LENGTH = 100;

	/**
	 * Stable names let GA4 reports and explorations survive copy or UI changes.
	 * Separate choice events remain directly visible without custom dimensions.
	 */
	const eventNames = Object.freeze({
		PATAT_OPINION_SELECTED: "patat_opinion_selected",
		FRIET_OPINION_SELECTED: "friet_opinion_selected",
		EASTER_EGGS_ACTIVATED: "easter_eggs_activated",
		GROUP_MODE_SELECTED: "group_mode_selected",
		PERSONAL_MODE_SELECTED: "personal_mode_selected",
		ROULETTE_SPIN_STARTED: "roulette_spin_started",
		ROULETTE_SPIN_COMPLETED: "roulette_spin_completed",
		SHARE_MODAL_OPENED: "share_modal_opened",
		HARLEM_SHAKE_STARTED: "harlem_shake_started",
		GROUP_ORDER_STARTED: "group_order_started",
		SNACK_REMOVED: "snack_removed",
		SNACK_ADDED: "snack_added"
	});

	function normalizeParameterValue(value) {
		if (typeof value === "string") {
			return value.trim().replace(/\s+/g, " ").slice(0, MAX_PARAMETER_VALUE_LENGTH);
		}
		if (typeof value === "number") {
			return Number.isFinite(value) ? value : null;
		}
		if (typeof value === "boolean") {
			return value;
		}
		return null;
	}

	/**
	 * Only primitive, GA4-compatible values cross the analytics boundary.
	 * Dropping objects also prevents accidental URLs, images or person records
	 * from being serialized when a caller only intended to send a snack name.
	 *
	 * @param {object} parameters
	 * @returns {object}
	 */
	function normalizeParameters(parameters) {
		return Object.entries(parameters || {}).reduce(function (normalized, [name, value]) {
			const isValidName = /^[a-z][a-z0-9_]*$/.test(name) &&
				name.length <= MAX_PARAMETER_NAME_LENGTH;
			const normalizedValue = normalizeParameterValue(value);
			if (isValidName && normalizedValue !== null && normalizedValue !== "") {
				normalized[name] = normalizedValue;
			}
			return normalized;
		}, {});
	}

	/**
	 * Analytics must never interrupt the roulette flow when gtag is blocked by
	 * privacy software or unavailable during local development.
	 *
	 * @param {string} eventName
	 * @param {object} parameters
	 * @returns {boolean} Whether the event was handed to gtag.
	 */
	function track(eventName, parameters) {
		const isValidEventName = typeof eventName === "string" &&
			/^[a-z][a-z0-9_]*$/.test(eventName) &&
			eventName.length <= MAX_EVENT_NAME_LENGTH;
		// A present gtag queue is not proof of consent: the consent bootstrap
		// creates it locally before Google is allowed to receive any data.
		const hasAnalyticsConsent = window.CookieConsent &&
			typeof window.CookieConsent.acceptedCategory === "function" &&
			window.CookieConsent.acceptedCategory("analytics");
		if (!isValidEventName || !hasAnalyticsConsent || typeof window.gtag !== "function") {
			return false;
		}

		window.gtag("event", eventName, normalizeParameters(parameters));
		return true;
	}

	/**
	 * Callers use semantic keys instead of repeating GA4 event-name strings.
	 *
	 * @param {string} eventKey
	 * @param {object} parameters
	 * @returns {boolean}
	 */
	function trackEvent(eventKey, parameters) {
		const eventName = eventNames[eventKey];
		return eventName ? track(eventName, parameters) : false;
	}

	app.analytics = Object.freeze({
		eventNames: eventNames,
		normalizeParameters: normalizeParameters,
		track: track,
		trackEvent: trackEvent
	});
})(window);
