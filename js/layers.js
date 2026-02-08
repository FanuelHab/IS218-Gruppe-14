/**
 * Lager og returnerer GeoJSON-lag for nødhavn (fra data/nodhavn.geojson).
 * Datadrevet styling og popups brukes her.
 */
function createNodhavnGeoJSONLayer() {
  var layer = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
      var color = getColorByType(feature.properties ? feature.properties.type : null);
      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: '#333',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
    },
    onEachFeature: function (feature, layer) {
      if (feature.properties) {
        layer.bindPopup(makePopupContent(feature.properties));
      }
    }
  });

  fetch('data/nodhavn.geojson')
    .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('Kunne ikke laste GeoJSON')); })
    .then(function (geojson) {
      layer.addData(geojson);
    })
    .catch(function (err) {
      console.warn('Nodhavn GeoJSON:', err.message);
    });

  return layer;
}

/**
 * Farge basert på type (datadrevet styling). Oppdater feltnavn/kategorier når Hamdi leverer.
 */
function getColorByType(type) {
  if (!type) return '#3388ff';
  var t = String(type).toLowerCase();
  if (t.indexOf('militær') !== -1 || t === 'military') return '#c0392b';
  if (t.indexOf('sivil') !== -1 || t === 'civil') return '#27ae60';
  if (t.indexOf('fiskeri') !== -1 || t === 'fishing') return '#8e44ad';
  return '#3388ff';
}

/**
 * Eksternt lag (OGC/WMS). Placeholder – Person 3 kan erstatte URL og params.
 * Eksempel: WMS fra GeoNorge.
 */
function createExternalLayer() {
  return L.tileLayer.wms('https://openwms.geonorge.no/skwms1/wms.topo2?', {
    layers: 'topo2_WMS',
    format: 'image/png',
    transparent: true,
    attribution: '© Kartverket/GeoNorge'
  });
}
