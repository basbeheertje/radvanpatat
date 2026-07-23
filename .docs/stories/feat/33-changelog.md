# Status van 33: Changelogpagina en generator

## 🤖 AI Session Metadata
- **Model:** GPT-5 Codex
- **Agent/Tool:** Codex CLI
- **Conversation ID:** niet-beschikbaar-in-deze-sessie

---

Dit bestand documenteert waar we zijn gebleven met de implementatie van de changelogpagina en generator.

## 🔍 Huidige Status
De frontend heeft nu een markdown-gedreven changelogbron (`CHANGELOG.md`), een generator-script dat daar `src/frontend/changelog.html` van maakt, een roadmappagina die via een array werkt, en een milestones-generator die die array bij releases kan verversen.

### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?
- **Geen bestaande git-tag aanwezig:** De repository bevat op dit moment geen git-tags.
  - *Oplossing/Workaround:* Gebruik voorlopig de sectie `[Onuitgebracht]` in `CHANGELOG.md` totdat er een echte releasetag bestaat.

---

## 🛠️ Wat is er gewijzigd?

### Frontend (HTML / CSS / Vanilla JavaScript)
- `src/frontend/changelog.html`: Nieuwe changelogpagina, gegenereerd vanuit `CHANGELOG.md`.
- `src/frontend/components/changelog-entry.js`: Herbruikbaar web component toegevoegd voor release-artikelen.
- `src/frontend/roadmap.html`: Nieuwe roadmappagina met dezelfde header, footer en branding als de rest van de site.
- `src/frontend/components/roadmap-board.js`: Herbruikbaar web component toegevoegd dat roadmap-cards uit een array groepeert per fase.
- `src/frontend/assets/js/roadmap-data.js`: Configureerbare array met titel, categorie, status, omschrijving, icoon en voortgang per card.
- `src/frontend/assets/js/roadmap-page.js`: Paginascript dat de roadmap-array aan het component koppelt.
- `src/frontend/components/register-components.js`: Registratie van het changelogcomponent toegevoegd.
- `src/frontend/assets/css/default.css`: Gedeelde changelogstyling toegevoegd voor hero, tijdlijn, cards en CTA.
- `src/frontend/README.md`: Documentatie uitgebreid met changelogpagina en generatorscript.

### Backend (Yii Applicatie / PHP)
- Geen backendwijzigingen.

### Docker / Environment / Database
- `scripts/generate-changelog-html.mjs`: Handmatig script toegevoegd dat `src/frontend/changelog.html` uit `CHANGELOG.md` opbouwt.
- `scripts/generate-roadmap.mjs`: Script toegevoegd dat GitHub milestones omzet naar de roadmap-array voor de frontend.
- `.agents/skills/changelog/SKILL.md`: Workflow aangepast zodat wijzigingen eerst in `CHANGELOG.md` landen en daarna in de gegenereerde frontendpagina.
- `.github/workflows/release-changelog.yml`: Release-workflow uitgebreid zodat ook de roadmap-data automatisch uit milestones wordt bijgewerkt.

---

## 📝 Activity Log (AI & Human)
- [2026-07-23] (AI): feat(changelog): markdown-gedreven changelogpagina, generator en skill-workflow toegevoegd
- [2026-07-23] (AI): feat(roadmap): roadmappagina, configureerbare array en milestone-generator toegevoegd

---

## 🚀 De test / het werk hervatten

1. **Changelogbron bijwerken**:
   Werk `CHANGELOG.md` bij onder de juiste versie of onder `[Onuitgebracht]`.
2. **HTML opnieuw genereren**:
   ```bash
   node scripts/generate-changelog-html.mjs
   ```
3. **Frontend lokaal serveren**:
   ```bash
   php -S 127.0.0.1:8000 -t src/frontend
   ```
4. **Controleren in de browser**:
   Open `http://127.0.0.1:8000/changelog.html` en controleer of de releasekaart, header, footer en CTA correct renderen.

---

## 📌 Best Practices voor het Team

* **Commit gedrag:** Neem updates aan `CHANGELOG.md`, `src/frontend/changelog.html` en deze story-log mee in dezelfde feature-commit.
* **Traceerbaarheid:** Houd `CHANGELOG.md` als bronbestand aan en laat `src/frontend/changelog.html` uitsluitend door het script genereren.
* **Code Reviewers:** Controleer bij changelogwaardige wijzigingen altijd of zowel `CHANGELOG.md` als de gegenereerde `src/frontend/changelog.html` zijn bijgewerkt.
