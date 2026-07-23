# Frontend

Deze map bevat een statische frontend zonder build tooling.

## Structuur

- `index.html`: interactieve Rad van Patat-pagina
- `help.html`: help-pagina
- `changelog.html`: gegenereerde changelogpagina op basis van `../../CHANGELOG.md`
- `components/`: herbruikbare web components voor layout
- `assets/css/default.css`: gedeelde en rad-specifieke styling
- `assets/js/`: roulettefunctionaliteit en componentregistratie
- `assets/images/` en `assets/sounds/`: statische media
- `../../scripts/generate-changelog-html.mjs`: bouwt `changelog.html` opnieuw op uit `CHANGELOG.md`

## Gebruik

Serveer `src/frontend` direct via Apache of Nginx als document root, of als submap.

Er is geen `npm install` of buildstap nodig.

Werk na een wijziging aan `CHANGELOG.md` de frontendpagina handmatig bij met:

```bash
node scripts/generate-changelog-html.mjs
```
