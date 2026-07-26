import {
	createDirectOrderItemWithQuantity,
	createDirectOrderPerson,
	loadDirectOrderById,
	saveDirectOrder,
	summarizeDirectOrderSnacks
} from "./direct-order-store.js";

const AUTOSAVE_DELAY_MS = 350;
const DEFAULT_DRAFT_QUANTITY = 1;

const state = {
	order: null,
	newSnackDrafts: {},
	saveStatus: "",
	autosaveTimerId: null
};

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function getOrderIdFromUrl() {
	return new URLSearchParams(window.location.search).get("id") || "";
}

function createOrderSummaryHref(orderId) {
	return `./order-summary.html?id=${encodeURIComponent(orderId)}`;
}

function updateSaveStatus(message) {
	state.saveStatus = message;
	const element = document.getElementById("direct-order-save-status");
	if (element) {
		element.textContent = message;
	}
}

function renderMissingOrder(container) {
	container.innerHTML = `
		<section class="order-summary-empty" aria-labelledby="missing-order-title">
			<span class="material-symbols-outlined order-summary-empty__icon" aria-hidden="true">shopping_cart_off</span>
			<h1 id="missing-order-title">Bestelling niet gevonden</h1>
			<p>Deze bestelling staat niet in de lokale browseropslag. Ga terug naar het besteloverzicht en maak een nieuwe bestelling aan.</p>
			<a class="order-summary__primary-action" href="./order.html">Ga naar bestellingen</a>
		</section>
	`;
}

/**
 * Keep transient add-row values outside the stored order so empty helper inputs
 * never pollute persisted data while users are still typing the next snack.
 *
 * @param {string} personId
 * @returns {{name:string,quantity:number}}
 */
function getDraftForPerson(personId) {
	if (!state.newSnackDrafts[personId]) {
		state.newSnackDrafts[personId] = {
			name: "",
			quantity: DEFAULT_DRAFT_QUANTITY
		};
	}

	return state.newSnackDrafts[personId];
}

function focusNewSnackName(personId) {
	const field = document.querySelector(`[data-order-new-snack-name="${personId}"]`);
	if (field instanceof HTMLElement) {
		field.focus();
	}
}

function renderTotals() {
	const totalsContainer = document.getElementById("direct-order-totals");
	if (!totalsContainer) {
		return;
	}

	const totals = state.order ? summarizeDirectOrderSnacks(state.order.people) : [];
	totalsContainer.innerHTML = totals.length > 0
		? totals.map((snack) => `
			<div class="order-total-row">
				<span aria-label="${escapeHtml(snack.quantity)} stuks" class="order-total-row__amount">${escapeHtml(snack.quantity)}</span>
				<span class="order-total-row__name">${escapeHtml(snack.name)}</span>
			</div>
		`).join("")
		: `
			<div class="order-summary-empty !my-0 !w-full !p-6 !shadow-none">
				<span class="material-symbols-outlined order-summary-empty__icon" aria-hidden="true">receipt_long</span>
				<h1>Nog geen snacks gekozen</h1>
				<p>Het totaaloverzicht vult zich automatisch zodra je per persoon snacks toevoegt.</p>
			</div>
		`;
}

function renderSnackRow(person, snack, index) {
	return `
		<div class="group-person-card" data-order-snack-id="${escapeHtml(snack.id)}">
			<div class="group-person-card__identity">
				<div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
					<input aria-label="Snacknaam ${index + 1}" class="group-person-card__name" id="order-snack-name-${escapeHtml(snack.id)}" data-order-snack-name="${escapeHtml(person.id)}:${escapeHtml(snack.id)}" maxlength="80" placeholder="Bijvoorbeeld: Frikandel speciaal" type="text" value="${escapeHtml(snack.name)}"/>
					<div>
						<div class="flex items-center gap-md">
							<button class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary text-primary transition-colors hover:bg-primary-fixed" data-adjust-snack-quantity="${escapeHtml(person.id)}:${escapeHtml(snack.id)}:-1" type="button">
								<span class="material-symbols-outlined" aria-hidden="true">remove</span>
							</button>
							<input aria-label="Snackaantal ${index + 1}" class="w-24 bg-transparent text-center text-headline-md font-bold border-none focus:ring-0" id="order-snack-quantity-${escapeHtml(snack.id)}" data-order-snack-quantity="${escapeHtml(person.id)}:${escapeHtml(snack.id)}" readonly type="number" value="${escapeHtml(snack.quantity)}"/>
							<button class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-container hover:text-on-primary-container shadow-sm" data-adjust-snack-quantity="${escapeHtml(person.id)}:${escapeHtml(snack.id)}:1" type="button">
								<span class="material-symbols-outlined" aria-hidden="true">add</span>
							</button>
						</div>
					</div>
					<button class="direct-order-snack-remove order-summary__secondary-action !w-auto !rounded-xl !px-4 !py-3" data-remove-order-snack="${escapeHtml(person.id)}:${escapeHtml(snack.id)}" type="button">Verwijder</button>
				</div>
			</div>
		</div>
	`;
}

function renderDraftSnackRow(person) {
	const draft = getDraftForPerson(person.id);
	return `
		<div class="group-person-card" data-order-new-snack-row="${escapeHtml(person.id)}">
			<div class="group-person-card__identity">
				<div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
					<input aria-label="Nieuwe snacknaam" class="group-person-card__name" id="order-new-snack-name-${escapeHtml(person.id)}" data-order-new-snack-name="${escapeHtml(person.id)}" maxlength="80" placeholder="Bijvoorbeeld: Frikandel speciaal" type="text" value="${escapeHtml(draft.name)}"/>
					<div>
						<div class="flex items-center gap-md">
							<button class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary text-primary transition-colors hover:bg-primary-fixed" data-adjust-draft-quantity="${escapeHtml(person.id)}:-1" type="button">
								<span class="material-symbols-outlined" aria-hidden="true">remove</span>
							</button>
							<input aria-label="Nieuw snackaantal" class="w-24 bg-transparent text-center text-headline-md font-bold border-none focus:ring-0" id="order-new-snack-quantity-${escapeHtml(person.id)}" data-order-new-snack-quantity="${escapeHtml(person.id)}" readonly type="number" value="${escapeHtml(draft.quantity)}"/>
							<button class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-container hover:text-on-primary-container shadow-sm" data-adjust-draft-quantity="${escapeHtml(person.id)}:1" type="button">
								<span class="material-symbols-outlined" aria-hidden="true">add</span>
							</button>
						</div>
					</div>
				</div>
				<p class="mt-3 text-body-sm text-on-surface-variant">Druk op Enter of verlaat deze rij om de snack direct toe te voegen.</p>
			</div>
		</div>
	`;
}

function renderPersonCard(person) {
	return `
		<article class="group-order-card !p-5" data-order-person-id="${escapeHtml(person.id)}">
			<div class="space-y-4">
				<input aria-label="Naam van persoon" class="group-person-card__name !text-headline-md" data-order-person-name="${escapeHtml(person.id)}" maxlength="50" placeholder="Naam van persoon" type="text" value="${escapeHtml(person.name)}"/>
				<div class="group-order-people !grid-cols-1">
					${person.snacks.length > 0
						? person.snacks.map((snack, index) => renderSnackRow(person, snack, index)).join("")
						: `<div class="order-summary-empty !my-0 !w-full !p-6 !shadow-none">
							<span class="material-symbols-outlined order-summary-empty__icon" aria-hidden="true">fastfood</span>
							<h1>Nog geen snacks voor ${escapeHtml(person.name)}</h1>
							<p>Voeg hieronder direct de eerste snack en hoeveelheid toe.</p>
						</div>`}
					${renderDraftSnackRow(person)}
				</div>
			</div>
		</article>
	`;
}

function render() {
	const container = document.getElementById("direct-order-detail-app");
	if (!state.order) {
		renderMissingOrder(container);
		return;
	}

	container.innerHTML = `
		<section class="group-order-hero mb-8" aria-labelledby="direct-order-title">
			<div class="space-y-4">
				<div class="flex flex-wrap items-center gap-3">
					<span class="group-order-eyebrow">Losse bestelling</span>
					<a class="order-summary__secondary-action !w-auto !rounded-full !px-5 !py-3" href="${createOrderSummaryHref(state.order.id)}">Bestellijst bekijken</a>
				</div>
				<h1 id="direct-order-title">Bestelling bewerken</h1>
				<p>Wijzigingen worden automatisch opgeslagen. Voeg per persoon snacks en aantallen toe in een compacte lijst.</p>
			</div>
			<div class="group-order-hero__badge" aria-hidden="true">
				<span class="material-symbols-outlined">shopping_cart</span>
			</div>
		</section>
		<div class="order-summary__layout">
			<section class="group-order-card" aria-labelledby="order-detail-fields-title">
				<header class="group-order-card__header">
					<span class="group-order-step">1</span>
					<div>
						<h2 id="order-detail-fields-title">Bestelgegevens</h2>
						<p>Alles blijft lokaal in deze browser opgeslagen.</p>
					</div>
				</header>
				<div class="space-y-5">
					<div>
						<label class="block font-label-md text-label-md mb-2" for="direct-order-name">Titel</label>
						<input class="w-full rounded-xl border-2 border-outline-variant bg-white px-4 py-3" id="direct-order-name" maxlength="80" type="text" value="${escapeHtml(state.order.title)}"/>
					</div>
					<div>
						<label class="block font-label-md text-label-md mb-2" for="direct-order-description">Omschrijving</label>
						<textarea class="w-full min-h-[120px] rounded-xl border-2 border-outline-variant bg-white px-4 py-3" id="direct-order-description" maxlength="280">${escapeHtml(state.order.description)}</textarea>
					</div>
					<div>
						<label class="font-label-md block mb-sm text-on-surface-variant" for="direct-order-people-count">Hoeveel mensen eten mee?</label>
						<div class="flex items-center gap-md">
							<button class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary text-primary transition-colors hover:bg-primary-fixed" data-adjust-people="-1" type="button">
								<span class="material-symbols-outlined" aria-hidden="true">remove</span>
							</button>
							<input class="w-24 bg-transparent text-center text-headline-md font-bold border-none focus:ring-0" id="direct-order-people-count" readonly type="number" value="${escapeHtml(state.order.peopleCount)}"/>
							<button class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-container hover:text-on-primary-container shadow-sm" data-adjust-people="1" type="button">
								<span class="material-symbols-outlined" aria-hidden="true">add</span>
							</button>
						</div>
					</div>
				</div>
			</section>
			<aside class="order-totals" aria-labelledby="order-detail-totals-title">
				<h2 id="order-detail-totals-title">Totaaloverzicht</h2>
				<p class="mb-4 text-center text-body-md text-on-surface-variant" id="direct-order-save-status">${escapeHtml(state.saveStatus || "Wijzigingen worden automatisch opgeslagen.")}</p>
				<div id="direct-order-totals"></div>
			</aside>
		</div>
		<section class="group-order-card mt-8" aria-labelledby="order-items-title">
			<header class="group-order-card__header">
				<span class="group-order-step">2</span>
				<div>
					<h2 id="order-items-title">Personen en snacks</h2>
					<p>Iedere persoon heeft direct een eigen naam, snackregels en een nieuwe invoerrij onderaan.</p>
				</div>
			</header>
			<div class="group-order-people !grid-cols-1" id="direct-order-items">
				${state.order.people.map((person) => renderPersonCard(person)).join("")}
			</div>
		</section>
	`;

	renderTotals();
	updateSaveStatus(state.saveStatus || "Wijzigingen worden automatisch opgeslagen.");
}

/**
 * The people count controls the visible card list. Existing names and snacks
 * remain intact while only surplus cards are added or trimmed.
 *
 * @param {number|string} requestedCount
 * @returns {void}
 */
function applyPeopleCount(requestedCount) {
	if (!state.order) {
		return;
	}

	const nextPeopleCount = Math.min(200, Math.max(1, Number.parseInt(requestedCount, 10) || 1));
	const currentPeople = state.order.people.slice(0, nextPeopleCount);

	while (currentPeople.length < nextPeopleCount) {
		currentPeople.push(createDirectOrderPerson(currentPeople.length));
	}

	state.order = {
		...state.order,
		peopleCount: nextPeopleCount,
		people: currentPeople
	};
}

function syncOrderFromInputs() {
	if (!state.order) {
		return;
	}

	const titleField = document.getElementById("direct-order-name");
	const descriptionField = document.getElementById("direct-order-description");
	const peopleField = document.getElementById("direct-order-people-count");
	const requestedPeopleCount = peopleField ? peopleField.value : state.order.peopleCount;

	applyPeopleCount(requestedPeopleCount);

	state.order = {
		...state.order,
		title: titleField ? titleField.value : state.order.title,
		description: descriptionField ? descriptionField.value : state.order.description,
		peopleCount: requestedPeopleCount,
		people: state.order.people.map((person) => {
			const personField = document.querySelector(`[data-order-person-name="${person.id}"]`);
			return {
				...person,
				name: personField ? personField.value : person.name,
				snacks: person.snacks.map((snack) => {
					const nameField = document.querySelector(`[data-order-snack-name="${person.id}:${snack.id}"]`);
					const quantityField = document.querySelector(`[data-order-snack-quantity="${person.id}:${snack.id}"]`);
					return {
						...snack,
						name: nameField ? nameField.value : snack.name,
						quantity: quantityField ? quantityField.value : snack.quantity
					};
				})
			};
		})
	};
}

/**
 * Save without rerendering while the user is typing so focus and cursor
 * position stay stable. Structural edits such as changing person count or
 * adding/removing snacks opt into a rerender explicitly.
 *
 * @param {{renderAfterSave?: boolean, skipSync?: boolean}} options
 * @returns {boolean}
 */
function saveCurrentOrder(options = {}) {
	const { renderAfterSave = false, skipSync = false } = options;
	if (!skipSync) {
		syncOrderFromInputs();
	}
	const savedOrder = saveDirectOrder(state.order);
	if (!savedOrder) {
		updateSaveStatus("Automatisch opslaan mislukt.");
		return false;
	}

	state.order = savedOrder;
	updateSaveStatus(`Automatisch opgeslagen om ${new Intl.DateTimeFormat("nl-NL", { timeStyle: "short" }).format(new Date(savedOrder.updatedAt))}.`);
	if (renderAfterSave) {
		render();
	} else {
		renderTotals();
	}
	return true;
}

function scheduleAutosave() {
	if (state.autosaveTimerId) {
		window.clearTimeout(state.autosaveTimerId);
	}

	updateSaveStatus("Wijzigingen worden opgeslagen...");
	state.autosaveTimerId = window.setTimeout(() => {
		state.autosaveTimerId = null;
		saveCurrentOrder();
	}, AUTOSAVE_DELAY_MS);
}

function adjustPeopleCount(change) {
	const peopleField = document.getElementById("direct-order-people-count");
	if (!(peopleField instanceof HTMLInputElement)) {
		return;
	}

	const nextValue = Math.max(1, Math.min(200, Number.parseInt(peopleField.value, 10) + change));
	peopleField.value = String(nextValue);
	applyPeopleCount(nextValue);
	saveCurrentOrder({ renderAfterSave: true });
}

function removeOrderSnack(personId, snackId) {
	syncOrderFromInputs();
	state.order = {
		...state.order,
		people: state.order.people.map((person) => person.id === personId
			? {
				...person,
				snacks: person.snacks.filter((snack) => snack.id !== snackId)
			}
			: person)
	};
	saveCurrentOrder({ renderAfterSave: true });
}

function updateDraftField(personId, fieldName, value) {
	const currentDraft = getDraftForPerson(personId);
	currentDraft[fieldName] = fieldName === "quantity"
		? Math.max(1, Number.parseInt(value, 10) || DEFAULT_DRAFT_QUANTITY)
		: value;
}

function adjustExistingSnackQuantity(personId, snackId, change) {
	syncOrderFromInputs();
	state.order = {
		...state.order,
		people: state.order.people.map((person) => person.id === personId
			? {
				...person,
				snacks: person.snacks.map((snack) => snack.id === snackId
					? {
						...snack,
						quantity: Math.max(1, Math.min(99, (Number.parseInt(snack.quantity, 10) || 1) + change))
					}
					: snack)
			}
			: person)
	};
	saveCurrentOrder({ renderAfterSave: true, skipSync: true });
}

function adjustDraftQuantity(personId, change) {
	const draft = getDraftForPerson(personId);
	draft.quantity = Math.max(1, Math.min(99, (Number.parseInt(draft.quantity, 10) || 1) + change));
	render();
	focusNewSnackName(personId);
}

function commitDraftSnack(personId) {
	const draft = getDraftForPerson(personId);
	if (!draft.name.trim()) {
		return;
	}

	syncOrderFromInputs();
	state.order = {
		...state.order,
		people: state.order.people.map((person) => person.id === personId
			? {
				...person,
				snacks: [...person.snacks, createDirectOrderItemWithQuantity(draft.name, draft.quantity)]
			}
			: person)
	};
	state.newSnackDrafts[personId] = {
		name: "",
		quantity: DEFAULT_DRAFT_QUANTITY
	};
	saveCurrentOrder({ renderAfterSave: true });
	focusNewSnackName(personId);
}

function openOrderSummary() {
	if (saveCurrentOrder()) {
		window.location.assign(createOrderSummaryHref(state.order.id));
	}
}

function handleClick(event) {
	const target = event.target instanceof Element ? event.target : null;
	if (!target) {
		return;
	}

	const removeButton = target.closest("[data-remove-order-snack]");
	if (removeButton) {
		const [personId, snackId] = removeButton.getAttribute("data-remove-order-snack").split(":");
		removeOrderSnack(personId, snackId);
		return;
	}

	const snackQuantityButton = target.closest("[data-adjust-snack-quantity]");
	if (snackQuantityButton) {
		const [personId, snackId, change] = snackQuantityButton.getAttribute("data-adjust-snack-quantity").split(":");
		adjustExistingSnackQuantity(personId, snackId, Number.parseInt(change, 10));
		return;
	}

	const draftQuantityButton = target.closest("[data-adjust-draft-quantity]");
	if (draftQuantityButton) {
		const [personId, change] = draftQuantityButton.getAttribute("data-adjust-draft-quantity").split(":");
		adjustDraftQuantity(personId, Number.parseInt(change, 10));
		return;
	}

	const peopleAdjustmentButton = target.closest("[data-adjust-people]");
	if (peopleAdjustmentButton) {
		adjustPeopleCount(Number.parseInt(peopleAdjustmentButton.getAttribute("data-adjust-people"), 10));
		return;
	}

	const viewSummaryButton = target.closest("[href^=\"./order-summary.html\"], [data-view-order-summary]");
	if (viewSummaryButton instanceof HTMLAnchorElement) {
		event.preventDefault();
		openOrderSummary();
	}
}

function handleInput(event) {
	const target = event.target;
	if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
		return;
	}

	if (target.hasAttribute("data-order-new-snack-name")) {
		updateDraftField(target.getAttribute("data-order-new-snack-name"), "name", target.value);
		return;
	}

	if (target.hasAttribute("data-order-new-snack-quantity")) {
		updateDraftField(target.getAttribute("data-order-new-snack-quantity"), "quantity", target.value);
		return;
	}

	scheduleAutosave();
}

function handleFocusOut(event) {
	const target = event.target instanceof Element ? event.target : null;
	if (!target) {
		return;
	}

	const draftRow = target.closest("[data-order-new-snack-row]");
	if (!draftRow) {
		return;
	}

	if (event.relatedTarget instanceof Element && draftRow.contains(event.relatedTarget)) {
		return;
	}

	commitDraftSnack(draftRow.getAttribute("data-order-new-snack-row"));
}

function handleKeyDown(event) {
	const target = event.target instanceof Element ? event.target : null;
	if (!target) {
		return;
	}

	const draftRow = target.closest("[data-order-new-snack-row]");
	if (draftRow && event.key === "Enter") {
		event.preventDefault();
		commitDraftSnack(draftRow.getAttribute("data-order-new-snack-row"));
	}
}

async function initOrderDetailPage() {
	await customElements.whenDefined("site-header");
	state.order = loadDirectOrderById(getOrderIdFromUrl());
	render();
	document.addEventListener("click", handleClick);
	document.addEventListener("input", handleInput);
	document.addEventListener("focusout", handleFocusOut);
	document.addEventListener("keydown", handleKeyDown);
}

initOrderDetailPage();
