(function (window) {
	const app = window.SnackRad;
	const core = app.core;
	const ui = app.ui;
	const wheel = app.wheel;
	const state = app.state;

	function bindOverlayClose(overlayId, onClose) {
		document.getElementById(overlayId).addEventListener("click", function (event) {
			if (event.target === this) {
				onClose();
			}
		});
	}

	function handleSnackSubmit(event) {
		event.preventDefault();

		const naam = document.getElementById("snack-naam").value.trim();
		const foto = document.getElementById("snack-foto").value.trim();

		if (!naam) {
			return;
		}

		if (core.bestaatSnackAl(naam)) {
			ui.toonToast("Snack bestaat al");
			return;
		}

		const snack = core.normaliseerSnack({ name: naam, image: foto, isCustom: true });
		if (!snack) {
			ui.toonToast("Snack is ongeldig");
			return;
		}

		if (core.bestaatSnackAl(snack.name)) {
			ui.toonToast("Snack bestaat al");
			return;
		}

		if (foto && !snack.image) {
			ui.toonToast("Gebruik een geldige http(s)-foto-URL");
			return;
		}

		state.alleSnacks.push(snack);
		core.persistSnacks();
		wheel.addSnackSegment(snack);
		event.currentTarget.reset();
		ui.closeSnackFormulier();
	}

	function handleCanvasPointerDown(event) {
		if (state.wheelSpinning) {
			return;
		}

		const segmentIndex = wheel.getSegmentIndexFromPointer(event.clientX, event.clientY);
		if (!segmentIndex || !state.theWheel.segments[segmentIndex] || !state.theWheel.segments[segmentIndex].snack) {
			return;
		}

		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		wheel.startDrag(segmentIndex, event.clientX, event.clientY);
	}

	function handleKeyDown(event) {
		if (event.key === "F5") {
			event.preventDefault();
			wheel.resetAndStart();
		}

		if (event.shiftKey && (event.key === "+" || event.key === "=")) {
			event.preventDefault();
			ui.openSnackFormulier();
		}

		if (event.key && event.key.length === 1) {
			state.easterEggBuffer = `${state.easterEggBuffer}${event.key.toLowerCase()}`.slice(-4);
			if (state.easterEggBuffer === "eggs") {
				state.easterEggsActief = !state.easterEggsActief;
				ui.updateEggsKansBeschikbaarheid();
				ui.toonEggsToast();
				state.easterEggBuffer = "";
			}
		}

		if (event.key === "Escape") {
			ui.closeModal();
			ui.closeSnackFormulier();
			ui.closeShareOverlay();
		}
	}

	function bindEvents() {
		[
			["spin-knop", wheel.resetAndStart],
			["spin-knop-mobiel", wheel.resetAndStart],
			["header-share-knop", ui.openShareOverlay],
			["share-open-knop", ui.openShareOverlay],
			["share-open-knop-mobiel", ui.openShareOverlay],
			["share-sluiten-knop", ui.closeShareOverlay],
			["share-sluiten-tekstknop", ui.closeShareOverlay],
			["share-kopieer-knop", ui.kopieerShareLink],
			["result-close-knop", ui.closeModal],
			["header-snack-toevoegen-knop", ui.openSnackFormulier],
			["snack-toevoegen-knop-desktop", ui.openSnackFormulier],
			["snack-toevoegen-knop-mobiel", ui.openSnackFormulier],
			["snack-formulier-sluiten", ui.closeSnackFormulier]
		].forEach(function ([elementId, handler]) {
			document.getElementById(elementId).addEventListener("click", handler);
		});

		document.getElementById("btn-friet").addEventListener("click", function () {
			ui.verwerkMening("friet");
		});
		document.getElementById("btn-patat").addEventListener("click", function () {
			ui.verwerkMening("patat");
		});
		document.getElementById("eggs-kans-slider").addEventListener("input", function () {
			state.eggsKansPercentage = parseFloat(this.value);
			ui.updateEggsKansWeergave();
		});
		document.getElementById("snack-formulier").addEventListener("submit", handleSnackSubmit);
		document.getElementById("canvas").addEventListener("pointerdown", handleCanvasPointerDown);

		bindOverlayClose("snack-formulier-overlay", ui.closeSnackFormulier);
		bindOverlayClose("share-overlay", ui.closeShareOverlay);

		window.addEventListener("pointermove", function (event) {
			wheel.updateDrag(event.clientX, event.clientY);
		});
		window.addEventListener("pointerup", function (event) {
			wheel.eindigDrag(event.clientX, event.clientY);
		});
		window.addEventListener("pointercancel", function () {
			wheel.stopDrag();
		});
		window.addEventListener("scroll", wheel.stopDrag, { passive: true });
		window.addEventListener("resize", function () {
			wheel.stopDrag();
			state.theWheel.draw();
		});
		document.addEventListener("keydown", handleKeyDown);
	}

	function init() {
		core.loadInitialSnacks();
		wheel.createWheel();
		core.updateTellers();
		ui.updateEggsKansWeergave();
		ui.updateEggsKansBeschikbaarheid();
		ui.updateShareData();
		ui.initialiseerMeningFlow();
		bindEvents();
	}

	window.addEventListener("DOMContentLoaded", init);
})(window);
