import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDirectory = path.join(repoRoot, "src", "frontend");
const productionOrigin = "https://radvanpatat.nl";

/**
 * Read one HTML tag by an identifying attribute so the sitemap contract does
 * not depend on the formatter's attribute order.
 *
 * @param {string} html
 * @param {string} attributeName
 * @param {string} attributeValue
 * @returns {Record<string, string> | null}
 */
function findTagAttributes(html, attributeName, attributeValue) {
	const tags = html.match(/<(?:link|meta)\b[^>]*>/gi) || [];
	const identifyingAttribute = `${attributeName}="${attributeValue}"`;
	const tag = tags.find((candidate) => candidate.includes(identifyingAttribute));

	if (!tag) {
		return null;
	}

	return Object.fromEntries(
		Array.from(tag.matchAll(/\b([a-z:-]+)="([^"]*)"/gi), ([, name, value]) => [
			name.toLowerCase(),
			value,
		]),
	);
}

/**
 * Use the HTML canonical and robots declarations as the source of truth. This
 * catches newly added public pages that would otherwise be forgotten in the
 * manually maintained sitemap.
 *
 * @returns {Promise<string[]>}
 */
async function readIndexableCanonicalUrls() {
	const filenames = (await readdir(frontendDirectory)).filter((filename) =>
		filename.endsWith(".html"),
	);
	const urls = [];

	for (const filename of filenames) {
		const html = await readFile(path.join(frontendDirectory, filename), "utf8");
		const robots = findTagAttributes(html, "name", "robots");
		const canonical = findTagAttributes(html, "rel", "canonical");

		if (!robots || robots.content.split(",").some((rule) => rule.trim() === "noindex")) {
			continue;
		}

		assert.ok(canonical?.href, `${filename} must declare a canonical URL`);
		urls.push(canonical.href);
	}

	return urls.sort();
}

test("sitemap lists every indexable canonical frontend page exactly once", async () => {
	const sitemap = await readFile(path.join(frontendDirectory, "sitemap.xml"), "utf8");
	const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => url);
	const uniqueSitemapUrls = new Set(sitemapUrls);

	assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
	assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
	assert.equal(uniqueSitemapUrls.size, sitemapUrls.length, "sitemap URLs must be unique");
	assert.deepEqual([...uniqueSitemapUrls].sort(), await readIndexableCanonicalUrls());

	for (const url of sitemapUrls) {
		assert.equal(new URL(url).origin, productionOrigin);
	}
});

test("robots.txt advertises the production sitemap", async () => {
	const robots = await readFile(path.join(frontendDirectory, "robots.txt"), "utf8");

	assert.match(robots, /^User-agent: \*$/m);
	assert.match(robots, /^Allow: \/$/m);
	assert.match(robots, /^Sitemap: https:\/\/radvanpatat\.nl\/sitemap\.xml$/m);
});
