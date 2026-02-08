/**
 * Bygger popup-innhold fra feature properties.
 * Bruk placeholder-felter (name, type, description) – oppdater med felt fra Hamdi/Person 3.
 */
function makePopupContent(properties) {
  if (!properties) return '<p>Ingen data</p>';
  var name = properties.name != null ? properties.name : '–';
  var type = properties.type != null ? properties.type : '–';
  var description = properties.description != null ? properties.description : '–';
  var html = '<div class="popup-content">';
  html += '<p><strong>Navn:</strong> ' + escapeHtml(String(name)) + '</p>';
  html += '<p><strong>Type:</strong> ' + escapeHtml(String(type)) + '</p>';
  if (description !== '–') {
    html += '<p><strong>Beskrivelse:</strong> ' + escapeHtml(String(description)) + '</p>';
  }
  html += '</div>';
  return html;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
