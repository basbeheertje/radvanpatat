export const PATAT_OPINION_STORAGE_KEY = "rad-van-patat-friet-of-patat";

export const PATAT_BANNER_MESSAGES = Object.freeze([
	"Deze persoon denkt dat het patat is.... huil huil huil",
	"Alarm: hier woont iemand die 'patat' zegt.",
	"Wij weten beter. Deze persoon koos toch voor patat.",
	"Triest nieuws: deze persoon noemt friet dus patat."
]);

/**
 * Keep privacy-restricted storage from blocking page initialization. A missing
 * opinion hides the banner and leaves the rest of the shared layout available.
 *
 * @param {Storage | null | undefined} storage
 * @returns {"friet" | "patat" | null}
 */
export function readStoredOpinion(storage) {
	try {
		const opinion = storage?.getItem(PATAT_OPINION_STORAGE_KEY);
		return opinion === "friet" || opinion === "patat" ? opinion : null;
	} catch (error) {
		return null;
	}
}

/**
 * Select a bounded message from a random value so tests and callers cannot
 * accidentally address outside the configured banner copy.
 *
 * @param {string | null} opinion
 * @param {number} randomValue
 * @returns {string}
 */
export function selectPatatBannerMessage(opinion, randomValue = Math.random()) {
	if (opinion !== "patat") {
		return "";
	}

	const normalizedRandomValue = Number.isFinite(randomValue)
		? Math.min(Math.max(randomValue, 0), 0.999999999)
		: 0;
	const index = Math.floor(normalizedRandomValue * PATAT_BANNER_MESSAGES.length);
	return PATAT_BANNER_MESSAGES[index];
}

const HTMLElementBase = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

class PatatBanner extends HTMLElementBase {
	static get observedAttributes() {
		return ["data-opinion"];
	}

	connectedCallback() {
		this.id = this.id || "patat-banner";
		this.classList.add("patat-banner");
		this.setAttribute("role", "note");
		this.render();
	}

	attributeChangedCallback() {
		if (this.isConnected) {
			this.render();
		}
	}

	/**
	 * An explicit attribute reflects a choice made on index.html immediately;
	 * other pages fall back to the site-wide localStorage opinion.
	 */
	render() {
		const explicitOpinion = this.getAttribute("data-opinion");
		const opinion = explicitOpinion || this.readBrowserOpinion();
		const message = selectPatatBannerMessage(opinion);

		this.textContent = message;
		this.classList.toggle("bottom-opinion-banner-hidden", !message);
	}

	/**
	 * Access to the localStorage property itself can fail in restricted browser
	 * contexts, before its methods are called, so the component guards both.
	 */
	readBrowserOpinion() {
		try {
			return readStoredOpinion(window.localStorage);
		} catch (error) {
			return null;
		}
	}
}

function mountPatatBanner() {
	// app.js is shared by every page, so automatic mounting keeps one banner ID
	// available site-wide without repeating page-specific integration markup.
	if (!document.getElementById("patat-banner")) {
		document.body.append(document.createElement("patat-banner"));
	}
}

if (typeof window !== "undefined" && typeof customElements !== "undefined") {
	if (!customElements.get("patat-banner")) {
		customElements.define("patat-banner", PatatBanner);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", mountPatatBanner, { once: true });
	} else {
		mountPatatBanner();
	}
}
