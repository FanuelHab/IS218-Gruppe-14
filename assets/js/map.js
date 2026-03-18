class MapApp {
  constructor() {
    this.NORWAY_CENTER = [62, 10];
    this.DEFAULT_ZOOM = 5;

    this.filterDistanceKm = 100;
    this.activeFilterCenter = null;

    this.filterRadiusLayer = null;
    this.closestResultLayer = null;
    this.currentMapClickHandler = null;

    this.map = this.initMap();
    this.baseLayers = this.initBaseLayers();
    this.nodhavnLayer = createNodhavnGeoJSONLayer();
    this.externalLayer = createExternalLayer();

    this.initLayerControls();
    this.initUI();
  }

  // ---------------- MAP ----------------
  initMap() {
    const map = L.map('map', {
      wheelPxPerZoomLevel: 120,
      wheelDebounceTime: 80,
      zoomSnap: 1,
      zoomDelta: 1,
      zoomControl: false
    }).setView(this.NORWAY_CENTER, this.DEFAULT_ZOOM);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    return map;
  }

  initBaseLayers() {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    });

    const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CARTO'
    });

    // OSM is already added in initMap; keep references for layer control.
    return {
      'OpenStreetMap': osm,
      'CartoDB Lys': carto
    };
  }

  initLayerControls() {
    // Show default baselayer (OSM)
    if (this.baseLayers && this.baseLayers['OpenStreetMap']) {
      this.baseLayers['OpenStreetMap'].addTo(this.map);
    }

    this.nodhavnLayer.addTo(this.map);

    const overlays = {
      'Nødhavn (søkeresultat)': this.nodhavnLayer,
      'Eksternt lag (OGC)': this.externalLayer
    };

    L.control.layers(this.baseLayers, overlays).addTo(this.map);
  }

  // ---------------- SAFE CLICK HANDLER ----------------
  setMapClickHandler(handler) {
    if (this.currentMapClickHandler) {
      this.map.off('click', this.currentMapClickHandler);
    }
    this.currentMapClickHandler = handler;
    if (handler) {
      this.map.on('click', handler);
    }
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

  // ---------------- FILTER --------------
  applySpatialFilter(latlng) {
    const client = window.supabase;

    if (!client) {
      this.updateHint('Supabase er ikke konfigurert. Bruk "Vis alle nødhavner" og prøv igjen.');
      return;
    }

    this.updateHint('Henter nødhavn fra databasen...');

    client
      .rpc('get_nodhavn_within_distance', {
      click_lng: latlng.lng,
      click_lat: latlng.lat,
      distance_meters: this.filterDistanceKm * 1000
    })
    .then(result => {
      if (result.error) {
        this.updateHint(`Feil: ${result.error.message || 'Kunne ikke hente data.'}`);
        return;
      }

      const rows = result.data || [];
      const features = rows.map(r => {
        const lng = Number(r.longitude);
        const latVal = Number(r.latitude);

        return {
          type: 'Feature',
          properties: {
            name: r.navn,
            navn: r.navn,
            kommune: r.kommune,
            fylke: r.fylke,
            type: r.kategori != null ? String(r.kategori) : '',
            kategori: r.kategori,
            lenke_faktaark: r.lenke_faktaark,
            forvaltningsstatus: r.forvaltningsstatus,
            nodhavnnummer: r.nodhavnnummer
          },
          geometry: { type: 'Point', coordinates: [lng, latVal] }
        };
      });

      // Update layer to only show filtered results
      this.clearAllOverlays();
      this.nodhavnLayer.clearLayers();
      this.nodhavnLayer.addData({ type: 'FeatureCollection', features });
      this.nodhavnLayer.addTo(this.map);

      // Draw radius circle + selected point marker
      const group = L.layerGroup();
      const circle = L.circle(latlng, {
        radius: this.filterDistanceKm * 1000,
        color: '#0066cc',
        fillColor: '#0066cc',
        fillOpacity: 0.15,
        weight: 2,
        interactive: false
      });
      const marker = L.marker(latlng).bindPopup(
        `Valgt punkt<br>Avstand: ${this.filterDistanceKm} km`
      );
      group.addLayer(circle);
      group.addLayer(marker);
      group.addTo(this.map);
      this.filterRadiusLayer = group;
      this.activeFilterCenter = latlng;

      const n = features.length;
      this.setHintHasResults(n > 0);
      this.updateHint(`${n} nødhavn innenfor ${this.filterDistanceKm} km. Klikk på en markør for å se detaljer.`);

      if (n > 0 && this.nodhavnLayer.getBounds().isValid()) {
        this.map.fitBounds(this.nodhavnLayer.getBounds().pad(0.15));
      }
    })
    .catch(err => {
      this.updateHint(`Kunne ikke hente nødhavn: ${err.message || 'Ukjent feil'}`);
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

  clearSpatialFilter() {
    this.clearAllOverlays();
    this.activeFilterCenter = null;
    this.nodhavnLayer.clearLayers();
    this.map.removeLayer(this.nodhavnLayer);
  }

  showAllNodhavn() {
    const geojson = window.nodhavnGeoJSON;

    if (!geojson) {
      this.updateHint('Data lastes...');
      return;
    }

    this.clearAllOverlays();
    this.activeFilterCenter = null;

    this.nodhavnLayer.clearLayers();
    this.nodhavnLayer.addData(geojson).addTo(this.map);

    this.setMapClickHandler(null);
    this.setHintHasResults(false);
    this.updateHint('Alle nødhavn i Norge vises. Bruk søkefunksjonen for å filtrere.');
  }

  // ---------------- UI ----------------
  initUI() {
    this.filterBtn = document.getElementById('filter-btn');
    this.closestBtn = document.getElementById('closest-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.filterHint = document.getElementById('filter-hint');
    this.filterDistanceInput = document.getElementById('filter-distance');
    this.filterDistanceValue = document.getElementById('filter-distance-value');
    this.usePositionBtn = document.getElementById('use-position-btn');
    this.panelToggle = document.getElementById('panel-toggle');

    if (this.panelToggle) {
      this.panelToggle.addEventListener('click', () => {
        const panel = document.getElementById('search-panel');
        if (panel) panel.classList.toggle('collapsed');
      });
    }

    if (this.filterDistanceInput) {
      const updateDistanceDisplay = () => {
        if (this.filterDistanceValue) this.filterDistanceValue.textContent = this.filterDistanceInput.value;
      };

      this.filterDistanceInput.addEventListener('input', () => {
        updateDistanceDisplay();
        this.filterDistanceKm = Number(this.filterDistanceInput.value) || 100;
        if (this.activeFilterCenter) {
          this.applySpatialFilter(this.activeFilterCenter);
        }
      });

      updateDistanceDisplay();
      this.filterDistanceKm = Number(this.filterDistanceInput.value) || 100;
    }

    if (this.closestBtn) {
      this.closestBtn.addEventListener('click', () => {
        this.setHintHasResults(false);
        this.updateHint('Klikk på kartet for å finne nærmeste nødhavn.');
        this.setMapClickHandler((e) => this.handleClosestClick(e.latlng));
      });
    }

    if (this.filterBtn) {
      this.filterBtn.addEventListener('click', () => {
        this.filterDistanceKm = Number(this.filterDistanceInput?.value) || this.filterDistanceKm || 100;

        this.clearSpatialFilter();
        this.setHintHasResults(false);
        this.updateHint(`Klikk på kartet for å finne nødhavner innenfor ${this.filterDistanceKm} km.`);

        this.setMapClickHandler((e) => this.applySpatialFilter(e.latlng));
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.showAllNodhavn());
    }

    if (this.usePositionBtn) {
      this.usePositionBtn.addEventListener('click', () => {
        this.setMapClickHandler(null);

        if (!navigator.geolocation) {
          this.updateHint('Støtte for geolokasjon er ikke tilgjengelig i nettleseren din.');
          return;
        }

        this.updateHint('Henter posisjon...');

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const userLatLng = { lat, lng };

            // Keep the same default behavior as before
            this.filterDistanceKm = Number(this.filterDistanceInput?.value) || 100;
            this.applySpatialFilter(userLatLng);
            this.map.setView([lat, lng], 8);
          },
          (err) => {
            if (err.code === 1) {
              this.updateHint('Posisjon avvist. Gi nettleseren tillatelse til å bruke posisjonen din.');
            } else if (err.code === 2) {
              this.updateHint('Kunne ikke bestemme posisjon (ukjent lokasjon).');
            } else {
              this.updateHint(`Kunne ikke hente posisjon: ${err.message || 'Ukjent feil'}`);
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });
    }
  }

  setHintHasResults(hasResults) {
    if (!this.filterHint) return;
    if (hasResults) this.filterHint.classList.add('has-results');
    else this.filterHint.classList.remove('has-results');
  }

  updateHint(text) {
    if (this.filterHint) {
      this.filterHint.textContent = text;
    }
  }
}

// Start
new MapApp();