# Project Development Documentation & Context Logs

Welkom in de `.docs/` map. Deze map bevat project-specifieke documentatie, architectuurkeuzes en **Story Context Logs**.

Het doel van deze opzet is om te voorkomen dat context verloren gaat tijdens het wisselen tussen feature-branches, code-reviews soepeler te laten verlopen en AI-assistenten (zoals Antigravity CLI, Cursor, etc.) direct te voorzien van de juiste projectstatus en testinstructies.

---

## 🏗️ Conventies & Mappenstructuur

We trekken onze **Git branch-naming** en de **Conventional Commits** standaard (v1.0.0) direct door in de mappenstructuur van de documentatie.

### 1. Git Branch Naming
Wanneer je een nieuwe branch aanmaakt, gebruik je altijd de structuur: `[TYPE]/[STORY-NUMMER]-[korte-beschrijving]`.

### 2. Mappenstructuur
Binnen `.docs/stories/` maken we mappen aan die matchen met het `[TYPE]` van je branch:

```text
.docs/
├── README.md               # Dit bestand
└── stories/                # Actieve context logs per ticket
    ├── feat/               # Nieuwe functionaliteiten (bijv. feat/TMS-1234)
    ├── fix/                # Bugfixes (bijv. fix/TMS-5678)
    ├── perf/               # Performance optimalisaties (bijv. perf/TMS8-4466)
    └── refactor/           # Code refactoring (bijv. refactor/TMS-1111)
```
---
