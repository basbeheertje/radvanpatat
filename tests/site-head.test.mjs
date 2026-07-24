import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const frontendPath = path.resolve("src/frontend");
const siteHeadPath = path.join(frontendPath, "components", "site-head.js");

/**
 * Capture the trusted markup written by the head loader without requiring a
 * browser DOM, so the shared runtime contract stays covered by `npm test`.
 *
 * @returns {Promise<string>}
 */
async function renderSharedHeadMarkup() {
	const source = await readFile(siteHeadPath, "utf8");
	let markup = "";

	vm.runInNewContext(source, {
		document: {
			write(value) {
				markup += value;
			},
		},
	});

	return markup;
}

test("the shared head contains site assets and Google Analytics", async () => {
	const markup = await renderSharedHeadMarkup();

	assert.match(markup, /name="viewport"/);
	assert.match(markup, /assets\/css\/default\.css/);
	assert.match(markup, /assets\/js\/tailwind-theme\.js/);
	assert.match(markup, /assets\/js\/app\.js/);
	assert.match(markup, /googletagmanager\.com\/gtag\/js\?id=G-FDRQ5JB0WX/);
	assert.match(markup, /gtag\('config', 'G-FDRQ5JB0WX'\)/);
});

test("every top-level frontend page uses the shared head once", async () => {
	const fileNames = (await readdir(frontendPath))
		.filter((fileName) => fileName.endsWith(".html"));

	assert.ok(fileNames.length > 0);

	for (const fileName of fileNames) {
		const html = await readFile(path.join(frontendPath, fileName), "utf8");
		const sharedHeadReferences = html.match(/src="\.\/components\/site-head\.js"/g) || [];

		assert.equal(sharedHeadReferences.length, 1, `${fileName} must load the shared head exactly once`);
		assert.match(html, /<title>.+<\/title>/, `${fileName} must retain its page title`);
		assert.match(html, /rel="canonical"/, `${fileName} must retain its canonical URL`);
		assert.match(html, /property="og:image"/, `${fileName} must retain crawler-visible social metadata`);
		assert.match(html, /name="twitter:card"/, `${fileName} must retain crawler-visible card metadata`);
		assert.match(html, /type="application\/ld\+json"/, `${fileName} must retain its structured data`);
		assert.doesNotMatch(html, /cdn\.tailwindcss\.com/, `${fileName} must not duplicate shared assets`);
		assert.doesNotMatch(html, /googletagmanager\.com/, `${fileName} must not duplicate analytics`);
	}
});
