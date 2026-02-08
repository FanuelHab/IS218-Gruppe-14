// ===== 1) MAP INIT (Norge) =====
const map = L.map('map').setView([64.5, 10.5], 5); // ca. midt i Norge/kysten

// ===== 2) BASE LAYERS =====
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
});

const osmHumanitarianLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>',
  maxZoom: 19
});

osmLayer.addTo(map);

// ===== 3) HELPERS =====
// Haversine distance (km) between two lat/lng points
function distanceKm(a, b) {
  const R = 6371; // km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function getProp(props, keys) {
  for (const k of keys) {
    if (props && props[k] !== undefined && props[k] !== null && String(props[k]).trim() !== '') return props[k];
  }
  return null;
}

// ===== 4) LAYERS (placeholders) =====
let nodhavnAllData = null;       // GeoJSON raw data
let nodhavnLayer = null;         // Leaflet GeoJSON layer (all)
let filteredLayer = null;        // Leaflet GeoJSON layer (filtered)
let clickMarker = null;          // marker for the click point
let clickCircle = null;          // circle showing radius
let radiusKm = 20;               // default filter radius (change as you like)

// ===== 5) LOAD GEOJSON (NØDHAVN) =====
fetch('data/nodhavn.geojson')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load data/nodhavn.geojson');
    return response.json();
  })
  .then((geojson) => {
    nodhavnAllData = geojson;

    // Datadrevet styling: farge basert på "type"/"kategori"/"status" (hva dere faktisk har i datasettet)
    function styleByProps(props) {
      const type = String(getProp(props, ['type', 'kategori', 'category', 'status']) || 'ukjent').toLowerCase();

      // En enkel regel: "hoved" / "primær" får større radius
      const isPrimary = type.includes('prim') || type.includes('hoved');

      // Ikke overtenk farger: bruk bare to-tre nivåer
      const fill = isPrimary ? '#d33' : '#3388ff';

      return {
        radius: isPrimary ? 8 : 5,
        color: '#222',
        weight: 1,
        fillColor: fill,
        fillOpacity: 0.8
      };
    }

    function onEachFeature(feature, layer) {
      const p = feature.properties || {};
      const name = getProp(p, ['navn', 'name', 'tittel', 'title']) || 'Nødhavn';
      const type = getProp(p, ['type', 'kategori', 'category', 'status']) || 'ukjent';
      const id = getProp(p, ['id', 'ID', 'objid', 'fid']) || '';

      layer.bindPopup(
        `<b>${name}</b><br>` +
        `Type: ${type}<br>` +
        (id ? `ID: ${id}<br>` : '')
      );
    }

    // Lag: alle nødhavner
    nodhavnLayer = L.geoJSON(nodhavnAllData, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, styleByProps(feature.properties)),
      onEachFeature
    });

    nodhavnLayer.addTo(map);

    // Lag et tomt filterlag (fylles når man klikker)
    filteredLayer = L.geoJSON(null, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 7 }),
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const name = getProp(p, ['navn', 'name', 'tittel', 'title']) || 'Nødhavn';
        layer.bindPopup(`<b>${name}</b><br>Innenfor ${radiusKm} km`);
      }
    });

    // Layer control
    const baseMaps = {
      "OpenStreetMap": osmLayer,
      "OpenStreetMap Humanitarian": osmHumanitarianLayer
    };

    const overlayMaps = {
      "Nødhavn (alle)": nodhavnLayer,
      "Nødhavn (filter innen radius)": filteredLayer
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Scale
    L.control.scale().addTo(map);

    console.log('Loaded nodhavn GeoJSON features:', nodhavnAllData.features?.length ?? 'unknown');
  })
  .catch((err) => {
    console.error(err);
    alert('Feil: klarte ikke å laste nodhavn.geojson. Sjekk at filen finnes i /data og at serveren kjører.');
  });

// ===== 6) SPATIAL FILTER: click -> show within X km =====
map.on('click', (e) => {
  if (!nodhavnAllData) return;

  const center = e.latlng;

  // vis klikkpunkt + sirkel
  if (clickMarker) map.removeLayer(clickMarker);
  if (clickCircle) map.removeLayer(clickCircle);

  clickMarker = L.marker(center).addTo(map).bindPopup(`Filterpunkt<br>Radius: ${radiusKm} km`).openPopup();
  clickCircle = L.circle(center, { radius: radiusKm * 1000 }).addTo(map);

  // filtrer features innen radius
  const filtered = {
    type: "FeatureCollection",
    features: (nodhavnAllData.features || []).filter((f) => {
      if (!f.geometry) return false;

      // funker best for Point. Hvis dataset er Polygon/LineString må vi endre logikken.
      if (f.geometry.type !== 'Point') return false;

      const [lng, lat] = f.geometry.coordinates;
      const d = distanceKm(center, { lat, lng });
      return d <= radiusKm;
    })
  };

  // oppdater filterlaget
  filteredLayer.clearLayers();
  filteredLayer.addData(filtered);

  console.log(`Filtered within ${radiusKm} km:`, filtered.features.length);
});
