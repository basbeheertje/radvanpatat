import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const htmlOutputPath = path.join(repoRoot, "src", "frontend", "changelog.html");
const markdownOutputPath = path.join(repoRoot, "CHANGELOG.md");

/**
 * The release workflow writes both outputs from one source run so GitHub Pages
 * always publishes a markdown changelog and a matching frontend page together.
 */
const CHANGELOG_INTRO = "Alle belangrijke wijzigingen per gepubliceerde versie.";

/**
 * GitHub release notes can be written in English headings while the public page
 * is Dutch, so categories are normalized once here before both files are built.
 */
const CATEGORY_LABELS = new Map([
	["added", "Toegevoegd"],
	["changed", "Gewijzigd"],
	["fixed", "Opgelost"],
	["improved", "Verbeterd"],
	["removed", "Verwijderd"],
	["deprecated", "Verouderd"],
	["security", "Beveiliging"],
	["what's changed", "Gewijzigd"],
	["whats changed", "Gewijzigd"],
	["breaking changes", "Breaking changes"],
]);

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

/**
 * The changelog component reads JSON from an application/json script tag, so we
 * escape only the HTML-sensitive characters that could terminate the tag early.
 *
 * @param {unknown} value
 * @returns {string}
 */
function serializeJsonForHtml(value) {
	return JSON.stringify(value)
		.replaceAll("<", "\\u003C")
		.replaceAll(">", "\\u003E")
		.replaceAll("&", "\\u0026");
}

function formatDisplayDate(dateValue) {
	return new Intl.DateTimeFormat("nl-NL", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "Europe/Amsterdam",
	}).format(new Date(dateValue));
}

/**
 * The markdown source uses ISO dates so generated HTML can format them
 * consistently regardless of where the workflow happens to run.
 *
 * @param {string} dateValue
 * @returns {string}
 */
function formatIsoDate(dateValue) {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: "Europe/Amsterdam",
	});
	const parts = formatter.formatToParts(new Date(dateValue));
	const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

	return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

/**
 * GitHub release notes may contain markdown links, emphasis, or issue links that
 * should stay readable inside plain-text component lists and CHANGELOG bullets.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeInlineMarkdown(value) {
	return value
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/__([^_]+)__/g, "$1")
		.replace(/\*([^*]+)\*/g, "$1")
		.replace(/_([^_]+)_/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

function normalizeCategoryTitle(title) {
	const cleanedTitle = normalizeInlineMarkdown(
		title
			.replace(/^#+\s+/, "")
			.replace(/[:：]\s*$/, "")
	).toLowerCase();

	return CATEGORY_LABELS.get(cleanedTitle) || cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
}

/**
 * Release bodies are authored by humans and GitHub-generated notes, so the
 * parser deliberately supports a small markdown subset and falls back to one
 * generic category instead of dropping useful release information.
 *
 * @param {string} body
 * @returns {{ summary: string, categories: Array<{title: string, items: string[]}> }}
 */
function parseReleaseBody(body) {
	const lines = body
		.replaceAll("\r\n", "\n")
		.replace(/<!--[\s\S]*?-->/g, "")
		.split("\n");
	const summaryParagraphs = [];
	const categories = [];
	let currentCategory = null;
	let summaryBuffer = [];
	let hasStructuredContent = false;

	const flushSummaryBuffer = () => {
		if (summaryBuffer.length === 0) {
			return;
		}

		summaryParagraphs.push(normalizeInlineMarkdown(summaryBuffer.join(" ")));
		summaryBuffer = [];
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line) {
			flushSummaryBuffer();
			continue;
		}

		if (/^\*\*full changelog\*\*:/i.test(line) || /^full changelog:/i.test(line)) {
			continue;
		}

		const headingMatch = line.match(/^#{2,6}\s+(.+)$/);

		if (headingMatch) {
			flushSummaryBuffer();
			hasStructuredContent = true;
			currentCategory = {
				title: normalizeCategoryTitle(headingMatch[1]),
				items: [],
			};
			categories.push(currentCategory);
			continue;
		}

		const bulletMatch = line.match(/^[-*]\s+(.+)$/);

		if (bulletMatch) {
			flushSummaryBuffer();
			hasStructuredContent = true;

			// Generated release notes often start with bullets before a heading.
			// Group them under one catch-all category so the frontend layout keeps
			// the same card structure for every release.
			if (!currentCategory) {
				currentCategory = {
					title: "Gewijzigd",
					items: [],
				};
				categories.push(currentCategory);
			}

			currentCategory.items.push(normalizeInlineMarkdown(bulletMatch[1]));
			continue;
		}

		if (hasStructuredContent && currentCategory && currentCategory.items.length > 0) {
			const lastItemIndex = currentCategory.items.length - 1;

			// Continuation lines belong to the previous bullet, otherwise multiline
			// GitHub notes would fragment into separate fake changes.
			currentCategory.items[lastItemIndex] = `${currentCategory.items[lastItemIndex]} ${normalizeInlineMarkdown(line)}`.trim();
			continue;
		}

		summaryBuffer.push(line);
	}

	flushSummaryBuffer();

	return {
		summary: summaryParagraphs.join(" ").trim() || "Geen wijzigingen beschreven.",
		categories: categories.filter((category) => category.items.length > 0),
	};
}

async function fetchReleases(repository, token) {
	const releases = [];
	let page = 1;

	while (true) {
		const response = await fetch(
			`https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`,
			{
				headers: {
					Accept: "application/vnd.github+json",
					Authorization: `Bearer ${token}`,
					"X-GitHub-Api-Version": "2022-11-28",
					"User-Agent": "changelog-generator",
				},
			},
		);

		if (!response.ok) {
			const body = await response.text();
			throw new Error(`GitHub API gaf ${response.status}: ${body}`);
		}

		const pageReleases = await response.json();
		releases.push(...pageReleases);

		if (pageReleases.length < 100) {
			break;
		}

		page += 1;
	}

	return releases
		.filter((release) => !release.draft)
		.filter((release) => !release.prerelease)
		.sort((left, right) => new Date(right.published_at) - new Date(left.published_at))
		.map((release) => {
			const parsedBody = parseReleaseBody(release.body?.trim() || "");

			return {
				date: formatIsoDate(release.published_at),
				displayDate: formatDisplayDate(release.published_at),
				htmlUrl: release.html_url,
				summary: parsedBody.summary,
				tag: release.tag_name,
				title: release.name || release.tag_name,
				categories: parsedBody.categories,
			};
		});
}

function createMarkdown(releases) {
	const sections = releases.map((release) => {
		const lines = [`## [${release.tag}] - ${release.date}`, "", release.summary];

		for (const category of release.categories) {
			lines.push("", `### ${category.title}`);

			for (const item of category.items) {
				lines.push(`- ${item}`);
			}
		}

		return lines.join("\n");
	});

	return [
		"# Changelog",
		"",
		CHANGELOG_INTRO,
		"",
		...sections.flatMap((section, index) => (
			index === sections.length - 1 ? [section] : [section, ""]
		)),
		"",
	].join("\n");
}

function renderRelease(release, index) {
	const payload = {
		summary: release.summary,
		categories: release.categories,
	};
	const tone = index === 0 ? "featured" : "default";

	return `		<changelog-entry data-date="${escapeHtml(release.date)}" data-label="${escapeHtml(release.tag)}" data-title="${escapeHtml(`Versie ${release.title}`)}" data-tone="${tone}">
			<script class="changelog-entry-data" type="application/json">${serializeJsonForHtml(payload)}</script>
		</changelog-entry>`;
}

function createHtml(releases) {
	const totalChanges = releases.reduce((count, release) => {
		return count + release.categories.reduce((sum, category) => sum + category.items.length, 0);
	}, 0);
	const latestRelease = releases[0];

	return `<!DOCTYPE html>
<html class="light" lang="nl">
	<head>
		<meta charset="UTF-8"/>
		<title>Rad van Patat Changelog | Bekijk alle updates</title>
		<meta content="Bekijk welke verbeteringen, nieuwe functies en fixes er aan Rad van Patat zijn toegevoegd." name="description"/>
		<meta content="rad van patat changelog, updates, releases, nieuwe functies, fixes, verbeteringen" name="keywords"/>
		<meta content="index, follow" name="robots"/>
		<link href="https://radvanpatat.nl/changelog.html" rel="canonical"/>
		<meta content="Rad van Patat Changelog | Bekijk alle updates" property="og:title"/>
		<meta content="Bekijk welke verbeteringen, nieuwe functies en fixes er aan Rad van Patat zijn toegevoegd." property="og:description"/>
		<meta content="nl_NL" property="og:locale"/>
		<meta content="Rad van Patat" property="og:site_name"/>
		<meta content="https://radvanpatat.nl/changelog.html" property="og:url"/>
		<meta content="website" property="og:type"/>
		<meta content="https://radvanpatat.nl/assets/images/brand/rad-van-patat-logo.png" property="og:image"/>
		<meta content="Rad van Patat logo" property="og:image:alt"/>
		<meta content="summary_large_image" name="twitter:card"/>
		<meta content="radvanpatat.nl" name="twitter:site"/>
		<meta content="https://radvanpatat.nl/changelog.html" name="twitter:url"/>
		<meta content="Rad van Patat Changelog | Bekijk alle updates" name="twitter:title"/>
		<meta content="Bekijk welke verbeteringen, nieuwe functies en fixes er aan Rad van Patat zijn toegevoegd." name="twitter:description"/>
		<meta content="https://radvanpatat.nl/assets/images/brand/rad-van-patat-logo.png" name="twitter:image"/>
		<script src="./components/site-head.js"></script>
		<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				"name": "Rad van Patat Changelog",
				"url": "https://radvanpatat.nl/changelog.html",
				"image": "https://radvanpatat.nl/assets/images/brand/rad-van-patat-logo.png",
				"description": "Overzicht van wijzigingen, verbeteringen en nieuwe functies binnen Rad van Patat.",
				"inLanguage": "nl-NL",
				"publisher": {
					"@type": "Organization",
					"name": "Rad van Patat",
					"url": "https://radvanpatat.nl"
				}
			}
		</script>
	</head>
	<body class="changelog-page bg-background text-on-background min-h-screen flex flex-col selection:bg-primary-container">
		<!-- Generated from GitHub releases by scripts/generate-changelog.mjs -->
		<site-header
			active-nav=""
			cta-href="./index.html"
			cta-label="Terug naar het rad"
			cta-mode="link"
			help-href="./help.html"
			logo-href="./index.html"
			rad-href="./index.html"
			share-href="./index.html"
			share-mode="link"></site-header>

		<main class="flex-1 max-w-[1280px] mx-auto w-full px-margin-mobile md:px-margin-desktop py-xl">
			<section class="changelog-hero">
				<div class="changelog-hero__copy">
					<p class="changelog-hero__eyebrow">Keukenlogboek van het Rad van Patat</p>
					<h1 class="font-headline-xl text-headline-xl text-primary">Wat is er nieuw?</h1>
					<p class="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">${escapeHtml(CHANGELOG_INTRO)}</p>
				</div>
				<div class="changelog-hero__stats" aria-label="Changelog samenvatting">
					<div class="changelog-stat-card">
						<span class="material-symbols-outlined text-primary text-[30px]" aria-hidden="true">history</span>
						<strong>${releases.length}</strong>
						<span>release${releases.length === 1 ? "" : "s"} zichtbaar</span>
					</div>
					<div class="changelog-stat-card">
						<span class="material-symbols-outlined text-secondary text-[30px]" aria-hidden="true">bolt</span>
						<strong>${totalChanges}</strong>
						<span>opgenomen wijziging${totalChanges === 1 ? "" : "en"}</span>
					</div>
					<div class="changelog-stat-card">
						<span class="material-symbols-outlined text-primary text-[30px]" aria-hidden="true">event</span>
						<strong>${escapeHtml(latestRelease?.tag || "Onbekend")}</strong>
						<span>${escapeHtml(latestRelease?.displayDate || "Nog geen datum")}</span>
					</div>
				</div>
			</section>

			<section aria-label="Tijdlijn van updates" class="changelog-timeline">
${releases.map(renderRelease).join("\n")}
			</section>

			<section class="changelog-cta">
				<div>
					<h2 class="font-headline-md text-headline-md text-on-primary-container">Mis je iets op de kaart?</h2>
					<p class="font-body-md text-on-primary-container/80 max-w-2xl">Bekijk de help-pagina voor uitleg of ga direct terug naar het rad om nieuwe snacks toe te voegen en te delen.</p>
				</div>
				<div class="changelog-cta__actions">
					<a class="changelog-cta__link changelog-cta__link--secondary" href="./help.html">Help bekijken</a>
					<a class="changelog-cta__link" href="./index.html">Naar het rad</a>
				</div>
			</section>
		</main>

		<site-footer-designed-by></site-footer-designed-by>

		<branding-sticker></branding-sticker>
	</body>
</html>`;
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

	const releases = await fetchReleases(repository, token);
	const markdown = createMarkdown(releases);
	const html = createHtml(releases);

	await fs.writeFile(markdownOutputPath, markdown, "utf8");
	await fs.writeFile(htmlOutputPath, html, "utf8");

	console.log(`${releases.length} releases verwerkt.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
