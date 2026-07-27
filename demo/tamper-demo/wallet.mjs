#!/usr/bin/env node
// wallet.mjs — the V1 correctness thesis, live (issue #11).
//
// Two wallets read the SAME balance through the SAME untrusted porch-node:
//   1. naive wallet    — bare eth_getBalance, believes whatever the node says
//   2. verifying wallet — Kohaku omni-provider on the Helios light-client backend:
//      the node must return an eth_getProof whose account leaf hashes into the
//      stateRoot of a header the wallet derived from Ethereum consensus itself.
//
// Against an honest node both agree. Against `porch-node --lie` the naive wallet
// shows 1,000,000 ETH and the verifying wallet REJECTS the response outright —
// the registry can be sybiled, the node can be malicious, the read stays safe.
//
// usage: node wallet.mjs [--rpc http://localhost:8646] [--address 0x…] [--consensus url]
import http from 'node:http';
import { helios } from '@kohaku-eth/provider/helios';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const PORCH = arg('rpc', 'http://localhost:8646');
const ADDRESS = arg('address', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // vitalik.eth
const CONSENSUS = arg('consensus', 'https://ethereum-beacon-api.publicnode.com');

const eth = (hexWei) => `${Number(BigInt(hexWei)) / 1e18} ETH`;
const rpc = (method, params) =>
  fetch(PORCH, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  }).then((r) => r.json());

console.log(`porch node under test: ${PORCH}`);
console.log(`account:               ${ADDRESS}\n`);

// ── 1. naive wallet: trusts the node ──────────────────────────────────────────
const naive = await rpc('eth_getBalance', [ADDRESS, 'latest']);
console.log(`[naive wallet]     eth_getBalance = ${eth(naive.result)}  (took the node's word for it)`);

// ── 2. verifying wallet: trusts consensus, not the node ───────────────────────
// Shim: publicnode's /light_client/updates ignores start_period/count and dumps its
// whole history (checked 2026-07-26), which trips Helios's period sequencing. We
// re-filter the array to the requested range before Helios sees it. This is transport
// repair only — every update is still verified by sync-committee signature client-side.
const shim = http.createServer(async (req, res) => {
  const url = new URL(req.url, CONSENSUS);
  const up = await fetch(`${CONSENSUS}${req.url}`).catch(() => null);
  if (!up) { res.writeHead(502); return res.end(); }
  let text = await up.text();
  if (url.pathname.endsWith('/light_client/updates')) {
    try {
      const start = Number(url.searchParams.get('start_period')), count = Number(url.searchParams.get('count'));
      const period = (u) => Math.floor(Number(u.data.attested_header.beacon.slot) / 8192);
      text = JSON.stringify(JSON.parse(text)
        .filter((u) => period(u) >= start && period(u) < start + count)
        .sort((a, b) => period(a) - period(b)));
    } catch { /* pass through */ }
  }
  res.writeHead(up.status, { 'Content-Type': 'application/json' });
  res.end(text);
});
await new Promise((ok) => shim.listen(0, '127.0.0.1', ok));
const SHIMMED = `http://127.0.0.1:${shim.address().port}`;

// Checkpoint = finalized epoch-boundary root, fetched from consensus (not from the porch node).
const fin = await fetch(`${CONSENSUS}/eth/v1/beacon/states/head/finality_checkpoints`).then((r) => r.json());
const checkpoint = fin.data.finalized.root;
console.log(`\n[verifying wallet] syncing Helios light client (checkpoint ${checkpoint.slice(0, 18)}…)`);

const provider = await helios(
  { executionRpc: PORCH, consensusRpc: SHIMMED, checkpoint, network: 'mainnet', dbType: 'config' },
  'ethereum',
);
let code = 0;
try {
  const verified = await provider.request({ method: 'eth_getBalance', params: [ADDRESS, 'latest'] });
  console.log(`[verifying wallet] eth_getBalance = ${eth(verified)}  ✅ VERIFIED — proof matches consensus stateRoot`);
} catch (e) {
  code = 2;
  console.log(`[verifying wallet] ❌ REJECTED — node's proof fails against the light-client header`);
  console.log(`                   (${String(e.message ?? e).slice(0, 120)})`);
}
await provider._internal.shutdown().catch(() => {});
process.exit(code);
