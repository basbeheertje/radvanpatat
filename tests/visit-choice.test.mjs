import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
	new URL("../src/frontend/assets/js/roulette-visit-choice.js", import.meta.url),
	"utf8"
);

function createVisitChoiceContext() {
	const storage = new Map();
	let writtenCookie = "";
	const document = {
		referrer: "",
		get cookie() {
			return writtenCookie;
		},
		set cookie(value) {
			writtenCookie = value;
		}
	};
	const window = {
		document,
		location: {
			href: "https://radvanpatat.nl/index.html",
			protocol: "https:"
		},
		localStorage: {
			getItem(key) {
				return storage.get(key) || null;
			},
			setItem(key, value) {
				storage.set(key, value);
			}
		},
		SnackRad: {
			config: {
				bezoekKeuzeCookieSleutel: "rad-van-patat-bezoekkeuze-getoond",
				bezoekKeuzeOpslagSleutel: "rad-van-patat-bezoekkeuze-tijdstip",
				bezoekKeuzeGeldigheidMs: 24 * 60 * 60 * 1000
			}
		}
	};
	const context = vm.createContext({
		Date,
		Number,
		URL,
		decodeURIComponent,
		document,
		encodeURIComponent,
		window
	});

	vm.runInContext(source, context);
	return {
		api: window.SnackRad.visitChoice,
		getWrittenCookie: function () {
			return writtenCookie;
		},
		storage
	};
}

test("same-domain navigation suppresses the daily visit choice", () => {
	const { api } = createVisitChoiceContext();
	const shouldShow = api.moetKeuzeTonen({
		referrer: "https://www.radvanpatat.nl/help.html",
		currentHref: "https://radvanpatat.nl/index.html",
		cookieText: "",
		storedAt: "",
		now: 1_750_000_000_000
	});

	assert.equal(shouldShow, false);
});

test("direct and external arrivals can see the visit choice", () => {
	const { api } = createVisitChoiceContext();
	const baseContext = {
		currentHref: "https://radvanpatat.nl/index.html",
		cookieText: "",
		storedAt: "",
		now: 1_750_000_000_000
	};

	assert.equal(api.moetKeuzeTonen({ ...baseContext, referrer: "" }), true);
	assert.equal(
		api.moetKeuzeTonen({ ...baseContext, referrer: "https://example.nl/snacks" }),
		true
	);
});

test("a recent cookie or local fallback suppresses the choice for 24 hours", () => {
	const { api } = createVisitChoiceContext();
	const now = 1_750_000_000_000;
	const recent = now - (23 * 60 * 60 * 1000);
	const baseContext = {
		referrer: "https://example.nl/",
		currentHref: "https://radvanpatat.nl/index.html",
		now
	};

	assert.equal(api.moetKeuzeTonen({
		...baseContext,
		cookieText: `rad-van-patat-bezoekkeuze-getoond=${recent}`,
		storedAt: ""
	}), false);
	assert.equal(api.moetKeuzeTonen({
		...baseContext,
		cookieText: "",
		storedAt: String(recent)
	}), false);
});

test("an expired marker allows the choice again", () => {
	const { api } = createVisitChoiceContext();
	const now = 1_750_000_000_000;
	const expired = now - (24 * 60 * 60 * 1000);

	assert.equal(api.moetKeuzeTonen({
		referrer: "",
		currentHref: "https://radvanpatat.nl/index.html",
		cookieText: `rad-van-patat-bezoekkeuze-getoond=${expired}`,
		storedAt: String(expired),
		now
	}), true);
});

test("showing the choice records a 24-hour cookie and local fallback", () => {
	const { api, getWrittenCookie, storage } = createVisitChoiceContext();
	const now = 1_750_000_000_000;

	api.markeerKeuzeGetoond(now);

	assert.match(getWrittenCookie(), /rad-van-patat-bezoekkeuze-getoond=1750000000000/);
	assert.match(getWrittenCookie(), /Max-Age=86400/);
	assert.match(getWrittenCookie(), /Path=\//);
	assert.match(getWrittenCookie(), /SameSite=Lax/);
	assert.match(getWrittenCookie(), /Secure/);
	assert.equal(storage.get("rad-van-patat-bezoekkeuze-tijdstip"), String(now));
});
