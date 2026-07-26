import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const frontendPath = path.resolve("src/frontend");
const siteHeadPath = path.join(frontendPath, "components", "site-head.js");

/**
 * Capture the shared head loader output without a browser DOM so the runtime
 * contract stays covered even though assets are now inserted through DOM APIs.
 *
 * @returns {Promise<{markup: string, scripts: object[]}>}
 */
async function renderSharedHeadMarkup() {
	const source = await readFile(siteHeadPath, "utf8");
	let markup = "";
	const scripts = [];
	const head = {
		insertBefore(node) {
			scripts.push(node);
		}
	};

	vm.runInNewContext(source, {
		document: {
			currentScript: {
				parentNode: head,
				insertAdjacentHTML(position, value) {
					assert.equal(position, "beforebegin");
					markup += value;
				}
			},
			head: head,
			createElement(tagName) {
				return { tagName };
			}
		}
	});

	return { markup, scripts };
}

test("the shared head contains the self-hosted consent manager before analytics", async () => {
	const { markup, scripts } = await renderSharedHeadMarkup();

	assert.doesNotMatch(await readFile(siteHeadPath, "utf8"), /document\.write/);
	assert.match(markup, /name="viewport"/);
	assert.match(markup, /assets\/vendor\/cookieconsent\/cookieconsent\.css/);
	assert.match(markup, /assets\/css\/default\.css/);
	assert.equal(
		scripts.map((script) => script.src).join("|"),
		[
			"./assets/vendor/cookieconsent/cookieconsent.umd.js",
			"./assets/js/cookie-consent.js",
			"./assets/js/analytics.js",
			"https://cdn.tailwindcss.com?plugins=forms,container-queries",
			"./assets/js/tailwind-theme.js",
			"./assets/js/app.js"
		].join("|")
	);
	assert.equal(scripts[0].async, false);
	assert.equal(scripts[1].async, false);
	assert.equal(scripts[2].async, false);
	assert.equal(scripts[3].async, false);
	assert.equal(scripts[4].async, false);
	assert.equal(scripts[5].type, "module");
	assert.doesNotMatch(markup, /googletagmanager\.com/, "Google Analytics must not load before consent");
	assert.ok(
		scripts.findIndex((script) => script.src.includes("cookie-consent.js")) <
			scripts.findIndex((script) => script.src.includes("analytics.js")),
		"consent must initialize before the analytics adapter"
	);
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
