import assert from "node:assert/strict";
import test from "node:test";

import {
	createDirectOrderItem,
	createDirectOrderItemWithQuantity,
	createEmptyDirectOrder,
	createDirectOrderPerson,
	loadDirectOrderById,
	loadDirectOrders,
	normalizeSnackLabel,
	saveDirectOrder,
	summarizeDirectOrderSnacks
} from "../src/frontend/assets/js/direct-order-store.js";

function createStorage() {
	const values = new Map();
	return {
		getItem(key) {
			return values.has(key) ? values.get(key) : null;
		},
		setItem(key, value) {
			values.set(key, String(value));
		}
	};
}

test("a direct order can be created and loaded by id", () => {
	const storage = createStorage();
	const order = createEmptyDirectOrder();
	order.title = "Vrijdag bestellen";
	order.people[0].snacks = [createDirectOrderItemWithQuantity("friet speciaal", 2)];

	const saved = saveDirectOrder(order, storage);

	assert.ok(saved);
	assert.equal(loadDirectOrders(storage).length, 1);
	assert.equal(loadDirectOrderById(saved.id, storage).title, "Vrijdag bestellen");
	assert.deepEqual(loadDirectOrderById(saved.id, storage).people[0].snacks, [{
		id: saved.people[0].snacks[0].id,
		name: "Friet speciaal",
		quantity: 2
	}]);
});

test("saving an existing direct order updates it in place", () => {
	const storage = createStorage();
	const order = createEmptyDirectOrder();
	order.title = "Lunch run";

	const firstSave = saveDirectOrder(order, storage);
	firstSave.description = "Met extra mayo";
	firstSave.peopleCount = 3;
	firstSave.people = [
		createDirectOrderPerson(0, "Bas"),
		createDirectOrderPerson(1, "Sam"),
		createDirectOrderPerson(2, "Kim")
	];
	firstSave.people[0].snacks = [createDirectOrderItemWithQuantity("kroket", 1)];
	firstSave.people[1].snacks = [createDirectOrderItemWithQuantity("KAASSOUFFLÉ", 1)];
	firstSave.people[2].snacks = [createDirectOrderItemWithQuantity("friet", 3)];
	const secondSave = saveDirectOrder(firstSave, storage);

	assert.equal(loadDirectOrders(storage).length, 1);
	assert.equal(secondSave.description, "Met extra mayo");
	assert.equal(secondSave.peopleCount, 3);
	assert.deepEqual(secondSave.people.map((person) => person.name), ["Bas", "Sam", "Kim"]);
	assert.deepEqual(secondSave.people.map((person) => person.snacks[0]), [
		{ id: secondSave.people[0].snacks[0].id, name: "Kroket", quantity: 1 },
		{ id: secondSave.people[1].snacks[0].id, name: "Kaassoufflé", quantity: 1 },
		{ id: secondSave.people[2].snacks[0].id, name: "Friet", quantity: 3 }
	]);
});

test("invalid direct orders are rejected by storage loading", () => {
	const storage = createStorage();

	storage.setItem("rad-van-patat-orders", JSON.stringify([
		{ version: 999, id: "bad", title: "bad", description: "", peopleCount: 1, people: [], createdAt: "x", updatedAt: "x" }
	]));

	assert.deepEqual(loadDirectOrders(storage), []);
});

test("legacy flat direct-order items are migrated to the first person", () => {
	const storage = createStorage();

	storage.setItem("rad-van-patat-orders", JSON.stringify([
		{
			version: 1,
			id: "legacy-order",
			title: "Oude bestelling",
			description: "",
			peopleCount: 3,
			items: [
				{ id: "item-1", name: "2x friet" },
				{ id: "item-2", name: "1x kroket" }
			],
			createdAt: "2026-07-26T10:00:00.000Z",
			updatedAt: "2026-07-26T10:00:00.000Z"
		}
	]));

	const [order] = loadDirectOrders(storage);

	assert.equal(order.peopleCount, 3);
	assert.equal(order.people.length, 3);
	assert.deepEqual(order.people[0].snacks.map((snack) => `${snack.quantity}x ${snack.name}`), ["2x Friet", "1x Kroket"]);
	assert.deepEqual(order.people[1].snacks, []);
	assert.deepEqual(order.people[2].snacks, []);
});

test("snack labels are normalized to one ucfirst form", () => {
	assert.equal(normalizeSnackLabel("  FRIKANDEL speciaal  "), "Frikandel speciaal");
});

test("direct order totals are sorted by quantity descending", () => {
	const totals = summarizeDirectOrderSnacks([
		{
			snacks: [
				createDirectOrderItemWithQuantity("frikandel", 2),
				createDirectOrderItemWithQuantity("kroket", 1)
			]
		},
		{
			snacks: [
				createDirectOrderItemWithQuantity("Frikandel", 3),
				createDirectOrderItem("kaassoufflé")
			]
		}
	]);

	assert.deepEqual(totals, [
		{ name: "Frikandel", quantity: 5 },
		{ name: "Kaassoufflé", quantity: 1 },
		{ name: "Kroket", quantity: 1 }
	]);
});
