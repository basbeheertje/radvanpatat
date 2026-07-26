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
		// Completed milestones can outnumber the active roadmap cap because they
		// no longer consume the nine open-work slots. Collapse them by default so
		// the "Nu" column still stays scannable on first render.
		this.showAllCompleted = false;
		this.handleClick = this.handleClick.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	set items(value) {
		this._items = Array.isArray(value) ? value.map((item) => this.normalizeItem(item)) : [];
		this.showAllCompleted = false;
		this.render();
	}

	get items() {
		return this._items;
	}

	connectedCallback() {
		if (!this.dataset.listenersBound) {
			this.addEventListener("click", this.handleClick);
			this.addEventListener("keydown", this.handleKeyDown);
			this.dataset.listenersBound = "true";
		}

		this.render();
	}

	/**
	 * Normalize generator output and hand-authored fallback data into one stable
	 * rendering contract so the component can stay dumb and predictable.
	 *
	 * @param {Record<string, unknown>} item
	 * @returns {{ title: string, category: string, status: string, description: string, icon: string, progress: number | null, isCompleted: boolean }}
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
			isCompleted: progress === 100 || status.trim().toLowerCase() === "live" || status.trim().toLowerCase() === "afgerond",
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

	/**
	 * Roadmap cards stay scannable by showing a short preview in the grid and
	 * moving the full copy into a modal. The preview stops at the first reached
	 * limit so it never exceeds 100 characters or 15 words, and it only cuts on
	 * word boundaries to keep the Dutch copy readable.
	 *
	 * @param {string} description
	 * @returns {{ preview: string, isTruncated: boolean }}
	 */
	truncateDescription(description) {
		const normalizedDescription = description.replace(/\s+/g, " ").trim();
		const words = normalizedDescription.split(" ").filter(Boolean);

		if (words.length <= 15 && normalizedDescription.length <= 100) {
			return {
				preview: normalizedDescription,
				isTruncated: false,
			};
		}

		let previewWords = [];
		let preview = "";

		for (const word of words) {
			const candidateWords = [...previewWords, word];
			const candidatePreview = candidateWords.join(" ");

			if (candidateWords.length > 15 || candidatePreview.length > 100) {
				break;
			}

			previewWords = candidateWords;
			preview = candidatePreview;
		}

		if (!preview) {
			preview = words[0] || normalizedDescription;
		}

		return {
			preview: `${preview}...`,
			isTruncated: true,
		};
	}

	openDescriptionModal(title, description) {
		const modal = this.querySelector("[data-roadmap-modal]");
		const titleNode = this.querySelector("[data-roadmap-modal-title]");
		const bodyNode = this.querySelector("[data-roadmap-modal-body]");

		if (!modal || !titleNode || !bodyNode) {
			return;
		}

		titleNode.textContent = title;
		bodyNode.textContent = description;
		modal.classList.remove("hidden");
		modal.classList.add("flex");

		const closeButton = modal.querySelector("[data-roadmap-modal-close]");
		if (closeButton instanceof HTMLElement) {
			closeButton.focus();
		}
	}

	closeDescriptionModal() {
		const modal = this.querySelector("[data-roadmap-modal]");
		if (!modal) {
			return;
		}

		modal.classList.add("hidden");
		modal.classList.remove("flex");
	}

	/**
	 * One delegated listener keeps the component reusable even after re-rendering
	 * the card list, because the buttons and modal nodes are recreated each time.
	 *
	 * @param {MouseEvent} event
	 */
	handleClick(event) {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const descriptionButton = target.closest("[data-roadmap-description-button]");
		if (descriptionButton instanceof HTMLElement) {
			this.openDescriptionModal(
				descriptionButton.dataset.roadmapTitle || "",
				descriptionButton.dataset.roadmapDescription || "",
			);
			return;
		}

		if (target.closest("[data-roadmap-toggle-completed]")) {
			this.showAllCompleted = !this.showAllCompleted;
			this.render();
			return;
		}

		if (
			target.closest("[data-roadmap-modal-close]") ||
			target.matches("[data-roadmap-modal]")
		) {
			this.closeDescriptionModal();
		}
	}

	handleKeyDown(event) {
		if (event.key === "Escape") {
			this.closeDescriptionModal();
		}
	}

	renderCard(item) {
		const descriptionPreview = this.truncateDescription(item.description);
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
				<button
					class="roadmap-card__description-button"
					data-roadmap-description-button
					data-roadmap-title="${this.escapeHtml(item.title)}"
					data-roadmap-description="${this.escapeHtml(item.description)}"
					type="button"
				>
					<span class="roadmap-card__description">${this.escapeHtml(descriptionPreview.preview)}</span>
				</button>
				${progressMarkup}
			</article>
		`;
	}

	renderSection(section) {
		const items = this.items.filter((item) => item.category === section.key);
		let content = "";

		if (section.key === "nu") {
			const activeNowItems = items.filter((item) => !item.isCompleted);
			const completedItems = items.filter((item) => item.isCompleted);
			const visibleCompletedItems = this.showAllCompleted ? completedItems : completedItems.slice(0, 3);
			const completedToggleMarkup = completedItems.length > 3
				? `
					<button
						class="roadmap-section__toggle"
						data-roadmap-toggle-completed
						type="button"
					>
						<span class="material-symbols-outlined" aria-hidden="true">${this.showAllCompleted ? "expand_less" : "expand_more"}</span>
						<span>${this.showAllCompleted ? "Toon minder afgeronde milestones" : `Toon alle ${completedItems.length} afgeronde milestones`}</span>
					</button>
				`
				: "";

			content = [
				...activeNowItems.map((item) => this.renderCard(item)),
				completedToggleMarkup,
				...visibleCompletedItems.map((item) => this.renderCard(item)),
			].filter(Boolean).join("");
		} else {
			content = items.map((item) => this.renderCard(item)).join("");
		}

		if (!content) {
			content = `
				<div class="roadmap-section__empty">
					<p>Nog geen roadmap-items in deze fase.</p>
				</div>
			`;
		}

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
			<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] hidden items-center justify-center p-6" data-roadmap-modal>
				<div aria-labelledby="roadmap-modal-title" aria-modal="true" class="bg-surface max-w-md w-full rounded-3xl p-8 border-4 border-primary-container shadow-2xl transform scale-90 transition-transform duration-300" role="dialog">
					<div class="flex items-start justify-between gap-4 mb-6">
						<div>
							<h3 class="font-headline-lg text-headline-lg text-primary" data-roadmap-modal-title id="roadmap-modal-title"></h3>
						</div>
						<button aria-label="Sluit roadmapdetails" class="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center text-on-surface-variant" data-roadmap-modal-close type="button">
							<span class="material-symbols-outlined" aria-hidden="true">close</span>
						</button>
					</div>
					<p class="roadmap-modal__body font-body-md text-body-md text-on-surface-variant" data-roadmap-modal-body></p>
					<button class="w-full bg-primary text-on-primary font-label-md text-label-md py-4 rounded-xl hover:opacity-90 transition-opacity mt-6" data-roadmap-modal-close type="button">
						Sluiten
					</button>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("roadmap-board")) {
	customElements.define("roadmap-board", RoadmapBoard);
}
