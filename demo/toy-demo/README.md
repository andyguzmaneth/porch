# demo/toy-demo — conceptual guided tours

> 🎬 **These are MOCKUPS, not runnable demos.** Everything here is **simulated** — no node runs, no registry exists, no chain is queried, no money moves. The sole purpose is to *explain the idea* with a click-through guided tour. For the runnable prototype code see [`../porch-node`](../porch-node) and [`../registry`](../registry); for the real design see [`../../docs/SPEC.md`](../../docs/SPEC.md).

Each version is a single self-contained static page (no build, no dependencies) — open `index.html` directly, or deploy to GitHub Pages / Vercel.

| Version | Shows | Status |
|---------|-------|--------|
| [`v0/`](v0/) | The core loop: a home node **registers** (central server) → a **wallet discovers** it and **reads** the chain. Free, not private. | ✅ mockup |
| `v1/` | + **on-chain registry** & **correctness** (node returns a Merkle proof, the wallet verifies it with a light client) | planned |
| `v2/` | + **privacy** (anonymizing transport + PIR) | planned |
| `v3/` | + **payments** (vault, fee, unlinkable payments) | planned |

The versioning mirrors the spec roadmap (V0 → V1 → V2 → V3), so the tour grows as the concept does — while always staying an illustration, never a proof of a working system.
