(function () {
  var NORWAY_CENTER = [62, 10];
  var DEFAULT_ZOOM = 5;

  var map = L.map('map').setView(NORWAY_CENTER, DEFAULT_ZOOM);

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  });
  osm.addTo(map);

  var carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO'
  });

  var baseLayers = {
    'OpenStreetMap': osm,
    'CartoDB Lys': carto
  };

  var nodhavnLayer = createNodhavnGeoJSONLayer();
  var externalLayer = createExternalLayer();

  var overlays = {
    'Nødhavn (søkeresultat)': nodhavnLayer,
    'Eksternt lag (OGC)': externalLayer
  };

  L.control.layers(baseLayers, overlays).addTo(map);

  // --- Ren flyt: velg avstand → klikk kart → vis kun nødhavn innenfor radius (klikk på markør for data) ---
  var filterDistanceKm = 100;
  var filterClickHandler = null;
  var filterRadiusLayer = null;

  function getDistanceKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function removeFilterOverlay() {
    if (filterRadiusLayer) {
      map.removeLayer(filterRadiusLayer);
      filterRadiusLayer = null;
    }
  }

  function applySpatialFilter(clickLatLng) {
    var geojson = window.nodhavnGeoJSON;
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      filterHint.textContent = 'Data lastes fortsatt. Prøv igjen om et øyeblikk.';
      return;
    }
    var km = filterDistanceKm;
    var clickLat = clickLatLng.lat;
    var clickLng = clickLatLng.lng;
    var within = geojson.features.filter(function (f) {
      var coords = f.geometry && f.geometry.coordinates;
      if (!coords || coords.length < 2) return false;
      var d = getDistanceKm(clickLat, clickLng, coords[1], coords[0]);
      return d <= km;
    });
    removeFilterOverlay();
    nodhavnLayer.clearLayers();
    nodhavnLayer.addData({ type: 'FeatureCollection', features: within });
    nodhavnLayer.addTo(map);
    var group = L.layerGroup();
    var circle = L.circle(clickLatLng, {
      radius: km * 1000,
      color: '#0066cc',
      fillColor: '#0066cc',
      fillOpacity: 0.15,
      weight: 2,
      interactive: false
    });
    var marker = L.marker(clickLatLng).bindPopup('Valgt punkt<br>Avstand: ' + km + ' km');
    group.addLayer(circle);
    group.addLayer(marker);
    group.addTo(map);
    filterRadiusLayer = group;
    var n = within.length;
    filterHint.textContent = n + ' nødhavn innenfor ' + km + ' km. Klikk på en markør for å se detaljer. Klikk «Finn nødhavner» for nytt søk.';
    if (within.length > 0 && nodhavnLayer.getBounds().isValid()) {
      map.fitBounds(nodhavnLayer.getBounds().pad(0.15));
    }
  }

  function clearSpatialFilter() {
    removeFilterOverlay();
    nodhavnLayer.clearLayers();
    map.removeLayer(nodhavnLayer);
  }

  var filterBtn = document.getElementById('filter-btn');
  var filterDistanceInput = document.getElementById('filter-distance');
  var filterHint = document.getElementById('filter-hint');

  filterBtn.addEventListener('click', function () {
    filterDistanceKm = Number(filterDistanceInput.value) || 100;
    if (filterClickHandler) {
      map.off('click', filterClickHandler);
    }
    clearSpatialFilter();
    filterHint.textContent = 'Velg avstand (km) og klikk deretter på kartet for å finne nødhavner innenfor ' + filterDistanceKm + ' km.';
    filterClickHandler = function (e) {
      applySpatialFilter(e.latlng);
    };
    map.on('click', filterClickHandler);
  });

  window.nodhavnLayer = nodhavnLayer;
  window.map = map;
})();
