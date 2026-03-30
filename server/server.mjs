/**
 * Main web layer: serves the static app and proxies maritime routing to the Python searoute service.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SEAROUTE_URL = (process.env.SEAROUTE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
const PORT = Number(process.env.PORT) || 3000;

const app = express();

// Live Server (f.eks. port 5500) og API (3000) er ulike origins. Chrome «Private Network Access»
// krever Access-Control-Allow-Private-Network på preflight — ellers «Failed to fetch».
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  const reqHdr = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Headers', reqHdr || 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

async function proxyJson(req, res, pathSuffix) {
  try {
    const r = await fetch(`${SEAROUTE_URL}${pathSuffix}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text || 'Invalid response from searoute service' };
    }
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({
      error: 'Sea route service unavailable',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, searoute: SEAROUTE_URL });
});

app.post('/api/route', (req, res) => proxyJson(req, res, '/route'));

app.post('/api/closest-port', (req, res) => proxyJson(req, res, '/closest-port'));

app.use(express.static(ROOT));

app.listen(PORT, () => {
  console.log(`App: http://127.0.0.1:${PORT}`);
  console.log(`Proxying searoute from ${SEAROUTE_URL}`);
});
