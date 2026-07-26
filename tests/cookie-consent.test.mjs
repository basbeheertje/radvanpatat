import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const consentSource = await readFile("src/frontend/assets/js/cookie-consent.js", "utf8");

function createConsentContext({
	language = "nl-NL",
	hostname = "radvanpatat.nl",
	readyState = "loading"
} = {}) {
	const appendedScripts = [];
	const eventListeners = new Map();
	const configCalls = [];
	let preferenceShows = 0;
	const document = {
		readyState,
		body: readyState === "loading" ? null : {},
		head: {
			appendChild(element) {
				appendedScripts.push(element);
			}
		},
		addEventListener(name, callback) {
			const listeners = eventListeners.get(name) || [];
			listeners.push(callback);
			eventListeners.set(name, listeners);
		},
		querySelectorAll() {
			return [];
		},
		getElementById(id) {
			return appendedScripts.find((script) => script.id === id) || null;
		},
		createElement(tagName) {
			return { tagName };
		}
	};
	const window = {
		location: { hostname },
		navigator: { language },
		CookieConsent: {
			run(config) {
				configCalls.push(config);
			},
			acceptedCategory() {
				return false;
			},
			showPreferences() {
				preferenceShows += 1;
			}
		}
	};

	vm.runInNewContext(consentSource, {
		Date,
		JSON,
		Math,
		Object,
		RegExp,
		String,
		document,
		encodeURIComponent,
		window
	});

	return {
		appendedScripts,
		config: configCalls[0],
		eventListeners,
		fireDOMContentLoaded() {
			document.readyState = "interactive";
			document.body = {};
			for (const listener of eventListeners.get("DOMContentLoaded") || []) {
				listener();
			}
			return configCalls[0];
		},
		get preferenceShows() {
			return preferenceShows;
		},
		window
	};
}

test("CookieConsent waits for the parsed body before rendering the modal", () => {
	const context = createConsentContext();

	assert.equal(context.config, undefined);
	assert.equal(context.eventListeners.get("DOMContentLoaded").length > 0, true);
	assert.equal(context.fireDOMContentLoaded().mode, "opt-in");
});

test("Google Analytics is opt-in and no remote tag loads before consent", () => {
	const { appendedScripts, window, fireDOMContentLoaded } = createConsentContext();
	const config = fireDOMContentLoaded();

	assert.equal(config.mode, "opt-in");
	assert.equal(config.categories.necessary.enabled, true);
	assert.equal(config.categories.necessary.readOnly, true);
	assert.equal(config.categories.analytics.enabled, undefined);
	assert.equal(window["ga-disable-G-FDRQ5JB0WX"], true);
	assert.deepEqual(appendedScripts, []);

	config.categories.analytics.services.googleAnalytics.onAccept();

	assert.equal(window["ga-disable-G-FDRQ5JB0WX"], false);
	assert.equal(appendedScripts.length, 1);
	assert.equal(appendedScripts[0].id, "rad-van-patat-google-analytics");
	assert.equal(
		appendedScripts[0].src,
		"https://www.googletagmanager.com/gtag/js?id=G-FDRQ5JB0WX"
	);

	config.categories.analytics.services.googleAnalytics.onAccept();
	assert.equal(appendedScripts.length, 1, "the Google tag must load at most once");
});

test("Google Analytics is never initialized outside radvanpatat.nl", () => {
	for (const hostname of ["localhost", "127.0.0.1", "preview.radvanpatat.nl", "www.radvanpatat.nl", ""]) {
		const { appendedScripts, fireDOMContentLoaded, window } = createConsentContext({ hostname });
		const config = fireDOMContentLoaded();

		assert.equal(window.SnackRadConsent.isGoogleAnalyticsHostname(hostname), false);
		assert.equal(window.gtag, undefined);
		assert.equal(window.dataLayer, undefined);
		assert.equal(config.categories.analytics.services.googleAnalytics.onAccept(), false);
		assert.equal(window["ga-disable-G-FDRQ5JB0WX"], true);
		assert.deepEqual(appendedScripts, []);
	}
});

test("the canonical production hostname comparison is normalized", () => {
	const { window } = createConsentContext({ hostname: "RADVANPATAT.NL", readyState: "complete" });

	assert.equal(window.SnackRadConsent.analyticsHostname, "radvanpatat.nl");
	assert.equal(window.SnackRadConsent.isGoogleAnalyticsHostname(" RADVANPATAT.NL "), true);
});

test("withdrawing consent disables measurement and clears every GA cookie", () => {
	const { fireDOMContentLoaded, window } = createConsentContext();
	const config = fireDOMContentLoaded();
	const analytics = config.categories.analytics;

	assert.equal(analytics.autoClear.cookies.length, 1);
	assert.equal(analytics.autoClear.cookies[0].name.test("_ga"), true);
	assert.equal(analytics.autoClear.cookies[0].name.test("_ga_FDRQ5JB0WX"), true);

	analytics.services.googleAnalytics.onAccept();
	analytics.services.googleAnalytics.onReject();

	assert.equal(window["ga-disable-G-FDRQ5JB0WX"], true);
	const consentUpdates = window.dataLayer
		.map((entry) => Array.from(entry))
		.filter((entry) => entry[0] === "consent" && entry[1] === "update");
	assert.equal(consentUpdates.at(-1)[2].analytics_storage, "denied");
});

test("the cookie inventory drives translations and consent revision", () => {
	const { fireDOMContentLoaded, window } = createConsentContext({ language: "de-DE" });
	const config = fireDOMContentLoaded();
	const consent = window.SnackRadConsent;

	assert.deepEqual(Object.keys(config.language.translations).sort(), ["de", "en", "es", "nl", "pl"]);
	assert.equal(config.language.autoDetect, "browser");
	assert.equal(config.revision, consent.revision);
	assert.ok(consent.revision > 0);

	for (const locale of ["nl", "en", "es", "pl", "de"]) {
		const translation = config.language.translations[locale];
		assert.ok(translation.consentModal.acceptAllBtn);
		assert.ok(translation.consentModal.acceptNecessaryBtn);
		assert.equal(translation.preferencesModal.sections.length, 4);
		assert.equal(
			translation.preferencesModal.sections[1].cookieTable.body.length,
			consent.inventory.necessary.length
		);
		assert.equal(
			translation.preferencesModal.sections[2].cookieTable.body.length,
			consent.inventory.analytics.length
		);
	}

	const expandedInventory = {
		necessary: Array.from(consent.inventory.necessary),
		analytics: [
			...Array.from(consent.inventory.analytics),
			{
				name: "_example",
				type: "cookie",
				provider: "Example",
				duration: "oneDay",
				purpose: "analyticsSession"
			}
		]
	};
	assert.notEqual(consent.deriveInventoryRevision(expandedInventory), consent.revision);
});

test("every project-owned browser storage key is declared in the inventory", async () => {
	const { window } = createConsentContext({ readyState: "complete" });
	const sourceDirectories = [
		"src/frontend/assets/js",
		"src/frontend/components"
	];
	const sourcePaths = (
		await Promise.all(sourceDirectories.map(async (directory) => {
			const fileNames = await readdir(directory);
			return fileNames
				.filter((fileName) => fileName.endsWith(".js") && fileName !== "cookie-consent.js")
				.map((fileName) => `${directory}/${fileName}`);
		}))
	).flat();
	const sources = await Promise.all(sourcePaths.map((filePath) => readFile(filePath, "utf8")));
	const discoveredKeys = new Set(
		sources
			.flatMap((source) => source.match(/rad-van-patat-[a-z0-9-]+/g) || [])
			.filter((key) => !key.includes("logo"))
	);
	const declaredKeys = new Set(
		Object.values(window.SnackRadConsent.inventory)
			.flatMap((entries) => Array.from(entries))
			.map((entry) => entry.name)
	);

	for (const key of discoveredKeys) {
		assert.equal(
			declaredKeys.has(key),
			true,
			`${key} must be described in the generated consent inventory`
		);
	}
});

test("the shared footer exposes a persistent consent withdrawal control", async () => {
	const footerSource = await readFile(
		"src/frontend/components/site-footer-designed-by.js",
		"utf8"
	);

	assert.match(footerSource, /data-cookie-settings/);
	assert.match(footerSource, /data-cookie-settings-label/);
});

test("a late-rendered footer control opens the preferences modal", () => {
	const context = createConsentContext();
	context.fireDOMContentLoaded();
	let prevented = false;

	context.eventListeners.get("click")[0]({
		target: {
			closest(selector) {
				return selector === "[data-cookie-settings]" ? {} : null;
			}
		},
		preventDefault() {
			prevented = true;
		}
	});

	assert.equal(prevented, true);
	assert.equal(context.preferenceShows, 1);
});
