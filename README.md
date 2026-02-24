# IS218-Gruppe-14

## Prosjektnavn & TL;DR
**Nødhavn i Norge** — Et webkart for Forsvaret og andre beredskapsaktører: vis nødhavn på kart, bruk egen posisjon eller velg et punkt med radius, og finn nærmeste havn raskt.

## Video av systemet


https://github.com/user-attachments/assets/0cc9151d-967e-4716-b5b5-656082a2f157





## Teknisk stack
- **Leaflet**: 1.9.4 (CDN via unpkg)
- **Supabase**: @supabase/supabase-js (CDN) – henting av nødhavndata fra databasen
- **OpenStreetMap / CartoDB**: Bakgrunnskart (OSM, Carto Lys) via Leaflet
- **WMS (OGC)**: GeoNorge Topo2 (ekstern karttjeneste, valgfritt lag)
- **JavaScript**: Vanilla JS, modulær oppbygning (ingen build step)
- **HTML/CSS**: HTML5 + CSS3 (designsystem med CSS-variabler, DM Sans)
- **Kjøring**: Statisk (åpne `index.html`) eller lokal webserver (Python/Node)

## Prosjektstruktur

```
.
├── index.html              # Hovedside: kart, søkepanel, legend
├── css/
│   └── style.css           # Stiler: søkepanel, knapper, popups, responsivt
├── js/
│   ├── supabase.js         # Supabase-klient (URL + anon key)
│   ├── popups.js           # Popup-innhold fra feature properties
│   ├── layers.js           # Nødhavn-lag (Supabase/GeoJSON), eksternt WMS-lag, styling
│   └── map.js              # Kartoppsett, lagkontroll, posisjon/søk, avstandsfilter
├── data/
│   ├── nodhavn.geojson     # Fallback nødhavndata (ved Supabase-feil)
│   ├── nodhavn.csv         # Rådata
│   └── README.md           # Veiledning for data
└── README.md               # Denne filen
```

### Arkitektur (JavaScript)

Scriptene lastes i rekkefølge i `index.html` og bygger på globale variabler der det trengs:

| Fil | Ansvar |
|-----|--------|
| **supabase.js** | Oppretter Supabase-klient (`window.supabase`); må kjøre før layers.js. |
| **popups.js** | `makePopupContent(properties)` og `escapeHtml()` – brukes av layers.js til popup-innhold. |
| **layers.js** | `fetchNodhavnFromSupabase()`, `createNodhavnGeoJSONLayer()`, `createExternalLayer()`, `getColorByType()`. Setter `window.nodhavnGeoJSON` når data er lastet. |
| **map.js** | Oppretter Leaflet-kartet, base layers, overlays, lagkontroll. Håndterer avstandsslider, «Bruk posisjonen min», «Finn nødhavner rundt punkt», «Vis alle nødhavner», panel-toggle. Eksponerer `window.map` og `window.nodhavnLayer`. |

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
   Åpne deretter `http://localhost:8000` i nettleseren.

### Usage

- **Kart**: Dra for å panne, bruk scroll eller +/- for zoom. Lagkontroll (øverst til høyre) bytter bakgrunnskart (OpenStreetMap / CartoDB Lys) og overlays (Nødhavn, Eksternt lag).
- **Søkepanel (venstre)**:
  - **Bruk posisjonen min**: Finner nødhavn innen 100 km fra din GPS-posisjon (krever tillatelse).
  - **Velg punkt på kartet**: Still avstand (10–500 km) med glidebryteren, klikk «Finn nødhavner rundt punkt», deretter på kartet. Kun nødhavn innenfor radius vises; sirkel og valgt punkt markeres.
  - **Vis alle nødhavner**: Nullstiller filter og viser alle nødhavn igjen.
- **Legend (i-knapp)**: Forklaring på fargene – K1 (største fartøy), K2 (>5000 BT), K3 (mindre fartøy), annen/ukjent.
- **Panel**: Pil-knappen på panelet lukker/åpner søkepanelet.
- **Popups**: Klikk på en nødhavn-markør for å se navn, sted, kategori og evt. lenke til faktaark.

### Adding Data

#### GeoJSON / nødhavndata

1. Legg GeoJSON-filer i `data/` (f.eks. `data/nodhavn.geojson` som fallback).
2. Nødhavn lastes i `js/layers.js` via Supabase (`fetchNodhavnFromSupabase`) med fallback til `fetch('data/nodhavn.geojson')`.
3. Se `data/README.md` for eksempler på struktur.

#### Eksterne API-er

Eksterne geospatiale API-er kan integreres ved å hente data (f.eks. i `js/layers.js`) og legge dem til kartet som nye lag.

### Datakatalog

Oversikt over datasett som brukes i applikasjonen:

| Datasett | Kilde | Format | Bearbeiding |
|----------|--------|--------|-------------|
| **Nødhavn (primær)** | Supabase-database (tabell `nodhavn`), prosjekt-URL: `https://gdkqqlbjpfuscqpdribx.supabase.co` | Tabell med kolonner: longitude, latitude, navn, kommune, fylke, kategori, lenke_faktaark, forvaltningsstatus, nodhavnnummer. Leveres via Supabase REST-API. | Hentes med `fetchNodhavnFromSupabase()` i `js/layers.js`, konverteres til GeoJSON FeatureCollection med Point-geometri og properties; vises som sirkelmarkører med farge etter kategori (K1/K2/K3 m.m.), popups bygges i `js/popups.js`. |
| **Nødhavn (fallback)** | Lokal fil: `data/nodhavn.geojson` | GeoJSON (FeatureCollection med Point-features og properties: name/navn, type/kategori, description, osv.). | Brukes når Supabase ikke er tilgjengelig; lastes i `js/layers.js` med `fetch('data/nodhavn.geojson')`, samme styling og popups som primærkilde. |
| **Kartbakgrunn** | OpenStreetMap / CartoDB (Leaflet tile) | Rasterkart via XYZ-tiles. | Lastes og vises som bakgrunnskart i Leaflet; ingen videre bearbeiding. |
| **Eksternt lag (OGC)** | GeoNorge Topo2 WMS | WMS (image/png). | Valgfritt overlay i `js/layers.js` (`createExternalLayer()`); kan slås på/av i lagkontrollen. |

### Dataflyt – fra kilde til kart

- **Nødhavn:** Data hentes i `js/layers.js` fra Supabase-tabellen `nodhavn` med `fetchNodhavnFromSupabase()` (eller fallback til `data/nodhavn.geojson`). Rader konverteres til GeoJSON FeatureCollection med punktgeometri og properties. Laget legges på kartet som sirkelmarkører med farge etter kategori (K1/K2/K3; `getColorByType()` i `layers.js`). Popup-innhold bygges i `js/popups.js` (`makePopupContent()`). Filtrering på avstand og brukerposisjon håndteres i `js/map.js` (klikk på kart eller «Bruk posisjonen min»).
- **Kartbakgrunn og WMS:** OpenStreetMap/CartoDB tiles og GeoNorge Topo2 WMS lastes via Leaflet; lagkontrollen styres fra `map.js`.

### Forbedringspunkter ved nåværende løsning

- **Tilgjengelighet:** Kart og popups bør støtte tastaturnavigasjon og skjermleser (ARIA, fokusrekkefølge og beskrivende tekster) for å møte WCAG-bedre.
- **Brukertilbakemelding:** Ved lasting av data eller ved feil mangler det tydelig loading-indikator og feilmeldinger; brukeren vet ikke alltid om noe lastes eller har feilet.
- **Mobil:** Interaksjon (zoom, pan, klikk på markører) kan forbedres for touch med større treffflater og tydeligere tilstand (f.eks. valgt markør).
- **Søk og filtrering:** Appen har avstandsfilter (radius 10–500 km) og «Bruk posisjonen min»; tekstsøk eller filter på fylke/kommune/kategori kunne utvides.
- **Offline:** Løsningen er avhengig av nett; en enkel service worker og caching av statisk innhold og GeoJSON-fallback kunne gi begrenset bruk uten nett.

### Technologies Used

- **Leaflet.js 1.9.4**: Interaktivt kart
- **Supabase (supabase-js)**: Database og REST-API for nødhavndata
- **OpenStreetMap / CartoDB**: Gratis bakgrunnskart
- **HTML5/CSS3**: Moderne nettsider med CSS-variabler og skrifttypen DM Sans
- **Vanilla JavaScript**: Modulær oppbygning (supabase, popups, layers, map) uten rammeverk

### Nettleserstøtte

Appen fungerer i moderne nettlesere som støtter ES6 JavaScript, CSS3 og HTML5 (inkl. geolokasjon for «Bruk posisjonen min»).

## Refleksjon (forbedringspunkter)
- **Bedre datadokumentasjon**: Legge inn eksakte kildelenker (URL) og evt. lisensinfo for alle eksterne lag, samt tydelig versjonering av egne datasett.
- **Feilhåndtering og robusthet**: Vise brukerfeedback ved nettverksfeil (f.eks. hvis GeoJSON/WMS ikke kan lastes) og fallback-løsninger.
- **Ytelse**: For større GeoJSON kan man bruke generalisering, clustering, eller vector tiles for raskere rendering.
- **UX og tilgjengelighet**: Forbedre kontrast, tastaturnavigasjon, og tydeligere legend/lag-navn; samt mobiltilpasning av kontroller.
- **Testing og CI**: Enkle tester (linting) og GitHub Actions for å sikre at statiske filer bygger/kjører uten feil.

## License
See LICENSE file for details.
