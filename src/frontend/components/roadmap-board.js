const ROADMAP_SECTIONS = [
	{
		key: "nu",
		title: "Nu: Versgebakken",
		subtitle: "Live of vrijwel afgerond",
		dotClass: "roadmap-section__dot roadmap-section__dot--live",
	},
	{
		key: "binnenkort",
		title: "Binnenkort: In de Pan",
		subtitle: "Actief in ontwikkeling",
		dotClass: "roadmap-section__dot roadmap-section__dot--soon",
	},
	{
		key: "later",
		title: "Later: Op de Kaart",
		subtitle: "Gepland voor hierna",
		dotClass: "roadmap-section__dot roadmap-section__dot--later",
	},
];

const STATUS_CLASS_MAP = {
	live: "roadmap-card__status roadmap-card__status--live",
	afgerond: "roadmap-card__status roadmap-card__status--live",
	"in uitvoering": "roadmap-card__status roadmap-card__status--active",
	"in ontwikkeling": "roadmap-card__status roadmap-card__status--active",
	gepland: "roadmap-card__status roadmap-card__status--planned",
};

/**
 * Render roadmap items from one array so maintainers only update data while the
 * layout, accessibility, and grouping logic remain consistent across releases.
 */
class RoadmapBoard extends HTMLElement {
	constructor() {
		super();
		this._items = [];
	}

	set items(value) {
		this._items = Array.isArray(value) ? value.map((item) => this.normalizeItem(item)) : [];
		this.render();
	}

	get items() {
		return this._items;
	}

	connectedCallback() {
		this.render();
	}

	/**
	 * Normalize generator output and hand-authored fallback data into one stable
	 * rendering contract so the component can stay dumb and predictable.
	 *
	 * @param {Record<string, unknown>} item
	 * @returns {{ title: string, category: string, status: string, description: string, icon: string, progress: number | null }}
	 */
	normalizeItem(item) {
		const title = typeof item?.title === "string" ? item.title.trim() : "";
		const category = typeof item?.category === "string" ? item.category.trim().toLowerCase() : "later";
		const status = typeof item?.status === "string" ? item.status.trim() : "Gepland";
		const description = typeof item?.description === "string" ? item.description.trim() : "";
		const icon = typeof item?.icon === "string" ? item.icon.trim() : "fastfood";
		const progressValue = Number(item?.progress);
		const progress = Number.isFinite(progressValue)
			? Math.max(0, Math.min(100, Math.round(progressValue)))
			: null;

		return {
			title: title || "Nieuwe milestone",
			category: ROADMAP_SECTIONS.some((section) => section.key === category) ? category : "later",
			status: status || "Gepland",
			description: description || "Meer details volgen zodra deze milestone verder is uitgewerkt.",
			icon: icon || "fastfood",
			progress: progress,
		};
	}

	escapeHtml(value) {
		return String(value)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#39;");
	}

	getStatusClass(status) {
		const normalizedStatus = status.trim().toLowerCase();
		return STATUS_CLASS_MAP[normalizedStatus] || STATUS_CLASS_MAP.gepland;
	}

	renderCard(item) {
		const progressMarkup = item.progress === null
			? ""
			: `
				<div class="roadmap-card__progress" aria-label="Voortgang ${item.progress}%">
					<div class="roadmap-card__progress-bar" style="width: ${item.progress}%"></div>
				</div>
				<p class="roadmap-card__progress-label">${item.progress}% voltooid</p>
			`;

		return `
			<article class="roadmap-card">
				<div class="roadmap-card__top">
					<span class="material-symbols-outlined roadmap-card__icon" aria-hidden="true">${this.escapeHtml(item.icon)}</span>
					<span class="${this.getStatusClass(item.status)}">${this.escapeHtml(item.status)}</span>
				</div>
				<p class="roadmap-card__meta">${this.escapeHtml(item.category)}</p>
				<h3 class="roadmap-card__title">${this.escapeHtml(item.title)}</h3>
				<p class="roadmap-card__description">${this.escapeHtml(item.description)}</p>
				${progressMarkup}
			</article>
		`;
	}

	renderSection(section) {
		const items = this.items.filter((item) => item.category === section.key);
		const content = items.length > 0
			? items.map((item) => this.renderCard(item)).join("")
			: `
				<div class="roadmap-section__empty">
					<p>Nog geen roadmap-items in deze fase.</p>
				</div>
			`;

		return `
			<section class="roadmap-section" aria-labelledby="roadmap-section-${section.key}">
				<div class="roadmap-section__header">
					<span class="${section.dotClass}" aria-hidden="true"></span>
					<div>
						<h2 class="roadmap-section__title" id="roadmap-section-${section.key}">${this.escapeHtml(section.title)}</h2>
						<p class="roadmap-section__subtitle">${this.escapeHtml(section.subtitle)}</p>
					</div>
				</div>
				<div class="roadmap-section__cards">
					${content}
				</div>
			</section>
		`;
	}

	render() {
		if (!this.isConnected) {
			return;
		}

		const totalItems = this.items.length;
		const activeItems = this.items.filter((item) => item.category !== "later").length;
		const completedItems = this.items.filter((item) => item.progress === 100).length;

		this.innerHTML = `
			<div class="roadmap-summary" aria-label="Samenvatting van de roadmap">
				<div class="roadmap-summary__card">
					<span class="material-symbols-outlined text-primary text-[30px]" aria-hidden="true">rocket_launch</span>
					<strong>${totalItems}</strong>
					<span>milestone${totalItems === 1 ? "" : "s"} op de kaart</span>
				</div>
				<div class="roadmap-summary__card">
					<span class="material-symbols-outlined text-secondary text-[30px]" aria-hidden="true">manufacturing</span>
					<strong>${activeItems}</strong>
					<span>onderweg naar de volgende release</span>
				</div>
				<div class="roadmap-summary__card">
					<span class="material-symbols-outlined text-primary text-[30px]" aria-hidden="true">check_circle</span>
					<strong>${completedItems}</strong>
					<span>mijlpaal${completedItems === 1 ? "" : "en"} afgerond</span>
				</div>
			</div>
			<div class="roadmap-columns">
				${ROADMAP_SECTIONS.map((section) => this.renderSection(section)).join("")}
			</div>
		`;
	}
}

if (!customElements.get("roadmap-board")) {
	customElements.define("roadmap-board", RoadmapBoard);
}
