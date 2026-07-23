import { roadmapItems } from "./roadmap-data.js";

function initRoadmapPage() {
	const roadmapBoard = document.querySelector("roadmap-board");

	if (!roadmapBoard) {
		return;
	}

	roadmapBoard.items = roadmapItems;
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initRoadmapPage, { once: true });
} else {
	initRoadmapPage();
}
