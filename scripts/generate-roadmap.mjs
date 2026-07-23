import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "src", "frontend", "assets", "js", "roadmap-data.js");

const CATEGORY_ORDER = ["nu", "binnenkort", "later"];
const ROADMAP_EXCLUDE_MARKER = "*** EXCLUDE FROM ROADMAP ***";

const ICON_KEYWORDS = [
	{ pattern: /(account|profiel|user|login)/i, icon: "account_circle" },
	{ pattern: /(chat|whatsapp|bericht|message)/i, icon: "chat" },
	{ pattern: /(share|delen|link|qr)/i, icon: "share" },
	{ pattern: /(mobile|mobiel|app|android|ios)/i, icon: "smartphone" },
	{ pattern: /(ai|slim|recommend|suggest)/i, icon: "psychology" },
	{ pattern: /(price|prijs|vergelijk)/i, icon: "compare_arrows" },
	{ pattern: /(delivery|bezorg|bestel|order)/i, icon: "delivery_dining" },
	{ pattern: /(leader|ranking|score)/i, icon: "leaderboard" },
	{ pattern: /(roadmap|milestone|release)/i, icon: "track_changes" },
	{ pattern: /(wheel|rad|spin)/i, icon: "motion_play" },
];

function normalizeWhitespace(value) {
	return String(value || "").replace(/\s+/g, " ").trim();
}

/**
 * Maintain a comment-friendly JS module instead of JSON so the static frontend
 * can import the roadmap directly without a bundler or an extra fetch request.
 *
 * @param {unknown} value
 * @returns {string}
 */
function serializeModuleValue(value) {
	return JSON.stringify(value, null, "\t");
}

/**
 * Milestone descriptions may contain private maintainer notes after a hard
 * marker. Strip that tail before any metadata parsing so those notes never leak
 * into public card copy or into the category/status/icon metadata contract.
 *
 * @param {string} description
 * @returns {string}
 */
function stripRoadmapExcludedContent(description) {
	const normalizedDescription = String(description || "").replaceAll("\r\n", "\n");
	const markerIndex = normalizedDescription.indexOf(ROADMAP_EXCLUDE_MARKER);

	if (markerIndex === -1) {
		return normalizedDescription;
	}

	return normalizedDescription.slice(0, markerIndex).trimEnd();
}

async function fetchMilestones(repository, token) {
	const milestones = [];
	let page = 1;

	while (true) {
		const response = await fetch(
			`https://api.github.com/repos/${repository}/milestones?state=all&per_page=100&page=${page}`,
			{
				headers: {
					Accept: "application/vnd.github+json",
					Authorization: `Bearer ${token}`,
					"X-GitHub-Api-Version": "2022-11-28",
					"User-Agent": "roadmap-generator",
				},
			},
		);

		if (!response.ok) {
			const body = await response.text();
			throw new Error(`GitHub API gaf ${response.status}: ${body}`);
		}

		const pageMilestones = await response.json();
		milestones.push(...pageMilestones);

		if (pageMilestones.length < 100) {
			break;
		}

		page += 1;
	}

	return milestones;
}

/**
 * GitHub milestones do not expose custom fields for category, icon, or status.
 * We therefore support lightweight metadata lines in the milestone description:
 * `Category: binnenkort`, `Status: In ontwikkeling`, `Icon: chat`.
 *
 * @param {string} description
 * @returns {{ category: string, status: string, icon: string, description: string }}
 */
function parseDescriptionMetadata(description) {
	const lines = stripRoadmapExcludedContent(description).split("\n");
	const metadata = {
		category: "",
		status: "",
		icon: "",
		description: "",
	};
	const descriptionLines = [];

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line) {
			if (descriptionLines.length > 0) {
				descriptionLines.push("");
			}
			continue;
		}

		const match = line.match(/^(category|status|icon)\s*:\s*(.+)$/i);
		if (match) {
			metadata[match[1].toLowerCase()] = normalizeWhitespace(match[2]);
			continue;
		}

		descriptionLines.push(line);
	}

	metadata.description = normalizeWhitespace(descriptionLines.join(" "));
	return metadata;
}

function inferIcon(milestone, metadata) {
	if (metadata.icon) {
		return metadata.icon;
	}

	const source = `${milestone.title} ${metadata.description}`;
	const match = ICON_KEYWORDS.find((entry) => entry.pattern.test(source));

	return match ? match.icon : "fastfood";
}

function inferProgress(milestone) {
	const totalIssues = milestone.open_issues + milestone.closed_issues;
	if (totalIssues === 0) {
		return milestone.state === "closed" ? 100 : 0;
	}

	return Math.round((milestone.closed_issues / totalIssues) * 100);
}

/**
 * Roadmap cards represent planned work with an explicit finish horizon. Milestones
 * without a GitHub due date stay out of the public roadmap so visitors only see
 * items that the team has actually scheduled.
 *
 * @param {{ due_on?: string | null }} milestone
 * @returns {boolean}
 */
function isRoadmapVisibleMilestone(milestone) {
	return Boolean(milestone?.due_on);
}

function inferCategory(milestone, metadata, progress) {
	const configuredCategory = metadata.category.toLowerCase();

	if (CATEGORY_ORDER.includes(configuredCategory)) {
		return configuredCategory;
	}

	if (milestone.state === "closed" || progress === 100) {
		return "nu";
	}

	if (milestone.due_on) {
		const dueDate = new Date(milestone.due_on);
		const now = new Date();
		const diffInDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

		if (diffInDays <= 60 || progress >= 35) {
			return "binnenkort";
		}
	}

	return progress >= 35 ? "binnenkort" : "later";
}

function inferStatus(milestone, metadata, progress, category) {
	if (metadata.status) {
		return metadata.status;
	}

	if (milestone.state === "closed" || progress === 100 || category === "nu") {
		return "Live";
	}

	if (progress > 0 || category === "binnenkort") {
		return "In ontwikkeling";
	}

	return "Gepland";
}

function normalizeMilestone(milestone) {
	const metadata = parseDescriptionMetadata(milestone.description || "");
	const progress = inferProgress(milestone);
	const category = inferCategory(milestone, metadata, progress);
	const status = inferStatus(milestone, metadata, progress, category);
	const icon = inferIcon(milestone, metadata);
	const description = metadata.description || "Meer details volgen zodra deze milestone verder is uitgewerkt.";

	return {
		title: normalizeWhitespace(milestone.title),
		category: category,
		status: status,
		description: description,
		icon: icon,
		progress: progress,
		sortWeight: CATEGORY_ORDER.indexOf(category),
		dueOn: milestone.due_on || "",
		number: milestone.number,
	};
}

function sortMilestones(items) {
	return [...items].sort((left, right) => {
		if (left.sortWeight !== right.sortWeight) {
			return left.sortWeight - right.sortWeight;
		}

		if (left.progress !== right.progress) {
			return right.progress - left.progress;
		}

		if (left.dueOn && right.dueOn) {
			return new Date(left.dueOn) - new Date(right.dueOn);
		}

		if (left.dueOn || right.dueOn) {
			return left.dueOn ? -1 : 1;
		}

		return left.number - right.number;
	});
}

function createModule(items) {
	const publicItems = items.map(({ sortWeight, dueOn, number, ...item }) => item);

	return `/**
 * Automatically generated from GitHub milestones by scripts/generate-roadmap.mjs.
 * Edit milestones in GitHub to change this roadmap; local manual edits will be overwritten.
 */
export const roadmapItems = ${serializeModuleValue(publicItems)};
`;
}

async function main() {
	const repository = process.env.GITHUB_REPOSITORY;
	const token = process.env.GITHUB_TOKEN;

	if (!repository) {
		throw new Error("GITHUB_REPOSITORY is niet ingesteld.");
	}

	if (!token) {
		throw new Error("GITHUB_TOKEN is niet ingesteld.");
	}

	const milestones = await fetchMilestones(repository, token);
	// Filter before normalization so every downstream step can assume the public
	// roadmap only contains milestones with an explicit end date.
	const roadmapItems = sortMilestones(
		milestones
			.filter(isRoadmapVisibleMilestone)
			.map(normalizeMilestone),
	);
	await fs.writeFile(outputPath, createModule(roadmapItems), "utf8");

	console.log(`${roadmapItems.length} roadmap-items gegenereerd.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
