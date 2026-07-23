import {
	GROUP_LIMITS,
	applyDefaultTarget,
	assignSnackToPerson,
	getOrderProgress,
	pickRandomEligiblePerson,
	resizePeople
} from "./group-order-engine.js";
import {
	GROUP_ORDER_VERSION,
	normalizeGroupOrder,
	saveLatestGroupOrder
} from "./group-order-store.js";

const DEFAULT_PEOPLE_COUNT = 5;
const DEFAULT_SNACK_COUNT = 2;
const PERSON_NAME_MAX_LENGTH = 50;
const ROUND_PAUSE_MS = 650;

// This page state survives consecutive asynchronous spins. `runId` invalidates
// an older sequence if a future cancellation or restart starts a new sequence.
const state = {
	people: resizePeople([], DEFAULT_PEOPLE_COUNT, DEFAULT_SNACK_COUNT),
	defaultSnackCount: DEFAULT_SNACK_COUNT,
	activePersonId: null,
	isRunning: false,
	runId: 0,
	latestOrder: null
};

const elements = {};

function getDisplayName(person, index) {
	const trimmedName = person.name.trim();
	return trimmedName || `Persoon ${index + 1}`;
}

/**
 * Keeps storage and runtime failures visible without interrupting the current
 * completed order view.
 *
 * @param {string} message
 * @returns {void}
 */
function setMessage(message) {
	elements.message.textContent = message;
	elements.message.hidden = !message;
}

/**
 * Derives progress from person assignments so the labels and bar cannot drift
 * from the eligibility rules used by the automatic sequence.
 *
 * @returns {void}
 */
function updateProgress() {
	const progress = getOrderProgress(state.people);
	const percentage = progress.requested > 0
		? Math.round((progress.assigned / progress.requested) * 100)
		: 0;
	elements.totalSnacks.textContent = `${progress.requested} ${progress.requested === 1 ? "snack" : "snacks"}`;
	elements.progressLabel.textContent = `${progress.assigned} van ${progress.requested} snacks verdeeld`;
	elements.progressBar.style.width = `${percentage}%`;
}

/**
 * Builds one participant editor without interpolating optional names into HTML.
 *
 * @param {object} person
 * @param {number} index
 * @returns {HTMLElement}
 */
function createPersonCard(person, index) {
	const card = document.createElement("article");
	card.className = "group-person-card";
	card.dataset.personId = person.id;
	card.classList.toggle("is-active", person.id === state.activePersonId);

	const identity = document.createElement("div");
	identity.className = "group-person-card__identity";
	const label = document.createElement("label");
	label.className = "sr-only";
	label.htmlFor = `person-name-${index + 1}`;
	label.textContent = `Naam van persoon ${index + 1}`;
	const input = document.createElement("input");
	input.id = label.htmlFor;
	input.className = "group-person-card__name";
	input.dataset.personName = person.id;
	input.maxLength = PERSON_NAME_MAX_LENGTH;
	input.placeholder = `Persoon ${index + 1}`;
	input.type = "text";
	input.value = person.name;
	input.disabled = state.isRunning;
	identity.append(label, input);

	const stepper = document.createElement("div");
	stepper.className = "group-person-card__stepper";
	stepper.setAttribute("aria-label", `Aantal snacks voor ${getDisplayName(person, index)}`);
	[-1, 1].forEach((change, buttonIndex) => {
		if (buttonIndex === 1) {
			const targetInput = document.createElement("input");
			targetInput.setAttribute("aria-label", `Aantal snacks voor ${getDisplayName(person, index)}`);
			targetInput.dataset.personTarget = person.id;
			targetInput.inputMode = "numeric";
			targetInput.max = String(GROUP_LIMITS.maxSnacks);
			targetInput.min = String(GROUP_LIMITS.minSnacks);
			targetInput.type = "number";
			targetInput.value = String(person.targetCount);
			targetInput.disabled = state.isRunning;
			stepper.appendChild(targetInput);
		}

		const button = document.createElement("button");
		button.type = "button";
		button.dataset.personChange = String(change);
		button.dataset.personId = person.id;
		button.disabled = state.isRunning;
		button.setAttribute(
			"aria-label",
			`${change < 0 ? "Eén snack minder" : "Eén snack meer"} voor ${getDisplayName(person, index)}`
		);
		const icon = document.createElement("span");
		icon.className = "material-symbols-outlined";
		icon.setAttribute("aria-hidden", "true");
		icon.textContent = change < 0 ? "remove" : "add";
		button.appendChild(icon);
		stepper.appendChild(button);
	});

	const inventory = document.createElement("div");
	inventory.className = "group-person-card__inventory";
	const count = document.createElement("span");
	count.textContent = `${person.snacks.length}/${person.targetCount}`;
	const latestSnack = document.createElement("span");
	latestSnack.textContent = person.snacks.length
		? `Laatste: ${person.snacks[person.snacks.length - 1].name}`
		: "Nog geen snack toegewezen";
	inventory.append(count, latestSnack);

	card.append(identity, stepper, inventory);
	return card;
}

/**
 * Rebuilds cards after structural or assignment changes. Name typing mutates
 * only its current model entry to avoid replacing the focused input per key.
 *
 * @returns {void}
 */
function renderPeople() {
	elements.namesContainer.replaceChildren(
		...state.people.map((person, index) => createPersonCard(person, index))
	);
	// At the hard group limit another click cannot change state, so expose that
	// boundary through the control instead of failing silently.
	elements.addPersonButton.disabled = state.isRunning || state.people.length >= GROUP_LIMITS.maxPeople;
	updateProgress();
}

/**
 * Locks all configuration controls for the full asynchronous spin sequence,
 * preventing target changes from invalidating an in-progress order.
 *
 * @param {boolean} isLocked
 * @returns {void}
 */
function setLocked(isLocked) {
	state.isRunning = isLocked;
	elements.configSection.classList.toggle("is-locked", isLocked);
	elements.spinButton.disabled = isLocked;
	elements.peopleCount.disabled = isLocked;
	elements.snackCount.disabled = isLocked;
	elements.addPersonButton.disabled = isLocked;
	renderPeople();
}

/**
 * Resizes the group within the public limits while preserving existing entries.
 *
 * @param {number|string} requestedCount
 * @returns {void}
 */
function updatePeopleCount(requestedCount) {
	const count = Math.min(
		GROUP_LIMITS.maxPeople,
		Math.max(GROUP_LIMITS.minPeople, Number.parseInt(requestedCount, 10) || GROUP_LIMITS.minPeople)
	);
	state.people = resizePeople(state.people, count, state.defaultSnackCount);
	elements.peopleCount.value = String(count);
	renderPeople();
}

/**
 * Updates the group default while the engine preserves explicit overrides.
 *
 * @param {number|string} requestedCount
 * @returns {void}
 */
function updateDefaultSnackCount(requestedCount) {
	const count = Math.min(
		GROUP_LIMITS.maxSnacks,
		Math.max(GROUP_LIMITS.minSnacks, Number.parseInt(requestedCount, 10) || GROUP_LIMITS.minSnacks)
	);
	state.defaultSnackCount = count;
	state.people = applyDefaultTarget(state.people, count);
	elements.snackCount.value = String(count);
	renderPeople();
}

/**
 * Marks a participant target as explicit so later default changes leave it
 * untouched.
 *
 * @param {string} personId
 * @param {number|string} requestedCount
 * @returns {void}
 */
function updatePersonTarget(personId, requestedCount) {
	const count = Math.min(
		GROUP_LIMITS.maxSnacks,
		Math.max(GROUP_LIMITS.minSnacks, Number.parseInt(requestedCount, 10) || GROUP_LIMITS.minSnacks)
	);
	state.people = state.people.map((person) => person.id === personId
		? { ...person, targetCount: count, hasCustomTarget: true }
		: person);
	renderPeople();
}

/**
 * Converts optional names to stable display names before crossing the
 * localStorage boundary.
 *
 * @returns {object|null}
 */
function createCompletedOrder() {
	const createdAt = new Date().toISOString();
	const orderId = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
		? globalThis.crypto.randomUUID()
		: `order-${Date.now()}`;
	return normalizeGroupOrder({
		version: GROUP_ORDER_VERSION,
		id: orderId,
		createdAt: createdAt,
		people: state.people.map((person, index) => ({
			id: person.id,
			name: getDisplayName(person, index),
			targetCount: person.targetCount,
			snacks: person.snacks
		}))
	});
}

/**
 * Makes the rest of the page inert while the completion decision is open.
 *
 * @returns {void}
 */
function openCompletionModal() {
	elements.completionOverlay.hidden = false;
	elements.groupView.inert = true;
	document.body.classList.add("group-modal-open");
	window.requestAnimationFrame(() => elements.viewOrderButton.focus());
}

/**
 * Restores page interaction before either showing results or starting again.
 *
 * @returns {void}
 */
function closeCompletionModal() {
	elements.completionOverlay.hidden = true;
	elements.groupView.inert = false;
	document.body.classList.remove("group-modal-open");
}

/**
 * Reuses the order summary already mounted on group.html rather than navigating
 * away and making the result dependent on localStorage availability.
 *
 * @returns {void}
 */
function showOrderSummary() {
	closeCompletionModal();
	elements.groupView.hidden = true;
	elements.resultsView.hidden = false;
	elements.orderSummary.order = state.latestOrder;
	window.scrollTo({ top: 0, behavior: "smooth" });
	window.requestAnimationFrame(() => {
		const title = elements.orderSummary.querySelector("h1");
		if (title) {
			title.tabIndex = -1;
			title.focus();
		}
	});
}

/**
 * Omits decorative pauses for users who requested reduced motion.
 *
 * @returns {Promise<void>}
 */
function waitBetweenRounds() {
	if (
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		return Promise.resolve();
	}

	return new Promise((resolve) => window.setTimeout(resolve, ROUND_PAUSE_MS));
}

/**
 * Runs one spin at a time. Recomputing eligibility before every round prevents
 * participants who reached their personal target from being selected again.
 *
 * @param {number} runId
 * @returns {Promise<void>}
 */
async function runAutomaticOrder(runId) {
	while (runId === state.runId) {
		const selectedPerson = pickRandomEligiblePerson(state.people);
		if (!selectedPerson) {
			break;
		}

		const personIndex = state.people.findIndex((person) => person.id === selectedPerson.id);
		state.activePersonId = selectedPerson.id;
		renderPeople();
		elements.spinStatus.textContent = `${getDisplayName(selectedPerson, personIndex)} is aan de beurt...`;

		const result = await window.SnackRad.wheel.spinRandom({
			duration: 2300,
			showResult: false
		});
		if (!result || runId !== state.runId) {
			throw new Error("De automatische draaironde kon niet worden voltooid.");
		}

		state.people = assignSnackToPerson(state.people, selectedPerson.id, result.snack);
		elements.spinStatus.textContent = `${getDisplayName(selectedPerson, personIndex)} krijgt ${result.snack.name}.`;
		renderPeople();
		await waitBetweenRounds();
	}

	state.activePersonId = null;
	renderPeople();
	state.latestOrder = createCompletedOrder();
	if (!state.latestOrder) {
		throw new Error("De voltooide bestelling kon niet worden opgebouwd.");
	}

	const isStored = saveLatestGroupOrder(state.latestOrder);
	setMessage(isStored ? "" : "De bestellijst is klaar, maar kon niet in deze browser worden opgeslagen.");
	setLocked(false);
	elements.spinStatus.textContent = "Iedereen is voorzien. De bestellijst staat klaar.";
	openCompletionModal();
}

function startOrder() {
	if (state.isRunning) {
		return;
	}

	closeCompletionModal();
	setMessage("");
	elements.resultsView.hidden = true;
	elements.groupView.hidden = false;
	state.people = state.people.map((person) => ({ ...person, snacks: [] }));
	state.activePersonId = null;
	state.runId += 1;
	const currentRunId = state.runId;
	setLocked(true);
	elements.spinStatus.textContent = "Het Rad maakt zich klaar voor de eerste deelnemer...";
	elements.spinButton.querySelector("span:first-child").textContent = "Bezig met verdelen...";

	runAutomaticOrder(currentRunId)
		.catch((error) => {
			// Keep technical context available for diagnostics while the visitor
			// receives a stable, non-technical recovery message.
			console.error("De groepsbestelling is tijdens het draaien gestopt.", error);
			state.activePersonId = null;
			setLocked(false);
			setMessage("Er ging iets mis tijdens het draaien. Probeer de groepsbestelling opnieuw.");
			elements.spinStatus.textContent = "Het draaien is gestopt.";
		})
		.finally(() => {
			elements.spinButton.querySelector("span:first-child").textContent = "Spin het rad";
		});
}

/**
 * Binds event delegation once because person cards are rebuilt after each spin.
 *
 * @returns {void}
 */
function bindEvents() {
	document.addEventListener("click", (event) => {
		const counterButton = event.target.closest("[data-counter-change]");
		if (counterButton && !state.isRunning) {
			const input = document.getElementById(counterButton.dataset.counterTarget);
			const nextValue = Number.parseInt(input.value, 10) + Number.parseInt(counterButton.dataset.counterChange, 10);
			input.id === "people-count" ? updatePeopleCount(nextValue) : updateDefaultSnackCount(nextValue);
			return;
		}

		const personButton = event.target.closest("[data-person-change]");
		if (personButton && !state.isRunning) {
			const person = state.people.find((item) => item.id === personButton.dataset.personId);
			updatePersonTarget(person.id, person.targetCount + Number.parseInt(personButton.dataset.personChange, 10));
		}
	});

	elements.namesContainer.addEventListener("input", (event) => {
		if (event.target.matches("[data-person-name]")) {
			const person = state.people.find((item) => item.id === event.target.dataset.personName);
			person.name = event.target.value.slice(0, PERSON_NAME_MAX_LENGTH);
		}
	});
	elements.namesContainer.addEventListener("change", (event) => {
		if (event.target.matches("[data-person-target]")) {
			updatePersonTarget(event.target.dataset.personTarget, event.target.value);
		}
	});
	elements.peopleCount.addEventListener("change", () => updatePeopleCount(elements.peopleCount.value));
	elements.snackCount.addEventListener("change", () => updateDefaultSnackCount(elements.snackCount.value));
	elements.addPersonButton.addEventListener("click", () => updatePeopleCount(state.people.length + 1));
	elements.spinButton.addEventListener("click", startOrder);
	elements.repeatOrderButton.addEventListener("click", startOrder);
	elements.viewOrderButton.addEventListener("click", showOrderSummary);
	elements.orderSummary.addEventListener("order-summary-restart", startOrder);
	document.addEventListener("keydown", (event) => {
		if (elements.completionOverlay.hidden) {
			return;
		}

		if (event.key === "Escape") {
			showOrderSummary();
			return;
		}

		// The dialog has exactly two choices; cycle focus within them while the
		// underlying configuration remains inert.
		if (event.key === "Tab") {
			const focusableElements = [elements.viewOrderButton, elements.repeatOrderButton];
			const currentIndex = focusableElements.indexOf(document.activeElement);
			const direction = event.shiftKey ? -1 : 1;
			const nextIndex = (currentIndex + direction + focusableElements.length) % focusableElements.length;
			event.preventDefault();
			focusableElements[nextIndex].focus();
		}
	});
}

/**
 * Waits for light-DOM web components before the classic roulette renderer
 * queries its stable SVG IDs.
 *
 * @returns {Promise<void>}
 */
async function init() {
	await Promise.all([
		customElements.whenDefined("roulette-wheel-view"),
		customElements.whenDefined("order-summary")
	]);

	Object.assign(elements, {
		groupView: document.getElementById("group-order-view"),
		resultsView: document.getElementById("group-order-results"),
		configSection: document.querySelector(".group-order-config"),
		peopleCount: document.getElementById("people-count"),
		snackCount: document.getElementById("snack-count"),
		totalSnacks: document.getElementById("total-snacks"),
		namesContainer: document.getElementById("names-container"),
		addPersonButton: document.getElementById("add-person-button"),
		spinButton: document.getElementById("group-spin-button"),
		spinStatus: document.getElementById("group-spin-status"),
		progressBar: document.getElementById("group-progress-bar"),
		progressLabel: document.getElementById("group-progress-label"),
		message: document.getElementById("group-order-message"),
		completionOverlay: document.getElementById("group-completion-overlay"),
		viewOrderButton: document.getElementById("view-order-button"),
		repeatOrderButton: document.getElementById("repeat-order-button"),
		orderSummary: document.getElementById("group-order-summary")
	});

	window.SnackRad.core.loadInitialSnacks();
	window.SnackRad.wheel.createWheel();
	renderPeople();
	bindEvents();
}

init();
