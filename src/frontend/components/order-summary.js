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

function countSnacks(snacks) {
	const counts = new Map();
	snacks.forEach((snack) => {
		counts.set(snack.name, (counts.get(snack.name) || 0) + 1);
	});
	return [...counts.entries()].sort(([firstName], [secondName]) =>
		firstName.localeCompare(secondName, "nl"));
}

class OrderSummary extends HTMLElement {
	constructor() {
		super();
		this.currentOrder = null;
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
		this.innerHTML = `
			<section class="order-summary-empty" aria-labelledby="empty-order-title">
				<span class="material-symbols-outlined order-summary-empty__icon" aria-hidden="true">receipt_long</span>
				<h1 id="empty-order-title">Nog geen bestelling gevonden</h1>
				<p>Maak eerst een groepsbestelling. De laatst voltooide bestellijst wordt alleen in deze browser bewaard.</p>
				<a class="order-summary__primary-action" href="./group.html">Maak een groepsbestelling</a>
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
		countSnacks(person.snacks).forEach(([snackName, count]) => {
			const item = createElement("li", "order-person-card__item");
			const icon = createElement("span", "material-symbols-outlined");
			icon.textContent = "check_circle";
			icon.setAttribute("aria-hidden", "true");
			item.append(icon, createElement("span", "", `${count}x ${snackName}`));
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
		const allSnacks = people.flatMap((person) => person.snacks);
		const list = createElement("div", "order-totals__list");

		countSnacks(allSnacks).forEach(([snackName, count]) => {
			const row = createElement("div", "order-total-row");
			const amount = createElement("span", "order-total-row__amount", String(count));
			amount.setAttribute("aria-label", `${count} stuks`);
			row.append(amount, createElement("span", "order-total-row__name", snackName));
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

		const formattedDate = new Intl.DateTimeFormat("nl-NL", {
			dateStyle: "long",
			timeStyle: "short"
		}).format(new Date(this.currentOrder.createdAt));

		this.innerHTML = `
			<div class="order-summary__hero">
				<span class="order-summary__badge">Resultaten zijn binnen!</span>
				<h1>Eet smakelijk, gezelligheid!</h1>
				<p>Het Rad heeft gesproken. Hieronder staat de verdeling per persoon en het totaal voor de frituurmeester.</p>
				<time class="order-summary__date"></time>
			</div>
			<div class="order-summary__layout">
				<section class="order-summary__people" aria-labelledby="order-people-title">
					<h2 id="order-people-title"><span class="material-symbols-outlined" aria-hidden="true">group</span> Wie krijgt wat?</h2>
					<div class="order-summary__people-grid"></div>
				</section>
				<aside class="order-totals" aria-labelledby="order-totals-title">
					<h2 id="order-totals-title">Totaaloverzicht</h2>
					<div data-order-totals></div>
					<div class="order-summary__actions"></div>
				</aside>
			</div>
		`;

		this.querySelector(".order-summary__date").textContent = `Bewaard op ${formattedDate}`;
		const peopleGrid = this.querySelector(".order-summary__people-grid");
		this.currentOrder.people.forEach((person, index) => {
			peopleGrid.appendChild(this.createPersonCard(person, index));
		});
		this.querySelector("[data-order-totals]").appendChild(this.createTotals(this.currentOrder.people));
		this.querySelector(".order-summary__actions").appendChild(this.createRestartAction());
	}
}

customElements.define("order-summary", OrderSummary);
