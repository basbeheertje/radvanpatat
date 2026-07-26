export const DIRECT_ORDER_STORAGE_KEY = "rad-van-patat-orders";
export const DIRECT_ORDER_VERSION = 1;

const MAX_ORDER_COUNT = 50;
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;
const MAX_PERSON_NAME_LENGTH = 50;
const MAX_ITEM_NAME_LENGTH = 80;
const MAX_ITEMS = 100;
const MIN_ITEM_QUANTITY = 1;
const MAX_ITEM_QUANTITY = 99;
const MIN_PEOPLE = 1;
const MAX_PEOPLE = 200;

function normalizeText(value, fallback, maxLength) {
	if (typeof value !== "string") {
		return fallback;
	}

	const normalized = value
		.replace(/[\u0000-\u001f\u007f]/g, "")
		.trim()
		.replace(/\s+/g, " ")
		.slice(0, maxLength);
	return normalized || fallback;
}

function normalizeOptionalText(value, maxLength) {
	if (typeof value !== "string") {
		return "";
	}

	return value
		.replace(/[\u0000-\u001f\u007f]/g, "")
		.trim()
		.replace(/\s+/g, " ")
		.slice(0, maxLength);
}

/**
 * Direct-order totals should collapse accidental casing differences such as
 * "frikandel" versus "Frikandel". Storing one canonical ucfirst label keeps
 * per-person rows readable while the total overview can merge equal snacks.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeSnackLabel(value) {
	const normalized = normalizeOptionalText(value, MAX_ITEM_NAME_LENGTH)
		.toLocaleLowerCase("nl-NL");
	if (!normalized) {
		return "";
	}

	return `${normalized.charAt(0).toLocaleUpperCase("nl-NL")}${normalized.slice(1)}`;
}

function normalizeInteger(value, minimum, maximum) {
	const parsedValue = Number.parseInt(value, 10);
	if (!Number.isFinite(parsedValue)) {
		return minimum;
	}

	return Math.min(maximum, Math.max(minimum, parsedValue));
}

function getBrowserStorage() {
	try {
		return typeof window !== "undefined" ? window.localStorage : null;
	} catch (error) {
		return null;
	}
}

function createOrderId() {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	return `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createItemId() {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createPersonId() {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	return `person-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseLegacySnackName(value) {
	const normalizedLabel = normalizeSnackLabel(value);
	if (!normalizedLabel) {
		return null;
	}

	const matchedLegacyQuantity = normalizedLabel.match(/^(\d+)\s*x\s*(.+)$/i);
	if (!matchedLegacyQuantity) {
		return {
			name: normalizedLabel,
			quantity: MIN_ITEM_QUANTITY
		};
	}

	return {
		name: normalizeSnackLabel(matchedLegacyQuantity[2]),
		quantity: normalizeInteger(matchedLegacyQuantity[1], MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY)
	};
}

function normalizeOrderItem(item, index) {
	if (!item || typeof item !== "object") {
		return null;
	}

	const parsedLegacySnack = parseLegacySnackName(item.name);
	if (!parsedLegacySnack || !parsedLegacySnack.name) {
		return null;
	}

	return {
		id: normalizeText(item.id, `item-${index + 1}`, 120),
		name: parsedLegacySnack.name,
		quantity: normalizeInteger(
			Object.hasOwn(item, "quantity") ? item.quantity : parsedLegacySnack.quantity,
			MIN_ITEM_QUANTITY,
			MAX_ITEM_QUANTITY
		)
	};
}

function normalizePerson(person, index) {
	if (!person || typeof person !== "object") {
		return null;
	}

	return {
		id: normalizeText(person.id, `person-${index + 1}`, 120),
		name: normalizeText(person.name, `Persoon ${index + 1}`, MAX_PERSON_NAME_LENGTH),
		snacks: Array.isArray(person.snacks)
			? person.snacks.slice(0, MAX_ITEMS).map(normalizeOrderItem).filter(Boolean)
			: []
	};
}

/**
 * Earlier direct orders stored one flat item list. Keep that data reachable by
 * attaching the legacy items to the first generated person while the rest of
 * the people remain available for the newer per-person editing flow.
 *
 * @param {unknown} order
 * @param {number} peopleCount
 * @returns {Array<{id:string,name:string,snacks:Array<{id:string,name:string,quantity:number}>}>}
 */
function normalizeLegacyPeople(order, peopleCount) {
	const legacyItems = Array.isArray(order.items)
		? order.items.slice(0, MAX_ITEMS).map(normalizeOrderItem).filter(Boolean)
		: [];

	return Array.from({ length: peopleCount }, function (_, index) {
		return {
			id: `person-${index + 1}`,
			name: `Persoon ${index + 1}`,
			snacks: index === 0 ? legacyItems : []
		};
	});
}

/**
 * Browser-owned order data is treated as untrusted input. Validation happens
 * before any order reaches the UI so stale or hand-edited storage fails closed.
 *
 * @param {unknown} order
 * @returns {{version:number,id:string,title:string,description:string,peopleCount:number,people:Array<{id:string,name:string,snacks:Array<{id:string,name:string,quantity:number}>}>,createdAt:string,updatedAt:string}|null}
 */
export function normalizeDirectOrder(order) {
	if (!order || typeof order !== "object" || order.version !== DIRECT_ORDER_VERSION) {
		return null;
	}

	const createdAt = new Date(order.createdAt);
	const updatedAt = new Date(order.updatedAt);
	if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
		return null;
	}

	const peopleCount = normalizeInteger(order.peopleCount, MIN_PEOPLE, MAX_PEOPLE);
	const people = Array.isArray(order.people) && order.people.length > 0
		? order.people.slice(0, MAX_PEOPLE).map(normalizePerson).filter(Boolean)
		: normalizeLegacyPeople(order, peopleCount);

	return {
		version: DIRECT_ORDER_VERSION,
		id: normalizeText(order.id, `order-${createdAt.getTime()}`, 120),
		title: normalizeText(order.title, "Nieuwe bestelling", MAX_TITLE_LENGTH),
		description: normalizeOptionalText(order.description, MAX_DESCRIPTION_LENGTH),
		peopleCount: people.length > 0 ? people.length : peopleCount,
		people: people.length > 0 ? people : normalizeLegacyPeople(order, peopleCount),
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString()
	};
}

export function createEmptyDirectOrder() {
	const now = new Date().toISOString();
	return {
		version: DIRECT_ORDER_VERSION,
		id: createOrderId(),
		title: "Nieuwe bestelling",
		description: "",
		peopleCount: 1,
		people: [createDirectOrderPerson(0)],
		createdAt: now,
		updatedAt: now
	};
}

export function createDirectOrderItem(name = "") {
	return {
		id: createItemId(),
		name: normalizeSnackLabel(name),
		quantity: MIN_ITEM_QUANTITY
	};
}

export function createDirectOrderItemWithQuantity(name = "", quantity = MIN_ITEM_QUANTITY) {
	return {
		id: createItemId(),
		name: normalizeSnackLabel(name),
		quantity: normalizeInteger(quantity, MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY)
	};
}

/**
 * Direct orders are edited per person so every browser session can manage a
 * named list of snacks without depending on the automatic group-wheel flow.
 *
 * @param {number} index
 * @param {string} name
 * @returns {{id:string,name:string,snacks:Array}}
 */
export function createDirectOrderPerson(index, name = "") {
	return {
		id: createPersonId(),
		name: normalizeText(name, `Persoon ${index + 1}`, MAX_PERSON_NAME_LENGTH),
		snacks: []
	};
}

/**
 * The same total logic is used by the live order-detail sidebar, the stored
 * summary page, and the order cards overview. Keep it centralized so quantity
 * sorting and ucfirst normalization never diverge between screens.
 *
 * @param {Array<{snacks:Array<{name:string,quantity:number}>}>} people
 * @returns {Array<{name:string,quantity:number}>}
 */
export function summarizeDirectOrderSnacks(people) {
	const totals = new Map();

	(people || []).forEach((person) => {
		(person.snacks || []).forEach((snack) => {
			const snackName = normalizeSnackLabel(snack.name);
			if (!snackName) {
				return;
			}

			const snackQuantity = normalizeInteger(snack.quantity, MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY);
			totals.set(snackName, (totals.get(snackName) || 0) + snackQuantity);
		});
	});

	return [...totals.entries()]
		.map(([name, quantity]) => ({ name, quantity }))
		.sort((left, right) => right.quantity - left.quantity || left.name.localeCompare(right.name, "nl"));
}

export function loadDirectOrders(storage = getBrowserStorage()) {
	if (!storage) {
		return [];
	}

	try {
		const storedOrders = JSON.parse(storage.getItem(DIRECT_ORDER_STORAGE_KEY) || "null");
		if (!Array.isArray(storedOrders)) {
			return [];
		}

		return storedOrders
			.slice(0, MAX_ORDER_COUNT)
			.map(normalizeDirectOrder)
			.filter(Boolean)
			.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
	} catch (error) {
		return [];
	}
}

export function loadDirectOrderById(orderId, storage = getBrowserStorage()) {
	return loadDirectOrders(storage).find((order) => order.id === orderId) || null;
}

/**
 * Persist one validated order back into the capped local collection so direct
 * order editing remains available without any backend.
 *
 * @param {unknown} order
 * @param {Storage} storage
 * @returns {{version:number,id:string,title:string,description:string,peopleCount:number,items:Array<{id:string,name:string}>,createdAt:string,updatedAt:string}|null}
 */
export function saveDirectOrder(order, storage = getBrowserStorage()) {
	const normalizedOrder = normalizeDirectOrder(order);
	if (!normalizedOrder || !storage) {
		return null;
	}

	const orders = loadDirectOrders(storage).filter((existingOrder) => existingOrder.id !== normalizedOrder.id);
	const updatedOrder = {
		...normalizedOrder,
		updatedAt: new Date().toISOString()
	};
	const nextOrders = [updatedOrder, ...orders].slice(0, MAX_ORDER_COUNT);

	try {
		storage.setItem(DIRECT_ORDER_STORAGE_KEY, JSON.stringify(nextOrders));
		return updatedOrder;
	} catch (error) {
		return null;
	}
}
