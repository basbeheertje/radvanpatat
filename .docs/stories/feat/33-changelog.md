# Status van 33: Changelogpagina en generator

## 🤖 AI Session Metadata
- **Model:** GPT-5 Codex
- **Agent/Tool:** Codex CLI
- **Conversation ID:** niet-beschikbaar-in-deze-sessie

---

Dit bestand documenteert waar we zijn gebleven met de implementatie van de changelogpagina en generator.

## 🔍 Huidige Status
De frontend heeft nu een markdown-gedreven changelogbron (`CHANGELOG.md`), een generator-script dat daar `src/frontend/changelog.html` van maakt, en een herbruikbaar web component voor changelog-artikelen.

### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?
- **Geen bestaande git-tag aanwezig:** De repository bevat op dit moment geen git-tags.
  - *Oplossing/Workaround:* Gebruik voorlopig de sectie `[Onuitgebracht]` in `CHANGELOG.md` totdat er een echte releasetag bestaat.

---

## 🛠️ Wat is er gewijzigd?

### Frontend (HTML / CSS / Vanilla JavaScript)
- `src/frontend/changelog.html`: Nieuwe changelogpagina, gegenereerd vanuit `CHANGELOG.md`.
- `src/frontend/components/changelog-entry.js`: Herbruikbaar web component toegevoegd voor release-artikelen.
- `src/frontend/components/register-components.js`: Registratie van het changelogcomponent toegevoegd.
- `src/frontend/assets/css/default.css`: Gedeelde changelogstyling toegevoegd voor hero, tijdlijn, cards en CTA.
- `src/frontend/README.md`: Documentatie uitgebreid met changelogpagina en generatorscript.

### Backend (Yii Applicatie / PHP)
- Geen backendwijzigingen.

### Docker / Environment / Database
- `scripts/generate-changelog-html.mjs`: Handmatig script toegevoegd dat `src/frontend/changelog.html` uit `CHANGELOG.md` opbouwt.
- `.agents/skills/changelog/SKILL.md`: Workflow aangepast zodat wijzigingen eerst in `CHANGELOG.md` landen en daarna in de gegenereerde frontendpagina.

---

## 📝 Activity Log (AI & Human)
- [2026-07-23] (AI): feat(changelog): markdown-gedreven changelogpagina, generator en skill-workflow toegevoegd

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
