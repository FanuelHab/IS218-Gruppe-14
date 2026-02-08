// Initialize the map
// Default center: New York City coordinates as an example
const map = L.map('map').setView([40.7128, -74.0060], 13);

// Define base map layers
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
});

// Alternative base layer - OpenStreetMap Humanitarian
const osmHumanitarianLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="http://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>',
    maxZoom: 19
});

// Add default layer to map
osmLayer.addTo(map);

// Create a marker with a popup example
const marker = L.marker([40.7128, -74.0060]).addTo(map);
marker.bindPopup('<b>Welcome!</b><br>This is a sample popup.<br>You can add markers with custom content.').openPopup();

// Create additional example markers
const marker2 = L.marker([40.7580, -73.9855]).addTo(map);
marker2.bindPopup('<b>Times Square</b><br>A popular tourist destination.');

const marker3 = L.marker([40.6892, -74.0445]).addTo(map);
marker3.bindPopup('<b>Statue of Liberty</b><br>An iconic landmark.');

// Define base maps for layer control
const baseMaps = {
    "OpenStreetMap": osmLayer,
    "OpenStreetMap Humanitarian": osmHumanitarianLayer
};

// Create a layer group for markers (for future overlay control)
const markersLayer = L.layerGroup([marker, marker2, marker3]);

// Define overlay maps for layer control
const overlayMaps = {
    "Markers": markersLayer
};

// Add layer control to the map
L.control.layers(baseMaps, overlayMaps).addTo(map);

// Add scale control
L.control.scale().addTo(map);

// Log to console for debugging
console.log('Map initialized successfully');
console.log('Map center:', map.getCenter());
console.log('Map zoom level:', map.getZoom());
