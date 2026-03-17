class MapApp {
  constructor() {
    this.NORWAY_CENTER = [62, 10];
    this.DEFAULT_ZOOM = 5;

    this.filterDistanceKm = 100;
    this.activeFilterCenter = null;

    this.filterRadiusLayer = null;
    this.closestResultLayer = null;

    this.map = this.initMap();
    this.baseLayers = this.initBaseLayers();
    this.nodhavnLayer = createNodhavnGeoJSONLayer();
    this.externalLayer = createExternalLayer();

    this.initLayerControls();
    this.initUI();
  }

  // ---------------- MAP ----------------
  initMap() {
    const map = L.map('map').setView(this.NORWAY_CENTER, this.DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    return map;
  }

  initBaseLayers() {
    return {};
  }

  initLayerControls() {
    this.nodhavnLayer.addTo(this.map);
  }

  // ---------------- SAFE CLICK HANDLER ----------------
  setMapClickHandler(handler) {
    this.map.off('click');
    this.map.on('click', handler);
    console.log("Click handler set");
  }

  // ---------------- HAVERSINE ----------------
  getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ---------------- CLOSEST HARBOR ----------------
  findClosestHarbor(clickLatLng) {
    const geojson = window.nodhavnGeoJSON;

    if (!geojson) {
      console.error("GeoJSON not loaded");
      return { error: 'Data lastes...' };
    }

    if (!geojson.features || geojson.features.length === 0) {
      return { error: 'Ingen nødhavn funnet.' };
    }

    let closest = null;
    let minDistance = Infinity;

    geojson.features.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates;

      const distance = this.getDistanceKm(
        clickLatLng.lat,
        clickLatLng.lng,
        lat,
        lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = feature;
      }
    });

    return {
      feature: closest,
      distanceKm: minDistance
    };
  }

  handleClosestClick(latlng) {
    console.log("MAP CLICKED", latlng);

    this.clearAllOverlays();

    const result = this.findClosestHarbor(latlng);

    if (result.error) {
      this.updateHint(result.error);
      return;
    }

    const { feature, distanceKm } = result;
    const navn = feature.properties.navn;

    const rounded = distanceKm.toFixed(2);

    const category = feature.properties.kategori || '–';

    this.updateHint(`Nærmeste: ${navn} – ${rounded} km`);

    const clickMarker = L.marker(latlng)
      .addTo(this.map)
      .bindPopup(`<b>${navn}</b><br>${rounded} km<br>Kategori: ${category}`)
      .openPopup();

    const [lng, lat] = feature.geometry.coordinates;
    const harborLatLng = L.latLng(lat, lng);

    const line = L.polyline([latlng, harborLatLng]).addTo(this.map);

    this.closestResultLayer = L.layerGroup([clickMarker, line]).addTo(this.map);

    this.map.fitBounds(line.getBounds().pad(0.3));
  }

  // ---------------- FILTER ---------------
  applySpatialFilter(latlng) {
    console.log("FILTER CLICK", latlng);

    const client = window.supabase;

    if (!client) {
      this.updateHint('Supabase mangler');
      return;
    }

    client.rpc('get_nodhavn_within_distance', {
      click_lng: latlng.lng,
      click_lat: latlng.lat,
      distance_meters: this.filterDistanceKm * 1000
    })
    .then(result => {
      if (result.error) {
        this.updateHint(result.error.message);
        return;
      }

      this.updateHint(`${result.data.length} funnet`);
    });
  }

  // ---------------- CLEANUP ----------------
  clearAllOverlays() {
    if (this.filterRadiusLayer) {
      this.map.removeLayer(this.filterRadiusLayer);
      this.filterRadiusLayer = null;
    }

    if (this.closestResultLayer) {
      this.map.removeLayer(this.closestResultLayer);
      this.closestResultLayer = null;
    }
  }

  showAllNodhavn() {
    const geojson = window.nodhavnGeoJSON;

    if (!geojson) {
      this.updateHint('Data lastes...');
      return;
    }

    this.clearAllOverlays();

    this.nodhavnLayer.clearLayers();
    this.nodhavnLayer.addData(geojson).addTo(this.map);

    this.updateHint('Viser alle');
  }

  // ---------------- UI ----------------
  initUI() {
    this.filterBtn = document.getElementById('filter-btn');
    this.closestBtn = document.getElementById('closest-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.filterHint = document.getElementById('filter-hint');

    if (!this.closestBtn) {
      console.error("closest-btn NOT FOUND");
    }

    this.closestBtn.addEventListener('click', () => {
      console.log("Closest button clicked");

      this.updateHint('Klikk på kartet');

      this.setMapClickHandler((e) => this.handleClosestClick(e.latlng));
    });

    this.filterBtn.addEventListener('click', () => {
      console.log("Filter button clicked");

      this.setMapClickHandler((e) => this.applySpatialFilter(e.latlng));
    });

    this.resetBtn.addEventListener('click', () => this.showAllNodhavn());
  }

  updateHint(text) {
    if (this.filterHint) {
      this.filterHint.textContent = text;
    }
  }
}

// Start
new MapApp();