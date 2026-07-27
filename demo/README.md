# demo/

Three different things live here — don't confuse them:

## 1. `toy-demo/` — the conceptual guided tour (the pitch) 🎬
**Mockup, not runnable.** A click-through, three-panel story (wallet ← registry ← home-node terminal) that *explains the idea*. Everything is simulated — no node, no chain, no money. Versioned `v0/`, `v1/`, `v2/` to mirror the roadmap. Deployable to GitHub Pages / Vercel; also opens by double-clicking `index.html`.

→ [`toy-demo/`](toy-demo/) · start at [`toy-demo/v0/`](toy-demo/v0/)

## 2. `porch-node/` + `registry/` — runnable prototype code ⚙️
**Actual code, but a throwaway prototype** (the real node is Rust; this is Node/JS to prove the loop). No payments, no privacy — illustrative. Zero dependencies, Node 18+.

```bash
# directory
node registry/registry.mjs                          # :8700
# a "home node" wrapping any Ethereum RPC
node porch-node/porch-node.mjs \
  --rpc https://ethereum-rpc.publicnode.com --name alice-porch --port 8646
# then query it
curl -s -X POST http://localhost:8646 \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}'
curl -s http://localhost:8700/nodes
```
Non-allowlisted methods (e.g. `eth_getLogs`) are rejected; the node self-registers and appears in `/nodes`.

## 3. `tamper-demo/` — V1 correctness, live 🔒
**Runnable, real verification.** A light-client wallet (Kohaku provider on Helios) reads a
mainnet balance *through* an untrusted porch-node: honest node → ✅ verified; node started
with `--lie` → ❌ rejected (`invalid account proof`). The registry can't make you accept
bad data — safety is client-side.

→ [`tamper-demo/`](tamper-demo/)

---
Neither is the real system. Design of record: [`../docs/SPEC.md`](../docs/SPEC.md).
