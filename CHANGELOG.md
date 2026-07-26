# Changelog

Alle belangrijke wijzigingen per gepubliceerde versie.

## [1.0.6] - 2026-07-24

Geen wijzigingen beschreven.

### Gewijzigd
- Fixed: Roulette rad on mobile devices;
- Fixed: Hide some buttons on mobile devices;
## [Onuitgebracht]

### Toegevoegd
- Bezoekers kunnen noodzakelijke en analytische opslag bekijken en Analytics apart accepteren of weigeren in een toegankelijke cookiemelding met vijf talen.
- Cookievoorkeuren kunnen onderaan iedere pagina opnieuw worden geopend en ingetrokken.
- Bezoekers kunnen nu meerdere rads lokaal opslaan, een overzicht en detailpagina openen, een rad als huidig rad instellen en per rad items toevoegen of verwijderen.
- Bezoekers kunnen nu ook zonder rouletteflow een losse bestelling starten via het winkelmandje in het menu en die daarna lokaal verder invullen op een orderdetailpagina.
- Losse bestellingen ondersteunen nu net als het groepsrad een personenoverzicht met een eigen naam en snacks per persoon.
- Iedere losse bestelling heeft nu ook een aparte bestellijstpagina met dezelfde verdeling-per-persoon en totaallijst als het groepsrad.
- Losse bestellingen slaan nu automatisch op, tonen op de detailpagina direct een totaaloverzicht op basis van hoeveelheden en gebruiken compacte snackregels met naam plus aantal.

### Beveiliging
- Google Analytics wordt uitsluitend op `radvanpatat.nl` en pas na expliciete toestemming geladen; lokale en preview-omgevingen initialiseren Analytics niet, en bij intrekken worden verdere metingen geblokkeerd en bekende Analytics-cookies verwijderd.

### Opgelost
- De menulink ‘Rad’ opent weer de volledige roulettepagina in plaats van alleen naar een anker op de huidige pagina te springen.
- Op de rad-detailpagina kunnen eigen items nu echt uit de lijst worden verwijderd en reageren de actieknoppen zichtbaar op hover.
- De gedeelde head laadt externe scripts niet langer via de verouderde parser-write-aanpak, waardoor browserwaarschuwingen verdwijnen en Tailwind/CDN-assets toekomstbestendig blijven laden.
- De cookiemelding initialiseert nu pas nadat de document-body beschikbaar is, zodat de consentmodal niet meer crasht tijdens het parsen van de head.
- De GitHub Pages-deployment wordt nu automatisch gestart nadat release-inhoud naar `main` is bijgewerkt.
- De changelog-skill bevat weer geldige YAML-frontmatter en kan daardoor door Codex worden geladen.

## [1.0.5] - 2026-07-24

Geen wijzigingen beschreven.

### Gewijzigd
- Added: Group wheel, automatic distribution, and local order list added
- Added: SVG animation fallback and fault-tolerant browser save
- Added: Daily choice between group wheel and personal wheel
- Added: Reusable opening intro for De Code Kas and Rad van Patat
- Added: Shift+C console and Harlem Shake command
- Added: Continuous synthesized beat and quit via Escape
- Added: Analytics
## [Onuitgebracht]

### Toegevoegd
- Alle pagina's gebruiken nu één gedeelde basis-head met consistente assets en Google Analytics-bezoekersmeting.
- De patat-banner blijft nu zichtbaar op iedere pagina voor bezoekers die eerder voor patat kozen.
- Keuzes, spins, snackresultaten, groepsaantallen, deelacties en easter eggs worden nu als afzonderlijke Google Analytics-gebeurtenissen gemeten.

## [1.0.4] - 2026-07-23

Geen wijzigingen beschreven.

### Gewijzigd
- Added: 404 page

## [1.0.3] - 2026-07-23

Geen wijzigingen beschreven.

### Gewijzigd
- Added: Roadmap;

## [1.0.2] - 2026-07-23

Geen wijzigingen beschreven.

### Gewijzigd
- Added: Changelog page

## [1.0.0] - 2026-07-23

Geen wijzigingen beschreven.

### Gewijzigd
- Added: New design for the spinningwheel;
- Added: An header with menu items;
- Added: An Logo to the header;
- Added: An build by floating button;
- Added: An build by footer;
- Added: An favicon;
- Added: An Share your list spinningwheel;
- Added: Question about "Is het friet of patat";
- Added: Toasts;
- Fixed: Duplicate snacknames;
- Added: Help page;
- Added: Custom Bamischijf image;
- Added: Custom Berenklauw image;
- Added: Custom Bitterbal image;
- Added: Custom Frikandel image;
- Added: Custom Kaassoufle image;
- Added: Custom Kipcorn image;
- Added: Custom: Kipnuggets image;
- Added: Custom Kroket image;
- Added: Custom Loempia image;
- Added: Custom Loempidel image;
- Added: Custom Mexicano image;
- Added: Custom Nasischijf image;
- Added: Custom Satekroket image;
- Added: Custom Viandel image;
