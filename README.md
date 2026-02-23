# IS218-Gruppe-14

## Leaflet Web Map Application

A simple, clean web map application built with Leaflet.js that displays an interactive map with OpenStreetMap tiles.

### Features

- **Interactive Map**: Pan and zoom functionality with OpenStreetMap tiles
- **Layer Control**: Switch between different base map styles
- **Popup Examples**: Markers with informative popups
- **Responsive Design**: Works on desktop and mobile devices
- **Extensible Structure**: Easy to add GeoJSON data files and external API layers

### Project Structure

```
.
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css      # Custom styles for the application
│   └── js/
│       └── app.js          # Map initialization and configuration
├── data/                   # Directory for GeoJSON files and data
│   └── README.md          # Guide for adding data
└── README.md              # This file
```

### Getting Started

1. **Open the application**: Simply open `index.html` in a web browser
   - No build process or server required for basic usage
   - For development with file loading (GeoJSON), use a local server

2. **Using a local server** (optional, for loading GeoJSON data):
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

### Technologies Used

Area	Technology	Version / note
Mapping	Leaflet	1.9.4 (CDN, unpkg)
Languages	HTML5	—
CSS3	Custom css/style.css
JavaScript (vanilla)	ES5-style, no build step
Data sources	GeoJSON	Static file (data/nodhavn.geojson)
WMS (OGC)	GeoNorge Topo2 (external layer)
Base maps	OpenStreetMap	Tile layer
CartoDB Light	Tile layer
Delivery	Static files	No bundler; served via local web server (e.g. npx serve or python -m http.server)
Summary: Vanilla HTML/CSS/JS with Leaflet for the map; GeoJSON and WMS as data sources; no front-end framework or build tooling.

### Browser Support

This application works in all modern browsers that support:
- ES6 JavaScript
- CSS3
- HTML5

### License

See LICENSE file for details.
