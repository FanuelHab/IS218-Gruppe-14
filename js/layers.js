/**
 * Lager og returnerer GeoJSON-lag for nødhavn (fra data/nodhavn.geojson).
 * Datadrevet styling og popups brukes her.
 */
function createNodhavnGeoJSONLayer() {
  var layer = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
      var props = feature.properties || {};
      var color = getColorByType(props.type || props.kategori);
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

  fetch('./data/nodhavn.geojson')
    .then(function (res) {
      if (!res.ok) throw new Error('Kunne ikke laste data/nodhavn.geojson (status ' + res.status + ')');
      return res.json();
    })
    .then(function (geojson) {
      if (geojson && geojson.features && geojson.features.length) {
        layer.addData(geojson);
        console.log('Nødhavn lastet:', geojson.features.length, 'punkter');
      } else {
        console.warn('Nodhavn GeoJSON: ingen features');
      }
    })
    .catch(function (err) {
      console.error('Nodhavn GeoJSON:', err.message);
    });

  return layer;
}

/**
 * Farge basert på type (datadrevet styling). Oppdater feltnavn/kategorier når Hamdi leverer.
 */
function getColorByType(type) {
  if (type == null || type === '') return '#3388ff';
  var t = String(type).toLowerCase();
  if (t === '1' || t.indexOf('militær') !== -1 || t === 'military') return '#c0392b';
  if (t === '2' || t.indexOf('sivil') !== -1 || t === 'civil') return '#27ae60';
  if (t === '3' || t.indexOf('fiskeri') !== -1 || t === 'fishing') return '#8e44ad';
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
