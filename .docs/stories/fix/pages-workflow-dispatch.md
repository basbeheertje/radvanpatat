# Status van pages-workflow-dispatch: GitHub Pages na release-updates starten

## 🤖 AI Session Metadata
- **Model:** GPT-5 Codex
- **Agent/Tool:** Codex
- **Conversation ID:** Niet beschikbaar in de Codex-runtime

---

Dit bestand documenteert de correctie waarmee een release-update ook de GitHub Pages-deployment start.

## 🔍 Huidige Status
De release-workflow pusht gegenereerde changelog- en roadmapbestanden naar `main` en start daarna expliciet `pages.yml` via `workflow_dispatch`. De workflow-YAML, dispatchvoorwaarden, generatorsyntax, skillfrontmatter en diff zijn lokaal gevalideerd.

### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?
- **Lokale validatorafhankelijkheid:** De meegeleverde `quick_validate.py` vereist PyYAML, dat niet in de huidige lokale Python-omgeving is geïnstalleerd.
  - *Oplossing/Workaround:* Dezelfde frontmattervoorwaarden zijn met Ruby gecontroleerd; installeer PyYAML om daarnaast de Python-validator te gebruiken.
- **Geen geautomatiseerde projecttests op `main`:** `package.json` bevat op deze branch geen `test`-script.
  - *Oplossing/Workaround:* Valideer de YAML, skillfrontmatter, generatorsyntax en diff afzonderlijk.

---

## 🛠️ Wat is er gewijzigd?

### GitHub Actions
- `.github/workflows/release-update-workflow.yml`: Houdt via een step-output bij of release-inhoud is gewijzigd en start daarna de bestaande Pages-workflow met `workflow_dispatch`.
- `.github/workflows/release-update-workflow.yml`: Geeft alleen de benodigde `actions: write`- en `contents: write`-rechten aan de release-workflow.

### Documentatie
- `.agents/skills/changelog/SKILL.md`: Herstelt de vereiste YAML-frontmatter zodat Codex de changelog-skill weer kan laden.
- `CHANGELOG.md`: Beschrijft dat GitHub Pages na een release-update automatisch wordt gestart.
- `src/frontend/changelog.html`: Wordt opnieuw uit `CHANGELOG.md` gegenereerd.

---

## 📝 Activity Log (AI & Human)
- 2026-07-24 (Codex): fix: dispatch GitHub Pages after updating release content
- 2026-07-24 (Codex): fix: restore changelog skill frontmatter

---

## 🚀 De test / het werk hervatten

1. **Controleer de workflow-syntax**:
   ```bash
   ruby -e 'require "yaml"; YAML.parse_file(".github/workflows/release-update-workflow.yml")'
   ```
2. **Controleer de skillfrontmatter**:
   ```bash
   ruby -e 'require "yaml"; content = File.read(".agents/skills/changelog/SKILL.md"); frontmatter = content.match(/\A---\n(.*?)\n---\n/m) or abort("missing frontmatter"); YAML.safe_load(frontmatter[1]); puts "Skill frontmatter is valid"'
   ```
3. **Controleer het gedrag op GitHub**:
   Publiceer of bewerk een release die gegenereerde bestanden wijzigt. Na `Update release content` moet `Deploy GitHub Pages` als `workflow_dispatch`-run verschijnen.

---

## 📌 Best Practices voor het Team

- Houd de expliciete dispatch in stand zolang de gegenereerde release-inhoud met `GITHUB_TOKEN` naar `main` wordt gepusht.
- Beperk de dispatch tot runs die daadwerkelijk een nieuwe release-contentcommit maken.
