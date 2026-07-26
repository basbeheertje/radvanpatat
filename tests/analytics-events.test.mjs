import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const analyticsSource = await readFile("src/frontend/assets/js/analytics.js", "utf8");

function createAnalyticsContext(withGtag = true, withConsent = true) {
	const calls = [];
	const window = {
		SnackRad: {},
		CookieConsent: {
			acceptedCategory(category) {
				return withConsent && category === "analytics";
			}
		}
	};
	if (withGtag) {
		window.gtag = function (...args) {
			calls.push(args);
		};
	}

	vm.runInNewContext(analyticsSource, { Object, Number, window });
	return { analytics: window.SnackRad.analytics, calls };
}

test("the GA4 adapter exposes stable names for every requested event", () => {
	const { analytics } = createAnalyticsContext();

	assert.deepEqual(
		Object.fromEntries(Object.entries(analytics.eventNames)),
		{
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
		}
	);
});

test("the GA4 adapter normalizes event parameters and ignores unsafe shapes", () => {
	const { analytics, calls } = createAnalyticsContext();
	const longSnackName = `  ${"Loaded fries ".repeat(12)}  `;

	assert.equal(analytics.trackEvent("SNACK_ADDED", {
		snack_name: longSnackName,
		available_snack_count: 15,
		nested_snack: { name: "must not be serialized" },
		invalid_number: Number.POSITIVE_INFINITY,
		InvalidKey: "must not be sent"
	}), true);
	assert.equal(calls.length, 1);
	assert.equal(calls[0][0], "event");
	assert.equal(calls[0][1], "snack_added");
	assert.deepEqual(
		Object.fromEntries(Object.entries(calls[0][2])),
		{
			snack_name: longSnackName.trim().replace(/\s+/g, " ").slice(0, 100),
			available_snack_count: 15
		}
	);
});

test("blocked analytics never interrupts application behavior", () => {
	const { analytics, calls } = createAnalyticsContext(false);

	assert.equal(analytics.trackEvent("SNACK_ADDED", { snack_name: "Kroket" }), false);
	assert.equal(analytics.trackEvent("UNKNOWN_EVENT"), false);
	assert.deepEqual(calls, []);
});

test("analytics events remain blocked until explicit consent exists", () => {
	const { analytics, calls } = createAnalyticsContext(true, false);

	assert.equal(analytics.trackEvent("SNACK_ADDED", { snack_name: "Kroket" }), false);
	assert.deepEqual(calls, []);
});

test("every requested interaction is connected to its owning frontend flow", async () => {
	const expectedHooks = new Map([
		["src/frontend/assets/js/roulette-ui.js", [
			"PATAT_OPINION_SELECTED",
			"FRIET_OPINION_SELECTED",
			"GROUP_MODE_SELECTED",
			"PERSONAL_MODE_SELECTED",
			"SHARE_MODAL_OPENED"
		]],
		["src/frontend/assets/js/roulette-init.js", [
			"EASTER_EGGS_ACTIVATED",
			"SNACK_ADDED"
		]],
		["src/frontend/assets/js/roulette-wheel.js", [
			"ROULETTE_SPIN_STARTED",
			"ROULETTE_SPIN_COMPLETED",
			"SNACK_REMOVED"
		]],
		["src/frontend/assets/js/roulette-easter-eggs.js", [
			"HARLEM_SHAKE_STARTED"
		]],
		["src/frontend/assets/js/group-order-page.js", [
			"GROUP_ORDER_STARTED"
		]]
	]);

	for (const [filePath, eventKeys] of expectedHooks) {
		const source = await readFile(filePath, "utf8");
		for (const eventKey of eventKeys) {
			assert.match(source, new RegExp(`["']${eventKey}["']`), `${eventKey} is missing from ${filePath}`);
		}
	}

	const parameterHooks = new Map([
		["src/frontend/assets/js/roulette-wheel.js", [
			"spin_mode",
			"snack_name",
			"snack_source",
			"available_snack_count"
		]],
		["src/frontend/assets/js/group-order-page.js", [
			"people_count",
			"requested_snack_count",
			"available_snack_count"
		]],
		["src/frontend/assets/js/roulette-init.js", [
			"snack_name",
			"available_snack_count"
		]]
	]);

	for (const [filePath, parameterNames] of parameterHooks) {
		const source = await readFile(filePath, "utf8");
		for (const parameterName of parameterNames) {
			assert.match(source, new RegExp(`\\b${parameterName}\\b`), `${parameterName} is missing from ${filePath}`);
		}
	}
});
