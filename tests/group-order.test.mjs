import test from "node:test";
import assert from "node:assert/strict";

import {
	applyDefaultTarget,
	assignSnackToPerson,
	getEligiblePeople,
	pickRandomEligiblePerson,
	resizePeople
} from "../src/frontend/assets/js/group-order-engine.js";
import {
	GROUP_ORDER_STORAGE_KEY,
	GROUP_ORDER_VERSION,
	loadLatestGroupOrder,
	normalizeGroupOrder,
	saveLatestGroupOrder
} from "../src/frontend/assets/js/group-order-store.js";

function createPerson(id, targetCount, snackCount = 0) {
	return {
		id: id,
		name: id,
		targetCount: targetCount,
		hasCustomTarget: false,
		snacks: Array.from({ length: snackCount }, () => ({ name: "Kroket" }))
	};
}

test("only participants below their personal target remain eligible", () => {
	const people = [
		createPerson("full", 2, 2),
		createPerson("open-a", 3, 1),
		createPerson("open-b", 1, 0)
	];

	assert.deepEqual(getEligiblePeople(people).map((person) => person.id), ["open-a", "open-b"]);
	assert.equal(pickRandomEligiblePerson(people, () => 0).id, "open-a");
	assert.equal(pickRandomEligiblePerson(people, () => 0.999).id, "open-b");
});

test("assignment cannot exceed a participant target", () => {
	const people = [createPerson("person-1", 1, 0)];
	const assigned = assignSnackToPerson(people, "person-1", { name: "Frikandel" });
	const overAssigned = assignSnackToPerson(assigned, "person-1", { name: "Kroket" });

	assert.deepEqual(assigned[0].snacks, [{ name: "Frikandel" }]);
	assert.deepEqual(overAssigned[0].snacks, [{ name: "Frikandel" }]);
});

test("repeated selection fills every participant exactly to their target", () => {
	let people = [
		createPerson("person-1", 2),
		createPerson("person-2", 1),
		createPerson("person-3", 3)
	];

	while (getEligiblePeople(people).length > 0) {
		const selectedPerson = pickRandomEligiblePerson(people, () => 0.4);
		people = assignSnackToPerson(people, selectedPerson.id, { name: "Bitterbal" });
	}

	assert.deepEqual(people.map((person) => person.snacks.length), [2, 1, 3]);
});

test("group defaults preserve personal snack-count overrides", () => {
	const people = resizePeople([], 2, 2);
	people[1] = { ...people[1], targetCount: 4, hasCustomTarget: true };
	const updated = applyDefaultTarget(people, 3);

	assert.equal(updated[0].targetCount, 3);
	assert.equal(updated[1].targetCount, 4);
});

test("only completed and normalized orders are accepted", () => {
	const completedOrder = normalizeGroupOrder({
		version: GROUP_ORDER_VERSION,
		id: "order-1",
		createdAt: "2026-07-23T12:00:00.000Z",
		people: [{
			id: "person-1",
			name: "  Jan   Jansen  ",
			targetCount: 2,
			snacks: [{ name: "Kroket" }, { name: "Frikandel" }]
		}]
	});
	const incompleteOrder = normalizeGroupOrder({
		version: GROUP_ORDER_VERSION,
		id: "order-2",
		createdAt: "2026-07-23T12:00:00.000Z",
		people: [{
			id: "person-1",
			name: "Jan",
			targetCount: 2,
			snacks: [{ name: "Kroket" }]
		}]
	});

	assert.equal(completedOrder.people[0].name, "Jan Jansen");
	assert.equal(incompleteOrder, null);
});

test("the latest completed order round-trips through browser storage", () => {
	const values = new Map();
	const storage = {
		getItem: (key) => values.get(key) || null,
		setItem: (key, value) => values.set(key, value)
	};
	const order = {
		version: GROUP_ORDER_VERSION,
		id: "order-3",
		createdAt: "2026-07-23T12:00:00.000Z",
		people: [{
			id: "person-1",
			name: "Anke",
			targetCount: 1,
			snacks: [{ name: "Kaassoufflé" }]
		}]
	};

	assert.equal(saveLatestGroupOrder(order, storage), true);
	assert.ok(values.has(GROUP_ORDER_STORAGE_KEY));
	assert.deepEqual(loadLatestGroupOrder(storage), order);
});

test("an unavailable storage backend does not invalidate a completed order", () => {
	const order = {
		version: GROUP_ORDER_VERSION,
		id: "order-4",
		createdAt: "2026-07-23T12:00:00.000Z",
		people: [{
			id: "person-1",
			name: "Piet",
			targetCount: 1,
			snacks: [{ name: "Kipcorn" }]
		}]
	};

	assert.equal(saveLatestGroupOrder(order, null), false);
	assert.equal(loadLatestGroupOrder(null), null);
});
