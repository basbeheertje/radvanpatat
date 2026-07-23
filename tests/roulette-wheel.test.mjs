import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("the wheel falls back to CSS when SVG Web Animations throws", async () => {
	const rotor = {
		style: {},
		animate() {
			throw new Error("SVG keyframes are not supported");
		},
		getBoundingClientRect() {
			return { width: 640 };
		}
	};
	const state = {
		alleSnacks: [{ name: "Kroket" }],
		wheelSpinning: false,
		wheelRotation: 0,
		wheelAnimation: null,
		actieveDrag: null,
		easterEggsActief: false,
		eggsKansPercentage: 0
	};
	const document = {
		body: { classList: { add() {}, remove() {} } },
		getElementById(id) {
			if (id === "wheel-rotor") {
				return rotor;
			}
			return null;
		},
		querySelector() {
			return null;
		},
		createElementNS() {
			return {};
		}
	};
	const context = vm.createContext({
		console,
		document,
		Math,
		Promise,
		setTimeout,
		URL,
		window: {
			document,
			setTimeout,
			SnackRad: {
				config: {
					kleuren: ["#ffb800"],
					randKleuren: ["#7c5800"],
					easterEggBerichten: []
				},
				core: {},
				state,
				ui: { closeModal() {}, showResult() {}, showEasterEggResult() {} }
			}
		}
	});
	const source = fs.readFileSync(
		new URL("../src/frontend/assets/js/roulette-wheel.js", import.meta.url),
		"utf8"
	);

	vm.runInContext(source, context);
	const result = await context.window.SnackRad.wheel.spinRandom({
		duration: 120,
		showResult: false
	});
	const secondResult = await context.window.SnackRad.wheel.spinRandom({
		duration: 120,
		showResult: false
	});

	assert.equal(result.snack.name, "Kroket");
	assert.equal(secondResult.snack.name, "Kroket");
	assert.equal(state.wheelSpinning, false);
	assert.match(rotor.style.transform, /^rotate\(.+deg\)$/);
});
