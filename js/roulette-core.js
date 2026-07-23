(function (window) {
	const app = window.SnackRad = window.SnackRad || {};

	app.config = {
		basisSnacks: [
			["Bitterbal", "bitterbal.jpg"], ["Kaassouffle", "kaassouffle.jpg"], ["Loempidel", "loempidel.jpg"],
			["Kroket", "kroket.jpg"], ["Nasischijf", "nasischijf.jpg"], ["Kipcorn", "kipcorn.jpg"],
			["Frikandel", "frikandel.jpg"], ["Bamischijf", "bamischijf.jpg"], ["Kipnuggets", "kipnuggets.jpg"],
			["Viandel", "viandel.jpg"], ["Satekroket", "satekroket.jpg"], ["Berenklauw", "berenklauw.jpg"], ["Mexicano", "mexicano.jpg"]
		].map(function ([name, image]) {
			return { name: name, image: `./images/${image}`, isCustom: false };
		}),
		snackOpslagSleutel: "rad-van-patat-roulette-snacks",
		meningOpslagSleutel: "rad-van-patat-friet-of-patat",
		gedeeldRadParameter: "rad",
		gedeeldRadVersie: 1,
		maxSnackNaamLengte: 40,
		maxSnackAfbeeldingLengte: 512,
		antwoordOpties: {
			friet: {
				toasts: [
					"Een echte kenner!",
					"Juist. Friet natuurlijk.",
					"Correct antwoord. Respect.",
					"Friet gekozen. Cultuur gewonnen."
				]
			},
			patat: {
				toasts: [
					"Tuurlijk is het friet.",
					"Patat? Dappere, maar foute keuze.",
					"We rekenen 'patat' niet goed, maar vooruit.",
					"Bijna goed. Het is friet."
				],
				banners: [
					"Deze persoon denkt dat het patat is.... huil huil huil",
					"Alarm: hier woont iemand die 'patat' zegt.",
					"Wij weten beter. Deze persoon koos toch voor patat.",
					"Triest nieuws: deze persoon noemt friet dus patat."
				]
			}
		},
		kleuren: ["#ffb800", "#e41f13", "#ffdea8", "#ffb4a8"],
		randKleuren: ["#7c5800", "#930000", "#7c5800", "#930000"],
		easterEggBerichten: [
			{ titel: "❌", subtitel: "Vandaag moet je gewoon koken.", tekst: "Geen frituur vandaag." },
			{ titel: "Je portemonnee zegt:", subtitel: "“Boterham met pindakaas.”", tekst: "Budgetmodus geactiveerd." },
			{ titel: "Vandaag is het cheat day.", subtitel: "Neem gewoon alles.", tekst: "Alles is de uitslag." }
		]
	};

	app.state = {
		alleSnacks: [],
		wheelSpinning: false,
		spinned: false,
		actieveDrag: null,
		easterEggsActief: false,
		easterEggBuffer: "",
		eggsToastTimer: null,
		eggsKansPercentage: 0.5,
		gedeeldeLink: "",
		shareQrCode: null,
		opgeslagenMening: null,
		theWheel: null
	};

	function normaliseerSnackAfbeelding(afbeelding) {
		if (typeof afbeelding !== "string") {
			return "";
		}

		const waarde = afbeelding.trim();
		if (!waarde || waarde.length > app.config.maxSnackAfbeeldingLengte) {
			return "";
		}

		if (waarde.startsWith("./images/")) {
			return waarde;
		}

		try {
			const url = new URL(waarde);
			if (url.protocol === "https:" || url.protocol === "http:") {
				return url.toString();
			}
		} catch (error) {
			return "";
		}

		return "";
	}

	function normaliseerSnack(snack) {
		if (!snack || typeof snack.name !== "string") {
			return null;
		}

		const naam = snack.name.trim().replace(/\s+/g, " ").slice(0, app.config.maxSnackNaamLengte);
		if (!naam) {
			return null;
		}

		return {
			name: naam,
			image: normaliseerSnackAfbeelding(snack.image),
			isCustom: Boolean(snack.isCustom)
		};
	}

	function normaliseerSnackNaam(naam) {
		return naam.trim().replace(/\s+/g, " ").toLowerCase();
	}

	function dedupliceerSnacks(snacks) {
		const gezieneNamen = new Set();

		return snacks.filter(function (snack) {
			const sleutel = normaliseerSnackNaam(snack.name);
			if (gezieneNamen.has(sleutel)) {
				return false;
			}

			gezieneNamen.add(sleutel);
			return true;
		});
	}

	function encodeBase64Url(waarde) {
		return btoa(unescape(encodeURIComponent(waarde))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
	}

	function decodeBase64Url(waarde) {
		const basis64 = waarde.replace(/-/g, "+").replace(/_/g, "/");
		const padding = "=".repeat((4 - (basis64.length % 4 || 4)) % 4);
		return decodeURIComponent(escape(atob(`${basis64}${padding}`)));
	}

	function maakDeelToken(snacks) {
		const payload = {
			v: app.config.gedeeldRadVersie,
			s: snacks.map(function (snack) {
				return {
					name: snack.name,
					image: snack.image || "",
					isCustom: Boolean(snack.isCustom)
				};
			})
		};

		return encodeBase64Url(JSON.stringify(payload));
	}

	function parseDeelToken(token) {
		if (!token || typeof token !== "string" || token.length > 12000) {
			return null;
		}

		try {
			const payload = JSON.parse(decodeBase64Url(token));
			if (!payload || payload.v !== app.config.gedeeldRadVersie || !Array.isArray(payload.s)) {
				return null;
			}

			const snacks = payload.s.map(normaliseerSnack).filter(Boolean);
			return snacks.length > 0 ? snacks : null;
		} catch (error) {
			return null;
		}
	}

	function haalGedeeldeSnacksUitUrl() {
		const params = new URLSearchParams(window.location.search);
		return parseDeelToken(params.get(app.config.gedeeldRadParameter));
	}

	function loadInitialSnacks() {
		let snacks = null;

		try {
			snacks = haalGedeeldeSnacksUitUrl() || JSON.parse(localStorage.getItem(app.config.snackOpslagSleutel) || "null");
		} catch (error) {
			snacks = null;
		}

		if (!Array.isArray(snacks) || snacks.length === 0) {
			snacks = app.config.basisSnacks.map(function (snack) {
				return { ...snack };
			});
		}

		snacks = dedupliceerSnacks(snacks.map(normaliseerSnack).filter(Boolean));
		if (snacks.length === 0) {
			snacks = app.config.basisSnacks.map(function (snack) {
				return { ...snack };
			});
		}

		app.state.alleSnacks = snacks;
	}

	function updateTellers() {
		const standaardAantal = app.state.alleSnacks.filter(function (snack) {
			return !snack.isCustom;
		}).length;
		const eigenAantal = app.state.alleSnacks.filter(function (snack) {
			return snack.isCustom;
		}).length;

		document.getElementById("standaard-teller").textContent = `${standaardAantal} keuzes`;
		document.getElementById("eigen-teller").textContent = `${eigenAantal} toegevoegd`;
	}

	function persistSnacks() {
		app.state.alleSnacks = dedupliceerSnacks(app.state.alleSnacks);
		localStorage.setItem(app.config.snackOpslagSleutel, JSON.stringify(app.state.alleSnacks));
		updateTellers();
		if (app.ui && typeof app.ui.updateShareData === "function") {
			app.ui.updateShareData();
		}
	}

	function bestaatSnackAl(naam) {
		const genormaliseerdeNaam = normaliseerSnackNaam(naam);
		return app.state.alleSnacks.some(function (snack) {
			return normaliseerSnackNaam(snack.name) === genormaliseerdeNaam;
		});
	}

	function playSound(filename) {
		const audio = new Audio(filename);
		audio.play();
	}

	function kiesWillekeurigeTekst(lijst) {
		if (!Array.isArray(lijst) || lijst.length === 0) {
			return "";
		}

		return lijst[Math.floor(Math.random() * lijst.length)];
	}

	app.core = {
		normaliseerSnackAfbeelding: normaliseerSnackAfbeelding,
		normaliseerSnack: normaliseerSnack,
		maakDeelToken: maakDeelToken,
		parseDeelToken: parseDeelToken,
		haalGedeeldeSnacksUitUrl: haalGedeeldeSnacksUitUrl,
		loadInitialSnacks: loadInitialSnacks,
		updateTellers: updateTellers,
		persistSnacks: persistSnacks,
		dedupliceerSnacks: dedupliceerSnacks,
		normaliseerSnackNaam: normaliseerSnackNaam,
		bestaatSnackAl: bestaatSnackAl,
		playSound: playSound,
		kiesWillekeurigeTekst: kiesWillekeurigeTekst
	};
})(window);
