import { loadLatestGroupOrder } from "./group-order-store.js";

/**
 * Restores only the validated latest order. The summary component owns the
 * empty state when this browser has no completed group order.
 *
 * @returns {Promise<void>}
 */
async function initOrderPage() {
	await customElements.whenDefined("order-summary");
	const summary = document.getElementById("latest-order-summary");
	summary.order = loadLatestGroupOrder();
}

initOrderPage();
