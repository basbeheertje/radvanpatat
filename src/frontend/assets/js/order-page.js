import { summarizeDirectOrderSnacks } from "./direct-order-store.js";
import {
	createEmptyDirectOrder,
	loadDirectOrders,
	saveDirectOrder
} from "./direct-order-store.js";

const DATE_FORMATTER = new Intl.DateTimeFormat("nl-NL", {
	dateStyle: "medium",
	timeStyle: "short"
});

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function countOrderSnacks(order) {
	return summarizeDirectOrderSnacks(order.people)
		.reduce((total, snack) => total + snack.quantity, 0);
}

function renderOrders(orders) {
	if (orders.length === 0) {
		return `
			<section class="order-summary-empty" aria-labelledby="empty-direct-orders-title">
				<span class="material-symbols-outlined order-summary-empty__icon" aria-hidden="true">shopping_cart</span>
				<h1 id="empty-direct-orders-title">Nog geen losse bestellingen</h1>
				<p>Maak hier je eerste losse bestelling aan. Daarna kun je titel, omschrijving, aantal personen en items verder invullen.</p>
			</section>
		`;
	}

	return `
		<div class="order-summary__people-grid">
			${orders.map((order) => `
				<article class="order-person-card">
					<header class="order-person-card__header">
						<span class="order-summary__avatar order-summary__avatar--gold" aria-hidden="true">${escapeHtml(order.title.charAt(0).toUpperCase())}</span>
						<div>
							<h3 class="order-person-card__name">${escapeHtml(order.title)}</h3>
							<p class="font-body-md text-body-md text-on-surface-variant">${order.peopleCount} ${order.peopleCount === 1 ? "persoon" : "personen"} • ${countOrderSnacks(order)} ${countOrderSnacks(order) === 1 ? "snack" : "snacks"}</p>
						</div>
					</header>
					<p class="font-body-md text-body-md text-on-surface-variant mb-4">${escapeHtml(order.description || "Nog geen omschrijving toegevoegd.")}</p>
					<time class="order-summary__date">Bijgewerkt op ${escapeHtml(DATE_FORMATTER.format(new Date(order.updatedAt)))}</time>
					<div class="order-summary__actions">
						<a class="order-summary__primary-action" href="./order-summary.html?id=${encodeURIComponent(order.id)}">Bestellijst bekijken</a>
						<a class="order-summary__secondary-action" href="./order-detail.html?id=${encodeURIComponent(order.id)}">Bestelling bewerken</a>
					</div>
				</article>
			`).join("")}
		</div>
	`;
}

function renderOrderPage() {
	const app = document.getElementById("direct-order-app");
	const orders = loadDirectOrders();

	app.innerHTML = `
		<section class="group-order-hero mb-8" aria-labelledby="direct-orders-title">
			<div>
				<span class="group-order-eyebrow">Bestellen zonder rad</span>
				<h1 id="direct-orders-title">Losse bestellingen</h1>
				<p>Start direct een nieuwe bestelling, maak een order-id aan en vul daarna de details en items in op de aparte orderpagina.</p>
			</div>
			<div class="group-order-hero__badge" aria-hidden="true">
				<span class="material-symbols-outlined">shopping_cart</span>
			</div>
		</section>
		<div class="order-summary__actions mb-10">
			<button class="order-summary__primary-action" id="create-direct-order-button" type="button">Nieuwe bestelling aanmaken</button>
		</div>
		<section aria-labelledby="existing-orders-title">
			<h2 class="mb-6 font-headline-md text-headline-md text-primary" id="existing-orders-title">Bestaande bestellingen in deze browser</h2>
			${renderOrders(orders)}
		</section>
	`;
}

function createDirectOrderAndRedirect() {
	const order = createEmptyDirectOrder();
	const savedOrder = saveDirectOrder(order);
	if (!savedOrder) {
		return;
	}

	window.location.assign(`./order-detail.html?id=${encodeURIComponent(savedOrder.id)}`);
}

async function initOrderPage() {
	await customElements.whenDefined("site-header");
	renderOrderPage();
	document.addEventListener("click", function (event) {
		if (event.target.id === "create-direct-order-button") {
			createDirectOrderAndRedirect();
		}
	});
}

initOrderPage();
