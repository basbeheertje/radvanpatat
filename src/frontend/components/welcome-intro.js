const INTRO_COOKIE_NAME = "rad-van-patat-welcome-intro";
const INTRO_VALIDITY_MS = 60 * 60 * 1000;
const INTRO_VALIDITY_SECONDS = INTRO_VALIDITY_MS / 1000;

function readCookieValue(cookieText, cookieName) {
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

/**
 * Determines whether the marketing intro is eligible for this page load.
 * The timestamp protects the one-hour rule even when a browser retains an
 * expired cookie slightly longer than its declared Max-Age. Localhost always
 * remains eligible so the animation can be reviewed during development.
 *
 * @param {string} cookieText
 * @param {number} now
 * @param {string} hostname
 * @returns {boolean}
 */
export function shouldShowWelcomeIntro(cookieText, now = Date.now(), hostname = "") {
	if (!shouldStoreWelcomeIntroCookie(hostname)) {
		return true;
	}

	const storedAt = Number.parseInt(readCookieValue(cookieText, INTRO_COOKIE_NAME), 10);
	if (!Number.isFinite(storedAt)) {
		return true;
	}

	const age = now - storedAt;
	return age >= INTRO_VALIDITY_MS;
}

/**
 * Keeps the cookie exception deliberately limited to the literal localhost
 * hostname; IP addresses and localhost subdomains retain production behavior.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
export function shouldStoreWelcomeIntroCookie(hostname) {
	return String(hostname || "").trim().toLowerCase() !== "localhost";
}

/**
 * Builds a site-wide, one-hour cookie. SameSite=Lax keeps the marker available
 * after external navigation without exposing it in third-party contexts.
 *
 * @param {number} now
 * @param {boolean} secure
 * @returns {string}
 */
export function buildWelcomeIntroCookie(now = Date.now(), secure = false) {
	const attributes = [
		`${encodeURIComponent(INTRO_COOKIE_NAME)}=${encodeURIComponent(now)}`,
		`Max-Age=${INTRO_VALIDITY_SECONDS}`,
		"Path=/",
		"SameSite=Lax"
	];

	if (secure) {
		attributes.push("Secure");
	}

	return attributes.join("; ");
}

function readDocumentCookie() {
	try {
		return document.cookie;
	} catch (error) {
		// Sandboxed or privacy-restricted contexts may deny cookie access. The
		// intro may repeat there, but it must never block the remaining frontend.
		return "";
	}
}

function markWelcomeIntroShown() {
	if (!shouldStoreWelcomeIntroCookie(window.location.hostname)) {
		return;
	}

	try {
		document.cookie = buildWelcomeIntroCookie(
			Date.now(),
			window.location.protocol === "https:"
		);
	} catch (error) {
		// Browsers without cookie access can still run and dismiss the intro;
		// only the one-hour suppression is unavailable in that context.
	}
}

const HTMLElementBase = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

class WelcomeIntro extends HTMLElementBase {
	constructor() {
		super();
		// Cleanup and timer state exist only while the overlay owns the viewport.
		// Both are cleared after dismissal so reconnecting remains harmless.
		this.cleanupIntro = null;
		this.dismissTimer = null;
	}

	connectedCallback() {
		if (
			this.shadowRoot ||
			!shouldShowWelcomeIntro(
				readDocumentCookie(),
				Date.now(),
				window.location.hostname
			)
		) {
			this.remove();
			return;
		}

		// Production registers on display rather than completion, while the
		// localhost exception deliberately leaves no marker between page loads.
		markWelcomeIntroShown();

		this.attachShadow({ mode: "open" });
		this.render();
		this.startIntro();
	}

	disconnectedCallback() {
		if (this.dismissTimer) {
			window.clearTimeout(this.dismissTimer);
			this.dismissTimer = null;
		}
		if (this.cleanupIntro) {
			this.cleanupIntro();
			this.cleanupIntro = null;
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					position: fixed;
					inset: 0;
					z-index: 10000;
					display: block;
					color: #21170f;
					font-family: "Space Grotesk", "Trebuchet MS", sans-serif;
				}

				.intro {
					position: absolute;
					inset: 0;
					display: grid;
					place-items: center;
					overflow: hidden;
					background: #ffffff;
					opacity: 1;
					transition: opacity 420ms ease, visibility 420ms ease;
				}

				.intro.is-leaving {
					visibility: hidden;
					opacity: 0;
				}

				.stage {
					position: relative;
					width: min(62rem, 100vw);
					height: min(35rem, 76vh);
					min-height: 25rem;
				}

				.brand {
					position: absolute;
					top: 46%;
					left: 50%;
					display: grid;
					place-items: center;
					will-change: transform, opacity, filter;
				}

				.brand--code {
					width: auto;
					height: 120px;
					opacity: 0;
					transform: translate(calc(-50% + 150vw), -50%);
				}

				.brand--code img {
					display: block;
					width: auto;
					height: 120px;
					max-width: none;
				}

				.brand--rad {
					width: clamp(15rem, 53vw, 25rem);
					opacity: 0;
					transform: translate(calc(-50% + 120vw), -50%) rotate(18deg) scale(0.72);
				}

				.brand--rad img {
					display: block;
					width: 100%;
					height: auto;
				}

				.impact {
					position: absolute;
					top: 44%;
					left: 48%;
					width: clamp(8rem, 25vw, 14rem);
					aspect-ratio: 1;
					border: 0.65rem solid #ffc928;
					border-radius: 50%;
					opacity: 0;
					transform: translate(-50%, -50%) scale(0.1);
				}

				.impact::before,
				.impact::after {
					position: absolute;
					inset: -2.25rem;
					border: 0.35rem dashed #ef3e2f;
					border-radius: 50%;
					content: "";
				}

				.impact::after {
					inset: -4rem;
					border-color: #f28c18;
					border-width: 0.2rem;
				}

				.intro.is-running .brand--code {
					animation:
						code-arrives 800ms 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
						code-ejected 560ms 1740ms cubic-bezier(0.65, 0, 0.85, 0.3) forwards;
				}

				.intro.is-running .brand--rad {
					animation: rad-strikes 1120ms 1200ms cubic-bezier(0.2, 0.78, 0.25, 1.08) forwards;
				}

				.intro.is-running .impact {
					animation: impact-burst 600ms 1700ms ease-out forwards;
				}

				@keyframes code-arrives {
					0% {
						opacity: 0;
						transform: translate(calc(-50% + 150vw), -50%);
					}
					70% {
						opacity: 1;
						transform: translate(calc(-50% - 50px), -50%);
					}
					100% {
						opacity: 1;
						transform: translate(-50%, -50%);
					}
				}

				@keyframes code-ejected {
					0% {
						opacity: 1;
						transform: translate(-50%, -50%);
					}
					30% {
						opacity: 1;
						transform: translate(calc(-50% - 3rem), -58%) rotate(-10deg) scale(0.94);
					}
					100% {
						opacity: 0;
						transform: translate(calc(-50% - 115vw), -105%) rotate(-38deg) scale(0.55);
					}
				}

				@keyframes rad-strikes {
					0% {
						opacity: 0;
						transform: translate(calc(-50% + 120vw), -50%) rotate(18deg) scale(0.72);
					}
					48% {
						opacity: 1;
						transform: translate(calc(-50% + 2rem), -50%) rotate(-4deg) scale(1.08);
					}
					62% {
						opacity: 1;
						transform: translate(calc(-50% - 1.6rem), -50%) rotate(-5deg) scale(1.1);
					}
					80% {
						opacity: 1;
						transform: translate(calc(-50% + 0.65rem), -50%) rotate(1.5deg) scale(0.98);
					}
					100% {
						opacity: 1;
						transform: translate(-50%, -50%) rotate(0) scale(1);
					}
				}

				@keyframes impact-burst {
					0% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(0.1) rotate(0);
					}
					25% {
						opacity: 0.9;
					}
					100% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(2.15) rotate(35deg);
					}
				}

				@media (max-width: 35rem) {
					.stage {
						height: 31rem;
					}

					.brand {
						top: 43%;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.intro {
						transition-duration: 180ms;
					}

					.intro.is-running .brand--code {
						animation: code-reduced 600ms ease forwards;
					}

					.intro.is-running .brand--rad {
						animation: rad-reduced 450ms 520ms ease-out forwards;
					}

					.intro.is-running .impact {
						display: none;
					}

					@keyframes code-reduced {
						0%,
						100% {
							opacity: 0;
							transform: translate(-50%, -50%) scale(0.95);
						}
						18%,
						75% {
							opacity: 1;
							transform: translate(-50%, -50%) scale(1);
						}
					}

					@keyframes rad-reduced {
						from {
							opacity: 0;
							transform: translate(-50%, -50%) scale(0.96);
						}
						to {
							opacity: 1;
							transform: translate(-50%, -50%) scale(1);
						}
					}
				}
			</style>

			<div class="intro" role="status" aria-label="De Code Kas presenteert het Rad van Patat">
				<div class="stage">
					<div class="brand brand--code">
						<img alt="De Code Kas" src="./assets/images/brand/logo-de-code-kas.png"/>
					</div>

					<span class="impact" aria-hidden="true"></span>

					<div class="brand brand--rad">
						<img alt="Rad van Patat" src="./assets/images/brand/rad-van-patat-logo-transparent.png"/>
					</div>

				</div>
			</div>
		`;
	}

	startIntro() {
		const intro = this.shadowRoot.querySelector(".intro");
		if (!intro) {
			this.remove();
			return;
		}

		const documentElementOverflow = document.documentElement.style.overflow;
		const bodyOverflow = document.body.style.overflow;
		const preventBackgroundTab = function (event) {
			if (event.key === "Tab") {
				event.preventDefault();
			}
		};

		// The overlay owns the viewport for only a few seconds. Restoring the
		// exact inline values avoids breaking modal or mobile-menu scroll locks.
		document.documentElement.style.overflow = "hidden";
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", preventBackgroundTab);
		this.cleanupIntro = function () {
			document.documentElement.style.overflow = documentElementOverflow;
			document.body.style.overflow = bodyOverflow;
			window.removeEventListener("keydown", preventBackgroundTab);
		};

		window.requestAnimationFrame(function () {
			window.requestAnimationFrame(function () {
				intro.classList.add("is-running");
			});
		});

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		this.dismissTimer = window.setTimeout(() => {
			this.dismissIntro();
		}, reducedMotion ? 1450 : 3200);
	}

	dismissIntro() {
		const intro = this.shadowRoot ? this.shadowRoot.querySelector(".intro") : null;
		if (!intro) {
			this.remove();
			return;
		}

		intro.classList.add("is-leaving");
		this.dismissTimer = window.setTimeout(() => {
			this.dismissTimer = null;
			this.remove();
		}, 450);
	}
}

function mountWelcomeIntro() {
	// Every page imports the shared registry; automatic mounting keeps the
	// integration in one reusable component instead of seven HTML copies.
	if (!document.querySelector("welcome-intro")) {
		document.body.append(document.createElement("welcome-intro"));
	}
}

if (typeof window !== "undefined" && typeof customElements !== "undefined") {
	if (!customElements.get("welcome-intro")) {
		customElements.define("welcome-intro", WelcomeIntro);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", mountWelcomeIntro, { once: true });
	} else {
		mountWelcomeIntro();
	}
}
