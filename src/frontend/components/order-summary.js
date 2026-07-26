import { summarizeDirectOrderSnacks } from "../assets/js/direct-order-store.js";

const AVATAR_CLASSES = [
	"order-summary__avatar--gold",
	"order-summary__avatar--red",
	"order-summary__avatar--neutral"
];

function createElement(tagName, className, text) {
	const element = document.createElement(tagName);
	if (className) {
		element.className = className;
	}
	if (typeof text === "string") {
		element.textContent = text;
	}
	return element;
}

class OrderSummary extends HTMLElement {
	constructor() {
		super();
		this.currentOrder = null;
	}

	getCopy() {
		return {
			badge: this.getAttribute("summary-badge") || "Resultaten zijn binnen!",
			title: this.getAttribute("summary-title") || "Eet smakelijk, gezelligheid!",
			description: this.getAttribute("summary-description") || "Het Rad heeft gesproken. Hieronder staat de verdeling per persoon en het totaal voor de frituurmeester.",
			peopleHeading: this.getAttribute("people-heading") || "Wie krijgt wat?",
			totalsHeading: this.getAttribute("totals-heading") || "Totaaloverzicht",
			datePrefix: this.getAttribute("date-prefix") || "Bewaard op",
			emptyTitle: this.getAttribute("empty-title") || "Nog geen bestelling gevonden",
			emptyDescription: this.getAttribute("empty-description") || "Maak eerst een groepsbestelling. De laatst voltooide bestellijst wordt alleen in deze browser bewaard.",
			emptyActionHref: this.getAttribute("empty-action-href") || "./group.html",
			emptyActionLabel: this.getAttribute("empty-action-label") || "Maak een groepsbestelling"
		};
	}

	set order(value) {
		this.currentOrder = value;
		if (this.isConnected) {
			this.render();
		}
	}

	get order() {
		return this.currentOrder;
	}

	connectedCallback() {
		this.render();
	}

	/**
	 * Provides a useful direct-route state when no completed local order exists.
	 *
	 * @returns {void}
	 */
	renderEmptyState() {
		const copy = this.getCopy();
		this.innerHTML = `
			<section class="order-summary-empty" aria-labelledby="empty-order-title">
				<span class="material-symbols-outlined order-summary-empty__icon" aria-hidden="true">receipt_long</span>
				<h1 id="empty-order-title">${copy.emptyTitle}</h1>
				<p>${copy.emptyDescription}</p>
				<a class="order-summary__primary-action" href="${copy.emptyActionHref}">${copy.emptyActionLabel}</a>
			</section>
		`;
	}

	/**
	 * Builds a person card with textContent-only user data so names restored from
	 * localStorage can never be interpreted as HTML.
	 *
	 * @param {object} person
	 * @param {number} index
	 * @returns {HTMLElement}
	 */
	createPersonCard(person, index) {
		const article = createElement("article", "order-person-card");
		const header = createElement("header", "order-person-card__header");
		const avatar = createElement(
			"span",
			`order-summary__avatar ${AVATAR_CLASSES[index % AVATAR_CLASSES.length]}`,
			person.name.charAt(0).toUpperCase()
		);
		avatar.setAttribute("aria-hidden", "true");
		header.append(avatar, createElement("h3", "order-person-card__name", person.name));

		const snackList = createElement("ul", "order-person-card__list");
		summarizeDirectOrderSnacks([person]).forEach(({ name, quantity }) => {
			const item = createElement("li", "order-person-card__item");
			const icon = createElement("span", "material-symbols-outlined");
			icon.textContent = "check_circle";
			icon.setAttribute("aria-hidden", "true");
			item.append(icon, createElement("span", "", `${quantity}x ${name}`));
			snackList.appendChild(item);
		});

		article.append(header, snackList);
		return article;
	}

	/**
	 * Aggregates all person-level assignments into the compact list used when
	 * placing one combined order at the snackbar.
	 *
	 * @param {Array} people
	 * @returns {HTMLElement}
	 */
	createTotals(people) {
		const list = createElement("div", "order-totals__list");

		summarizeDirectOrderSnacks(people).forEach(({ name, quantity }) => {
			const row = createElement("div", "order-total-row");
			const amount = createElement("span", "order-total-row__amount", String(quantity));
			amount.setAttribute("aria-label", `${quantity} stuks`);
			row.append(amount, createElement("span", "order-total-row__name", name));
			list.appendChild(row);
		});

		return list;
	}

	createRestartAction() {
		const restartHref = this.getAttribute("restart-href");
		const restartLabel = this.getAttribute("restart-label") || "Nieuwe groepsbestelling";
		if (restartHref) {
			const link = createElement("a", "order-summary__secondary-action", restartLabel);
			link.href = restartHref;
			return link;
		}

		const button = createElement("button", "order-summary__secondary-action", restartLabel);
		button.type = "button";
		button.addEventListener("click", () => {
			this.dispatchEvent(new CustomEvent("order-summary-restart", { bubbles: true }));
		});
		return button;
	}

	/**
	 * Renders fixed structural markup first and appends all stored values through
	 * textContent-based helpers to keep localStorage data non-executable.
	 *
	 * @returns {void}
	 */
	render() {
		if (!this.currentOrder) {
			this.renderEmptyState();
			return;
		}

		const copy = this.getCopy();
		const formattedDate = new Intl.DateTimeFormat("nl-NL", {
			dateStyle: "long",
			timeStyle: "short"
		}).format(new Date(this.currentOrder.updatedAt || this.currentOrder.createdAt));

		this.innerHTML = `
			<div class="order-summary__hero">
				<span class="order-summary__badge">${copy.badge}</span>
				<h1>${copy.title}</h1>
				<p>${copy.description}</p>
				<time class="order-summary__date"></time>
			</div>
			<div class="order-summary__layout">
				<section class="order-summary__people" aria-labelledby="order-people-title">
					<h2 id="order-people-title"><span class="material-symbols-outlined" aria-hidden="true">group</span> ${copy.peopleHeading}</h2>
					<div class="order-summary__people-grid"></div>
				</section>
				<aside class="order-totals" aria-labelledby="order-totals-title">
					<h2 id="order-totals-title">${copy.totalsHeading}</h2>
					<div data-order-totals></div>
					<div class="order-summary__actions"></div>
				</aside>
			</div>
		`;

		this.querySelector(".order-summary__date").textContent = `${copy.datePrefix} ${formattedDate}`;
		const peopleGrid = this.querySelector(".order-summary__people-grid");
		this.currentOrder.people.forEach((person, index) => {
			peopleGrid.appendChild(this.createPersonCard(person, index));
		});
		this.querySelector("[data-order-totals]").appendChild(this.createTotals(this.currentOrder.people));
		this.querySelector(".order-summary__actions").appendChild(this.createRestartAction());
	}
}

customElements.define("order-summary", OrderSummary);
