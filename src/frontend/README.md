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
- `components/site-head.js`: gedeelde parser-synchrone head voor algemene metadata, fonts, styling, consentbeheer en componentregistratie
- `components/patat-banner.js`: automatisch gemounte sitebrede banner voor de opgeslagen friet-of-patatkeuze
- `components/roulette-wheel-view.js`: gedeelde wielmarkup voor het gewone rad en het groepsrad
- `components/order-summary.js`: gedeelde bestellijstweergave voor `group.html` en `order.html`
- `assets/css/default.css`: gedeelde en rad-specifieke styling
- `assets/js/cookie-consent.js`: centrale opslaginventaris, meertalige consentconfiguratie en opt-in-loader voor Google Analytics
- `assets/js/analytics.js`: fouttolerante GA4-adapter met stabiele eventnamen en gevalideerde parameters
- `assets/vendor/cookieconsent/`: self-hosted CookieConsent 3.1.0-distributie en MIT-licentie
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
Analytics-configuratie (`G-FDRQ5JB0WX`). De gedeelde head initialiseert eerst
CookieConsent; de Google-tag wordt dus niet opgevraagd voordat een bezoeker
expliciet analytische cookies accepteert. Daarnaast initialiseert de frontend
de lokale `dataLayer`/`gtag`-bootstrap en het externe Google-script uitsluitend
op de exacte hostname `radvanpatat.nl`. Localhost, IP-adressen, `www`,
preview-subdomeinen en andere deployments versturen daardoor nooit Analytics.

## Cookie- en consentbeheer

De frontend gebruikt de gratis, open-source
[CookieConsent 3.1.0](https://github.com/orestbida/cookieconsent) onder de
MIT-licentie. De distributie wordt lokaal geserveerd, zodat de cookiemelding
zelf geen extra third-party request nodig heeft.

`assets/js/cookie-consent.js` bevat één `storageInventory` voor:

- noodzakelijke cookies;
- noodzakelijke localStorage-sleutels;
- toestemmingsplichtige analytische cookies.

Dezelfde inventaris genereert de zichtbare opslagtabellen voor Nederlands,
Engels, Spaans, Pools en Duits. De consentrevisie wordt deterministisch uit de
inventaris berekend. Voeg een nieuwe cookie of lokale opslagsleutel daarom
altijd daar toe; bestaande bezoekers krijgen na zo'n inventariswijziging
automatisch opnieuw de melding. `npm test` controleert bovendien dat iedere
project-eigen `rad-van-patat-*` opslagsleutel in deze inventaris voorkomt. Laad
een nieuwe niet-noodzakelijke dienst uitsluitend via een
CookieConsent-categorie en nooit rechtstreeks vanuit een HTML-pagina of
`components/site-head.js`.

De permanente knop “Cookievoorkeuren” in de gedeelde footer laat bezoekers hun
toestemming altijd opnieuw bekijken of intrekken. Bij intrekken blokkeert de
Analytics-adapter nieuwe events en verwijdert CookieConsent bekende `_ga`-
cookies.

De configuratie beperkt de Analytics-cookielevensduur tot maximaal 13 maanden,
ververst die termijn niet bij ieder bezoek en schakelt Google Signals en
advertentiepersonalisatie uit. De hostname-controle staat centraal in
`isGoogleAnalyticsHostname()`; verruim deze allowlist alleen wanneer een extra
productiedomein bewust dezelfde GA4-property moet gebruiken. Controleer
aanvullend in de beheeromgeving van de GA4-property:

1. welke gebruikers- en eventretentie is ingesteld;
2. of retentie bij nieuwe activiteit wordt gereset;
3. dat Google Signals en advertentiepersonalisatie ook op propertyniveau uitstaan;
4. dat de verwerkersovereenkomst en overige organisatorische privacydocumentatie actueel zijn.

## Google Analytics-gebeurtenissen

Na toestemming verstuurt de gedeelde adapter de volgende gebeurtenissen:

| Event | Moment | Parameters |
| --- | --- | --- |
| `patat_opinion_selected` | Bezoeker kiest patat | — |
| `friet_opinion_selected` | Bezoeker kiest friet | — |
| `easter_eggs_activated` | De `eggs`-modus wordt geactiveerd | — |
| `group_mode_selected` | Bezoeker kiest het groepsrad | — |
| `personal_mode_selected` | Bezoeker kiest het persoonlijke rad | — |
| `roulette_spin_started` | Een persoonlijke of automatische groepsspin start | `spin_mode`, `available_snack_count` |
| `roulette_spin_completed` | Het rad heeft een snack gekozen | `spin_mode`, `snack_name`, `snack_source` |
| `share_modal_opened` | De deelmodal opent | `available_snack_count` |
| `harlem_shake_started` | Het `shake`-commando start | — |
| `group_order_started` | Een groepsverdeling start | `people_count`, `requested_snack_count`, `available_snack_count` |
| `snack_removed` | Een snack wordt buiten het rad gesleept | `snack_name`, `snack_source`, `available_snack_count` |
| `snack_added` | Een geldige eigen snack wordt toegevoegd | `snack_name`, `available_snack_count` |

Registreer `snack_name`, `snack_source` en `spin_mode` als event-scoped
custom dimensions en de drie telparameters als custom metrics wanneer deze
waarden in gewone GA4-rapporten en Explorations beschikbaar moeten zijn. Zonder
die registratie zijn ze wel in Realtime en DebugView te controleren. Zie
[Google Analytics: event parameters](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters).

De gedeelde componentregistratie mount `#patat-banner` automatisch op iedere
pagina. De banner blijft verborgen tenzij de bezoeker op het persoonlijke rad
voor `patat` heeft gekozen; die keuze wordt sitebreed uit localStorage gelezen.

De groepsbestelling gebruikt dezelfde opgeslagen snackselectie als `index.html`. Na de laatste automatische spin wordt uitsluitend de voltooide bestelling lokaal bewaard onder `rad-van-patat-last-group-order`. Deelnemersnamen en bestellingen verlaten de browser niet. Snacknamen worden bij toevoegen, verwijderen en spinresultaten wel als genormaliseerde Analytics-eventparameter verstuurd. Open `order.html` op hetzelfde apparaat en in dezelfde browser om die bestelling opnieuw te bekijken.

Analytics-events met snacknamen worden pas na expliciete Analytics-toestemming
verstuurd. Zonder toestemming blijven deze gegevens uitsluitend onderdeel van
de lokale applicatiestaat.

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
