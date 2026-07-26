import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const rouletteCoreSource = await readFile("src/frontend/assets/js/roulette-core.js", "utf8");

function encodeBase64Url(value) {
	return Buffer.from(value, "utf8")
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

function createCoreContext({ search = "", storageEntries = {} } = {}) {
	const storage = new Map(Object.entries(storageEntries));
	const localStorage = {
		getItem(key) {
			return storage.has(key) ? storage.get(key) : null;
		},
		setItem(key, value) {
			storage.set(key, String(value));
		},
		removeItem(key) {
			storage.delete(key);
		}
	};
	const window = {
		location: {
			search,
			href: `https://radvanpatat.nl/index.html${search}`
		},
		localStorage,
		crypto: {
			randomUUID() {
				return `uuid-${storage.size}-${Math.random().toString(36).slice(2, 8)}`;
			}
		}
	};
	const context = {
		Audio: function () {},
		Date,
		JSON,
		Math,
		URL,
		URLSearchParams,
		atob(value) {
			return Buffer.from(value, "base64").toString("binary");
		},
		btoa(value) {
			return Buffer.from(value, "binary").toString("base64");
		},
		document: {
			getElementById() {
				return null;
			}
		},
		localStorage,
		window
	};

	vm.runInNewContext(rouletteCoreSource, context);

	return {
		core: window.SnackRad.core,
		state: window.SnackRad.state,
		storage
	};
}

test("legacy single-wheel storage migrates into one saved wheel", () => {
	const { core } = createCoreContext({
		storageEntries: {
			"rad-van-patat-roulette-snacks": JSON.stringify([{ name: "Kroket", image: "", isCustom: false }])
		}
	});

	const wheels = core.listRads();

	assert.equal(wheels.length, 1);
	assert.equal(wheels[0].name, "Standaard snacks");
	assert.deepEqual(wheels[0].snacks.map((snack) => snack.name), ["Kroket"]);
	assert.equal(core.getActiefRad().id, wheels[0].id);
});

test("wheel names stay unique within the browser", () => {
	const { core } = createCoreContext();

	core.createRad({ name: "Vrijdagmiddag", snacks: core.getDefaultSnacks() });

	assert.throws(
		() => core.createRad({ name: " vrijdagmiddag ", snacks: core.getDefaultSnacks() }),
		/de radnaam moet uniek zijn binnen deze browser/i
	);
});

test("persisting snacks writes only to the active wheel", () => {
	const { core, state } = createCoreContext();
	const firstWheel = core.getActiefRad();
	const secondWheel = core.createRad({
		name: "Movie night",
		snacks: [{ name: "Mexicano", image: "", isCustom: true }]
	});

	core.setActiefRad(secondWheel.id);
	state.alleSnacks = [
		{ name: "Bitterbal", image: "", isCustom: false },
		{ name: "Kaassouffle", image: "", isCustom: false }
	];
	core.persistSnacks();

	assert.deepEqual(core.getRadOpId(secondWheel.id).snacks.map((snack) => snack.name), ["Bitterbal", "Kaassouffle"]);
	assert.notDeepEqual(core.getRadOpId(firstWheel.id).snacks.map((snack) => snack.name), ["Bitterbal", "Kaassouffle"]);
});

test("shared wheel links override runtime snacks without replacing the active wheel", () => {
	const payload = encodeBase64Url(JSON.stringify({
		v: 1,
		s: [{ name: "Loempia", image: "", isCustom: false }]
	}));
	const { core, state } = createCoreContext({
		search: `?rad=${payload}`
	});
	const activeWheel = core.getActiefRad();

	core.loadInitialSnacks();

	assert.equal(activeWheel.name, "Standaard snacks");
	assert.deepEqual(state.alleSnacks.map((snack) => snack.name), ["Loempia"]);
	assert.notDeepEqual(activeWheel.snacks.map((snack) => snack.name), ["Loempia"]);
});

test("personal wheel usage increments the active wheel spin counter", () => {
	const { core } = createCoreContext();
	const activeWheel = core.getActiefRad();

	core.noteActiefRadGebruik();
	core.noteActiefRadGebruik();

	assert.equal(core.getRadOpId(activeWheel.id).spinCount, activeWheel.spinCount + 2);
});
