(function () {
  var NORWAY_CENTER = [62, 10];
  var DEFAULT_ZOOM = 5;

  var map = L.map('map', {
    wheelPxPerZoomLevel: 120,
    wheelDebounceTime: 80,
    zoomSnap: 1,
    zoomDelta: 1
  }).setView(NORWAY_CENTER, DEFAULT_ZOOM);

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

  nodhavnLayer.addTo(map); // vis nødhavn som standard
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

  var usePositionBtn = document.getElementById('use-position-btn');
  usePositionBtn.addEventListener('click', function () {
    if (filterClickHandler) {
      map.off('click', filterClickHandler);
      filterClickHandler = null;
    }
    if (!navigator.geolocation) {
      filterHint.textContent = 'Støtte for geolokasjon er ikke tilgjengelig i nettleseren din.';
      return;
    }
    filterHint.textContent = 'Henter posisjon...';
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var userLatLng = { lat: lat, lng: lng };
        filterDistanceKm = 100;
        applySpatialFilter(userLatLng);
        map.setView([lat, lng], 8);
      },
      function (err) {
        if (err.code === 1) {
          filterHint.textContent = 'Posisjon avvist. Gi nettleseren tillatelse til å bruke posisjonen din.';
        } else if (err.code === 2) {
          filterHint.textContent = 'Kunne ikke bestemme posisjon (ukjent lokasjon).';
        } else {
          filterHint.textContent = 'Kunne ikke hente posisjon: ' + (err.message || 'Ukjent feil');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

  window.nodhavnLayer = nodhavnLayer;
  window.map = map;
})();
