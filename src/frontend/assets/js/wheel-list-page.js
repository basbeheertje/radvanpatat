const DATE_FORMATTER = new Intl.DateTimeFormat("nl-NL", {
	dateStyle: "medium",
	timeStyle: "short"
});

const state = {
	sort: "recent",
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
	state.status = message;
	state.statusVariant = variant || "positive";
	render();
}

function getAppState() {
	const core = getCore();
	const activeWheel = core.getActiefRad();
	return {
		activeWheelId: activeWheel.id,
		rads: core.listRads()
	};
}

function getSortedRads(rads) {
	return rads.slice().sort(function (left, right) {
		if (state.sort === "used") {
			return right.spinCount - left.spinCount || right.lastUsedAt - left.lastUsedAt;
		}

		if (state.sort === "alphabetical") {
			return left.name.localeCompare(right.name, "nl-NL");
		}

		return right.updatedAt - left.updatedAt;
	});
}

function buildShareUrl(rad) {
	const url = new URL("./index.html", window.location.href);
	url.searchParams.set("rad", getCore().maakDeelToken(rad.snacks));
	return url.toString();
}

function getPreviewIcon(rad) {
	const customCount = rad.snacks.filter(function (snack) {
		return snack.isCustom;
	}).length;
	return customCount > 0 ? "star" : "lunch_dining";
}

function renderStatus() {
	if (!state.status) {
		return "";
	}

	return `
		<div class="mb-6 rounded-2xl border-2 px-5 py-4 ${state.statusVariant === "negative"
		? "border-secondary bg-[#fff0ef] text-secondary"
		: "border-primary-container bg-primary-container/20 text-primary"}" role="status" aria-live="polite">
			${escapeHtml(state.status)}
		</div>
	`;
}

function renderCreateModal() {
	return `
		<div class="viewport-modal-overlay fixed inset-0 z-[240] hidden items-center justify-center p-6 bg-black/60 backdrop-blur-sm" id="wheel-create-overlay">
			<div class="viewport-modal-panel bg-surface max-w-md w-full rounded-3xl p-8 border-4 border-primary-container shadow-2xl">
				<div class="flex items-start justify-between gap-4 mb-6">
					<div>
						<h2 class="font-headline-lg text-headline-lg text-primary">Nieuw rad</h2>
						<p class="font-body-md text-body-md text-on-surface-variant">Elke radnaam is verplicht en moet uniek zijn in deze browser.</p>
					</div>
					<button aria-label="Nieuw rad sluiten" class="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center" data-create-close type="button">
						<span class="material-symbols-outlined">close</span>
					</button>
				</div>
				<form class="space-y-4" id="wheel-create-form">
					<div>
						<label class="block font-label-md text-label-md mb-2" for="wheel-create-name">Naam van het rad</label>
						<input class="w-full rounded-xl border-2 border-outline-variant bg-surface-container-low px-4 py-3" id="wheel-create-name" maxlength="50" name="name" required type="text" autocomplete="off"/>
					</div>
					<p class="font-body-md text-body-md text-on-surface-variant">Nieuwe rads starten met de standaard snackselectie en kun je daarna volledig aanpassen.</p>
					<button class="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-4 rounded-xl border-2 border-primary shadow-[0_4px_0_0_#5e4200] active:translate-y-1 active:shadow-none" type="submit">
						Rad aanmaken
					</button>
				</form>
			</div>
		</div>
	`;
}

function render() {
	const appState = getAppState();
	const container = document.getElementById("wheel-list-app");
	const sortedRads = getSortedRads(appState.rads);

	container.innerHTML = `
		${renderStatus()}
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
			<div>
				<p class="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary mb-3">Overzicht</p>
				<h1 class="font-headline-xl text-headline-xl text-primary mb-2">Mijn rads</h1>
				<p class="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">Beheer hier al je opgeslagen rads, stel een rad actief in en open later precies dezelfde selectie opnieuw.</p>
			</div>
			<button class="group inline-flex items-center justify-center gap-3 bg-primary-container text-on-primary-container font-headline-md text-headline-md px-8 py-5 rounded-2xl border-2 border-primary shadow-[0_6px_0_0_#7c5800] active:translate-y-1 active:shadow-none transition-all" data-create-open type="button">
				<span class="material-symbols-outlined text-[30px]">add_circle</span>
				Nieuw rad aanmaken
			</button>
		</div>
		<div class="flex flex-wrap items-center gap-3 mb-8">
			<span class="font-label-md text-label-md text-on-surface-variant">Sorteren op:</span>
			<button class="px-5 py-2 rounded-full font-label-md border-2 ${state.sort === "recent" ? "bg-primary text-white border-primary" : "bg-surface-container-low border-outline-variant text-on-surface-variant"}" data-sort="recent" type="button">Recent</button>
			<button class="px-5 py-2 rounded-full font-label-md border-2 ${state.sort === "used" ? "bg-primary text-white border-primary" : "bg-surface-container-low border-outline-variant text-on-surface-variant"}" data-sort="used" type="button">Meest gebruikt</button>
			<button class="px-5 py-2 rounded-full font-label-md border-2 ${state.sort === "alphabetical" ? "bg-primary text-white border-primary" : "bg-surface-container-low border-outline-variant text-on-surface-variant"}" data-sort="alphabetical" type="button">Alfabetisch</button>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			${sortedRads.map(function (rad) {
				const isActive = rad.id === appState.activeWheelId;
				const customCount = rad.snacks.filter(function (snack) {
					return snack.isCustom;
				}).length;
				return `
					<article class="group relative bg-surface-container-low rounded-[28px] p-6 border-2 ${isActive ? "border-primary-container shadow-[0_16px_30px_rgba(255,184,0,0.18)]" : "border-outline-variant shadow-[0_10px_24px_rgba(33,23,15,0.06)]"} transition-all" data-open-wheel="${escapeHtml(rad.id)}" tabindex="0">
						${isActive ? '<span class="absolute top-4 right-4 bg-secondary text-white font-label-sm px-3 py-1 rounded-full">Actief rad</span>' : ""}
						<div class="flex items-center gap-4 mb-6">
							<div class="w-16 h-16 rounded-full bg-primary-container border-2 border-primary flex items-center justify-center text-primary">
								<span class="material-symbols-outlined text-[32px]">${getPreviewIcon(rad)}</span>
							</div>
							<div class="min-w-0">
								<h2 class="font-headline-md text-headline-md text-primary leading-tight break-words">${escapeHtml(rad.name)}</h2>
								<p class="font-label-sm text-label-sm text-on-surface-variant">${rad.snacks.length} items • ${rad.spinCount}x gedraaid</p>
								<p class="font-label-sm text-label-sm text-on-surface-variant">Bijgewerkt: ${escapeHtml(DATE_FORMATTER.format(new Date(rad.updatedAt)))}</p>
							</div>
						</div>
						<div class="rounded-2xl bg-white/80 border border-outline-variant px-4 py-3 mb-5">
							<p class="font-body-md text-body-md text-on-surface-variant">Standaard: ${rad.snacks.length - customCount} • Eigen items: ${customCount}</p>
						</div>
						<div class="grid grid-cols-3 gap-3">
							<button class="flex flex-col items-center justify-center gap-1 py-3 rounded-xl ${isActive ? "bg-primary text-white border-2 border-primary" : "bg-primary-container text-on-primary-container border-2 border-primary"}" data-use-wheel="${escapeHtml(rad.id)}" type="button">
								<span class="material-symbols-outlined">play_arrow</span>
								<span class="text-[10px] font-bold">${isActive ? "OPEN" : "GEBRUIK"}</span>
							</button>
							<a class="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 border-outline-variant text-on-surface-variant bg-white hover:bg-surface-container-low" href="./wheel.html?id=${encodeURIComponent(rad.id)}">
								<span class="material-symbols-outlined">edit</span>
								<span class="text-[10px] font-bold">BEWERK</span>
							</a>
							<button class="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 border-outline-variant text-on-surface-variant bg-white hover:bg-surface-container-low" data-share-wheel="${escapeHtml(rad.id)}" type="button">
								<span class="material-symbols-outlined">share</span>
								<span class="text-[10px] font-bold">DEEL</span>
							</button>
						</div>
					</article>
				`;
			}).join("")}
		</div>
		${renderCreateModal()}
	`;
}

function openCreateOverlay() {
	const overlay = document.getElementById("wheel-create-overlay");
	if (!overlay) {
		return;
	}

	overlay.classList.remove("hidden");
	overlay.classList.add("flex");
	window.requestAnimationFrame(function () {
		const input = document.getElementById("wheel-create-name");
		if (input) {
			input.focus();
		}
	});
}

function closeCreateOverlay() {
	const overlay = document.getElementById("wheel-create-overlay");
	if (!overlay) {
		return;
	}

	overlay.classList.add("hidden");
	overlay.classList.remove("flex");
}

async function copyShareLink(rad) {
	const url = buildShareUrl(rad);
	if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
		await navigator.clipboard.writeText(url);
		return;
	}

	throw new Error("Kopiëren naar het klembord is niet beschikbaar.");
}

function handleClick(event) {
	const createOpen = event.target.closest("[data-create-open]");
	if (createOpen) {
		openCreateOverlay();
		return;
	}

	const createClose = event.target.closest("[data-create-close]");
	if (createClose || event.target.id === "wheel-create-overlay") {
		closeCreateOverlay();
		return;
	}

	const sortButton = event.target.closest("[data-sort]");
	if (sortButton) {
		state.sort = sortButton.getAttribute("data-sort") || "recent";
		render();
		return;
	}

	const useButton = event.target.closest("[data-use-wheel]");
	if (useButton) {
		const rad = getCore().setActiefRad(useButton.getAttribute("data-use-wheel"));
		if (!rad) {
			setStatus("Dit rad kon niet actief worden gemaakt.", "negative");
			return;
		}

		window.location.assign("./index.html");
		return;
	}

	const shareButton = event.target.closest("[data-share-wheel]");
	if (shareButton) {
		const rad = getCore().getRadOpId(shareButton.getAttribute("data-share-wheel"));
		if (!rad) {
			setStatus("De deellink kon niet worden gemaakt.", "negative");
			return;
		}

		copyShareLink(rad)
			.then(function () {
				setStatus(`Deellink voor "${rad.name}" is gekopieerd.`, "positive");
			})
			.catch(function () {
				setStatus("Kopiëren is niet gelukt. Gebruik eventueel de detailpagina om het rad te openen.", "negative");
			});
		return;
	}

	const card = event.target.closest("[data-open-wheel]");
	if (card && !event.target.closest("button, a")) {
		window.location.assign(`./wheel.html?id=${encodeURIComponent(card.getAttribute("data-open-wheel"))}`);
	}
}

function handleKeyDown(event) {
	const card = event.target.closest("[data-open-wheel]");
	if (!card) {
		return;
	}

	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		window.location.assign(`./wheel.html?id=${encodeURIComponent(card.getAttribute("data-open-wheel"))}`);
	}
}

function handleSubmit(event) {
	if (event.target.id !== "wheel-create-form") {
		return;
	}

	event.preventDefault();
	const formData = new FormData(event.target);
	try {
		const nieuwRad = getCore().createRad({
			name: formData.get("name"),
			snacks: getCore().getDefaultSnacks()
		});
		window.location.assign(`./wheel.html?id=${encodeURIComponent(nieuwRad.id)}`);
	} catch (error) {
		setStatus(error.message || "Het nieuwe rad kon niet worden aangemaakt.", "negative");
	}
}

function init() {
	render();
	document.addEventListener("click", handleClick);
	document.addEventListener("keydown", handleKeyDown);
	document.addEventListener("submit", handleSubmit);
}

window.addEventListener("DOMContentLoaded", init);
