/**
 * Bygger popup-innhold fra feature properties.
 * Støtter både Supabase-felter (navn, kommune, fylke, kategori) og GeoJSON-felter (name, type, description).
 */
function makePopupContent(properties) {
  if (!properties) return '<p>Ingen data</p>';
  var name = properties.navn != null ? properties.navn : (properties.name != null ? properties.name : '–');
  var type = properties.kategori != null ? String(properties.kategori) : (properties.type != null ? properties.type : '–');
  var kommune = properties.kommune;
  var fylke = properties.fylke;
  var description = properties.description;
  var html = '<div class="popup-content">';
  html += '<p><strong>Navn:</strong> ' + escapeHtml(String(name)) + '</p>';
  if (kommune || fylke) {
    html += '<p><strong>Sted:</strong> ' + escapeHtml([kommune, fylke].filter(Boolean).join(', ') || '–') + '</p>';
  }
  html += '<p><strong>Kategori:</strong> ' + escapeHtml(String(type)) + '</p>';
  if (description) {
    html += '<p><strong>Beskrivelse:</strong> ' + escapeHtml(String(description)) + '</p>';
  }
  if (properties.lenke_faktaark) {
    html += '<p><a href="' + escapeHtml(properties.lenke_faktaark) + '" target="_blank" rel="noopener">Faktaark</a></p>';
  }
  html += '</div>';
  return html;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
