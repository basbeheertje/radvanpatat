import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
	new URL("../src/frontend/assets/js/roulette-easter-eggs.js", import.meta.url),
	"utf8"
);

function createClassList() {
	const values = new Set();
	return {
		add(...names) {
			names.forEach(function (name) {
				values.add(name);
			});
		},
		remove(...names) {
			names.forEach(function (name) {
				values.delete(name);
			});
		},
		contains(name) {
			return values.has(name);
		}
	};
}

function createEasterEggContext(active = false) {
	const body = { classList: createClassList() };
	const commandBar = {
		classList: createClassList(),
		setAttribute() {}
	};
	const commandInput = {
		value: "",
		focus() {},
		select() {}
	};
	const elements = {
		"easter-egg-command-bar": commandBar,
		"easter-egg-command-input": commandInput
	};
	const state = { easterEggsActief: active };
	const toastMessages = [];
	let nextTimerId = 0;
	const timeoutCallbacks = [];
	const window = {
		SnackRad: {
			state,
			ui: {
				toonToast(message, variant) {
					toastMessages.push({ message, variant });
				}
			}
		},
		clearTimeout() {},
		matchMedia() {
			return { matches: false };
		},
		requestAnimationFrame(callback) {
			callback();
		},
		setTimeout(callback) {
			nextTimerId += 1;
			timeoutCallbacks.push(callback);
			return nextTimerId;
		}
	};
	const document = {
		activeElement: null,
		body,
		getElementById(id) {
			return elements[id] || null;
		}
	};
	const context = vm.createContext({
		Object,
		document,
		window
	});

	vm.runInContext(source, context);
	return {
		api: window.SnackRad.easterEggs,
		body,
		commandBar,
		state,
		toastMessages,
		runTimeouts() {
			timeoutCallbacks.splice(0).forEach(function (callback) {
				callback();
			});
		}
	};
}

test("commands are normalized and shake is registered", () => {
	const { api } = createEasterEggContext();

	assert.equal(api.normaliseerCommando("  ShAkE  "), "shake");
	assert.equal(api.isBekendCommando("SHAKE"), true);
	assert.equal(api.isBekendCommando("unknown"), false);
});

test("the console and commands remain blocked until eggs are enabled", () => {
	const { api, body } = createEasterEggContext(false);

	assert.equal(api.openCommandBar(), false);
	assert.equal(api.voerCommandoUit("shake"), false);
	assert.equal(body.classList.contains("harlem-shake-active"), false);
});

test("shake starts the solo phase when eggs are enabled", () => {
	const { api, body, runTimeouts, toastMessages } = createEasterEggContext(true);

	assert.equal(api.voerCommandoUit(" SHAKE "), true);
	assert.equal(body.classList.contains("harlem-shake-active"), true);
	assert.equal(body.classList.contains("harlem-shake-intro"), true);
	assert.deepEqual(toastMessages, [{
		message: "Harlem Shake! Druk Esc om te stoppen.",
		variant: "positive"
	}]);

	// Completing the intro timer changes phase but deliberately does not stop
	// the effect; only the explicit Escape path calls stopHarlemShake.
	runTimeouts();
	assert.equal(body.classList.contains("harlem-shake-active"), true);
	assert.equal(body.classList.contains("harlem-shake-intro"), false);
	assert.equal(body.classList.contains("harlem-shake-party"), true);

	api.deactivate();
	assert.equal(body.classList.contains("harlem-shake-active"), true);

	api.stopHarlemShake();
	assert.equal(body.classList.contains("harlem-shake-active"), false);
	assert.equal(body.classList.contains("harlem-shake-intro"), false);
	assert.equal(body.classList.contains("harlem-shake-party"), false);
});
