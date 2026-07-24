# Status van 72: Sitemap voor zoekmachines

## 🤖 AI Session Metadata
- **Model:** GPT-5 Codex
- **Agent/Tool:** Codex
- **Conversation ID:** Niet beschikbaar in de Codex-runtime

---

Dit bestand documenteert waar we zijn gebleven met de implementatie van een sitemap voor zoekmachines.

## 🔍 Huidige Status
De statische frontend publiceert een XML-sitemap met alle canonieke pagina's die indexering toestaan. `robots.txt` verwijst crawlers naar de sitemap en een regressietest bewaakt dat de sitemap gelijk blijft lopen met de HTML-metadata. Alle 33 tests slagen; lokale HTTP-controles leveren voor beide bestanden status 200 en het juiste contenttype op.

### ⚠️ Bekende Problemen / Waar loop je nu tegenaan?
- **Search Console vereist handmatige registratie:** De sitemap wordt automatisch gepubliceerd, maar Google Search Console moet nog aan het domein worden gekoppeld.
  - *Oplossing/Workaround:* Dien na deployment `https://radvanpatat.nl/sitemap.xml` in via het onderdeel Sitemaps van Google Search Console.

---

## 🛠️ Wat is er gewijzigd?

### Frontend (statische HTML)
- `src/frontend/sitemap.xml`: Bevat de absolute canonical URLs van home, groepsrad, help, roadmap en changelog.
- `src/frontend/robots.txt`: Staat crawling toe en publiceert de absolute sitemaplocatie.
- `tests/sitemap.test.mjs`: Vergelijkt de sitemap met indexeerbare canonical HTML-pagina's en controleert de robots.txt-verwijzing.

### Documentatie
- `CHANGELOG.md`: Beschrijft de nieuwe zoekmachine-indexeringsondersteuning en voegt de bestaande dubbele sectie voor onuitgebrachte wijzigingen samen.
- `src/frontend/changelog.html`: Wordt opnieuw uit `CHANGELOG.md` gegenereerd.

---

## 📝 Activity Log (AI & Human)
- 2026-07-24 (Codex): feat: add sitemap for search engine indexing

---

## 🚀 De test / het werk hervatten

1. **Voer de tests uit**:
   ```bash
   npm test
   ```
2. **Controleer de sitemap na deployment**:
   Open `https://radvanpatat.nl/sitemap.xml` en controleer dat de server XML teruggeeft.
3. **Registreer de sitemap bij Google**:
   Dien `https://radvanpatat.nl/sitemap.xml` in via Google Search Console.

---

## 📌 Best Practices voor het Team

- Voeg alleen canonieke, indexeerbare URLs toe aan `src/frontend/sitemap.xml`.
- Werk de sitemap bij wanneer een publieke HTML-pagina wordt toegevoegd of van indexeringsstatus verandert.
- Gebruik geen handmatige `lastmod`-waarden wanneer deze niet betrouwbaar uit de content kunnen worden afgeleid.
