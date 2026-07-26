# Status van 21: GDPR- en cookietoestemming

## 🤖 AI Session Metadata
- **Model:** GPT-5.6
- **Agent/Tool:** Codex
- **Conversation ID:** 019f9e75-c536-79d1-a3f6-a02fe106cdbe

---

Dit bestand documenteert de implementatie van GDPR- en cookietoestemming voor Rad van Patat.

## 🔍 Huidige Status

 CookieConsent 3.1.0 is als self-hosted MIT-library toegevoegd. De gedeelde head initialiseert de consentlaag op iedere frontendpagina voordat de Analytics-adapter en applicatiecode starten, maar gebruikt daarbij niet langer de verouderde parser-write-aanpak voor externe scripts. Google Analytics wordt uitsluitend op de exacte hostname `radvanpatat.nl` en pas na expliciete toestemming geïnitialiseerd; localhost, IP-adressen, `www`, preview-subdomeinen en andere deployments maken zelfs geen lokale `dataLayer` of `gtag`-functie aan. Daarnaast ondersteunt de frontend nu meerdere lokaal opgeslagen rads via `wheels.html` en `wheel.html`: bezoekers kunnen een verplicht uniek rad aanmaken, alle rads in een overzicht bekijken, een rad als huidig rad instellen en per rad items toevoegen of verwijderen. Ook ondersteunt de site nu losse bestellingen via `order.html`, `order-detail.html` en `order-summary.html`, inclusief een lokaal order-ID, titel, omschrijving, een plus/min-knop voor het aantal personen, een eigen naam per persoon, snacks per persoon met aparte hoeveelheden, autosave, ucfirst-normalisatie van snacknamen en een apart bestellijstoverzicht met totaaloverzicht. De centrale opslaginventaris in `src/frontend/assets/js/cookie-consent.js` dekt nu ook de nieuwe localStorage-sleutels voor de radcollectie en losse bestellingen. Alle 56 geautomatiseerde tests slagen en de gewijzigde JavaScriptbestanden zijn syntactisch geldig.

### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?

- **Google Analytics-retentie is deels een beheerdersinstelling:** de cookielevensduur wordt in code begrensd op maximaal 13 maanden, maar de retentie van gebruikers- en eventgegevens moet ook in de GA4-property worden ingesteld.
  - *Oplossing/Workaround:* Controleer in Google Analytics onder Beheer → Gegevensinstellingen → Gegevensbewaring dat de gewenste termijn is ingesteld en beoordeel of “resetten bij nieuwe activiteit” past bij het privacybeleid.

---

## 🛠️ Wat is er gewijzigd?

### Frontend (HTML/CSS/JavaScript)

- `src/frontend/assets/js/cookie-consent.js`: centrale inventaris voor noodzakelijke cookies, lokale opslag en Google Analytics toegevoegd; de inventaris genereert automatisch de cookietabellen en een nieuwe consentrevisie.
- `src/frontend/assets/js/cookie-consent.js`: Google Analytics opt-in-loading, intrekken van toestemming, `_ga`-cookieverwijdering, beperkte cookieduur en uitgeschakelde advertentiesignalen toegevoegd.
- `src/frontend/assets/js/cookie-consent.js`: `isGoogleAnalyticsHostname()` en `initializeGoogleAnalyticsQueue()` beperken zowel de lokale Google-bootstrap als het externe script tot de exacte productiehostname `radvanpatat.nl`.
- `src/frontend/assets/js/cookie-consent.js`: CookieConsent initialiseert nu pas na `DOMContentLoaded`, omdat de library modalmarkup in `document.body` injecteert en anders in de head-fase op `null` kon crashen.
- `src/frontend/assets/js/cookie-consent.js`: consentteksten en opslagbeschrijvingen toegevoegd voor Nederlands, Engels, Spaans, Pools en Duits.
- `src/frontend/assets/js/cookie-consent.js`: nieuwe localStorage-sleutels voor de opgeslagen radcollectie en het actieve rad toegevoegd aan de noodzakelijke opslaginventaris.
- `src/frontend/assets/js/cookie-consent.js`: de nieuwe localStorage-sleutel voor losse bestellingen toegevoegd aan de noodzakelijke opslaginventaris.
- `src/frontend/assets/js/analytics.js`: events worden alleen nog verstuurd wanneer CookieConsent expliciet bevestigt dat de categorie `analytics` is geaccepteerd.
- `src/frontend/assets/js/roulette-core.js`: de oude enkelvoudige snackopslag omgebouwd naar een lokale store met meerdere opgeslagen rads, een actief rad, legacy-migratie en verplichte case-insensitief unieke radnamen.
- `src/frontend/assets/js/roulette-wheel.js`: persoonlijke spins verhogen nu de gebruiksteller van het actieve rad.
- `src/frontend/assets/js/roulette-init.js`: sneltoets `Shift+L` toegevoegd om direct naar het radoverzicht te navigeren.
- `src/frontend/assets/js/wheel-list-page.js`: overzichtspagina toegevoegd voor sorteren, activeren, delen en aanmaken van opgeslagen rads.
- `src/frontend/assets/js/wheel-detail-page.js`: detail- en bewerkpagina toegevoegd voor naambeheer, itemselectie en eigen snacks per rad.
- `src/frontend/assets/js/wheel-detail-page.js`: eigen items kunnen nu definitief uit de lijst worden verwijderd; de hoofdacties en itemacties hebben expliciete hoverstates gekregen.
- `src/frontend/assets/js/direct-order-store.js`: nieuwe lokale store toegevoegd voor losse bestellingen met order-ID's, validatie, migratie van legacy-itemlijsten en browserpersistatie per persoon.
- `src/frontend/assets/js/order-page.js`: `order.html` omgebouwd naar bestelstartpagina voor losse bestellingen en lokaal orderoverzicht.
- `src/frontend/assets/js/order-detail-page.js`: detailpagina toegevoegd voor titel, omschrijving, plus/min-aantal personen, persoonsnamen, autosave, live totaaloverzicht en compacte snackregels met naam plus hoeveelheid.
- `src/frontend/assets/js/order-summary-page.js`: nieuwe overzichtspagina toegevoegd die een losse bestelling rendert met dezelfde bestellijstopmaak als het groepsrad.
- `src/frontend/order.html`: herbestemd naar losse bestelstartpagina en gekoppeld aan het winkelmandje in het menu.
- `src/frontend/order-detail.html`: nieuwe noindex-detailpagina toegevoegd voor lokale losse bestellingen.
- `src/frontend/order-summary.html`: nieuwe noindex-overzichtspagina toegevoegd voor de bestellijst van één losse bestelling.
- `src/frontend/components/order-summary.js`: samenvattingscomponent parametriseerbaar gemaakt zodat dezelfde UI zowel groepsbestellingen als losse bestellingen kan tonen.
- `src/frontend/components/order-summary.js`: hoeveelheden en totaaltellingen laten nu identieke snacknamen met afwijkende casing in één gezamenlijke rij samenkomen.
- `src/frontend/wheels.html`: nieuwe openbare overzichtspagina met SEO-metadata en gedeelde layoutcomponenten toegevoegd.
- `src/frontend/wheel.html`: nieuwe openbare detailpagina met SEO-metadata en gedeelde layoutcomponenten toegevoegd.
- `src/frontend/components/site-head.js`: de directe Google-tag verwijderd en vervangen door de self-hosted consentlibrary en consentconfiguratie.
- `src/frontend/components/site-head.js`: gedeelde head-assets worden nu via DOM-insertie en geordende dynamische scripts geladen, zodat browserwaarschuwingen over cross-site parser-blocking scripts verdwijnen.
- `src/frontend/components/site-header.js`: navigatie uitgebreid met “Mijn rads”.
- `src/frontend/components/site-header.js`: navigatie uitgebreid met een winkelmandje-link naar `order.html`.
- `src/frontend/index.html`: het actieve rad wordt nu zichtbaar getoond en linkt naar het nieuwe beheer.
- `src/frontend/index.html`: de hoofdmenulink `Rad` verwijst weer naar `./index.html` zodat bezoekers altijd de volledige roulettepagina openen.
- `src/frontend/help.html`: helpnavigatie en FAQ uitgebreid met de nieuwe radbeheerflow.
- `src/frontend/sitemap.xml`: de nieuwe pagina’s `wheels.html` en `wheel.html` toegevoegd.
- `src/frontend/components/site-footer-designed-by.js`: een permanente, toetsenbordbedienbare knop toegevoegd waarmee toestemming kan worden ingetrokken of gewijzigd.
- `src/frontend/assets/css/default.css`: CookieConsent gekoppeld aan de bestaande designkleuren, typografie, focusstijl en responsive modalopmaak.
- `src/frontend/assets/vendor/cookieconsent/`: de officiële distributie en MIT-licentie van CookieConsent 3.1.0 toegevoegd voor self-hosting.
- `tests/cookie-consent.test.mjs`: regressietests toegevoegd voor opt-in, intrekken, automatische revisie, cookietabellen, vijf talen, de instellingenknop, ontbrekende project-eigen opslagsleutels en production-only Analytics.
- `tests/cookie-consent.test.mjs`: extra regressietest toegevoegd die afdwingt dat CookieConsent pas start nadat `document.body` beschikbaar is.
- `tests/analytics-events.test.mjs`: Analytics-tests uitgebreid met expliciete consentstatus.
- `tests/site-head.test.mjs`: het gedeelde head-contract aangepast zodat de scriptvolgorde behouden blijft zonder `document.write()` en een directe Google-tag vóór toestemming wordt afgekeurd.
- `tests/wheel-store.test.mjs`: regressietests toegevoegd voor legacy-migratie, naamuniekheid, actieve-radpersistatie, share-linkoverride en gebruikstellers.
- `tests/direct-order-store.test.mjs`: regressietests toegevoegd voor het aanmaken, bijwerken, migreren en valideren van losse lokale bestellingen.
- `tests/order-summary-page.test.mjs`: regressietests toegevoegd voor de samenvattingskop en navigatie van losse bestellijsten.
- `tests/direct-order-store.test.mjs`: extra regressietests toegevoegd voor ucfirst-normalisatie van snacknamen en hoeveelheidsgestuurde totaalsortering.
- `src/frontend/README.md`: beheerinstructies toegevoegd voor nieuwe opslag, nieuwe diensten, intrekken van toestemming en GA4-propertyinstellingen.
- `CHANGELOG.md`: de meertalige cookiemelding en consent-gated Analytics vastgelegd onder `[Onuitgebracht]`.
- `src/frontend/changelog.html`: opnieuw gegenereerd vanuit `CHANGELOG.md`, inclusief de bijgewerkte gedeelde head en nieuwe privacy-items.

### Backend

Niet van toepassing; de website is een statische frontend.

### Docker / Environment / Database

- `package.json` en `package-lock.json`: `vanilla-cookieconsent` 3.1.0 exact vastgezet voor reproduceerbare dependency-audits.

---

## 📝 Activity Log (AI & Human)

- 2026-07-26 (Codex): feat(privacy): add consent-gated analytics and generated cookie inventory
- 2026-07-26 (Codex): test(privacy): cover opt-in, withdrawal, translations and inventory revisions
- 2026-07-26 (Codex): docs(privacy): document consent maintenance and regenerate changelog
- 2026-07-26 (Codex): test(privacy): verify 40 tests, JavaScript syntax and dependency audit
- 2026-07-26 (Codex): fix(analytics): restrict Google Analytics initialization to radvanpatat.nl
- 2026-07-26 (Codex): fix(consent): delay CookieConsent bootstrap until body exists and remove parser-write head loading
- 2026-07-26 (Codex): feat(wheels): add saved wheel overview, detail editing and active wheel persistence
- 2026-07-26 (Codex): fix(navigation): point the Rad menu item back to the roulette page
- 2026-07-26 (Codex): fix(wheels): allow deleting custom wheel items and restore hover feedback on detail actions
- 2026-07-26 (Codex): feat(order): add direct order flow with local order detail editing and cart navigation
- 2026-07-26 (Codex): feat(order): model direct orders per person with editable names and snacks
- 2026-07-26 (Codex): feat(order): add direct-order summary page with per-person and total overview
- 2026-07-26 (Codex): feat(order): autosave direct orders with compact quantity inputs and live totals

---

## 🚀 De test / het werk hervatten

1. **Dependencies installeren**:

   ```bash
   npm install
   ```

2. **Geautomatiseerde tests uitvoeren**:

   ```bash
   npm test
   ```

3. **Frontend lokaal serveren**:

   ```bash
   php -S 127.0.0.1:8080 -t src/frontend
   ```

4. **In de browser controleren**:
   Open `http://127.0.0.1:8080`, maak via `wheels.html` minimaal twee rads aan, stel er één actief in en controleer op `index.html` en `group.html` dat steeds de items van het actieve rad worden gebruikt. Open daarna `wheel.html?id=...` om naam en items aan te passen en bevestig dat dubbele radnamen worden geweigerd. Open vervolgens `order.html`, maak een nieuwe losse bestelling aan, gebruik op `order-detail.html?id=...` de plus/min-knoppen voor het aantal personen, wijzig namen en snacks en controleer dat wijzigingen zonder handmatige opslag bewaard blijven. Controleer daarnaast dat het live totaaloverzicht aantallen aflopend sorteert en `frikandel`, `Frikandel` en `FRIKANDEL` in één rij samenneemt. Klik daarna op `Bestellijst bekijken` en controleer op `order-summary.html?id=...` dat de weergave dezelfde verdeling-per-persoon en totaallijst gebruikt als het groepsrad-overzicht. Controleer tenslotte dat er ook ná het accepteren van Analytics lokaal geen `dataLayer`, `gtag`, request naar `googletagmanager.com` of `_ga`-cookie bestaat. Herhaal op `radvanpatat.nl`: daar mag het Google-request uitsluitend na toestemming verschijnen.

---

## 📌 Best Practices voor het Team

- **Nieuwe browseropslag:** voeg iedere nieuwe cookie of localStorage-sleutel toe aan `storageInventory` in `src/frontend/assets/js/cookie-consent.js`; de tabellen en consentrevisie volgen dan automatisch.
- **Nieuwe radfuncties:** verander lokale radstructuren altijd via de storefuncties in `src/frontend/assets/js/roulette-core.js`, zodat naamvalidatie, legacy-migratie en actieve-radpersistatie centraal blijven.
- **Nieuwe niet-noodzakelijke diensten:** registreer scripts onder een expliciete CookieConsent-categorie en laad ze nooit rechtstreeks vanuit een HTML-pagina of `site-head.js`.
- **Commit gedrag:** neem updates aan dit statusbestand mee in de reguliere featurecommit.
- **Traceerbaarheid:** gebruik de Conversation ID bovenaan om de bijbehorende Codex-sessie terug te vinden.
