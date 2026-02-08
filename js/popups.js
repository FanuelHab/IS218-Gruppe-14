/**
 * Bygger popup-innhold fra feature properties.
 * Bruk placeholder-felter (name, type, description) – oppdater med felt fra Hamdi/Person 3.
 */
function makePopupContent(properties) {
  if (!properties) return '<p>Ingen data</p>';
  var name = properties.navn != null ? properties.navn : (properties.name != null ? properties.name : '–');
  var type = properties.kategori != null ? properties.kategori : (properties.type != null ? properties.type : '–');
  var kommune = properties.kommune != null ? properties.kommune : '–';
  var lenke = properties.lenkeFaktaark != null ? properties.lenkeFaktaark : null;
  var html = '<div class="popup-content">';
  html += '<p><strong>Navn:</strong> ' + escapeHtml(String(name)) + '</p>';
  html += '<p><strong>Kategori:</strong> ' + escapeHtml(String(type)) + '</p>';
  html += '<p><strong>Kommune:</strong> ' + escapeHtml(String(kommune)) + '</p>';
  if (lenke) {
    html += '<p><a href="' + escapeHtml(lenke) + '" target="_blank" rel="noopener">Faktaark (PDF)</a></p>';
  }
  html += '</div>';
  return html;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
