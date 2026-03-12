/**
 * Supabase-klient for å hente GeoJSON fra databasen.
 * Fyll inn din prosjekt-URL og anon key fra Supabase-dashboardet:
 * https://app.supabase.com → prosjektet ditt → Settings → API
 */
(function () {
  var SUPABASE_URL = 'https://gdkqqlbjpfuscqpdribx.supabase.co';  // F.eks. 'https://xxxxx.supabase.co'
  var SUPABASE_ANON_KEY = 'sb_publishable_jIWbj9lC-g9kCATmc8lx-w_bdc26lEN';  // Public anon key (ikke service_role)

  if (typeof supabase === 'undefined') {
    console.warn('Supabase SDK ikke lastet. Sjekk at scriptet fra CDN er inkludert i index.html.');
    window.supabase = null;
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase: Fyll inn SUPABASE_URL og SUPABASE_ANON_KEY i js/supabase.js');
    window.supabase = null;
    return;
  }

  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
