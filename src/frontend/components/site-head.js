/**
 * Keep parser-sensitive styles and scripts in one shared head definition.
 * This static site has no build step, so writing the trusted, constant markup
 * while the document is being parsed preserves the original blocking order.
 */
document.write(`
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
	<link href="./assets/css/default.css" rel="stylesheet"/>
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-FDRQ5JB0WX"><\/script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());

		gtag('config', 'G-FDRQ5JB0WX');
	<\/script>
	<script src="./assets/js/analytics.js"><\/script>
	<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"><\/script>
	<script src="./assets/js/tailwind-theme.js"><\/script>
	<script type="module" src="./assets/js/app.js"><\/script>
`);
