# Status van 29: Groepsbestelling met gedeeld Rad van Patat

## 🤖 AI Session Metadata
- **Model:** GPT-5 Codex
- **Agent/Tool:** Codex
- **Conversation ID:** niet-beschikbaar-in-deze-sessie

---

Dit bestand documenteert waar we zijn gebleven met de implementatie van de groepsbestelling.

## 🔍 Huidige Status
`src/frontend/group.html` configureert een groep, ondersteunt optionele namen en individuele snackaantallen en draait het bestaande SVG-rad automatisch totdat iedere deelnemer zijn of haar doel heeft bereikt. De wielanimatie valt terug op een CSS-transitie wanneer een browser SVG Web Animations weigert. De voltooide bestelling wordt op dezelfde pagina getoond en indien beschikbaar gevalideerd in localStorage opgeslagen, waarna `src/frontend/order.html` de laatste order kan herstellen. Externe en directe bezoekers van `index.html` krijgen maximaal eens per 24 uur eerst de keuze tussen het groepsrad en het persoonlijke rad.

### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?
- **Geen visuele browsertest in deze sessie:** De ingebouwde browserruntime rapporteerde dat geen browser beschikbaar was.
  - *Oplossing/Workaround:* Start de lokale server en controleer `group.html` handmatig op desktop en mobiel; de JavaScript-syntax, HTTP-resources en pure businessregels zijn wel geautomatiseerd gecontroleerd.
- **Browseropslag kan uitgeschakeld zijn:** Privacy-instellingen kunnen toegang tot localStorage blokkeren.
  - *Oplossing/Workaround:* De groepsbestelling wordt wel voltooid en op `group.html` getoond; alleen het later herstellen via `order.html` is dan niet beschikbaar.

---

## 🛠️ Wat is er gewijzigd?

### Frontend (HTML / CSS / Vanilla JavaScript)
- `src/frontend/group.html`: Nieuwe groepsconfiguratie, gedeeld rad, voortgang, voltooiingsmodal en geïntegreerde bestellijst.
- `src/frontend/order.html`: Nieuwe pagina die de laatst voltooide lokale bestelling toont.
- `src/frontend/components/roulette-wheel-view.js`: De wielmarkup uit `index.html` geëxtraheerd zodat het gewone en het groepsrad exact dezelfde view gebruiken.
- `src/frontend/components/order-summary.js`: Herbruikbare, XSS-veilige weergave voor persoonlijke snackverdelingen en het totaaloverzicht.
- `src/frontend/assets/js/roulette-wheel.js`: Promise-gebaseerde `spinRandom`- en `spinToSegment`-API toegevoegd met een CSS-fallback voor browsers die SVG-keyframes via Web Animations weigeren. De drag-ghost is optioneel, zodat `group.html` kan spinnen zonder de verwijderinteractie van `index.html` te dupliceren.
- `src/frontend/assets/js/group-order-engine.js`: Pure regels voor deelnemers, persoonlijke doelen, selectie en toewijzing.
- `src/frontend/assets/js/group-order-store.js`: Versiebeheer, validatie en fouttolerante localStorage-opslag voor uitsluitend voltooide orders.
- `src/frontend/assets/js/group-order-page.js`: Pagina-controller voor de automatische opeenvolgende spins met technische foutregistratie en een gebruikersvriendelijke herstelmelding.
- `src/frontend/assets/js/order-page.js`: Herstelt de laatste gevalideerde bestelling voor `order.html`.
- `src/frontend/assets/js/roulette-visit-choice.js`: Isoleert de referrercontrole en de 24-uursregistratie via cookie met localStorage-fallback.
- `src/frontend/assets/js/roulette-ui.js` en `roulette-init.js`: Tonen de dagelijkse keuze vóór de bestaande friet/patat-vraag en sturen groepsbezoekers door naar `group.html`.
- `src/frontend/components/site-header.js`: Herbruikbare navigatie uitgebreid met `Groepsrad`.
- `src/frontend/assets/css/default.css`: Responsive groeps-, bestellijst- en bezoekkeuzestyling toegevoegd.
- `tests/group-order.test.mjs`: Tests voor selectie, limieten, voltooiing en veilige of geblokkeerde opslag toegevoegd.
- `tests/roulette-wheel.test.mjs`: Regressietest toegevoegd voor browsers die `SVGElement.animate()` aanbieden maar SVG-transform-keyframes weigeren en voor hergebruik zonder `#snack-drag-ghost`.
- `tests/visit-choice.test.mjs`: Dekt interne en externe referrers, de rollende 24-uursperiode en beide opslagvormen af.

### Backend (Yii Applicatie / PHP)
- Geen backendwijzigingen; de volledige flow blijft statisch en browser-lokaal.

### Docker / Environment / Database
- Geen database of extra runtime toegevoegd.
- `package.json`: `npm test` gebruikt de ingebouwde Node.js test runner en vereist geen dependencies.

---

## 📝 Activity Log (AI & Human)
- [2026-07-23] (AI): feat(group-order): groepsrad, automatische verdeling en lokale bestellijst toegevoegd
- [2026-07-23] (AI): fix(group-order): SVG-animatiefallback en fouttolerante browseropslag toegevoegd
- [2026-07-23] (AI): fix(group-order): optionele drag-ghost blokkeert groepsspins niet langer
- [2026-07-23] (AI): feat(index): dagelijkse keuze tussen groepsrad en persoonlijk rad toegevoegd

---

## 🚀 De test / het werk hervatten

1. **Start de statische frontend**:
   ```bash
   php -S 127.0.0.1:8000 -t src/frontend
   ```
2. **Open de groepspagina**:
   Ga naar `http://127.0.0.1:8000/group.html`.
3. **Controleer de verdeling**:
   Stel verschillende persoonlijke snackaantallen in, start het rad en verifieer dat niemand meer snacks krijgt dan ingesteld.
4. **Controleer het herstel**:
   Open na voltooiing `http://127.0.0.1:8000/order.html` in dezelfde browser.
5. **Draai de geautomatiseerde tests**:
   ```bash
   npm test
   ```

---

## 📌 Best Practices voor het Team

* **Eén rad:** Wijzig de wielmarkup alleen in `roulette-wheel-view.js` en de animatielogica alleen in `roulette-wheel.js`.
* **Opslagcontract:** Verhoog `GROUP_ORDER_VERSION` wanneer de persistente orderstructuur incompatibel verandert.
* **Privacy:** Voeg geen synchronisatie of URL-serialisatie van persoonsnamen toe zonder expliciete privacyafweging.
