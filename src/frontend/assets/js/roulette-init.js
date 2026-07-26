(function (window) {
	const app = window.SnackRad;
	const core = app.core;
	const ui = app.ui;
	const wheel = app.wheel;
	const state = app.state;
	const easterEggs = app.easterEggs;

	function bindOverlayClose(overlayId, onClose) {
		const overlay = document.getElementById(overlayId);
		if (!overlay) {
			return;
		}

		overlay.addEventListener("click", function (event) {
			if (event.target === this) {
				onClose();
			}
		});
	}

	function bindClick(elementId, handler) {
		const element = document.getElementById(elementId);
		if (element) {
			element.addEventListener("click", handler);
		}
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
		wheel.addSnackSegment();
		// The normalized name is the exact label added to the wheel; image URLs
		// and raw form values deliberately remain outside analytics.
		app.trackAnalyticsEvent("SNACK_ADDED", {
			snack_name: snack.name,
			available_snack_count: state.alleSnacks.length
		});
		event.currentTarget.reset();
		ui.closeSnackFormulier();
	}

	function handleWheelPointerDown(event) {
		if (state.wheelSpinning) {
			return;
		}

		// The transparent SVG hit area sits above the center logo, so center clicks
		// must be resolved from pointer coordinates here instead of on the image.
		if (wheel.isPointerOnCenter(event.clientX, event.clientY)) {
			event.preventDefault();
			wheel.resetAndStart();
			return;
		}

		const segmentIndex = wheel.getSegmentIndexFromPointer(event.clientX, event.clientY);
		if (!segmentIndex || !state.alleSnacks[segmentIndex - 1]) {
			return;
		}

		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		wheel.startDrag(segmentIndex, event.clientX, event.clientY);
	}

	function handleKeyDown(event) {
		const target = event.target;
		const isEditableTarget = target && typeof target.matches === "function" && (
			target.matches("input, textarea, select") ||
			target.isContentEditable
		);

		if (event.key === "F5") {
			event.preventDefault();
			wheel.resetAndStart();
		}

		if (event.shiftKey && (event.key === "+" || event.key === "=")) {
			event.preventDefault();
			ui.openSnackFormulier();
		}

		if (event.shiftKey && event.key.toLowerCase() === "l") {
			event.preventDefault();
			window.location.assign("./wheels.html");
			return;
		}

		if (event.shiftKey && event.key.toLowerCase() === "c") {
			if (state.easterEggsActief) {
				event.preventDefault();
				easterEggs.openCommandBar();
			}
			return;
		}

		// Commands typed into forms must not accidentally toggle the global
		// easter-egg state while the visitor is entering normal page data.
		if (!isEditableTarget && event.key && event.key.length === 1) {
			state.easterEggBuffer = `${state.easterEggBuffer}${event.key.toLowerCase()}`.slice(-4);
			if (state.easterEggBuffer === "eggs") {
				state.easterEggsActief = !state.easterEggsActief;
				if (state.easterEggsActief) {
					app.trackAnalyticsEvent("EASTER_EGGS_ACTIVATED");
				}
				ui.updateEggsKansBeschikbaarheid();
				ui.toonEggsToast();
				if (!state.easterEggsActief) {
					easterEggs.deactivate();
				}
				state.easterEggBuffer = "";
			}
		}

		if (event.key === "Escape") {
			if (easterEggs.isHarlemShakeActive()) {
				event.preventDefault();
				easterEggs.stopHarlemShake();
				ui.toonToast("Harlem Shake gestopt", "positive");
			}
			easterEggs.closeCommandBar();
			ui.sluitBezoekKeuzeAlsEigenRad();
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
			bindClick(elementId, handler);
		});

		bindClick("btn-friet", function () {
			ui.verwerkMening("friet");
		});
		bindClick("btn-patat", function () {
			ui.verwerkMening("patat");
		});
		bindClick("bezoek-keuze-groep", function () {
			ui.verwerkBezoekKeuze("groep");
		});
		bindClick("bezoek-keuze-eigen", function () {
			ui.verwerkBezoekKeuze("eigen");
		});

		const eggsKansSlider = document.getElementById("eggs-kans-slider");
		if (eggsKansSlider) {
			eggsKansSlider.addEventListener("input", function () {
				state.eggsKansPercentage = parseFloat(this.value);
				ui.updateEggsKansWeergave();
			});
		}

		const snackFormulier = document.getElementById("snack-formulier");
		if (snackFormulier) {
			snackFormulier.addEventListener("submit", handleSnackSubmit);
		}

		const easterEggCommandForm = document.getElementById("easter-egg-command-form");
		if (easterEggCommandForm) {
			easterEggCommandForm.addEventListener("submit", function (event) {
				event.preventDefault();
				const commandInput = document.getElementById("easter-egg-command-input");
				if (!commandInput) {
					return;
				}

				if (!easterEggs.voerCommandoUit(commandInput.value)) {
					commandInput.focus();
					commandInput.select();
				}
			});
		}
		bindClick("easter-egg-command-close", easterEggs.closeCommandBar);

		const wheelHitArea = document.getElementById("wheel-hit-area");
		if (wheelHitArea) {
			wheelHitArea.addEventListener("pointerdown", handleWheelPointerDown);
			wheelHitArea.addEventListener("pointermove", function (event) {
				wheel.updateCenterHover(event.clientX, event.clientY);
			});
			wheelHitArea.addEventListener("pointerleave", wheel.clearCenterHover);
		}

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
			wheel.clearCenterHover();
		});
		window.addEventListener("scroll", wheel.stopDrag, { passive: true });
		window.addEventListener("resize", function () {
			wheel.stopDrag();
			wheel.clearCenterHover();
		});
		document.addEventListener("keydown", handleKeyDown);
	}

	/**
	 * The shared head now injects the component registry via a module script.
	 * Waiting for the wheel custom element prevents the classic renderer from
	 * querying `#wheel-rotor` before the light-DOM SVG has been stamped out.
	 *
	 * @returns {Promise<void>}
	 */
	async function init() {
		if (window.customElements && typeof window.customElements.whenDefined === "function") {
			await window.customElements.whenDefined("roulette-wheel-view");
		}

		core.loadInitialSnacks();
		wheel.createWheel();
		core.updateTellers();
		ui.updateEggsKansWeergave();
		ui.updateEggsKansBeschikbaarheid();
		ui.updateShareData();
		ui.initialiseerEersteBezoekFlows();
		bindEvents();
	}

	window.addEventListener("DOMContentLoaded", function () {
		init();
	});
}(window));
