import assert from "node:assert/strict";
import test from "node:test";

import { createDirectOrderSummaryCopy } from "../src/frontend/assets/js/order-summary-page.js";

test("direct order summary copy reuses the order title and edit link", () => {
	const copy = createDirectOrderSummaryCopy({
		id: "order-123",
		title: "Vrijdaglunch",
		description: "Bestelling voor kantoor"
	});

	assert.equal(copy.badge, "Losse bestelling");
	assert.equal(copy.title, "Vrijdaglunch");
	assert.match(copy.description, /Bestelling voor kantoor/);
	assert.equal(copy.editHref, "./order-detail.html?id=order-123");
	assert.equal(copy.editLabel, "Bestelling bewerken");
});

test("direct order summary copy falls back when no description exists", () => {
	const copy = createDirectOrderSummaryCopy({
		id: "order-456",
		title: "",
		description: ""
	});

	assert.equal(copy.title, "Losse bestelling");
	assert.equal(copy.description, "Hieronder staat de verdeling per persoon en het totaaloverzicht voor de frituurmeester.");
});
