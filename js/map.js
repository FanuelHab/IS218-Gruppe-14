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
    'Nødhavn (GeoJSON)': nodhavnLayer,
    'Eksternt lag (OGC)': externalLayer
  };

  L.control.layers(baseLayers, overlays).addTo(map);

  // --- Romlig filter: klikk på kartet → vis nødhavn innenfor X km ---
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
    var km = filterDistanceKm;
    removeFilterOverlay();
    var group = L.layerGroup();
    var circle = L.circle(clickLatLng, {
      radius: km * 1000,
      color: '#0066cc',
      fillColor: '#0066cc',
      fillOpacity: 0.15,
      weight: 2
    });
    var marker = L.marker(clickLatLng).bindPopup('Valgt punkt<br>Avstand: ' + km + ' km');
    group.addLayer(circle);
    group.addLayer(marker);
    group.addTo(map);
    filterRadiusLayer = group;
    nodhavnLayer.eachLayer(function (layer) {
      var latlng = layer.getLatLng ? layer.getLatLng() : (layer.getBounds && layer.getBounds().getCenter());
      if (!latlng) return;
      var d = getDistanceKm(clickLatLng.lat, clickLatLng.lng, latlng.lat, latlng.lng);
      layer.setStyle({ opacity: d <= km ? 1 : 0.2, fillOpacity: d <= km ? 0.8 : 0.15 });
    });
  }

  function clearSpatialFilter() {
    removeFilterOverlay();
    nodhavnLayer.eachLayer(function (layer) {
      layer.setStyle({ opacity: 1, fillOpacity: 0.8 });
    });
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
    filterHint.textContent = 'Klikk på kartet for å finne nødhavner innenfor ' + filterDistanceKm + ' km.';
    filterClickHandler = function (e) {
      applySpatialFilter(e.latlng);
      filterHint.textContent = 'Valgt avstand: ' + filterDistanceKm + ' km fra markert punkt. Sirkel viser området. Klikk "Finn nødhavner..." for nytt søk.';
    };
    map.on('click', filterClickHandler);
  });

  window.nodhavnLayer = nodhavnLayer;
  window.map = map;
})();
