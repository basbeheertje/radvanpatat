/**
 * Render changelog releases via one shared web component so every version card
 * follows the same semantics, spacing, and accent treatment without duplicating
 * large chunks of HTML in the generated page.
 */
class ChangelogEntry extends HTMLElement {
	connectedCallback() {
		if (this.dataset.rendered === "true") {
			return;
		}

		const payloadNode = this.querySelector(".changelog-entry-data");

		if (!payloadNode) {
			return;
		}

		const payload = this.parsePayload(payloadNode.textContent || "{}");
		const label = this.getAttribute("data-label") || "";
		const title = this.getAttribute("data-title") || "";
		const tone = this.getAttribute("data-tone") || "default";
		const date = this.formatDate(this.getAttribute("data-date") || "");

		this.innerHTML = `
			<article class="changelog-entry ${tone === "featured" ? "changelog-entry--featured" : ""}">
				<div aria-hidden="true" class="changelog-entry__dot"></div>
				<div class="changelog-entry__card">
					<div class="changelog-entry__header">
						<div class="changelog-entry__title-wrap">
							<span class="changelog-entry__badge">${this.escapeHtml(label)}</span>
							<h2 class="font-headline-md text-headline-md text-on-surface">${this.escapeHtml(title)}</h2>
						</div>
						<time class="font-label-md text-label-md text-on-surface-variant">${this.escapeHtml(date)}</time>
					</div>
					${payload.summary ? `<p class="changelog-entry__summary font-body-md text-on-surface-variant">${this.escapeHtml(payload.summary)}</p>` : ""}
					<div class="changelog-entry__sections">
						${payload.categories.map((category) => this.renderCategory(category)).join("")}
					</div>
				</div>
			</article>
		`;

		this.dataset.rendered = "true";
	}

	/**
	 * Fail closed when the embedded JSON is malformed so the page keeps working
	 * even if one changelog block was edited incorrectly by hand.
	 *
	 * @param {string} rawPayload
	 * @returns {{ summary: string, categories: Array<{title: string, items: string[]}> }}
	 */
	parsePayload(rawPayload) {
		try {
			const parsedPayload = JSON.parse(rawPayload);

			return {
				summary: typeof parsedPayload.summary === "string" ? parsedPayload.summary : "",
				categories: Array.isArray(parsedPayload.categories) ? parsedPayload.categories : [],
			};
		} catch {
			return {
				summary: "",
				categories: [],
			};
		}
	}

	/**
	 * Keep human-edited release notes safe when they are inserted as HTML.
	 *
	 * @param {string} value
	 * @returns {string}
	 */
	escapeHtml(value) {
		return value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#39;");
	}

	/**
	 * Show Dutch long dates in the UI while preserving the original source value
	 * as a fallback for tags that use a non-date label.
	 *
	 * @param {string} value
	 * @returns {string}
	 */
	formatDate(value) {
		if (!value) {
			return "";
		}

		const date = new Date(`${value}T12:00:00`);

		if (Number.isNaN(date.getTime())) {
			return value;
		}

		return new Intl.DateTimeFormat("nl-NL", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(date);
	}

	/**
	 * Categories map directly to grouped change bullets so long releases remain
	 * scannable on desktop and mobile without collapsing everything into one list.
	 *
	 * @param {{title: string, items: string[]}} category
	 * @returns {string}
	 */
	renderCategory(category) {
		if (!category || !Array.isArray(category.items) || category.items.length === 0) {
			return "";
		}

		return `
			<section class="changelog-entry__section">
				<h3 class="changelog-entry__section-title">${this.escapeHtml(category.title)}</h3>
				<ul class="changelog-entry__list">
					${category.items.map((item) => `<li>${this.escapeHtml(item)}</li>`).join("")}
				</ul>
			</section>
		`;
	}
}

if (!customElements.get("changelog-entry")) {
	customElements.define("changelog-entry", ChangelogEntry);
}
