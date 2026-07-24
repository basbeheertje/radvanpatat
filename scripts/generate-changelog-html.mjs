import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const outputPath = path.join(repoRoot, "src", "frontend", "changelog.html");

/**
 * Escape user-authored markdown content before it is embedded into HTML.
 * The changelog is edited by humans, so the generator must avoid turning
 * release notes into executable markup.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

/**
 * JSON in an application/json script tag must remain valid JSON after HTML
 * serialization. Escaping `<` prevents accidental closing tags without turning
 * quotes into HTML entities that would break JSON.parse in the browser.
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

/**
 * Parse a deliberately small markdown subset so maintainers can update one
 * plain-text source of truth without introducing a full markdown dependency.
 * Supported structure:
 * - # Changelog
 * - ## [Versie] - Datum
 * - vrije samenvattingsregels
 * - ### Categorie
 * - bullet items
 *
 * @param {string} markdown
 * @returns {{ intro: string[], releases: Array<{version: string, date: string, summary: string[], categories: Array<{title: string, items: string[]}>}> }}
 */
function parseChangelog(markdown) {
	const lines = markdown.split(/\r?\n/);
	const intro = [];
	const releases = [];
	let currentRelease = null;
	let currentCategory = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line || line === "# Changelog") {
			continue;
		}

		const releaseMatch = line.match(/^## \[(.+?)\](?: - (.+))?$/);

		if (releaseMatch) {
			currentRelease = {
				version: releaseMatch[1].trim(),
				date: (releaseMatch[2] || "").trim(),
				summary: [],
				categories: [],
			};
			releases.push(currentRelease);
			currentCategory = null;
			continue;
		}

		const categoryMatch = line.match(/^### (.+)$/);

		if (categoryMatch && currentRelease) {
			currentCategory = {
				title: categoryMatch[1].trim(),
				items: [],
			};
			currentRelease.categories.push(currentCategory);
			continue;
		}

		const itemMatch = line.match(/^- (.+)$/);

		if (itemMatch && currentCategory) {
			currentCategory.items.push(itemMatch[1].trim());
			continue;
		}

		if (currentRelease) {
			currentRelease.summary.push(line);
		} else {
			intro.push(line);
		}
	}

	return { intro, releases };
}

/**
 * Keep the generated page human-readable by converting ISO-like dates to
 * Dutch long dates, while falling back to the source string when parsing fails.
 *
 * @param {string} value
 * @returns {string}
 */
function formatDisplayDate(value) {
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
 * Serialize release content into a data payload for the web component. Using
 * JSON keeps the generator and renderer loosely coupled while still letting the
 * component own the final article markup.
 *
 * @param {{version: string, date: string, summary: string[], categories: Array<{title: string, items: string[]}>}} release
 * @param {number} index
 * @returns {string}
 */
function renderRelease(release, index) {
	const payload = {
		summary: release.summary.join(" "),
		categories: release.categories,
	};
	const tone = index === 0 ? "featured" : "default";

	return `				<changelog-entry data-date="${escapeHtml(release.date)}" data-label="${escapeHtml(release.version)}" data-title="${escapeHtml(`Versie ${release.version}`)}" data-tone="${tone}">
					<script class="changelog-entry-data" type="application/json">${serializeJsonForHtml(payload)}</script>
				</changelog-entry>`;
}

/**
 * Build the standalone HTML file that Apache or Nginx can serve directly.
 * The page reuses the same shared CSS and web components as the rest of the
 * frontend so the changelog stays visually consistent without a build step.
 *
 * @param {{ intro: string[], releases: Array<{version: string, date: string, summary: string[], categories: Array<{title: string, items: string[]}>}> }} changelog
 * @returns {string}
 */
function renderPage(changelog) {
	const introText = changelog.intro.join(" ");
	const releasesMarkup = changelog.releases.map(renderRelease).join("\n");
	const totalChanges = changelog.releases.reduce((count, release) => {
		return count + release.categories.reduce((sum, category) => sum + category.items.length, 0);
	}, 0);
	const latestRelease = changelog.releases[0];
	const latestDate = latestRelease ? formatDisplayDate(latestRelease.date) : "";
	const latestLabel = latestRelease ? latestRelease.version : "Onbekend";

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
		<!-- Generated from CHANGELOG.md by scripts/generate-changelog-html.mjs -->
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
					<p class="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">${escapeHtml(introText)}</p>
				</div>
				<div class="changelog-hero__stats" aria-label="Changelog samenvatting">
					<div class="changelog-stat-card">
						<span class="material-symbols-outlined text-primary text-[30px]" aria-hidden="true">history</span>
						<strong>${changelog.releases.length}</strong>
						<span>release${changelog.releases.length === 1 ? "" : "s"} zichtbaar</span>
					</div>
					<div class="changelog-stat-card">
						<span class="material-symbols-outlined text-secondary text-[30px]" aria-hidden="true">bolt</span>
						<strong>${totalChanges}</strong>
						<span>opgenomen wijziging${totalChanges === 1 ? "" : "en"}</span>
					</div>
					<div class="changelog-stat-card">
						<span class="material-symbols-outlined text-primary text-[30px]" aria-hidden="true">event</span>
						<strong>${escapeHtml(latestLabel)}</strong>
						<span>${escapeHtml(latestDate || "Nog geen datum")}</span>
					</div>
				</div>
			</section>

			<section aria-label="Tijdlijn van updates" class="changelog-timeline">
				${releasesMarkup}
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
</html>
`;
}

async function main() {
	const markdown = await readFile(changelogPath, "utf8");
	const parsedChangelog = parseChangelog(markdown);

	if (parsedChangelog.releases.length === 0) {
		throw new Error("CHANGELOG.md bevat nog geen release-secties.");
	}

	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, renderPage(parsedChangelog), "utf8");
	console.log(`Gegenereerd: ${path.relative(repoRoot, outputPath)}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
