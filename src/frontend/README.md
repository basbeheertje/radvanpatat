# Frontend

Deze map bevat een statische frontend zonder build tooling.

## Structuur

- `index.html`: interactieve Rad van Patat-pagina
- `help.html`: help-pagina
- `changelog.html`: gegenereerde changelogpagina op basis van `../../CHANGELOG.md`
- `roadmap.html`: roadmappagina die cards uit een configureerbare JavaScript-array rendert
- `404.html`: statische foutpagina met gedeelde layoutcomponenten
- `.nojekyll`: zorgt dat GitHub Pages de statische frontendbestanden direct serveert, inclusief `404.html`
- `components/`: herbruikbare web components voor layout
- `assets/css/default.css`: gedeelde en rad-specifieke styling
- `assets/js/`: roulettefunctionaliteit en componentregistratie
- `assets/images/` en `assets/sounds/`: statische media
- `../../scripts/generate-changelog-html.mjs`: bouwt `changelog.html` opnieuw op uit `CHANGELOG.md`
- `../../scripts/generate-roadmap.mjs`: bouwt `assets/js/roadmap-data.js` opnieuw op uit GitHub milestones

## Gebruik

Serveer `src/frontend` direct via Apache of Nginx als document root, of als submap.

Er is geen `npm install` of buildstap nodig.

Werk na een wijziging aan `CHANGELOG.md` de frontendpagina handmatig bij met:

```bash
node scripts/generate-changelog-html.mjs
```

Werk de roadmap-data handmatig bij vanuit GitHub milestones met:

```bash
GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... node scripts/generate-roadmap.mjs
```
