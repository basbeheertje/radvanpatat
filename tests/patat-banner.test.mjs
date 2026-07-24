import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
	PATAT_BANNER_MESSAGES,
	PATAT_OPINION_STORAGE_KEY,
	readStoredOpinion,
	selectPatatBannerMessage
} from "../src/frontend/components/patat-banner.js";

test("the patat banner only selects copy for the patat opinion", () => {
	assert.equal(selectPatatBannerMessage(null, 0), "");
	assert.equal(selectPatatBannerMessage("friet", 0), "");
	assert.equal(selectPatatBannerMessage("patat", 0), PATAT_BANNER_MESSAGES[0]);
	assert.equal(
		selectPatatBannerMessage("patat", 0.999999999),
		PATAT_BANNER_MESSAGES.at(-1)
	);
});

test("the patat banner reads only supported stored opinions", () => {
	const createStorage = (value) => ({
		getItem(key) {
			assert.equal(key, PATAT_OPINION_STORAGE_KEY);
			return value;
		}
	});

	assert.equal(readStoredOpinion(createStorage("patat")), "patat");
	assert.equal(readStoredOpinion(createStorage("friet")), "friet");
	assert.equal(readStoredOpinion(createStorage("anders")), null);
	assert.equal(readStoredOpinion({
		getItem() {
			throw new Error("storage unavailable");
		}
	}), null);
});

test("the shared component registry mounts the patat banner on every page", async () => {
	const registry = await readFile("src/frontend/components/register-components.js", "utf8");

	assert.match(registry, /import "\.\/patat-banner\.js";/);
});
