/**
 * This shared head runs from a classic script tag inside `<head>`. The old
 * write-through parser API now triggers browser warnings for cross-site assets
 * and can be blocked in future loads, so shared assets are inserted with DOM APIs.
 */
(function (document) {
	const currentScript = document.currentScript;
	const head = currentScript && currentScript.parentNode ? currentScript.parentNode : document.head;
	if (!head || !currentScript) {
		return;
	}

	currentScript.insertAdjacentHTML("beforebegin", `
		<meta content="width=device-width, initial-scale=1.0, maximum-scale=2.0, minimum-scale=1.0, user-scalable=yes" name="viewport"/>
		<meta content="telephone=yes" name="format-detection"/>
		<meta content="yes" name="mobile-web-app-capable"/>
		<meta content="#7c5800" name="theme-color"/>
		<meta content="on" http-equiv="cleartype"/>
		<link as="image" href="https://radvanpatat.nl/assets/images/brand/rad-van-patat-logo.png" rel="preload"/>
		<link href="./assets/images/brand/apple-touch-icon.png" rel="apple-touch-icon"/>
		<link href="./assets/images/brand/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png"/>
		<link href="./assets/images/brand/favicon-16x16.png" rel="icon" sizes="16x16" type="image/png"/>
		<link href="./assets/images/brand/favicon.png" rel="icon" type="image/png"/>
		<link href="./assets/images/brand/favicon.png" rel="shortcut icon" type="image/png"/>
		<link href="https://fonts.googleapis.com" rel="preconnect"/>
		<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
		<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;family=Space+Grotesk:wght@500;600;700&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
		<link href="./assets/vendor/cookieconsent/cookieconsent.css" rel="stylesheet"/>
		<link href="./assets/css/default.css" rel="stylesheet"/>
	`);

	/**
	 * Dynamic classic scripts default to async loading. Setting `async = false`
	 * preserves the same dependency order the previous parser-blocking markup had:
	 * consent library, consent config, analytics adapter, Tailwind theme, then app.
	 */
	[
		{ src: "./assets/vendor/cookieconsent/cookieconsent.umd.js" },
		{ src: "./assets/js/cookie-consent.js" },
		{ src: "./assets/js/analytics.js" },
		{ src: "https://cdn.tailwindcss.com?plugins=forms,container-queries" },
		{ src: "./assets/js/tailwind-theme.js" },
		{ src: "./assets/js/app.js", type: "module" }
	].forEach(function (definition) {
		const script = document.createElement("script");
		script.src = definition.src;
		if (definition.type) {
			script.type = definition.type;
		} else {
			script.async = false;
		}
		head.insertBefore(script, currentScript);
	});
})(document);
