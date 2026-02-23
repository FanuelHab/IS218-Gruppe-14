# IS218-Gruppe-14

## Prosjektnavn & TL;DR
**Nødhavn i Norge** – et enkelt webkart som viser et interaktivt kart med flere bakgrunnskart, eksempelmarkører med popups, og støtte for å vise egne datasett (GeoJSON) og eksterne karttjenester (WMS). Løsningen gjør det lett å utforske et område og skru lag av/på uten installasjon eller byggesteg.

## Demo av system
Legg inn en video eller GIF som viser:
1) at kartet laster, 2) at du bytter basemap i layer control, og 3) at du slår på/av datasett (GeoJSON/WMS) og åpner en popup.

- Video (anbefalt): `docs/demo.mp4`
- GIF (alternativ): `docs/demo.gif`

> Bytt ut lenkene under når demo-filen er lagt til i repoet.

**Demo (GIF):**

![Demo av kartløsningen](docs/demo.gif)

## Teknisk stack
- **Leaflet**: 1.9.4 (CDN via unpkg)
- **OpenStreetMap tiles**: standard OSM tile server (via Leaflet)
- **CartoDB Positron / Light**: Carto tile layer (via Leaflet)
- **WMS (OGC)**: GeoNorge Topo2 (ekstern karttjeneste)
- **JavaScript**: Vanilla JS (ingen build step)
- **HTML/CSS**: HTML5 + CSS3
- **Kjøring**: Statisk (åpne `index.html`) eller lokal webserver (Python/Node)

## Prosjektstruktur

```
.
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css      # Custom styles for the application
│   └── js/
│       └── app.js          # Map initialization and configuration
├── data/                   # Directory for GeoJSON files and data
│   └── README.md           # Guide for adding data
└── README.md               # This file
```

## Getting started

1. **Åpne applikasjonen**: Åpne `index.html` i en nettleser.
   - Ingen build-prosess eller server er nødvendig for enkel bruk.
   - For utvikling med filinnlasting (GeoJSON via `fetch`) bør du bruke lokal server.

2. **Kjør lokal server** (valgfritt, anbefalt for `fetch` av GeoJSON):
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js (with http-server installed)
   npx http-server
   ```
   Gå til `http://localhost:8000` i nettleseren.

## Bruk

- **Panorer kartet**: klikk og dra
- **Zoom**: musehjul eller +/- knappene
- **Layer control**: bruk lag-ikonet (typisk øverst til høyre) for å bytte bakgrunnskart og skru lag av/på
- **Popups**: klikk på markører/objekter

## Datakatalog
| Datasett | Kilde | Format | Bearbeiding |
|---|---|---|---|
| OpenStreetMap basemap | OpenStreetMap (tile provider) | Raster tiles (XYZ) | Ingen lokal bearbeiding; vises direkte som tile layer i Leaflet |
| CartoDB Light/Positron basemap | CARTO (tile provider) | Raster tiles (XYZ) | Ingen lokal bearbeiding; vises som alternativ basemap |
| `data/nodhavn.geojson` | Lokal fil i repo (`data/`) | GeoJSON | Lastes med `fetch`, rendres med `L.geoJSON`, evt. styling/popup-binding i `assets/js/app.js` |
| GeoNorge Topo2 | GeoNorge (OGC WMS) | WMS | Konsumeres direkte som WMS-layer i Leaflet; ingen lokal lagring |

## Arkitekturskisse (dataflyt)

```text
           +-------------------+
           |  Bruker (nettleser)|
           +---------+---------+
                     |
                     v
            +--------+---------+
            | index.html       |
            | - laster Leaflet |
            | - laster app.js  |
            +--------+---------+
                     |
                     v
          +----------+-----------+
          | assets/js/app.js     |
          | - init map           |
          | - base layers (OSM,  |
          |   Carto)             |
          | - data layers:       |
          |   * fetch GeoJSON    |
          |   * WMS (GeoNorge)   |
          +----------+-----------+
                     |
     +---------------+-------------------+
     |                                   |
     v                                   v
+----+------------------+      +---------+----------------+
| Lokal data (data/*.   |      | Ekstern karttjeneste     |
| geojson)              |      | (GeoNorge WMS Topo2)     |
+-----------------------+      +--------------------------+
                     |
                     v
              +------+------+
              | Leaflet map |
              | (render UI) |
              +-------------+
```

## Refleksjon (forbedringspunkter)
- **Bedre datadokumentasjon**: Legge inn eksakte kildelenker (URL) og evt. lisensinfo for alle eksterne lag, samt tydelig versjonering av egne datasett.
- **Feilhåndtering og robusthet**: Vise brukerfeedback ved nettverksfeil (f.eks. hvis GeoJSON/WMS ikke kan lastes) og fallback-løsninger.
- **Ytelse**: For større GeoJSON kan man bruke generalisering, clustering, eller vector tiles for raskere rendering.
- **UX og tilgjengelighet**: Forbedre kontrast, tastaturnavigasjon, og tydeligere legend/lag-navn; samt mobiltilpasning av kontroller.
- **Testing og CI**: Enkle tester (linting) og GitHub Actions for å sikre at statiske filer bygger/kjører uten feil.

## License
See LICENSE file for details.
