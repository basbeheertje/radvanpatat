import test from "node:test";
import assert from "node:assert/strict";

import {
	buildWelcomeIntroCookie,
	shouldShowWelcomeIntro,
	shouldStoreWelcomeIntroCookie
} from "../src/frontend/components/welcome-intro.js";

test("the welcome intro is eligible without its cookie", () => {
	assert.equal(shouldShowWelcomeIntro("", 1_750_000_000_000), true);
});

test("the welcome intro remains hidden during the first hour", () => {
	const now = 1_750_000_000_000;
	const shownAt = now - (59 * 60 * 1000);
	const cookie = `other=value; rad-van-patat-welcome-intro=${shownAt}`;

	assert.equal(shouldShowWelcomeIntro(cookie, now), false);
});

test("the welcome intro becomes eligible after exactly one hour", () => {
	const now = 1_750_000_000_000;
	const shownAt = now - (60 * 60 * 1000);

	assert.equal(
		shouldShowWelcomeIntro(`rad-van-patat-welcome-intro=${shownAt}`, now),
		true
	);
});

test("the welcome intro cookie expires site-wide after one hour", () => {
	const cookie = buildWelcomeIntroCookie(1_750_000_000_000, true);

	assert.match(cookie, /rad-van-patat-welcome-intro=1750000000000/);
	assert.match(cookie, /Max-Age=3600/);
	assert.match(cookie, /Path=\//);
	assert.match(cookie, /SameSite=Lax/);
	assert.match(cookie, /Secure/);
});

test("localhost always shows the intro and never stores its cookie", () => {
	const now = 1_750_000_000_000;
	const recentCookie = `rad-van-patat-welcome-intro=${now - 1000}`;

	assert.equal(shouldShowWelcomeIntro(recentCookie, now, "localhost"), true);
	assert.equal(shouldShowWelcomeIntro(recentCookie, now, "LOCALHOST"), true);
	assert.equal(shouldStoreWelcomeIntroCookie("localhost"), false);
});

test("only the literal localhost hostname bypasses the cookie", () => {
	assert.equal(shouldStoreWelcomeIntroCookie("127.0.0.1"), true);
	assert.equal(shouldStoreWelcomeIntroCookie("intro.localhost"), true);
	assert.equal(shouldStoreWelcomeIntroCookie("radvanpatat.nl"), true);
});
