import { loadDirectOrderById } from "./direct-order-store.js";

/**
 * The direct-order summary page reuses the same visual summary component as the
 * completed group flow so local orders and roulette-generated orders stay
 * visually interchangeable for the user.
 *
 * @param {{id:string,title:string,description:string}} order
 * @returns {{badge:string,title:string,description:string,peopleHeading:string,totalsHeading:string,datePrefix:string,editHref:string,editLabel:string}|null}
 */
export function createDirectOrderSummaryCopy(order) {
	if (!order) {
		return null;
	}

	return {
		badge: "Losse bestelling",
		title: order.title || "Losse bestelling",
		description: order.description
			? `${order.description} Hieronder staat de verdeling per persoon en het totaaloverzicht voor de frituurmeester.`
			: "Hieronder staat de verdeling per persoon en het totaaloverzicht voor de frituurmeester.",
		peopleHeading: "Wie haalt wat?",
		totalsHeading: "Totaaloverzicht",
		datePrefix: "Bijgewerkt op",
		editHref: `./order-detail.html?id=${encodeURIComponent(order.id)}`,
		editLabel: "Bestelling bewerken"
	};
}

function getOrderIdFromUrl() {
	return new URLSearchParams(window.location.search).get("id") || "";
}

function applyMissingState(orderSummary) {
	orderSummary.setAttribute("summary-badge", "Losse bestelling");
	orderSummary.setAttribute("summary-title", "Bestelling niet gevonden");
	orderSummary.setAttribute("summary-description", "Deze losse bestelling staat niet meer in de lokale browseropslag.");
	orderSummary.setAttribute("empty-title", "Bestelling niet gevonden");
	orderSummary.setAttribute("empty-description", "Ga terug naar het besteloverzicht en maak een nieuwe bestelling aan.");
	orderSummary.setAttribute("empty-action-href", "./order.html");
	orderSummary.setAttribute("empty-action-label", "Ga naar bestellingen");
	orderSummary.order = null;
}

async function initOrderSummaryPage() {
	if (typeof window === "undefined") {
		return;
	}

	await customElements.whenDefined("order-summary");
	const orderSummary = document.getElementById("direct-order-summary");
	if (!orderSummary) {
		return;
	}

	const order = loadDirectOrderById(getOrderIdFromUrl());
	if (!order) {
		applyMissingState(orderSummary);
		return;
	}

	const copy = createDirectOrderSummaryCopy(order);
	orderSummary.setAttribute("summary-badge", copy.badge);
	orderSummary.setAttribute("summary-title", copy.title);
	orderSummary.setAttribute("summary-description", copy.description);
	orderSummary.setAttribute("people-heading", copy.peopleHeading);
	orderSummary.setAttribute("totals-heading", copy.totalsHeading);
	orderSummary.setAttribute("date-prefix", copy.datePrefix);
	orderSummary.setAttribute("empty-title", "Bestelling niet gevonden");
	orderSummary.setAttribute("empty-description", "Ga terug naar het besteloverzicht en maak een nieuwe bestelling aan.");
	orderSummary.setAttribute("empty-action-href", "./order.html");
	orderSummary.setAttribute("empty-action-label", "Ga naar bestellingen");
	orderSummary.setAttribute("restart-href", copy.editHref);
	orderSummary.setAttribute("restart-label", copy.editLabel);
	orderSummary.order = order;
}

initOrderSummaryPage();
