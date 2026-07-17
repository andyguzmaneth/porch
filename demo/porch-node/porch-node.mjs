#!/usr/bin/env node
// porch-node (TOY) — opens a confined, allowlisted JSON-RPC port in front of an
// existing Ethereum RPC, and self-registers with a Porch registry.
// Prototype only: the real node is Rust and serves from a local full node.
// Zero dependencies (Node 18+, uses built-in fetch + http).
import http from 'node:http';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const UPSTREAM = arg('rpc', process.env.PORCH_RPC);
const REGISTRY = arg('registry', 'http://localhost:8700');
const PORT = Number(arg('port', 8646));
const NAME = arg('name', `porch-node-${PORT}`);
const PUBLIC = arg('public', `http://localhost:${PORT}`);

if (!UPSTREAM) { console.error('usage: porch-node --rpc <upstream JSON-RPC URL> [--registry url] [--port n] [--name label]'); process.exit(1); }

// V0 allowlist — bounded-cost reads. See ../../docs/SPEC.md §4 and ../../rpc/porch-profile.openrpc.json
const ALLOW = new Set([
  'eth_chainId', 'eth_blockNumber', 'eth_getBalance', 'eth_getTransactionCount', 'eth_getCode',
  'eth_getStorageAt', 'eth_call', 'eth_estimateGas', 'eth_gasPrice', 'eth_feeHistory',
  'eth_getBlockByNumber', 'eth_getBlockByHash', 'eth_getTransactionByHash', 'eth_getTransactionReceipt',
  'eth_getProof', // V1 correctness: light-client wallets (Helios/Kohaku) verify the Merkle proof
]);
const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); return res.end(); }
  cors(res);
  if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
  const chunks = []; for await (const c of req) chunks.push(c);
  let body; try { body = JSON.parse(Buffer.concat(chunks).toString()); }
  catch { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end('{"error":"bad json"}'); }

  if (!ALLOW.has(body?.method)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ jsonrpc: '2.0', id: body?.id ?? null,
      error: { code: -32601, message: `method not allowed by porch allowlist: ${body?.method}` } }));
  }
  try {
    const up = await fetch(UPSTREAM, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    res.writeHead(200, { 'Content-Type': 'application/json', 'x-porch-node': NAME });
    res.end(await up.text());
  } catch {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32000, message: 'upstream error' } }));
  }
}).listen(PORT, async () => {
  console.log(`porch-node (toy) :${PORT}  ->  ${UPSTREAM}   [${ALLOW.size} allowlisted methods]`);
  const register = () => fetch(`${REGISTRY}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: PUBLIC, name: NAME, pubkey: PUBLIC,
      capabilities: { real_node: false, proxy: true, pir: false, proof_back: false, wants_payment: false, methods: [...ALLOW] } }),
  }).then(() => console.log(`registered ${NAME} with ${REGISTRY}`)).catch(() => console.log(`registry ${REGISTRY} unreachable (retrying)`));
  await register();
  setInterval(() => fetch(`${REGISTRY}/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: PUBLIC }) }).catch(() => {}), 30_000);
});
