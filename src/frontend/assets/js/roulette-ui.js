(function (window) {
	const app = window.SnackRad;
	const state = app.state;
	const core = app.core;
	const config = app.config;

	function getOverlayPaneel(overlay) {
		return overlay ? overlay.querySelector("div") : null;
	}

	function openOverlay(overlayId) {
		const overlay = document.getElementById(overlayId);
		if (!overlay) {
			return;
		}

		overlay.classList.remove("hidden");
		overlay.classList.add("flex");
		const paneel = getOverlayPaneel(overlay);
		if (paneel) {
			paneel.classList.remove("scale-90");
			paneel.classList.add("scale-100");
		}
	}

	function closeOverlay(overlayId) {
		const overlay = document.getElementById(overlayId);
		if (!overlay) {
			return;
		}

		overlay.classList.add("hidden");
		overlay.classList.remove("flex");
		const paneel = getOverlayPaneel(overlay);
		if (paneel) {
			paneel.classList.remove("scale-100");
			paneel.classList.add("scale-90");
		}
	}

	function openSnackFormulier() {
		openOverlay("snack-formulier-overlay");
		window.requestAnimationFrame(function () {
			const naamVeld = document.getElementById("snack-naam");
			if (naamVeld) {
				naamVeld.focus();
			}
		});
	}

	function closeSnackFormulier() {
		closeOverlay("snack-formulier-overlay");
	}

	function buildShareUrl() {
		const url = new URL(window.location.href);
		url.hash = "";
		url.searchParams.set(config.gedeeldRadParameter, core.maakDeelToken(state.alleSnacks));
		return url.toString();
	}

	function renderShareQrCode(url) {
		const qrContainer = document.getElementById("share-qrcode");
		if (!qrContainer) {
			return;
		}
		qrContainer.innerHTML = "";

		if (typeof QRCode !== "function") {
			qrContainer.textContent = "QR-code niet beschikbaar";
			return;
		}

		new QRCode(qrContainer, {
			text: url,
			width: 192,
			height: 192,
			colorDark: "#7c5800",
			colorLight: "#ffffff",
			correctLevel: QRCode.CorrectLevel.M
		});
	}

	function updateShareButtons(url) {
		const encodedUrl = encodeURIComponent(url);
		const bericht = encodeURIComponent("Draai aan dit Rad van Patat!");
		const facebookKnop = document.getElementById("share-facebook-knop");
		const whatsappKnop = document.getElementById("share-whatsapp-knop");
		const xKnop = document.getElementById("share-x-knop");
		const emailKnop = document.getElementById("share-email-knop");
		if (facebookKnop) {
			facebookKnop.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
		}
		if (whatsappKnop) {
			whatsappKnop.href = `https://wa.me/?text=${encodeURIComponent(`Draai aan dit Rad van Patat! ${url}`)}`;
		}
		if (xKnop) {
			xKnop.href = `https://x.com/intent/post?text=${bericht}&url=${encodedUrl}`;
		}
		if (emailKnop) {
			emailKnop.href = `mailto:?subject=${encodeURIComponent("Mijn Rad van Patat")}&body=${encodeURIComponent(`Open dit Rad van Patat: ${url}`)}`;
		}
	}

	function updateShareData() {
		state.gedeeldeLink = buildShareUrl();
		const shareLinkVeld = document.getElementById("share-link-veld");
		if (shareLinkVeld) {
			shareLinkVeld.value = state.gedeeldeLink;
		}
		renderShareQrCode(state.gedeeldeLink);
		updateShareButtons(state.gedeeldeLink);
	}

	function openShareOverlay() {
		updateShareData();
		openOverlay("share-overlay");
	}

	function closeShareOverlay() {
		closeOverlay("share-overlay");
	}

	function toonToast(tekst, variant) {
		const toast = document.getElementById("eggs-toast");
		if (!toast) {
			return;
		}
		const gekozenVariant = variant || "positive";
		toast.textContent = tekst;
		toast.classList.remove("is-hidden", "toast-positive", "toast-negative");
		toast.classList.add(gekozenVariant === "negative" ? "toast-negative" : "toast-positive");
		if (state.eggsToastTimer) {
			window.clearTimeout(state.eggsToastTimer);
		}
		state.eggsToastTimer = window.setTimeout(function () {
			toast.classList.add("is-hidden");
			state.eggsToastTimer = null;
		}, 2200);
	}

	function toonEggsToast() {
		toonToast(state.easterEggsActief ? "Eggs enabled" : "Eggs disabled", "positive");
	}

	function kopieerShareLink() {
		if (!state.gedeeldeLink) {
			updateShareData();
		}

		if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
			const shareLinkVeld = document.getElementById("share-link-veld");
			if (shareLinkVeld) {
				shareLinkVeld.select();
			}
			toonToast("Selecteer en kopieer de link handmatig");
			return;
		}

		navigator.clipboard.writeText(state.gedeeldeLink)
			.then(function () {
				toonToast("Link gekopieerd");
			})
			.catch(function () {
				const shareLinkVeld = document.getElementById("share-link-veld");
				if (shareLinkVeld) {
					shareLinkVeld.select();
				}
				toonToast("Selecteer en kopieer de link handmatig");
			});
	}

	function showResult(snack) {
		const afbeelding = document.getElementById("resultaat-afbeelding");
		const letter = document.getElementById("resultaat-letter");
		const titel = document.getElementById("resultaat-titel");
		const subtitel = document.getElementById("resultaat-subtitel");
		const benaming = document.getElementById("resultaat-benaming");
		if (!afbeelding || !letter || !titel || !subtitel || !benaming) {
			return;
		}
		titel.textContent = "Gewonnen!";
		subtitel.textContent = "Jouw avondeten is bepaald:";
		benaming.textContent = snack.name;

		if (snack.image) {
			afbeelding.src = snack.image;
			afbeelding.style.display = "block";
			letter.style.display = "none";
			afbeelding.onerror = function () {
				afbeelding.style.display = "none";
				letter.textContent = snack.name.charAt(0).toUpperCase();
				letter.style.display = "flex";
			};
		} else {
			afbeelding.style.display = "none";
			letter.textContent = snack.name.charAt(0).toUpperCase();
			letter.style.display = "flex";
		}

		openOverlay("result-modal");
		core.playSound("./assets/sounds/winnaar.mp3");
	}

	function showEasterEggResult(bericht) {
		const afbeelding = document.getElementById("resultaat-afbeelding");
		const letter = document.getElementById("resultaat-letter");
		const titel = document.getElementById("resultaat-titel");
		const subtitel = document.getElementById("resultaat-subtitel");
		const benaming = document.getElementById("resultaat-benaming");
		if (!afbeelding || !letter || !titel || !subtitel || !benaming) {
			return;
		}
		titel.textContent = bericht.titel;
		subtitel.textContent = bericht.subtitel;
		benaming.textContent = bericht.tekst;
		afbeelding.style.display = "none";
		letter.textContent = "!";
		letter.style.display = "flex";

		openOverlay("result-modal");
		core.playSound("./assets/sounds/winnaar.mp3");
	}

	function closeModal() {
		closeOverlay("result-modal");
	}

	function leesOpgeslagenMening() {
		try {
			const waarde = localStorage.getItem(config.meningOpslagSleutel);
			return waarde === "friet" || waarde === "patat" ? waarde : null;
		} catch (error) {
			return null;
		}
	}

	function slaMeningOp(antwoord) {
		try {
			localStorage.setItem(config.meningOpslagSleutel, antwoord);
		} catch (error) {
			return;
		}
	}

	function updatePatatBanner() {
		const banner = document.getElementById("patat-banner");
		if (!banner) {
			return;
		}
		if (state.opgeslagenMening !== "patat") {
			banner.classList.add("bottom-opinion-banner-hidden");
			banner.textContent = "";
			return;
		}

		banner.textContent = core.kiesWillekeurigeTekst(config.antwoordOpties.patat.banners);
		banner.classList.remove("bottom-opinion-banner-hidden");
	}

	function verwerkMening(antwoord) {
		if (!config.antwoordOpties[antwoord]) {
			return;
		}

		state.opgeslagenMening = antwoord;
		slaMeningOp(antwoord);
		closeOverlay("vraag-overlay");

		if (antwoord === "friet") {
			toonToast(core.kiesWillekeurigeTekst(config.antwoordOpties.friet.toasts), "positive");
		} else {
			toonToast(core.kiesWillekeurigeTekst(config.antwoordOpties.patat.toasts), "negative");
		}

		updatePatatBanner();
	}

	function initialiseerMeningFlow() {
		state.opgeslagenMening = leesOpgeslagenMening();
		updatePatatBanner();

		if (!state.opgeslagenMening) {
			openOverlay("vraag-overlay");
		}
	}

	function updateEggsKansWeergave() {
		const kansWaarde = document.getElementById("eggs-kans-waarde");
		if (kansWaarde) {
			kansWaarde.textContent = `${state.eggsKansPercentage.toFixed(1)}%`;
		}
	}

	function updateEggsKansBeschikbaarheid() {
		const slider = document.getElementById("eggs-kans-slider");
		const paneel = document.getElementById("eggs-kans-paneel");
		const hint = document.getElementById("eggs-kans-hint");
		if (!slider || !paneel || !hint) {
			return;
		}
		slider.disabled = !state.easterEggsActief;
		paneel.classList.toggle("eggs-kans-verborgen", !state.easterEggsActief);
		hint.textContent = state.easterEggsActief
			? "Bepaalt hoe vaak een easter egg de normale uitslag vervangt."
			: "Schakel eerst eggs in om deze kans aan te passen.";
	}

	app.ui = {
		openOverlay: openOverlay,
		closeOverlay: closeOverlay,
		openSnackFormulier: openSnackFormulier,
		closeSnackFormulier: closeSnackFormulier,
		updateShareData: updateShareData,
		openShareOverlay: openShareOverlay,
		closeShareOverlay: closeShareOverlay,
		kopieerShareLink: kopieerShareLink,
		showResult: showResult,
		showEasterEggResult: showEasterEggResult,
		toonToast: toonToast,
		toonEggsToast: toonEggsToast,
		verwerkMening: verwerkMening,
		initialiseerMeningFlow: initialiseerMeningFlow,
		updateEggsKansWeergave: updateEggsKansWeergave,
		updateEggsKansBeschikbaarheid: updateEggsKansBeschikbaarheid,
		closeModal: closeModal
	};
})(window);
