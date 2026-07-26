const pageState = {
	rad: null,
	draftName: "",
	draftSnacks: [],
	search: "",
	status: "",
	statusVariant: "positive"
};

function getCore() {
	return window.SnackRad && window.SnackRad.core;
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function setStatus(message, variant) {
	pageState.status = message;
	pageState.statusVariant = variant || "positive";
	render();
}

function getRadIdFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.get("id") || "";
}

function getDraftSnackNames() {
	return new Set(
		pageState.draftSnacks.map(function (snack) {
			return getCore().normaliseerSnackNaam(snack.name);
		})
	);
}

function getVisibleCatalog() {
	const basisSnacks = getCore().getDefaultSnacks();
	const catalog = basisSnacks.map(function (snack) {
		return { ...snack };
	});
	const names = new Set(catalog.map(function (snack) {
		return getCore().normaliseerSnackNaam(snack.name);
	}));

	pageState.draftSnacks.forEach(function (snack) {
		const key = getCore().normaliseerSnackNaam(snack.name);
		if (!names.has(key)) {
			catalog.push({ ...snack });
			names.add(key);
		}
	});

	if (!pageState.search.trim()) {
		return catalog;
	}

	const query = getCore().normaliseerSnackNaam(pageState.search);
	return catalog.filter(function (snack) {
		return getCore().normaliseerSnackNaam(snack.name).includes(query);
	});
}

function renderStatus() {
	if (!pageState.status) {
		return "";
	}

	return `
		<div class="mb-6 rounded-2xl border-2 px-5 py-4 ${pageState.statusVariant === "negative"
		? "border-secondary bg-[#fff0ef] text-secondary"
		: "border-primary-container bg-primary-container/20 text-primary"}" role="status" aria-live="polite">
			${escapeHtml(pageState.status)}
		</div>
	`;
}

function renderSnackCard(snack) {
	const isSelected = getDraftSnackNames().has(getCore().normaliseerSnackNaam(snack.name));
	const canDelete = snack.isCustom;
	const preview = snack.image
		? `<img alt="" class="w-full h-full object-cover" src="${escapeHtml(snack.image)}"/>`
		: `<span class="font-headline-md text-headline-md text-primary">${escapeHtml(snack.name.charAt(0).toUpperCase())}</span>`;
	return `
		<article class="bg-white rounded-3xl overflow-hidden border-2 transition-all duration-200 ${isSelected ? "border-primary-container shadow-[0_16px_30px_rgba(255,184,0,0.16)]" : "border-outline-variant hover:border-primary-container hover:shadow-[0_12px_24px_rgba(33,23,15,0.08)]"}">
			<div class="h-40 bg-surface-container flex items-center justify-center overflow-hidden">
				${preview}
			</div>
			<div class="p-5 flex items-start justify-between gap-4">
				<div class="min-w-0 flex-1">
					<h2 class="font-headline-md text-headline-md text-on-surface break-words">${escapeHtml(snack.name)}</h2>
					<p class="font-label-sm text-label-sm text-on-surface-variant">${snack.isCustom ? "Eigen item" : "Standaard item"}</p>
					${canDelete
						? `<button class="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-secondary/30 px-4 py-2 font-label-sm text-label-sm text-secondary transition-all hover:border-secondary hover:bg-secondary hover:text-white active:translate-y-px" data-delete-snack="${escapeHtml(snack.name)}" type="button">
							<span class="material-symbols-outlined text-[18px]">delete</span>
							Verwijder item
						</button>`
						: `<p class="mt-3 font-label-sm text-label-sm text-on-surface-variant">Standaarditems kun je uitzetten, maar niet definitief verwijderen.</p>`}
				</div>
				<label class="relative inline-flex items-center cursor-pointer shrink-0">
					<input class="sr-only peer" ${isSelected ? "checked" : ""} data-snack-toggle="${escapeHtml(snack.name)}" type="checkbox"/>
					<div class="w-14 h-8 bg-surface-variant rounded-full peer-checked:bg-primary-container after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full"></div>
				</label>
			</div>
		</article>
	`;
}

function renderNotFound(container) {
	container.innerHTML = `
		<section class="bg-surface-container-low rounded-[32px] border-2 border-outline-variant p-10 text-center">
			<h1 class="font-headline-lg text-headline-lg text-primary mb-4">Dit rad bestaat niet</h1>
			<p class="font-body-lg text-body-lg text-on-surface-variant mb-8">Ga terug naar het overzicht en kies een bestaand rad of maak een nieuw rad aan.</p>
			<a class="inline-flex items-center justify-center gap-3 bg-primary-container text-on-primary-container font-label-md text-label-md px-8 py-4 rounded-2xl border-2 border-primary shadow-[0_4px_0_0_#5e4200]" href="./wheels.html">
				<span class="material-symbols-outlined">arrow_back</span>
				Terug naar mijn rads
			</a>
		</section>
	`;
}

function render() {
	const container = document.getElementById("wheel-detail-app");
	if (!pageState.rad) {
		renderNotFound(container);
		return;
	}

	const activeWheel = getCore().getActiefRad();
	const isActive = activeWheel.id === pageState.rad.id;
	const visibleCatalog = getVisibleCatalog();
	const saveDisabled = !getCore().normaliseerRadNaam(pageState.draftName) || pageState.draftSnacks.length === 0;

	container.innerHTML = `
		${renderStatus()}
		<div class="flex flex-col xl:flex-row gap-8 items-start mb-8">
			<section class="flex-1 bg-surface-container-low rounded-[32px] border-2 border-outline-variant p-6 md:p-8">
				<div class="flex flex-wrap items-start justify-between gap-4 mb-6">
					<div>
						<p class="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary mb-3">Rad details</p>
						<h1 class="font-headline-xl text-headline-xl text-primary mb-2">${escapeHtml(pageState.rad.name)}</h1>
						<p class="font-body-lg text-body-lg text-on-surface-variant">Geef je rad een unieke naam, voeg items toe of haal ze weg en kies daarna of dit je actieve rad moet zijn.</p>
					</div>
					<a class="inline-flex items-center justify-center gap-2 rounded-full border-2 border-outline-variant px-5 py-3 font-label-md text-label-md text-on-surface-variant bg-white transition-all hover:border-primary hover:bg-primary-container/15 hover:text-primary active:translate-y-px" href="./wheels.html">
						<span class="material-symbols-outlined">arrow_back</span>
						Terug
					</a>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
					<div class="rounded-2xl bg-white border-2 border-outline-variant p-5">
						<label class="block font-label-md text-label-md mb-2" for="wheel-name">Naam van het rad</label>
						<input class="w-full rounded-xl border-2 border-outline-variant bg-surface-container-low px-4 py-3" id="wheel-name" maxlength="50" type="text" value="${escapeHtml(pageState.draftName)}"/>
						<p class="font-label-sm text-label-sm text-on-surface-variant mt-2">De naam is verplicht en moet uniek zijn in deze browser.</p>
					</div>
					<div class="rounded-2xl bg-white border-2 border-outline-variant p-5">
						<p class="font-label-md text-label-md mb-2">Status</p>
						<p class="font-body-md text-body-md text-on-surface-variant mb-2">${isActive ? "Dit rad is nu actief." : "Dit rad staat klaar om actief te worden."}</p>
						<p class="font-body-md text-body-md text-on-surface-variant">${pageState.draftSnacks.length} items geselecteerd</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-3">
					<button class="inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-4 rounded-2xl border-2 border-primary shadow-[0_4px_0_0_#5e4200] transition-all hover:bg-primary hover:text-white hover:shadow-[0_6px_0_0_#5e4200] active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:shadow-none disabled:translate-y-0 disabled:hover:bg-primary-container disabled:hover:text-on-primary-container" ${saveDisabled ? "disabled" : ""} data-save-wheel type="button">
						<span class="material-symbols-outlined">save</span>
						Opslaan
					</button>
					<button class="inline-flex items-center justify-center gap-2 ${isActive ? "bg-primary text-white border-primary hover:bg-[#5e4200]" : "bg-white text-primary border-primary hover:bg-primary-container/20"} font-label-md text-label-md px-6 py-4 rounded-2xl border-2 transition-all hover:shadow-[0_8px_20px_rgba(124,88,0,0.16)] active:translate-y-px" data-set-active type="button">
						<span class="material-symbols-outlined">${isActive ? "check_circle" : "play_arrow"}</span>
						${isActive ? "Actief rad" : "Maak actief rad"}
					</button>
					<a class="inline-flex items-center justify-center gap-2 bg-white text-on-surface-variant font-label-md text-label-md px-6 py-4 rounded-2xl border-2 border-outline-variant transition-all hover:border-primary hover:bg-primary-container/15 hover:text-primary hover:shadow-[0_8px_20px_rgba(124,88,0,0.12)] active:translate-y-px" href="./index.html">
						<span class="material-symbols-outlined">casino</span>
						Open roulette
					</a>
				</div>
			</section>
			<aside class="w-full xl:max-w-[360px] bg-surface-container-low rounded-[32px] border-2 border-outline-variant p-6 md:p-8">
				<h2 class="font-headline-md text-headline-md text-primary mb-3">Eigen item toevoegen</h2>
				<p class="font-body-md text-body-md text-on-surface-variant mb-5">Voeg een extra snack toe die alleen in dit rad beschikbaar is.</p>
				<form class="space-y-4" id="custom-snack-form">
					<div>
						<label class="block font-label-md text-label-md mb-2" for="custom-snack-name">Naam</label>
						<input class="w-full rounded-xl border-2 border-outline-variant bg-white px-4 py-3" id="custom-snack-name" maxlength="40" name="name" required type="text"/>
					</div>
					<div>
						<label class="block font-label-md text-label-md mb-2" for="custom-snack-image">Foto-URL (optioneel)</label>
						<input class="w-full rounded-xl border-2 border-outline-variant bg-white px-4 py-3" id="custom-snack-image" name="image" placeholder="https://..." type="url"/>
					</div>
					<button class="w-full bg-secondary text-white font-label-md text-label-md py-4 rounded-2xl border-2 border-secondary transition-all hover:bg-[#930000] hover:border-[#930000] hover:shadow-[0_10px_24px_rgba(188,0,0,0.22)] active:translate-y-px" type="submit">
						Item toevoegen
					</button>
				</form>
			</aside>
		</div>
		<section class="mb-6">
			<div class="relative max-w-xl">
				<input class="w-full rounded-2xl border-2 border-primary-container bg-white px-5 py-4 pl-14" id="wheel-search" placeholder="Zoek een item..." type="search" value="${escapeHtml(pageState.search)}"/>
				<span class="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary">search</span>
			</div>
		</section>
		<section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			${visibleCatalog.map(renderSnackCard).join("")}
		</section>
	`;
}

function toggleSnack(name, isSelected) {
	const normalized = getCore().normaliseerSnackNaam(name);
	const existing = pageState.draftSnacks.find(function (snack) {
		return getCore().normaliseerSnackNaam(snack.name) === normalized;
	});

	if (isSelected && !existing) {
		const snack = getVisibleCatalog().find(function (candidate) {
			return getCore().normaliseerSnackNaam(candidate.name) === normalized;
		});
		if (snack) {
			pageState.draftSnacks = pageState.draftSnacks.concat([{ ...snack }]);
		}
	}

	if (!isSelected && existing) {
		pageState.draftSnacks = pageState.draftSnacks.filter(function (snack) {
			return getCore().normaliseerSnackNaam(snack.name) !== normalized;
		});
	}

	render();
}

/**
 * Removing a custom item is stronger than merely deselecting it: once deleted
 * it disappears from this wheel's catalog until the visitor adds it again.
 *
 * @param {string} name
 * @returns {void}
 */
function deleteSnack(name) {
	const normalized = getCore().normaliseerSnackNaam(name);
	const snack = getVisibleCatalog().find(function (candidate) {
		return getCore().normaliseerSnackNaam(candidate.name) === normalized;
	});
	if (!snack || !snack.isCustom) {
		setStatus("Alleen eigen items kunnen definitief uit deze lijst worden verwijderd.", "negative");
		return;
	}

	pageState.draftSnacks = pageState.draftSnacks.filter(function (draftSnack) {
		return getCore().normaliseerSnackNaam(draftSnack.name) !== normalized;
	});
	setStatus(`"${snack.name}" is uit dit rad verwijderd.`, "positive");
}

function saveWheel() {
	try {
		pageState.rad = getCore().updateRad(pageState.rad.id, {
			name: pageState.draftName,
			snacks: pageState.draftSnacks
		});
		pageState.draftName = pageState.rad.name;
		pageState.draftSnacks = pageState.rad.snacks.map(function (snack) {
			return { ...snack };
		});
		setStatus(`"${pageState.rad.name}" is opgeslagen.`, "positive");
	} catch (error) {
		setStatus(error.message || "Opslaan is niet gelukt.", "negative");
	}
}

function setActiveWheel() {
	const rad = getCore().setActiefRad(pageState.rad.id);
	if (!rad) {
		setStatus("Dit rad kon niet actief worden gemaakt.", "negative");
		return;
	}

	pageState.rad = rad;
	setStatus(`"${rad.name}" is nu het actieve rad.`, "positive");
}

function handleClick(event) {
	const saveButton = event.target.closest("[data-save-wheel]");
	if (saveButton) {
		saveWheel();
		return;
	}

	const setActiveButton = event.target.closest("[data-set-active]");
	if (setActiveButton) {
		setActiveWheel();
		return;
	}

	const deleteButton = event.target.closest("[data-delete-snack]");
	if (deleteButton) {
		deleteSnack(deleteButton.getAttribute("data-delete-snack"));
		return;
	}

	const toggle = event.target.closest("[data-snack-toggle]");
	if (toggle) {
		toggleSnack(toggle.getAttribute("data-snack-toggle"), toggle.checked);
	}
}

function handleInput(event) {
	if (event.target.id === "wheel-name") {
		pageState.draftName = event.target.value;
		return;
	}

	if (event.target.id === "wheel-search") {
		pageState.search = event.target.value;
		render();
	}
}

function handleSubmit(event) {
	if (event.target.id !== "custom-snack-form") {
		return;
	}

	event.preventDefault();
	const formData = new FormData(event.target);
	const snack = getCore().normaliseerSnack({
		name: formData.get("name"),
		image: formData.get("image"),
		isCustom: true
	});
	if (!snack) {
		setStatus("Voer een geldige naam in voor het nieuwe item.", "negative");
		return;
	}

	if (formData.get("image") && !snack.image) {
		setStatus("Gebruik een geldige http(s)-afbeeldings-URL.", "negative");
		return;
	}

	const bestaatAl = pageState.draftSnacks.some(function (draftSnack) {
		return getCore().normaliseerSnackNaam(draftSnack.name) === getCore().normaliseerSnackNaam(snack.name);
	});
	if (bestaatAl) {
		setStatus("Dit item staat al in dit rad.", "negative");
		return;
	}

	pageState.draftSnacks = pageState.draftSnacks.concat([snack]);
	event.target.reset();
	setStatus(`"${snack.name}" is toegevoegd aan het concept.`, "positive");
}

function init() {
	const rad = getCore().getRadOpId(getRadIdFromUrl());
	if (rad) {
		pageState.rad = rad;
		pageState.draftName = rad.name;
		pageState.draftSnacks = rad.snacks.map(function (snack) {
			return { ...snack };
		});
	}

	render();
	document.addEventListener("click", handleClick);
	document.addEventListener("input", handleInput);
	document.addEventListener("submit", handleSubmit);
}

window.addEventListener("DOMContentLoaded", init);
