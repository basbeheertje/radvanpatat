# Frontend

Deze map bevat een statische frontend zonder build tooling.

## Structuur

- `index.html`: interactieve Rad van Patat-pagina
- `help.html`: help-pagina
- `components/`: herbruikbare web components voor layout
- `assets/css/default.css`: gedeelde en rad-specifieke styling
- `assets/js/`: roulettefunctionaliteit en componentregistratie
- `assets/images/` en `assets/sounds/`: statische media

## Gebruik

Serveer `src/frontend` direct via Apache of Nginx als document root, of als submap.

Er is geen `npm install` of buildstap nodig.
