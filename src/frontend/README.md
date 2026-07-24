# Frontend

Deze map bevat een statische frontend zonder build tooling.

## Structuur

- `index.html`: interactieve Rad van Patat-pagina
- `group.html`: configureert deelnemers en laat het gedeelde rad automatisch een groepsbestelling samenstellen
- `order.html`: toont de laatst voltooide groepsbestelling uit de localStorage van de huidige browser
- `help.html`: help-pagina
- `changelog.html`: gegenereerde changelogpagina op basis van `../../CHANGELOG.md`
- `roadmap.html`: roadmappagina die cards uit een configureerbare JavaScript-array rendert
- `404.html`: statische foutpagina met gedeelde layoutcomponenten
- `.nojekyll`: zorgt dat GitHub Pages de statische frontendbestanden direct serveert, inclusief `404.html`
- `components/`: herbruikbare web components voor layout
- `components/site-head.js`: gedeelde parser-synchrone head voor algemene metadata, fonts, styling, componentregistratie en Google Analytics
- `components/patat-banner.js`: automatisch gemounte sitebrede banner voor de opgeslagen friet-of-patatkeuze
- `components/roulette-wheel-view.js`: gedeelde wielmarkup voor het gewone rad en het groepsrad
- `components/order-summary.js`: gedeelde bestellijstweergave voor `group.html` en `order.html`
- `assets/css/default.css`: gedeelde en rad-specifieke styling
- `assets/js/`: roulettefunctionaliteit en componentregistratie
- `assets/images/` en `assets/sounds/`: statische media
- `../../scripts/generate-changelog-html.mjs`: bouwt `changelog.html` opnieuw op uit `CHANGELOG.md`
- `../../scripts/generate-roadmap.mjs`: bouwt `assets/js/roadmap-data.js` opnieuw op uit GitHub milestones

## Gebruik

Serveer `src/frontend` direct via Apache of Nginx als document root, of als submap.

Er is geen `npm install` of buildstap nodig.

Iedere top-level HTML-pagina houdt alleen de pagina-eigen SEO-metadata en
structured data in de eigen `<head>`. Laad daarnaast
`./components/site-head.js` voor de gedeelde browsermetadata, assets en Google
Analytics-configuratie (`G-FDRQ5JB0WX`).

De gedeelde componentregistratie mount `#patat-banner` automatisch op iedere
pagina. De banner blijft verborgen tenzij de bezoeker op het persoonlijke rad
voor `patat` heeft gekozen; die keuze wordt sitebreed uit localStorage gelezen.

De groepsbestelling gebruikt dezelfde opgeslagen snackselectie als `index.html`. Na de laatste automatische spin wordt uitsluitend de voltooide bestelling lokaal bewaard onder `rad-van-patat-last-group-order`. Namen en bestellingen verlaten de browser niet. Open `order.html` op hetzelfde apparaat en in dezelfde browser om die bestelling opnieuw te bekijken.

De businessregels voor de groepsverdeling en localStorage-validatie kunnen worden gecontroleerd met:

```bash
npm test
```

Werk na een wijziging aan `CHANGELOG.md` de frontendpagina handmatig bij met:

```bash
node scripts/generate-changelog-html.mjs
```

Werk de roadmap-data handmatig bij vanuit GitHub milestones met:

```bash
GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... node scripts/generate-roadmap.mjs
```

Alleen milestones met een GitHub-einddatum (`due date`) worden in de publieke roadmap opgenomen.
De roadmap toont maximaal 9 milestones tegelijk, geeft voorrang aan milestones met gestarte issues en laat afgeronde milestones maximaal 3 maanden zichtbaar staan.
