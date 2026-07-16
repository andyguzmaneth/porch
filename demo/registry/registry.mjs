#!/usr/bin/env node
// Porch TOY registry — minimal, in-memory, zero-dependency.
// Stands in for the eventual on-chain registry (V1). Not for production.
import http from 'node:http';

const PORT = process.env.PORT || 8700;
const STALE_MS = 60_000;
const nodes = new Map(); // id -> { id, name, endpoint, capabilities, lastSeen }

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};
const json = (res, code, body) => {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};
const readBody = async (req) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { return {}; }
};

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); return res.end(); }
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && pathname === '/register') {
    const b = await readBody(req);
    if (!b.endpoint) return json(res, 400, { error: 'endpoint required' });
    const id = b.pubkey || b.endpoint;
    nodes.set(id, { id, name: b.name || id, endpoint: b.endpoint, capabilities: b.capabilities || {}, lastSeen: Date.now() });
    console.log(`+ register ${b.name || id} (${b.endpoint})`);
    return json(res, 200, { ok: true, id });
  }
  if (req.method === 'POST' && pathname === '/heartbeat') {
    const b = await readBody(req);
    const n = nodes.get(b.id);
    if (n) n.lastSeen = Date.now();
    return json(res, 200, { ok: !!n });
  }
  if (req.method === 'GET' && pathname === '/nodes') {
    const now = Date.now();
    return json(res, 200, { nodes: [...nodes.values()].filter(n => now - n.lastSeen < STALE_MS) });
  }
  json(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log(`porch toy registry :${PORT}  —  GET /nodes · POST /register · POST /heartbeat`));
