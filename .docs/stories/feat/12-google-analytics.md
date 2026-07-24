# Status van 12: Gedeelde basis-head en Google Analytics

## 🤖 AI Session Metadata
- **Model:** GPT-5 Codex
- **Agent/Tool:** Codex
- **Conversation ID:** niet-beschikbaar-in-deze-sessie

---

Dit bestand documenteert waar we zijn gebleven met de implementatie van een gedeelde basis-head en Google Analytics.

## 🔍 Huidige Status
Alle top-level HTML-pagina's in `src/frontend/` behouden hun crawlergevoelige en pagina-eigen SEO-metadata en structured data, maar laden algemene browsermetadata, favicons, fonts, gedeelde styling, Tailwind, webcomponentregistratie en Google Analytics nu via `src/frontend/components/site-head.js`. De Analytics-configuratie gebruikt measurement-ID `G-FDRQ5JB0WX`. `src/frontend/assets/js/analytics.js` levert één fouttolerante GA4-adapter voor twaalf stabiele events rond friet/patat, moduskeuze, spins, snackresultaten, delen, easter eggs, groepsaantallen en snackmutaties. De changeloggenerators en het changelogtemplate verwijzen eveneens naar deze basis-head, zodat regeneratie de centrale architectuur behoudt. `src/frontend/components/patat-banner.js` mount daarnaast automatisch `#patat-banner` op iedere pagina en toont deze wanneer de sitebrede localStorage-keuze `patat` bevat.

### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?
- **Geen browserbackend beschikbaar in deze Codex-sessie:** De runtime kon geen in-app browser of Chrome-backend selecteren voor een visuele controle.
  - *Oplossing/Workaround:* Serveer `src/frontend` lokaal en controleer in DevTools of `site-head.js`, `default.css`, Tailwind en `gtag/js?id=G-FDRQ5JB0WX` laden zonder consolefouten.
- **Custom GA4-parameters vereisen beheerconfiguratie:** Eventparameters worden verzameld en zijn in Realtime/DebugView zichtbaar, maar verschijnen niet automatisch in gewone rapporten en Explorations.
  - *Oplossing/Workaround:* Registreer `snack_name`, `snack_source` en `spin_mode` als event-scoped custom dimensions en de telparameters als custom metrics in de GA4-property.

---

## 🛠️ Wat is er gewijzigd?

### Frontend (HTML / CSS / Vanilla JavaScript)
- `src/frontend/components/site-head.js`: Centrale parser-synchrone basis-head toegevoegd met algemene metadata, icons, fonts, CSS, Tailwind, componentregistratie en Google Analytics.
- `src/frontend/assets/js/analytics.js`: Centrale GA4-adapter toegevoegd met eventallowlist, primitieve parameterfiltering, naamvalidatie en een veilige no-op wanneer gtag wordt geblokkeerd.
- `src/frontend/components/patat-banner.js`: Zelfstandig component toegevoegd dat de opgeslagen friet-of-patatkeuze veilig leest en de patat-banner op iedere pagina mount.
- `src/frontend/components/register-components.js`: Sitebrede registratie van de patat-banner toegevoegd.
- `src/frontend/assets/js/roulette-core.js`: Fouttolerante brug van roulettecode naar de gedeelde Analytics-adapter toegevoegd.
- `src/frontend/assets/js/roulette-ui.js`: Patat/friet-, groep/persoonlijk- en deelmodal-events toegevoegd; bannerteksten en weergave-eigenaarschap naar het gedeelde component verplaatst.
- `src/frontend/assets/js/roulette-init.js`: Events toegevoegd voor succesvolle snacktoevoegingen en activatie van de eggs-modus.
- `src/frontend/assets/js/roulette-wheel.js`: Start- en resultaatevents voor persoonlijke en groepsspins toegevoegd, inclusief snacknaam en bron; verwijderde snacks worden eveneens gemeten.
- `src/frontend/assets/js/roulette-easter-eggs.js`: `harlem_shake_started` toegevoegd aan de daadwerkelijke effectstart.
- `src/frontend/assets/js/group-order-page.js`: `group_order_started` toegevoegd met alleen deelnemersaantal, gevraagd snacktotaal en beschikbare snackselectie; deelnemersnamen blijven lokaal.
- `src/frontend/assets/css/default.css`: Bestaande bannerweergave omgezet naar een herbruikbare componentklasse.
- `src/frontend/*.html`: Gedeelde head-regels vervangen door één verwijzing naar `./components/site-head.js`; crawlergevoelige SEO en JSON-LD blijven lokaal staan.
- `src/frontend/templates/changelog.html`: Changelogtemplate overgezet op de gedeelde basis-head.
- `src/frontend/README.md`: Onderhoudscontract van de basis-head en Analytics measurement-ID gedocumenteerd.
- `tests/site-head.test.mjs`: Regressietests toegevoegd voor gedeelde assets, Analytics en het head-contract van alle top-level pagina's.
- `tests/patat-banner.test.mjs`: Tests toegevoegd voor opslagvalidatie, berichtselectie en sitebrede componentregistratie.
- `tests/analytics-events.test.mjs`: Tests toegevoegd voor alle eventnamen, parameterfiltering, geblokkeerde analytics en koppeling aan de twaalf frontendflows.
- `tests/roulette-wheel.test.mjs` en `tests/easter-eggs.test.mjs`: Gedragstests uitgebreid met spin/resultaat- en Harlem Shake-events.

### Backend (Yii Applicatie / PHP)
- Geen backendwijzigingen; de website blijft volledig statisch.

### Docker / Environment / Database
- `scripts/generate-changelog-html.mjs`: Gegenereerde changelogpagina gebruikt voortaan de gedeelde basis-head.
- `scripts/generate-changelog.mjs`: Releasegenerator behoudt voortaan dezelfde gedeelde basis-head.
- Geen database, dependency of extra buildstap toegevoegd.

---

## 📝 Activity Log (AI & Human)
- [2026-07-24] (AI): feat(frontend): gedeelde basis-head en Google Analytics toegevoegd
- [2026-07-24] (AI): feat(frontend): patat-banner sitebreed beschikbaar gemaakt
- [2026-07-24] (AI): feat(analytics): interactie-, spin-, snack- en groepsgebeurtenissen toegevoegd

---

## 🚀 De test / het werk hervatten

1. **Draai de geautomatiseerde tests**:
   ```bash
   npm test
   ```
2. **Serveer de statische frontend**:
   ```bash
   php -S 127.0.0.1:8012 -t src/frontend
   ```
3. **Controleer de gedeelde head**:
   Open meerdere pagina's en controleer in DevTools dat `components/site-head.js` eenmaal laadt en dat titel, canonical en structured data per pagina verschillen.
4. **Controleer Analytics**:
   Verifieer in het Network-paneel dat `https://www.googletagmanager.com/gtag/js?id=G-FDRQ5JB0WX` wordt aangevraagd en dat de measurement-ID in de Analytics-debugweergave verschijnt.
5. **Controleer Analytics-events**:
   Activeer iedere gedocumenteerde interactie en controleer in GA4 DebugView de eventnamen en parameters. Registreer daarna de gewenste custom dimensions en metrics.
6. **Controleer de patat-banner**:
   Kies op `index.html` voor `Patat`, navigeer daarna naar meerdere andere pagina's en controleer dat `#patat-banner` zichtbaar blijft.
7. **Controleer changelogregeneratie**:
   ```bash
   node scripts/generate-changelog-html.mjs
   ```

---

## 📌 Best Practices voor het Team

* **Gedeelde head:** Voeg algemene browsermetadata en globale assets uitsluitend toe in `src/frontend/components/site-head.js`.
* **Analytics:** Voeg eventnamen en parametervalidatie alleen toe in `src/frontend/assets/js/analytics.js`; roep vanuit flows uitsluitend semantische eventkeys aan.
* **Privacy:** Stuur geen deelnemersnamen, afbeeldingen, URLs of volledige orderobjecten naar Analytics. Alleen genormaliseerde snacknamen en geaggregeerde aantallen zijn toegestaan.
* **Crawlergevoelige SEO:** Houd titel, description, keywords, robots, canonical, Open Graph/Twitter-metadata en JSON-LD in het betreffende HTML-bestand zodat crawlers geen JavaScript hoeven uit te voeren.
* **Patat-banner:** Pas opslaggedrag en bannerteksten alleen aan in `src/frontend/components/patat-banner.js`; pagina's krijgen de banner automatisch via `app.js`.
* **Generatoren:** Werk bij veranderingen aan het head-contract ook beide changeloggenerators en `src/frontend/templates/changelog.html` bij.
