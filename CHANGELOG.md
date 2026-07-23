# Changelog

Deze changelog houdt de belangrijkste zichtbare en onderhoudsrelevante wijzigingen van Rad van Patat bij.

## [Onuitgebracht] - 2026-07-23

Deze versie bundelt de eerste publieke changelog van de frontend en de tooling om die voortaan vanuit markdown te onderhouden.

### Toegevoegd

- Een aparte changelogpagina in `src/frontend` die dezelfde header, footer en brandingcomponenten gebruikt als de rest van de site.
- Een herbruikbaar changelog-artikelcomponent waarmee releases consequent en zonder duplicatie worden weergegeven.
- Een handmatig script toegevoegd waarmee `src/frontend/changelog.html` vanuit `CHANGELOG.md` wordt gegenereerd.

### Gewijzigd

- De changelog-skill dwingt nu af dat betekenisvolle wijzigingen in zowel `CHANGELOG.md` als het bijbehorende artikel in `src/frontend/changelog.html` terechtkomen.
