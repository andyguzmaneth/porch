# sidecar/ — Porch client sidecar

A small local process that exposes an ordinary JSON-RPC endpoint (`http://localhost:…`). A wallet points at it unmodified.

Responsibilities:
- Discover nodes and select a rotating pool (~3), reshuffling periodically.
- **Canonicalize** each request to a byte-identical form across users (anti-fingerprinting).
- Attach payment on the node's rail and verify the fee receipt.
- Verify the response's `(blockNumber, blockHash)` tag against the client's freshness policy.
- Keep **local, private reputation** and drop misbehaving nodes.

Designed to also plug into emerging client-side provider interfaces so wallets can adopt Porch natively later, without a sidecar.

*Not implemented yet — see [../docs/SPEC.md](../docs/SPEC.md) §3, §5.*
