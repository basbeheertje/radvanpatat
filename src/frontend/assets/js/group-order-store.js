export const GROUP_ORDER_STORAGE_KEY = "rad-van-patat-last-group-order";
export const GROUP_ORDER_VERSION = 1;

const MAX_PEOPLE = 20;
const MAX_SNACKS_PER_PERSON = 20;
const MAX_TEXT_LENGTH = 50;

function normalizeText(value, fallback) {
	if (typeof value !== "string") {
		return fallback;
	}

	const normalized = value
		.replace(/[\u0000-\u001f\u007f]/g, "")
		.trim()
		.replace(/\s+/g, " ")
		.slice(0, MAX_TEXT_LENGTH);
	return normalized || fallback;
}

function normalizeInteger(value, minimum, maximum) {
	const parsedValue = Number.parseInt(value, 10);
	if (!Number.isFinite(parsedValue)) {
		return minimum;
	}

	return Math.min(maximum, Math.max(minimum, parsedValue));
}

function normalizeSnack(snack) {
	const name = normalizeText(snack && snack.name, "");
	return name ? { name: name } : null;
}

function getBrowserStorage() {
	try {
		return typeof window !== "undefined" ? window.localStorage : null;
	} catch (error) {
		// Privacy modes may throw while merely reading localStorage. Treat that
		// browser state as unavailable so completing an order can continue.
		return null;
	}
}

function normalizePerson(person, index) {
	if (!person || typeof person !== "object") {
		return null;
	}

	const targetCount = normalizeInteger(person.targetCount, 0, MAX_SNACKS_PER_PERSON);
	const snacks = Array.isArray(person.snacks)
		? person.snacks.map(normalizeSnack).filter(Boolean).slice(0, targetCount)
		: [];

	return {
		id: normalizeText(person.id, `person-${index + 1}`),
		name: normalizeText(person.name, `Persoon ${index + 1}`),
		targetCount: targetCount,
		snacks: snacks
	};
}

/**
 * Validates browser-owned order data before it reaches the UI. localStorage is
 * client-controlled input, so stale or manually edited values fail closed.
 *
 * @param {unknown} order
 * @returns {{version: number, id: string, createdAt: string, people: Array}|null}
 */
export function normalizeGroupOrder(order) {
	if (!order || typeof order !== "object" || order.version !== GROUP_ORDER_VERSION) {
		return null;
	}

	const people = Array.isArray(order.people)
		? order.people.slice(0, MAX_PEOPLE).map(normalizePerson).filter(Boolean)
		: [];
	if (people.length === 0 || people.some((person) => person.snacks.length !== person.targetCount)) {
		return null;
	}

	const parsedDate = new Date(order.createdAt);
	if (Number.isNaN(parsedDate.getTime())) {
		return null;
	}

	return {
		version: GROUP_ORDER_VERSION,
		id: normalizeText(order.id, `order-${parsedDate.getTime()}`),
		createdAt: parsedDate.toISOString(),
		people: people
	};
}

/**
 * Stores only a completed, normalized order so order.html never displays a
 * half-finished automatic spin sequence.
 *
 * @param {unknown} order
 * @param {Storage} storage
 * @returns {boolean}
 */
export function saveLatestGroupOrder(order, storage = getBrowserStorage()) {
	const normalizedOrder = normalizeGroupOrder(order);
	if (!normalizedOrder || !storage) {
		return false;
	}

	try {
		storage.setItem(GROUP_ORDER_STORAGE_KEY, JSON.stringify(normalizedOrder));
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Reads and validates the most recent completed order from browser storage.
 *
 * @param {Storage} storage
 * @returns {{version: number, id: string, createdAt: string, people: Array}|null}
 */
export function loadLatestGroupOrder(storage = getBrowserStorage()) {
	if (!storage) {
		return null;
	}

	try {
		const storedOrder = JSON.parse(storage.getItem(GROUP_ORDER_STORAGE_KEY) || "null");
		return normalizeGroupOrder(storedOrder);
	} catch (error) {
		return null;
	}
}
