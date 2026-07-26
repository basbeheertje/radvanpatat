# Frontend

Deze map bevat een statische frontend zonder build tooling.

## Structuur

- `index.html`: interactieve Rad van Patat-pagina
- `group.html`: configureert deelnemers en laat het gedeelde rad automatisch een groepsbestelling samenstellen
- `wheels.html`: overzichtspagina met alle opgeslagen rads in de huidige browser
- `wheel.html`: detail- en bewerkpagina voor één opgeslagen rad
- `order.html`: start- en overzichtspagina voor losse bestellingen in de huidige browser
- `order-detail.html`: detailpagina voor één losse bestelling
- `order-summary.html`: bestellijstweergave voor één losse bestelling
- `help.html`: help-pagina
- `changelog.html`: gegenereerde changelogpagina op basis van `../../CHANGELOG.md`
- `roadmap.html`: roadmappagina die cards uit een configureerbare JavaScript-array rendert
- `404.html`: statische foutpagina met gedeelde layoutcomponenten
- `.nojekyll`: zorgt dat GitHub Pages de statische frontendbestanden direct serveert, inclusief `404.html`
- `components/`: herbruikbare web components voor layout
- `components/site-head.js`: gedeelde parser-synchrone head voor algemene metadata, fonts, styling, consentbeheer en componentregistratie
- `components/patat-banner.js`: automatisch gemounte sitebrede banner voor de opgeslagen friet-of-patatkeuze
- `components/roulette-wheel-view.js`: gedeelde wielmarkup voor het gewone rad en het groepsrad
- `components/order-summary.js`: gedeelde bestellijstweergave voor `group.html`, `order-summary.html` en herbruikbare orderoverzichten
- `assets/css/default.css`: gedeelde en rad-specifieke styling
- `assets/js/cookie-consent.js`: centrale opslaginventaris, meertalige consentconfiguratie en opt-in-loader voor Google Analytics
- `assets/js/analytics.js`: fouttolerante GA4-adapter met stabiele eventnamen en gevalideerde parameters
- `assets/js/roulette-core.js`: gedeelde rad-store, actieve-radlogica, snacknormalisatie en share-tokenlogica
- `assets/js/wheel-list-page.js`: rendert het overzicht van opgeslagen rads, sorteren en activeren
- `assets/js/wheel-detail-page.js`: rendert de detailpagina voor naambeheer, itemselectie en eigen items
- `assets/js/direct-order-store.js`: lokale opslag, validatie, migratie en ID-beheer voor losse bestellingen
- `assets/js/order-page.js`: maakt nieuwe losse bestellingen aan en toont bestaande lokale orders
- `assets/js/order-detail-page.js`: bewerkt titel, omschrijving, aantal personen en snacks per persoon van één lokale order met autosave en live totaaloverzicht
- `assets/js/order-summary-page.js`: toont één losse bestelling als bestellijst met verdeling per persoon en totaallijst
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

## Opgeslagen rads

De frontend beheert meerdere opgeslagen rads volledig lokaal in de browser:

- `rad-van-patat-roulette-rads`: bevat alle opgeslagen rads inclusief naam, items en gebruiksmetadata;
- `rad-van-patat-actief-rad`: onthoudt welk rad op dit moment actief is;
- `rad-van-patat-roulette-snacks`: wordt alleen nog gelezen als legacy migratiebron voor oudere browsersessies zonder de nieuwe rad-collectie.

`index.html` en `group.html` gebruiken altijd het actieve rad. `wheels.html`
toont het overzicht van alle rads en `wheel.html?id=...` laat één rad bewerken.
Radnamen zijn verplicht en case-insensitief uniek binnen dezelfde browser.
Bezoekers kunnen op de detailpagina standaarditems aan- of uitzetten en extra
eigen items toevoegen.

De groepsbestelling gebruikt dezelfde actieve snackselectie als `index.html`. Na de laatste automatische spin wordt uitsluitend de voltooide bestelling lokaal bewaard onder `rad-van-patat-last-group-order`. Deelnemersnamen en bestellingen verlaten de browser niet. Snacknamen worden bij toevoegen, verwijderen en spinresultaten wel als genormaliseerde Analytics-eventparameter verstuurd.

## Losse bestellingen

Naast het groepsrad ondersteunt de frontend ook losse bestellingen zonder
rouletteflow. Via `order.html` maakt de bezoeker een nieuwe bestelling aan; de
pagina genereert direct een lokaal order-ID en stuurt daarna door naar
`order-detail.html?id=...`.

De detailpagina gebruikt `assets/js/direct-order-store.js` en bewaart orders
onder `rad-van-patat-orders` in localStorage. Elke order bevat:

- een lokale order-ID;
- een titel;
- een omschrijving;
- een aantal personen;
- een personenlijst met een eigen naam per persoon;
- een lijst snacks per persoon.

Via `order-summary.html?id=...` kan een losse bestelling daarna ook als
bestellijst worden bekeken, met dezelfde verdeling per persoon en
totaalweergave als bij het afgeronde groepsrad.

De detailpagina slaat wijzigingen automatisch op. Snacknamen worden bij het
opslaan genormaliseerd naar één ucfirst-vorm en hoeveelheden worden apart
bewaard, zodat `frikandel`, `Frikandel` en `FRIKANDEL` in het totaaloverzicht
als dezelfde snack worden samengenomen.

Deze losse bestellingen worden uitsluitend lokaal in de huidige browser
bewaard. Er is geen server-side opslag of synchronisatie tussen apparaten.

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
De roadmap toont maximaal 9 niet-afgeronde milestones tegelijk, gesorteerd op prioriteit en due date. Afgeronde milestones blijven daarnaast zichtbaar en tellen niet mee in die limiet. In de `Nu`-kolom toont de UI standaard de 3 nieuwste afgeronde milestones en kan de bezoeker oudere afgeronde milestones handmatig uitklappen.
