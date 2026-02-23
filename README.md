# IS218-Gruppe-14

## Prosjektnavn & TL;DR
Nødhavn i Norge – et webkart som lar Forsvaret (og andre beredskapsaktører) raskt finne nærmeste nødhavn ved å vise nødhavner på kart og gi enkel søk/valg av posisjon med avstand til nærmeste havn.

## GIF av systemet
![NdhavniNorge-Finnnrmestehavn-GoogleChrome2026-02-2318-36-45-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/1c21f08b-ea7a-4556-8557-ba171988fd6a)



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
   Then navigate to `http://localhost:8000` in your browser

### Usage

- **Pan the map**: Click and drag
- **Zoom**: Use mouse wheel or the +/- buttons
- **Layer Control**: Use the layers icon in the top-right corner to switch base maps
- **Popups**: Click on markers to see popup information

### Adding Data

#### GeoJSON Files

1. Place your GeoJSON files in the `data/` directory
2. Load them in `assets/js/app.js` using the fetch API
3. See `data/README.md` for examples

#### External APIs

You can easily integrate external geospatial APIs by fetching data and adding it to the map as layers.

### Datakatalog

Oversikt over datasett som brukes i applikasjonen:

| Datasett | Kilde | Format | Bearbeiding |
|----------|--------|--------|-------------|
| **Nødhavn (primær)** | Supabase-database (tabell `nodhavn`), prosjekt-URL: `https://gdkqqlbjpfuscqpdribx.supabase.co` | Tabell med kolonner: longitude, latitude, navn, kommune, fylke, kategori, lenke_faktaark, forvaltningsstatus, nodhavnnummer. Leveres via Supabase REST-API. | Hentes med `fetchNodhavnFromSupabase()`, konverteres til GeoJSON FeatureCollection med Point-geometri og properties; vises som sirkelmarkører med farge etter type (sivil/militær/fiskeri), popups med navn og øvrige felter. |
| **Nødhavn (fallback)** | Lokal fil i prosjektet: `data/nodhavn.geojson` | GeoJSON (FeatureCollection med Point-features og properties: name, type, description). | Brukes når Supabase ikke er tilgjengelig; lastes med `fetch('data/nodhavn.geojson')`, parses som JSON og brukes som GeoJSON-lag med samme styling og popups som primærkilde. |
| **Kartbakgrunn** | OpenStreetMap / Leaflet tile-tjenere (f.eks. OSM, CartoDB) | Rasterkart (PNG/JPG) via XYZ-tiles (HTTP). | Lastes og vises som bakgrunnskart i Leaflet; ingen videre bearbeiding av data. |

### Dataflyt – fra kilde til kart

- **Nødhavn:** Data kommer fra Supabase-tabellen `nodhavn` (eller fallback fra `data/nodhavn.geojson`). I `js/layers.js` hentes data med `fetchNodhavnFromSupabase()` eller ved feil med `fetch('data/nodhavn.geojson')`. Rader konverteres til GeoJSON FeatureCollection med punktgeometri og properties, deretter legges laget på Leaflet-kartet som sirkelmarkører med farge etter type og popups ved klikk.
- **Kartbakgrunn:** OpenStreetMap/Leaflet tile-URL brukes direkte av Leaflet; tiles lastes og vises som bakgrunnskart uten egen bearbeiding i appen.

### Forbedringspunkter ved nåværende løsning

- **Tilgjengelighet:** Kart og popups bør støtte tastaturnavigasjon og skjermleser (ARIA, fokusrekkefølge og beskrivende tekster) for å møte WCAG-bedre.
- **Brukertilbakemelding:** Ved lasting av data eller ved feil mangler det tydelig loading-indikator og feilmeldinger; brukeren vet ikke alltid om noe lastes eller har feilet.
- **Mobil:** Interaksjon (zoom, pan, klikk på markører) kan forbedres for touch med større treffflater og tydeligere tilstand (f.eks. valgt markør).
- **Søk og filtrering:** Det finnes ingen søk eller filter på nødhavn (fylke, type, kommune); slike funksjoner ville gjort det enklere å finne relevante havner.
- **Offline:** Løsningen er avhengig av nett; en enkel service worker og caching av statisk innhold og GeoJSON-fallback kunne gi begrenset bruk uten nett.

### Technologies Used

- **Leaflet.js 1.9.4**: Interactive map library
- **OpenStreetMap**: Free, editable map tiles
- **HTML5/CSS3**: Modern web standards
- **Vanilla JavaScript**: No frameworks required

### Browser Support

This application works in all modern browsers that support:
- ES6 JavaScript
- CSS3
- HTML5

## Refleksjon (forbedringspunkter)
- **Bedre datadokumentasjon**: Legge inn eksakte kildelenker (URL) og evt. lisensinfo for alle eksterne lag, samt tydelig versjonering av egne datasett.
- **Feilhåndtering og robusthet**: Vise brukerfeedback ved nettverksfeil (f.eks. hvis GeoJSON/WMS ikke kan lastes) og fallback-løsninger.
- **Ytelse**: For større GeoJSON kan man bruke generalisering, clustering, eller vector tiles for raskere rendering.
- **UX og tilgjengelighet**: Forbedre kontrast, tastaturnavigasjon, og tydeligere legend/lag-navn; samt mobiltilpasning av kontroller.
- **Testing og CI**: Enkle tester (linting) og GitHub Actions for å sikre at statiske filer bygger/kjører uten feil.

## License
See LICENSE file for details.
