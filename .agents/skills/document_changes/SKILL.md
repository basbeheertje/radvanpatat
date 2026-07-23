---
name: document_changes
description: Houdt na significante wijzigingen een status- en contextlogbestand bij in .docs/stories/ conform de projectconventies.
---

# Project Development Documentation & Context Logs

De `.docs/` map. Deze map bevat project-specifieke documentatie, architectuurkeuzes en **Story Context Logs**.

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

## Prompt

 Je bent een senior full-stack developer en software architect. We werken binnen dit project met Conventional Commits en Git branch-naming zoals 'feat/branch-naam', 'fix/branch-naam' of 'perf/branch-naam'.

 Om de context te behouden bij het wisselen van branches en om later documentatie te kunnen genereren, houden we per story een 'Context & State Log' bij in Markdown.

 Locatie van het bestand: .docs/stories/[TYPE]/[STORY-NUMMER]-[korte-beschrijving].md
 (Bijvoorbeeld: .docs/stories/perf/TMS8-4466-mercure-sse-test.md)

 Jouw taak:
 1. Bepaal de huidige branch-naam (gebruik een git-commando om de actieve branch te achterhalen).
 2. Als het bestand `.docs/stories/[TYPE]/[STORY-NUMMER]-[korte-beschrijving].md` nog niet bestaat op deze branch, maak het aan op basis van onderstaand template.
 3. Vul BOVENAAN direct de AI-metadata in (gebruik de actieve Conversation ID en de modelnaam uit de huidige chatsessie). Dit is cruciaal voor de traceerbaarheid.
 4. Na ELKE significante wijziging (FE/BE logica, database, docker, etc.) update je dit bestand.
 5. Wees extreem specifiek: noem exacte bestandsnamen en indien relevant regelnummers of methodes.
 6. Update de 'Huidige Status' en 'Bekende Problemen' zodra we tegen bugs of blockers aanlopen (bijv. caching, poort-conflicten, 401 errors).

 Gebruik exact dit template:
 ---
 # Status van [STORY-NUMMER]: [Titel van de Story]

 ## 🤖 AI Session Metadata
 - **Model:** [Bijv. Gemini 3.5 Flash / GPT-4o]
 - **Agent/Tool:** [Bijv. Antigravity CLI / Cursor]
 - **Conversation ID:** [Vul hier het unieke UUID / de ID van deze chatsessie in]

 ---

 Dit bestand documenteert waar we zijn gebleven met de implementatie van [Titel].

 ## 🔍 Huidige Status
 [Korte, concrete samenvatting van de huidige status van de applicatie en de werking op dit moment]

 ### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?
 - **[Probleem, bijv. Browser Caching]:** [Omschrijving waarom het gebeurt]
   - *Oplossing/Workaround:* [Hoe de developer dit nu lokaal kan omzeilen of oplossen]

 ---

 ## 🛠️ Wat is er gewijzigd?

 ### Frontend ([Taal/Framework])
 - `[pad/naar/bestand.js]`: [Specifieke wijziging]

 ### Backend (Yii Applicatie / PHP)
 - `[pad/naar/Component.php]`: [Welke klassen/controllers/helpers zijn toegevoegd of aangepast]

 ### Docker / Environment / Database
 - `[pad/naar/docker-compose.yml]`: [Nieuwe containers of database migraties]

 ---

 ## 📝 Activity Log (AI & Human)
 - [YYYY-MM-DD] ([Developer/AI]): [Conventional Commit stijl omschrijving, bijv: perf(api): query-optimalisatie doorgevoerd]

 ---

 ## 🚀 De test / het werk hervatten

 Als je het werk of de test later wilt hervatten, volg dan deze stappen:

 1. **[Stap 1, bijv. Hosts file / Database migratie]**:
    [Uitleg + code block indien nodig]
 2. **[Stap 2, bijv. Docker herstart]**:
    ```bash
    [commando]
 3. **[Stap 3, code wijziging bijv PHP]**:
    ```PHP
    [code]
 4. **[Stap 4, bijv. Hoe te controleren / testen in de browser]**:
    Uitleg waar te kijken, welke logs te controleren

    ---

    ## 📌 Best Practices voor het Team

    * **Commit gedrag:** Neem updates aan het `.md` bestand gerust mee in je reguliere commits (bijvoorbeeld met de commit message: `docs(stories): update log state voor FEAT-XXXX`).
    * **Traceerbaarheid:** De *Conversation ID* in de metadata is goud waard. Mocht een collega (of jijzelf over een paar maanden) de logica niet snappen, dan kun je hiermee direct de volledige chatsessie in de AI-tool terugzoeken.
    * **Code Reviewers:** Ben je assigned op een Pull Request? Open altijd eerst het bijbehorende `.md` bestand in `.docs/stories/`. Je ziet direct hoe je de branch lokaal opstart en waar de eventuele bottlenecks zitten, wat je bakken met tijd scheelt tijdens het reviewen.