(function (window) {
	const app = window.SnackRad = window.SnackRad || {};
	const DEFAULT_WHEEL_NAME = "Standaard snacks";

	/**
	 * Keep callers independent from gtag availability. Tests and privacy tools
	 * may omit analytics.js, while production delegates semantic event keys to
	 * the shared GA4 adapter loaded by the base head.
	 */
	app.trackAnalyticsEvent = function (eventKey, parameters) {
		if (!app.analytics || typeof app.analytics.trackEvent !== "function") {
			return false;
		}
		return app.analytics.trackEvent(eventKey, parameters);
	};

	app.config = {
		basisSnacks: [
			["Bitterbal", "/snacks/bitterbal.png"],
			["Kaassouffle", "/snacks/kaassoufle.png"],
			["Loempidel", "/snacks/loempidel.png"],
			["Kroket", "/snacks/kroket.png"],
			["Nasischijf", "/snacks/nasischijf.png"],
			["Kipcorn", "/snacks/kipcorn.png"],
			["Frikandel", "/snacks/frikandel.png"],
			["Bamischijf", "/snacks/bamischijf.png"],
			["Kipnuggets", "/snacks/kipnuggets.png"],
			["Viandel", "/snacks/viandel.png"],
			["Satekroket", "/snacks/satekroket.png"],
			["Berenklauw", "/snacks/berenklauw.png"],
			["Mexicano", "/snacks/mexicano.png"],
			["Loempia", "/snacks/loempia.png"]
		].map(function ([name, image]) {
			return { name: name, image: `./assets/images/${image}`, isCustom: false };
		}),
		snackOpslagSleutel: "rad-van-patat-roulette-snacks",
		radsOpslagSleutel: "rad-van-patat-roulette-rads",
		actiefRadOpslagSleutel: "rad-van-patat-actief-rad",
		meningOpslagSleutel: "rad-van-patat-friet-of-patat",
		bezoekKeuzeCookieSleutel: "rad-van-patat-bezoekkeuze-getoond",
		bezoekKeuzeOpslagSleutel: "rad-van-patat-bezoekkeuze-tijdstip",
		bezoekKeuzeGeldigheidMs: 24 * 60 * 60 * 1000,
		gedeeldRadParameter: "rad",
		radIdParameter: "id",
		gedeeldRadVersie: 1,
		maxSnackNaamLengte: 40,
		maxSnackAfbeeldingLengte: 512,
		maxRadNaamLengte: 50,
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
		huidigRadId: "",
		huidigRadNaam: "",
		wheelSpinning: false,
		wheelRotation: 0,
		wheelAnimation: null,
		actieveDrag: null,
		easterEggsActief: false,
		easterEggBuffer: "",
		eggsToastTimer: null,
		eggsKansPercentage: 0.5,
		gedeeldeLink: "",
		opgeslagenMening: null
	};

	function getStorage() {
		try {
			return window.localStorage;
		} catch (error) {
			return null;
		}
	}

	function cloneSnack(snack) {
		return { ...snack };
	}

	function cloneWheel(wheel) {
		return {
			...wheel,
			snacks: wheel.snacks.map(cloneSnack)
		};
	}

	function getTimestamp(value, fallbackValue) {
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
	}

	function getNow() {
		return Date.now();
	}

	function createWheelId() {
		if (window.crypto && typeof window.crypto.randomUUID === "function") {
			return window.crypto.randomUUID();
		}

		return `rad-${getNow()}-${Math.random().toString(36).slice(2, 10)}`;
	}

	function getDefaultSnacks() {
		return app.config.basisSnacks.map(cloneSnack);
	}

	function normaliseerRadNaam(naam) {
		if (typeof naam !== "string") {
			return "";
		}

		return naam.trim().replace(/\s+/g, " ").slice(0, app.config.maxRadNaamLengte);
	}

	function normaliseerSnackAfbeelding(afbeelding) {
		if (typeof afbeelding !== "string") {
			return "";
		}

		const waarde = afbeelding.trim();
		if (!waarde || waarde.length > app.config.maxSnackAfbeeldingLengte) {
			return "";
		}

		if (waarde.startsWith("./assets/images/")) {
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
		return String(naam || "").trim().replace(/\s+/g, " ").toLowerCase();
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

	function maakUniekeRadNaam(naam, bestaandeRads, uitgeslotenRadId) {
		const basisNaam = normaliseerRadNaam(naam) || DEFAULT_WHEEL_NAME;
		const bezetteNamen = new Set(
			(bestaandeRads || [])
				.filter(function (rad) {
					return rad.id !== uitgeslotenRadId;
				})
				.map(function (rad) {
					return normaliseerSnackNaam(rad.name);
				})
		);
		if (!bezetteNamen.has(normaliseerSnackNaam(basisNaam))) {
			return basisNaam;
		}

		let index = 2;
		while (bezetteNamen.has(normaliseerSnackNaam(`${basisNaam} ${index}`))) {
			index += 1;
		}
		return `${basisNaam} ${index}`;
	}

	function normaliseerRad(rad, bestaandeRads) {
		const fallbackTimestamp = getNow();
		const snacks = Array.isArray(rad && rad.snacks)
			? dedupliceerSnacks(rad.snacks.map(normaliseerSnack).filter(Boolean))
			: [];
		const veiligeSnacks = snacks.length > 0 ? snacks : getDefaultSnacks();

		return {
			id: typeof rad && typeof rad.id === "string" && rad.id.trim() ? rad.id.trim() : createWheelId(),
			name: maakUniekeRadNaam(rad && rad.name, bestaandeRads),
			snacks: veiligeSnacks,
			createdAt: getTimestamp(rad && rad.createdAt, fallbackTimestamp),
			updatedAt: getTimestamp(rad && rad.updatedAt, fallbackTimestamp),
			lastUsedAt: getTimestamp(rad && rad.lastUsedAt, fallbackTimestamp),
			spinCount: Math.max(0, Number.parseInt(rad && rad.spinCount, 10) || 0)
		};
	}

	function leesLegacySnacks() {
		const storage = getStorage();
		if (!storage) {
			return null;
		}

		try {
			const waarde = JSON.parse(storage.getItem(app.config.snackOpslagSleutel) || "null");
			if (!Array.isArray(waarde)) {
				return null;
			}
			const snacks = dedupliceerSnacks(waarde.map(normaliseerSnack).filter(Boolean));
			return snacks.length > 0 ? snacks : null;
		} catch (error) {
			return null;
		}
	}

	function persistWheels(rads, actiefRadId) {
		const storage = getStorage();
		if (!storage) {
			return false;
		}

		try {
			storage.setItem(app.config.radsOpslagSleutel, JSON.stringify(rads));
			storage.setItem(app.config.actiefRadOpslagSleutel, actiefRadId);
			return true;
		} catch (error) {
			return false;
		}
	}

	function leesRads() {
		const storage = getStorage();
		const fallbackTimestamp = getNow();
		let rads = [];
		let actiefRadId = "";

		if (storage) {
			try {
				const opgeslagenRads = JSON.parse(storage.getItem(app.config.radsOpslagSleutel) || "null");
				if (Array.isArray(opgeslagenRads)) {
					rads = opgeslagenRads.reduce(function (lijst, kandidaat) {
						const genormaliseerd = normaliseerRad(kandidaat, lijst);
						lijst.push(genormaliseerd);
						return lijst;
					}, []);
				}
				actiefRadId = storage.getItem(app.config.actiefRadOpslagSleutel) || "";
			} catch (error) {
				rads = [];
				actiefRadId = "";
			}
		}

		if (rads.length === 0) {
			const legacySnacks = leesLegacySnacks();
			rads = [
				{
					id: createWheelId(),
					name: DEFAULT_WHEEL_NAME,
					snacks: legacySnacks || getDefaultSnacks(),
					createdAt: fallbackTimestamp,
					updatedAt: fallbackTimestamp,
					lastUsedAt: fallbackTimestamp,
					spinCount: 0
				}
			];
			actiefRadId = rads[0].id;
			persistWheels(rads, actiefRadId);
		}

		if (!rads.some(function (rad) { return rad.id === actiefRadId; })) {
			actiefRadId = rads[0].id;
			persistWheels(rads, actiefRadId);
		}

		return {
			rads: rads.map(cloneWheel),
			actiefRadId: actiefRadId
		};
	}

	function getRadIndexById(rads, radId) {
		return rads.findIndex(function (rad) {
			return rad.id === radId;
		});
	}

	function getActiefRadGegevens() {
		const gegevens = leesRads();
		const actiefRad = gegevens.rads.find(function (rad) {
			return rad.id === gegevens.actiefRadId;
		}) || gegevens.rads[0];
		return {
			rads: gegevens.rads,
			actiefRad: cloneWheel(actiefRad),
			actiefRadId: actiefRad.id
		};
	}

	function getRadOpId(radId) {
		const gegevens = leesRads();
		const rad = gegevens.rads.find(function (kandidaat) {
			return kandidaat.id === radId;
		});
		return rad ? cloneWheel(rad) : null;
	}

	function listRads() {
		return leesRads().rads.map(cloneWheel);
	}

	function setActiefRad(radId) {
		const gegevens = leesRads();
		const index = getRadIndexById(gegevens.rads, radId);
		if (index < 0) {
			return null;
		}

		const now = getNow();
		gegevens.rads[index] = {
			...gegevens.rads[index],
			lastUsedAt: now,
			updatedAt: now
		};
		persistWheels(gegevens.rads, radId);
		app.state.huidigRadId = radId;
		app.state.huidigRadNaam = gegevens.rads[index].name;
		return cloneWheel(gegevens.rads[index]);
	}

	function createRad(options) {
		const gegevens = leesRads();
		const naam = normaliseerRadNaam(options && options.name);
		if (!naam) {
			throw new Error("Een radnaam is verplicht.");
		}

		const naamBestaatAl = gegevens.rads.some(function (rad) {
			return normaliseerSnackNaam(rad.name) === normaliseerSnackNaam(naam);
		});
		if (naamBestaatAl) {
			throw new Error("De radnaam moet uniek zijn binnen deze browser.");
		}

		const now = getNow();
		const snacks = Array.isArray(options && options.snacks)
			? dedupliceerSnacks(options.snacks.map(normaliseerSnack).filter(Boolean))
			: getDefaultSnacks();
		const nieuwRad = {
			id: createWheelId(),
			name: naam,
			snacks: snacks.length > 0 ? snacks : getDefaultSnacks(),
			createdAt: now,
			updatedAt: now,
			lastUsedAt: now,
			spinCount: 0
		};
		const nieuweRads = [nieuwRad].concat(gegevens.rads);
		persistWheels(nieuweRads, gegevens.actiefRadId || nieuwRad.id);
		return cloneWheel(nieuwRad);
	}

	function updateRad(radId, options) {
		const gegevens = leesRads();
		const index = getRadIndexById(gegevens.rads, radId);
		if (index < 0) {
			throw new Error("Het gevraagde rad bestaat niet.");
		}

		const naam = normaliseerRadNaam(options && options.name);
		if (!naam) {
			throw new Error("Een radnaam is verplicht.");
		}

		const naamBestaatAl = gegevens.rads.some(function (rad) {
			return rad.id !== radId && normaliseerSnackNaam(rad.name) === normaliseerSnackNaam(naam);
		});
		if (naamBestaatAl) {
			throw new Error("De radnaam moet uniek zijn binnen deze browser.");
		}

		const snacks = Array.isArray(options && options.snacks)
			? dedupliceerSnacks(options.snacks.map(normaliseerSnack).filter(Boolean))
			: [];
		if (snacks.length === 0) {
			throw new Error("Een rad moet minimaal één item bevatten.");
		}

		const bestaandRad = gegevens.rads[index];
		const bijgewerktRad = {
			...bestaandRad,
			name: naam,
			snacks: snacks,
			updatedAt: getNow()
		};
		gegevens.rads[index] = bijgewerktRad;
		persistWheels(gegevens.rads, gegevens.actiefRadId);
		if (gegevens.actiefRadId === radId) {
			app.state.huidigRadNaam = bijgewerktRad.name;
			app.state.huidigRadId = bijgewerktRad.id;
		}
		return cloneWheel(bijgewerktRad);
	}

	function updateActiefRadSnacks(snacks) {
		const gegevens = getActiefRadGegevens();
		return updateRad(gegevens.actiefRadId, {
			name: gegevens.actiefRad.name,
			snacks: snacks
		});
	}

	function noteActiefRadGebruik() {
		const gegevens = leesRads();
		const index = getRadIndexById(gegevens.rads, gegevens.actiefRadId);
		if (index < 0) {
			return null;
		}

		const now = getNow();
		const bijgewerktRad = {
			...gegevens.rads[index],
			spinCount: gegevens.rads[index].spinCount + 1,
			lastUsedAt: now,
			updatedAt: now
		};
		gegevens.rads[index] = bijgewerktRad;
		persistWheels(gegevens.rads, gegevens.actiefRadId);
		app.state.huidigRadId = bijgewerktRad.id;
		app.state.huidigRadNaam = bijgewerktRad.name;
		return cloneWheel(bijgewerktRad);
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

	/**
	 * Shared links intentionally override only the runtime list for the current
	 * visit. The persisted active wheel remains untouched until the visitor
	 * explicitly changes and saves that wheel through the wheel management pages.
	 */
	function loadInitialSnacks() {
		const actieveGegevens = getActiefRadGegevens();
		const gedeeldeSnacks = haalGedeeldeSnacksUitUrl();
		const snacks = gedeeldeSnacks || actieveGegevens.actiefRad.snacks;

		app.state.huidigRadId = actieveGegevens.actiefRad.id;
		app.state.huidigRadNaam = actieveGegevens.actiefRad.name;
		app.state.alleSnacks = snacks.map(cloneSnack);
	}

	function updateTellers() {
		const standaardAantal = app.state.alleSnacks.filter(function (snack) {
			return !snack.isCustom;
		}).length;
		const eigenAantal = app.state.alleSnacks.filter(function (snack) {
			return snack.isCustom;
		}).length;

		const standaardTeller = document.getElementById("standaard-teller");
		const eigenTeller = document.getElementById("eigen-teller");
		if (standaardTeller) {
			standaardTeller.textContent = `${standaardAantal} keuzes`;
		}
		if (eigenTeller) {
			eigenTeller.textContent = `${eigenAantal} toegevoegd`;
		}

		const radNaamElement = document.getElementById("huidig-rad-naam");
		if (radNaamElement) {
			radNaamElement.textContent = app.state.huidigRadNaam || DEFAULT_WHEEL_NAME;
		}
	}

	/**
	 * Every wheel interaction on the roulette page edits the active wheel. The
	 * separate wheel detail page is the place where users switch or rename wheels.
	 */
	function persistSnacks() {
		app.state.alleSnacks = dedupliceerSnacks(app.state.alleSnacks);
		const bijgewerktRad = updateActiefRadSnacks(app.state.alleSnacks);
		app.state.huidigRadId = bijgewerktRad.id;
		app.state.huidigRadNaam = bijgewerktRad.name;
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
		normaliseerSnackNaam: normaliseerSnackNaam,
		normaliseerRadNaam: normaliseerRadNaam,
		maakDeelToken: maakDeelToken,
		parseDeelToken: parseDeelToken,
		haalGedeeldeSnacksUitUrl: haalGedeeldeSnacksUitUrl,
		loadInitialSnacks: loadInitialSnacks,
		updateTellers: updateTellers,
		persistSnacks: persistSnacks,
		dedupliceerSnacks: dedupliceerSnacks,
		bestaatSnackAl: bestaatSnackAl,
		playSound: playSound,
		kiesWillekeurigeTekst: kiesWillekeurigeTekst,
		listRads: listRads,
		getRadOpId: getRadOpId,
		getActiefRad: function () {
			return getActiefRadGegevens().actiefRad;
		},
		setActiefRad: setActiefRad,
		createRad: createRad,
		updateRad: updateRad,
		updateActiefRadSnacks: updateActiefRadSnacks,
		noteActiefRadGebruik: noteActiefRadGebruik,
		getDefaultSnacks: getDefaultSnacks
	};
})(window);
