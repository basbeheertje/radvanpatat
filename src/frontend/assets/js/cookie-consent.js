(function (window, document) {
	const GOOGLE_ANALYTICS_ID = "G-FDRQ5JB0WX";
	const GOOGLE_ANALYTICS_HOSTNAME = "radvanpatat.nl";
	const CONSENT_COOKIE_NAME = "rad-van-patat-cookie-consent";
	const CONSENT_EXPIRY_DAYS = 182;
	const ANALYTICS_COOKIE_EXPIRY_SECONDS = 395 * 24 * 60 * 60;
	const SUPPORTED_LOCALES = Object.freeze(["nl", "en", "es", "pl", "de"]);

	/**
	 * This inventory is the single source of truth for both consent behavior and
	 * the visible storage table. Adding an entry changes the derived revision,
	 * so existing visitors are automatically asked to review the new inventory.
	 */
	const storageInventory = Object.freeze({
		necessary: Object.freeze([
			Object.freeze({
				name: CONSENT_COOKIE_NAME,
				type: "cookie",
				provider: "Rad van Patat",
				duration: "sixMonths",
				purpose: "consentChoice"
			}),
			Object.freeze({
				name: "rad-van-patat-welcome-intro",
				type: "cookie",
				provider: "Rad van Patat",
				duration: "oneHour",
				purpose: "welcomeIntro"
			}),
			Object.freeze({
				name: "rad-van-patat-bezoekkeuze-getoond",
				type: "cookie",
				provider: "Rad van Patat",
				duration: "oneDay",
				purpose: "visitChoice"
			}),
			Object.freeze({
				name: "rad-van-patat-roulette-snacks",
				type: "localStorage",
				provider: "Rad van Patat",
				duration: "untilRemoved",
				purpose: "snackList"
			}),
			Object.freeze({
				name: "rad-van-patat-friet-of-patat",
				type: "localStorage",
				provider: "Rad van Patat",
				duration: "untilRemoved",
				purpose: "opinion"
			}),
			Object.freeze({
				name: "rad-van-patat-bezoekkeuze-tijdstip",
				type: "localStorage",
				provider: "Rad van Patat",
				duration: "untilRemoved",
				purpose: "visitChoice"
			}),
			Object.freeze({
				name: "rad-van-patat-last-group-order",
				type: "localStorage",
				provider: "Rad van Patat",
				duration: "untilReplaced",
				purpose: "groupOrder"
			})
		]),
		analytics: Object.freeze([
			Object.freeze({
				name: "_ga",
				type: "cookie",
				provider: "Google Analytics (Google LLC)",
				duration: "thirteenMonths",
				purpose: "analyticsUser"
			}),
			Object.freeze({
				name: `_ga_${GOOGLE_ANALYTICS_ID.replace("G-", "")}`,
				type: "cookie",
				provider: "Google Analytics (Google LLC)",
				duration: "thirteenMonths",
				purpose: "analyticsSession"
			})
		])
	});

	const copy = Object.freeze({
		nl: Object.freeze({
			title: "Koekje erbij?",
			summary: "Rad van Patat gebruikt noodzakelijke opslag om jouw keuzes en de werking van de site te onthouden. Met jouw toestemming gebruikt Google Analytics daarnaast cookie-ID's, bezochte pagina's, interacties en globale apparaat- en locatiegegevens om de site te verbeteren. De site werkt ook als je weigert en je kunt je keuze altijd intrekken.",
			revision: "Onze cookie-inventaris is gewijzigd. Controleer daarom opnieuw je voorkeuren.",
			acceptAll: "Alles accepteren",
			rejectAll: "Alleen noodzakelijk",
			preferences: "Voorkeuren instellen",
			save: "Keuze opslaan",
			close: "Sluiten",
			settings: "Cookievoorkeuren",
			preferencesTitle: "Cookie- en privacyvoorkeuren",
			introTitle: "Jouw privacykeuze",
			intro: "Rad van Patat wordt beheerd door De Code Kas. Noodzakelijke opslag blijft lokaal in je browser. Google Analytics wordt pas geladen nadat je analytische cookies aanzet. Toestemming is vrijwillig en kan via de knop onderaan iedere pagina worden gewijzigd.",
			necessaryTitle: "Noodzakelijke cookies en lokale opslag",
			necessaryDescription: "Deze opslag is nodig voor door jou gevraagde functies, zoals het bewaren van je snackrad, voorkeur en laatste groepsbestelling. Zij wordt niet gebruikt om je over andere websites te volgen en kan daarom niet worden uitgeschakeld.",
			analyticsTitle: "Analytische cookies",
			analyticsDescription: "Google Analytics helpt Rad van Patat begrijpen welke pagina's en functies worden gebruikt. Google verwerkt hiervoor cookie-ID's, interacties, browser- en apparaatgegevens en een globale locatie. Advertentiepersonalisatie en Google Signals staan uit.",
			moreTitle: "Meer informatie en je rechten",
			more: "Je kunt toestemming op elk moment intrekken via ‘Cookievoorkeuren’ onderaan de site. Eerder verzamelde gegevens worden daarmee niet automatisch gewist. Voor inzage, verwijdering, bezwaar of andere privacyvragen kun je mailen naar <a class=\"cc__link\" href=\"mailto:support@decodekas.nl\">support@decodekas.nl</a>. Bekijk ook het <a class=\"cc__link\" href=\"https://policies.google.com/privacy\" rel=\"noopener noreferrer\" target=\"_blank\">privacybeleid van Google</a>.",
			tableCaption: "Gebruikte browseropslag",
			name: "Naam",
			type: "Type",
			provider: "Aanbieder",
			purpose: "Doel",
			duration: "Bewaartermijn",
			types: { cookie: "Cookie", localStorage: "Lokale opslag" },
			durations: {
				oneHour: "1 uur",
				oneDay: "24 uur",
				sixMonths: "6 maanden",
				thirteenMonths: "Maximaal 13 maanden",
				untilRemoved: "Tot je browseropslag wordt gewist",
				untilReplaced: "Tot vervanging of wissen"
			},
			purposes: {
				consentChoice: "Bewaart je cookiekeuze en de versie van de inventaris.",
				welcomeIntro: "Voorkomt dat de welkomstintro binnen een uur opnieuw verschijnt.",
				visitChoice: "Voorkomt dat de keuze voor een persoonlijk of groepsrad te vaak verschijnt.",
				snackList: "Bewaart de snacklijst die je zelf samenstelt.",
				opinion: "Bewaart je keuze tussen friet en patat.",
				groupOrder: "Bewaart de laatste voltooide groepsbestelling op dit apparaat.",
				analyticsUser: "Onderscheidt bezoekers voor geaggregeerde gebruiksstatistieken.",
				analyticsSession: "Bewaart de sessiestatus voor geaggregeerde gebruiksstatistieken."
			}
		}),
		en: Object.freeze({
			title: "Cookie with that?",
			summary: "Rad van Patat uses necessary storage to remember your choices and keep the site working. With your consent, Google Analytics also uses cookie identifiers, visited pages, interactions, and general device and location data to improve the site. The site works if you refuse, and you can withdraw your choice at any time.",
			revision: "Our cookie inventory has changed. Please review your preferences again.",
			acceptAll: "Accept all",
			rejectAll: "Necessary only",
			preferences: "Set preferences",
			save: "Save selection",
			close: "Close",
			settings: "Cookie preferences",
			preferencesTitle: "Cookie and privacy preferences",
			introTitle: "Your privacy choice",
			intro: "Rad van Patat is managed by De Code Kas. Necessary storage stays locally in your browser. Google Analytics loads only after you enable analytics cookies. Consent is voluntary and can be changed using the button at the bottom of every page.",
			necessaryTitle: "Necessary cookies and local storage",
			necessaryDescription: "This storage supports features you request, such as saving your snack wheel, preference, and latest group order. It is not used to follow you across other websites and therefore cannot be disabled.",
			analyticsTitle: "Analytics cookies",
			analyticsDescription: "Google Analytics helps Rad van Patat understand which pages and features are used. Google processes cookie identifiers, interactions, browser and device data, and a general location. Advertising personalisation and Google Signals are disabled.",
			moreTitle: "More information and your rights",
			more: "You can withdraw consent at any time through ‘Cookie preferences’ at the bottom of the site. This does not automatically erase data collected earlier. For access, deletion, objection, or other privacy questions, email <a class=\"cc__link\" href=\"mailto:support@decodekas.nl\">support@decodekas.nl</a>. Also see <a class=\"cc__link\" href=\"https://policies.google.com/privacy\" rel=\"noopener noreferrer\" target=\"_blank\">Google's privacy policy</a>.",
			tableCaption: "Browser storage in use",
			name: "Name",
			type: "Type",
			provider: "Provider",
			purpose: "Purpose",
			duration: "Retention",
			types: { cookie: "Cookie", localStorage: "Local storage" },
			durations: {
				oneHour: "1 hour",
				oneDay: "24 hours",
				sixMonths: "6 months",
				thirteenMonths: "Up to 13 months",
				untilRemoved: "Until browser storage is cleared",
				untilReplaced: "Until replaced or cleared"
			},
			purposes: {
				consentChoice: "Stores your cookie choice and the inventory version.",
				welcomeIntro: "Stops the welcome intro from reappearing within one hour.",
				visitChoice: "Stops the personal or group wheel choice from appearing too often.",
				snackList: "Stores the snack list you compose.",
				opinion: "Stores your choice between friet and patat.",
				groupOrder: "Stores the latest completed group order on this device.",
				analyticsUser: "Distinguishes visitors for aggregated usage statistics.",
				analyticsSession: "Persists session state for aggregated usage statistics."
			}
		}),
		es: Object.freeze({
			title: "¿Una cookie de acompañamiento?",
			summary: "Rad van Patat utiliza almacenamiento necesario para recordar tus elecciones y mantener el sitio en funcionamiento. Con tu consentimiento, Google Analytics también utiliza identificadores de cookies, páginas visitadas, interacciones y datos generales del dispositivo y la ubicación para mejorar el sitio. El sitio funciona si rechazas y puedes retirar tu elección en cualquier momento.",
			revision: "Nuestro inventario de cookies ha cambiado. Revisa de nuevo tus preferencias.",
			acceptAll: "Aceptar todo",
			rejectAll: "Solo necesarias",
			preferences: "Configurar preferencias",
			save: "Guardar selección",
			close: "Cerrar",
			settings: "Preferencias de cookies",
			preferencesTitle: "Preferencias de cookies y privacidad",
			introTitle: "Tu elección de privacidad",
			intro: "Rad van Patat está gestionado por De Code Kas. El almacenamiento necesario permanece localmente en tu navegador. Google Analytics solo se carga después de activar las cookies analíticas. El consentimiento es voluntario y puede cambiarse con el botón al final de cada página.",
			necessaryTitle: "Cookies necesarias y almacenamiento local",
			necessaryDescription: "Este almacenamiento permite funciones que solicitas, como guardar tu rueda de aperitivos, preferencia y último pedido de grupo. No se utiliza para seguirte en otros sitios web y, por tanto, no se puede desactivar.",
			analyticsTitle: "Cookies analíticas",
			analyticsDescription: "Google Analytics ayuda a Rad van Patat a saber qué páginas y funciones se utilizan. Google procesa identificadores de cookies, interacciones, datos del navegador y del dispositivo y una ubicación general. La personalización publicitaria y Google Signals están desactivados.",
			moreTitle: "Más información y tus derechos",
			more: "Puedes retirar el consentimiento en cualquier momento mediante «Preferencias de cookies» al final del sitio. Esto no borra automáticamente los datos recopilados anteriormente. Para acceso, eliminación, oposición u otras preguntas de privacidad, escribe a <a class=\"cc__link\" href=\"mailto:support@decodekas.nl\">support@decodekas.nl</a>. Consulta también la <a class=\"cc__link\" href=\"https://policies.google.com/privacy\" rel=\"noopener noreferrer\" target=\"_blank\">política de privacidad de Google</a>.",
			tableCaption: "Almacenamiento del navegador utilizado",
			name: "Nombre",
			type: "Tipo",
			provider: "Proveedor",
			purpose: "Finalidad",
			duration: "Conservación",
			types: { cookie: "Cookie", localStorage: "Almacenamiento local" },
			durations: {
				oneHour: "1 hora",
				oneDay: "24 horas",
				sixMonths: "6 meses",
				thirteenMonths: "Hasta 13 meses",
				untilRemoved: "Hasta borrar el almacenamiento del navegador",
				untilReplaced: "Hasta sustituirlo o borrarlo"
			},
			purposes: {
				consentChoice: "Guarda tu elección de cookies y la versión del inventario.",
				welcomeIntro: "Evita que la introducción vuelva a aparecer durante una hora.",
				visitChoice: "Evita que la elección de rueda personal o grupal aparezca con demasiada frecuencia.",
				snackList: "Guarda la lista de aperitivos que compones.",
				opinion: "Guarda tu elección entre friet y patat.",
				groupOrder: "Guarda el último pedido de grupo completado en este dispositivo.",
				analyticsUser: "Distingue visitantes para estadísticas de uso agregadas.",
				analyticsSession: "Conserva el estado de la sesión para estadísticas de uso agregadas."
			}
		}),
		pl: Object.freeze({
			title: "Może ciasteczko?",
			summary: "Rad van Patat używa niezbędnej pamięci, aby zapamiętać Twoje wybory i zapewnić działanie strony. Za Twoją zgodą Google Analytics używa również identyfikatorów plików cookie, odwiedzonych stron, interakcji oraz ogólnych danych o urządzeniu i lokalizacji w celu ulepszania strony. Strona działa także po odmowie, a zgodę możesz wycofać w dowolnym momencie.",
			revision: "Nasz wykaz plików cookie uległ zmianie. Sprawdź ponownie swoje preferencje.",
			acceptAll: "Akceptuj wszystkie",
			rejectAll: "Tylko niezbędne",
			preferences: "Ustaw preferencje",
			save: "Zapisz wybór",
			close: "Zamknij",
			settings: "Preferencje plików cookie",
			preferencesTitle: "Preferencje plików cookie i prywatności",
			introTitle: "Twój wybór prywatności",
			intro: "Rad van Patat jest zarządzany przez De Code Kas. Niezbędne dane pozostają lokalnie w przeglądarce. Google Analytics ładuje się dopiero po włączeniu analitycznych plików cookie. Zgoda jest dobrowolna i można ją zmienić przyciskiem na dole każdej strony.",
			necessaryTitle: "Niezbędne pliki cookie i pamięć lokalna",
			necessaryDescription: "Ta pamięć obsługuje żądane przez Ciebie funkcje, takie jak zapis koła przekąsek, preferencji i ostatniego zamówienia grupowego. Nie służy do śledzenia Cię w innych witrynach i dlatego nie można jej wyłączyć.",
			analyticsTitle: "Analityczne pliki cookie",
			analyticsDescription: "Google Analytics pomaga Rad van Patat zrozumieć, które strony i funkcje są używane. Google przetwarza identyfikatory plików cookie, interakcje, dane przeglądarki i urządzenia oraz ogólną lokalizację. Personalizacja reklam i Google Signals są wyłączone.",
			moreTitle: "Więcej informacji i Twoje prawa",
			more: "Zgodę możesz wycofać w dowolnym momencie przez „Preferencje plików cookie” na dole strony. Nie powoduje to automatycznego usunięcia wcześniej zebranych danych. W sprawie dostępu, usunięcia, sprzeciwu lub innych pytań o prywatność napisz na <a class=\"cc__link\" href=\"mailto:support@decodekas.nl\">support@decodekas.nl</a>. Zobacz też <a class=\"cc__link\" href=\"https://policies.google.com/privacy\" rel=\"noopener noreferrer\" target=\"_blank\">politykę prywatności Google</a>.",
			tableCaption: "Używana pamięć przeglądarki",
			name: "Nazwa",
			type: "Typ",
			provider: "Dostawca",
			purpose: "Cel",
			duration: "Okres przechowywania",
			types: { cookie: "Cookie", localStorage: "Pamięć lokalna" },
			durations: {
				oneHour: "1 godzina",
				oneDay: "24 godziny",
				sixMonths: "6 miesięcy",
				thirteenMonths: "Do 13 miesięcy",
				untilRemoved: "Do wyczyszczenia pamięci przeglądarki",
				untilReplaced: "Do zastąpienia lub usunięcia"
			},
			purposes: {
				consentChoice: "Przechowuje wybór dotyczący plików cookie i wersję wykazu.",
				welcomeIntro: "Zapobiega ponownemu wyświetleniu powitania przez godzinę.",
				visitChoice: "Zapobiega zbyt częstemu wyświetlaniu wyboru koła osobistego lub grupowego.",
				snackList: "Przechowuje utworzoną przez Ciebie listę przekąsek.",
				opinion: "Przechowuje wybór między friet a patat.",
				groupOrder: "Przechowuje ostatnie ukończone zamówienie grupowe na tym urządzeniu.",
				analyticsUser: "Rozróżnia odwiedzających na potrzeby zbiorczych statystyk użycia.",
				analyticsSession: "Utrzymuje stan sesji na potrzeby zbiorczych statystyk użycia."
			}
		}),
		de: Object.freeze({
			title: "Darf es ein Cookie sein?",
			summary: "Rad van Patat verwendet notwendige Speicherung, um deine Auswahl zu merken und die Website funktionsfähig zu halten. Mit deiner Einwilligung verwendet Google Analytics außerdem Cookie-Kennungen, besuchte Seiten, Interaktionen sowie allgemeine Geräte- und Standortdaten, um die Website zu verbessern. Die Website funktioniert auch bei Ablehnung und du kannst deine Auswahl jederzeit widerrufen.",
			revision: "Unser Cookie-Verzeichnis hat sich geändert. Bitte prüfe deine Einstellungen erneut.",
			acceptAll: "Alle akzeptieren",
			rejectAll: "Nur notwendige",
			preferences: "Einstellungen festlegen",
			save: "Auswahl speichern",
			close: "Schließen",
			settings: "Cookie-Einstellungen",
			preferencesTitle: "Cookie- und Datenschutzeinstellungen",
			introTitle: "Deine Datenschutzwahl",
			intro: "Rad van Patat wird von De Code Kas verwaltet. Notwendige Speicherung bleibt lokal in deinem Browser. Google Analytics wird erst geladen, nachdem du Analyse-Cookies aktivierst. Die Einwilligung ist freiwillig und kann über die Schaltfläche am Ende jeder Seite geändert werden.",
			necessaryTitle: "Notwendige Cookies und lokaler Speicher",
			necessaryDescription: "Diese Speicherung unterstützt von dir angeforderte Funktionen, etwa das Speichern deines Snackrads, deiner Präferenz und der letzten Gruppenbestellung. Sie wird nicht zur Verfolgung über andere Websites verwendet und kann daher nicht deaktiviert werden.",
			analyticsTitle: "Analyse-Cookies",
			analyticsDescription: "Google Analytics hilft Rad van Patat zu verstehen, welche Seiten und Funktionen genutzt werden. Google verarbeitet Cookie-Kennungen, Interaktionen, Browser- und Gerätedaten sowie einen ungefähren Standort. Anzeigenpersonalisierung und Google Signals sind deaktiviert.",
			moreTitle: "Weitere Informationen und deine Rechte",
			more: "Du kannst deine Einwilligung jederzeit über „Cookie-Einstellungen“ am Ende der Website widerrufen. Zuvor erhobene Daten werden dadurch nicht automatisch gelöscht. Für Auskunft, Löschung, Widerspruch oder andere Datenschutzfragen schreibe an <a class=\"cc__link\" href=\"mailto:support@decodekas.nl\">support@decodekas.nl</a>. Siehe auch die <a class=\"cc__link\" href=\"https://policies.google.com/privacy\" rel=\"noopener noreferrer\" target=\"_blank\">Datenschutzerklärung von Google</a>.",
			tableCaption: "Verwendeter Browserspeicher",
			name: "Name",
			type: "Typ",
			provider: "Anbieter",
			purpose: "Zweck",
			duration: "Speicherdauer",
			types: { cookie: "Cookie", localStorage: "Lokaler Speicher" },
			durations: {
				oneHour: "1 Stunde",
				oneDay: "24 Stunden",
				sixMonths: "6 Monate",
				thirteenMonths: "Bis zu 13 Monate",
				untilRemoved: "Bis der Browserspeicher gelöscht wird",
				untilReplaced: "Bis zum Ersetzen oder Löschen"
			},
			purposes: {
				consentChoice: "Speichert deine Cookie-Auswahl und die Version des Verzeichnisses.",
				welcomeIntro: "Verhindert eine Stunde lang die erneute Anzeige der Begrüßung.",
				visitChoice: "Verhindert, dass die Auswahl zwischen persönlichem und Gruppenrad zu oft erscheint.",
				snackList: "Speichert die von dir zusammengestellte Snackliste.",
				opinion: "Speichert deine Auswahl zwischen friet und patat.",
				groupOrder: "Speichert die letzte abgeschlossene Gruppenbestellung auf diesem Gerät.",
				analyticsUser: "Unterscheidet Besucher für zusammengefasste Nutzungsstatistiken.",
				analyticsSession: "Speichert den Sitzungsstatus für zusammengefasste Nutzungsstatistiken."
			}
		})
	});

	/**
	 * A deterministic positive number is required by CookieConsent revision
	 * management. Only structural inventory data participates, keeping translated
	 * copy changes from repeatedly invalidating otherwise identical consent.
	 *
	 * @param {object} inventory
	 * @returns {number}
	 */
	function deriveInventoryRevision(inventory) {
		const serialized = JSON.stringify(inventory);
		let hash = 5381;

		for (let index = 0; index < serialized.length; index += 1) {
			hash = ((hash << 5) + hash) ^ serialized.charCodeAt(index);
		}

		return (hash >>> 0) || 1;
	}

	/**
	 * Storage metadata remains language-neutral in the registry; localized
	 * labels are resolved only while generating the modal's display table.
	 */
	function createStorageTable(entries, localeCopy) {
		return {
			caption: localeCopy.tableCaption,
			headers: {
				name: localeCopy.name,
				type: localeCopy.type,
				provider: localeCopy.provider,
				purpose: localeCopy.purpose,
				duration: localeCopy.duration
			},
			body: entries.map(function (entry) {
				return {
					name: entry.name,
					type: localeCopy.types[entry.type],
					provider: entry.provider,
					purpose: localeCopy.purposes[entry.purpose],
					duration: localeCopy.durations[entry.duration]
				};
			})
		};
	}

	/**
	 * CookieConsent accepts trusted HTML in translations. Building every locale
	 * from the same inventory prevents translated tables from drifting away from
	 * the scripts and storage that the consent categories actually control.
	 */
	function createTranslation(localeCopy) {
		return {
			consentModal: {
				label: localeCopy.preferencesTitle,
				title: localeCopy.title,
				description: `${localeCopy.summary}<br><br>{{revisionMessage}}`,
				revisionMessage: localeCopy.revision,
				acceptAllBtn: localeCopy.acceptAll,
				acceptNecessaryBtn: localeCopy.rejectAll,
				showPreferencesBtn: localeCopy.preferences,
				closeIconLabel: localeCopy.rejectAll
			},
			preferencesModal: {
				title: localeCopy.preferencesTitle,
				acceptAllBtn: localeCopy.acceptAll,
				acceptNecessaryBtn: localeCopy.rejectAll,
				savePreferencesBtn: localeCopy.save,
				closeIconLabel: localeCopy.close,
				sections: [
					{
						title: localeCopy.introTitle,
						description: localeCopy.intro
					},
					{
						title: localeCopy.necessaryTitle,
						description: localeCopy.necessaryDescription,
						linkedCategory: "necessary",
						cookieTable: createStorageTable(storageInventory.necessary, localeCopy)
					},
					{
						title: localeCopy.analyticsTitle,
						description: localeCopy.analyticsDescription,
						linkedCategory: "analytics",
						cookieTable: createStorageTable(storageInventory.analytics, localeCopy)
					},
					{
						title: localeCopy.moreTitle,
						description: localeCopy.more
					}
				]
			}
		};
	}

	/**
	 * The site itself remains Dutch, but privacy information follows one of the
	 * five project locales when the browser advertises a supported base language.
	 */
	function detectLocale() {
		const browserLocale = String(window.navigator && window.navigator.language || "nl")
			.toLowerCase()
			.split("-")[0];
		return SUPPORTED_LOCALES.includes(browserLocale) ? browserLocale : "nl";
	}

	/**
	 * Footer web components are upgraded after this parser-blocking script runs,
	 * so labels are translated once the complete document is available.
	 */
	function translateSettingsButtons() {
		const localeCopy = copy[detectLocale()];
		document.querySelectorAll("[data-cookie-settings-label]").forEach(function (label) {
			label.textContent = localeCopy.settings;
		});
	}

	/**
	 * Delegation keeps the withdrawal control working even though its web
	 * component markup is created after CookieConsent initially scans the DOM.
	 */
	function openPreferencesFromControl(event) {
		const control = event.target.closest("[data-cookie-settings]");
		if (!control || !window.CookieConsent) {
			return;
		}

		event.preventDefault();
		window.CookieConsent.showPreferences();
	}

	/**
	 * Analytics is a production-only integration. Requiring the exact canonical
	 * hostname prevents local, preview, subdomain and copied deployments from
	 * contaminating the Rad van Patat property with non-production traffic.
	 *
	 * @param {string} hostname
	 * @returns {boolean}
	 */
	function isGoogleAnalyticsHostname(hostname) {
		return String(hostname || "").trim().toLowerCase() === GOOGLE_ANALYTICS_HOSTNAME;
	}

	/**
	 * The local queue is part of the Google tag bootstrap and is therefore also
	 * production-only. Non-production hosts should not expose a partial gtag
	 * implementation that application code could mistake for active Analytics.
	 *
	 * @returns {boolean}
	 */
	function initializeGoogleAnalyticsQueue() {
		if (!isGoogleAnalyticsHostname(window.location && window.location.hostname)) {
			return false;
		}

		window.dataLayer = window.dataLayer || [];
		window.gtag = window.gtag || function () {
			window.dataLayer.push(arguments);
		};
		return true;
	}

	/**
	 * Google receives no request before opt-in or outside the canonical production
	 * hostname. The queued consent signal and privacy-oriented GA settings are
	 * applied before the remote tag can process any page view or application event.
	 *
	 * @returns {boolean} Whether Analytics was enabled for the production host.
	 */
	function enableGoogleAnalytics() {
		if (!initializeGoogleAnalyticsQueue()) {
			window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = true;
			return false;
		}

		window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = false;
		window.gtag("consent", "update", {
			analytics_storage: "granted",
			ad_storage: "denied",
			ad_user_data: "denied",
			ad_personalization: "denied",
			personalization_storage: "denied"
		});

		if (document.getElementById("rad-van-patat-google-analytics")) {
			return true;
		}

		window.gtag("js", new Date());
		window.gtag("config", GOOGLE_ANALYTICS_ID, {
			allow_ad_personalization_signals: false,
			allow_google_signals: false,
			cookie_expires: ANALYTICS_COOKIE_EXPIRY_SECONDS,
			cookie_flags: "SameSite=Lax;Secure",
			cookie_update: false
		});

		const script = document.createElement("script");
		script.async = true;
		script.id = "rad-van-patat-google-analytics";
		script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ANALYTICS_ID)}`;
		document.head.appendChild(script);
		return true;
	}

	/**
	 * The GA disable flag blocks queued and already loaded measurement after a
	 * withdrawal, while CookieConsent separately removes matching cookies. A
	 * missing queue is expected outside production and requires no initialization.
	 *
	 * @returns {boolean} Whether an existing production queue received the signal.
	 */
	function disableGoogleAnalytics() {
		window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = true;
		if (typeof window.gtag !== "function") {
			return false;
		}

		window.gtag("consent", "update", {
			analytics_storage: "denied",
			ad_storage: "denied",
			ad_user_data: "denied",
			ad_personalization: "denied",
			personalization_storage: "denied"
		});
		return true;
	}

	/**
	 * CookieConsent renders modal markup into the live document body. Running it
	 * while the parser is still inside `<head>` leaves the library without an
	 * insertion target and crashes the page before any consent UI can appear.
	 */
	function initializeCookieConsent() {
		if (!window.CookieConsent || typeof window.CookieConsent.run !== "function") {
			return false;
		}

		document.addEventListener("click", openPreferencesFromControl);
		window.CookieConsent.run({
			mode: "opt-in",
			revision: revision,
			cookie: {
				name: CONSENT_COOKIE_NAME,
				expiresAfterDays: CONSENT_EXPIRY_DAYS,
				sameSite: "Lax"
			},
			guiOptions: {
				consentModal: {
					layout: "cloud inline",
					position: "bottom center",
					equalWeightButtons: true,
					flipButtons: false
				},
				preferencesModal: {
					layout: "box",
					equalWeightButtons: true,
					flipButtons: false
				}
			},
			categories: {
				necessary: {
					enabled: true,
					readOnly: true
				},
				analytics: {
					autoClear: {
						cookies: [
							{ name: /^_ga/ }
						]
					},
					services: {
						googleAnalytics: {
							label: "Google Analytics",
							cookies: [
								{ name: /^_ga/ }
							],
							onAccept: enableGoogleAnalytics,
							onReject: disableGoogleAnalytics
						}
					}
				}
			},
			language: {
				default: "nl",
				autoDetect: "browser",
				translations: translations
			}
		});

		translateSettingsButtons();
		return true;
	}

	// Queue the denied default only on production; all other hosts stay entirely
	// free of both the local Google bootstrap and the remote Google resource.
	window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = true;
	if (initializeGoogleAnalyticsQueue()) {
		disableGoogleAnalytics();
	}

	const translations = Object.fromEntries(
		SUPPORTED_LOCALES.map(function (locale) {
			return [locale, createTranslation(copy[locale])];
		})
	);
	const revision = deriveInventoryRevision(storageInventory);

	window.SnackRadConsent = Object.freeze({
		analyticsId: GOOGLE_ANALYTICS_ID,
		analyticsHostname: GOOGLE_ANALYTICS_HOSTNAME,
		inventory: storageInventory,
		revision: revision,
		deriveInventoryRevision: deriveInventoryRevision,
		isGoogleAnalyticsHostname: isGoogleAnalyticsHostname,
		enableGoogleAnalytics: enableGoogleAnalytics,
		disableGoogleAnalytics: disableGoogleAnalytics
	});

	if (document.readyState === "loading" || !document.body) {
		document.addEventListener("DOMContentLoaded", initializeCookieConsent, { once: true });
	} else {
		initializeCookieConsent();
	}
})(window, document);
