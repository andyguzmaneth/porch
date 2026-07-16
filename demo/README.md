# demo/ — Porch toy demo

> ⚠️ **Toy / illustrative only.** This is a disposable prototype to *show the idea* and test the loop — **not** the real implementation (that's Rust, serves from a real local node, and has payments/privacy). No money moves here. No privacy guarantees here. Do not run against anything you care about.

It demonstrates the one thing that makes Porch click: **install → self-register → discover → serve a read.**

```
  your node's RPC ──► porch-node (allowlisted proxy) ──► registry ◄── website/client
                                                          picks a node, reads the chain
```

## Parts

| Folder | What it is |
|--------|-----------|
| `porch-node/` | the code an operator runs on their node — a confined, allowlisted RPC port that self-registers |
| `registry/` | a minimal in-memory registry (`POST /register`, `POST /heartbeat`, `GET /nodes`) — stands in for the eventual on-chain registry |
| `website/` | a static landing page: the idea, local run steps, a video placeholder, and a **live panel** that reads the chain through a registered node |

## Run it locally (3 terminals, no install)

Needs Node 18+. Zero dependencies.

```bash
# 1) registry
node demo/registry/registry.mjs                 # :8700

# 2) a "home node" — wrap ANY Ethereum RPC (your node, or a public one for the demo)
node demo/porch-node/porch-node.mjs \
  --rpc https://ethereum-rpc.publicnode.com \
  --name alice-porch --port 8646

# 3) the website — any static server
cd demo/website && python3 -m http.server 8080
# open http://localhost:8080
```

Start a **second** `porch-node` on `--port 8647 --name bob-porch` and watch two homes show up in the directory.

## What it deliberately fakes / omits
Payments, the ZK vault, unlinkability, PIR, proof-back, on-chain registry, slashing, and "runs a real node" (it proxies an upstream RPC). All of that is the real build — see [`../docs/SPEC.md`](../docs/SPEC.md).
