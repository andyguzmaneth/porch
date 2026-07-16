# sidecar/ — Porch client sidecar

A small local process exposing an ordinary JSON-RPC endpoint (`http://localhost:…`) a wallet points at unmodified.

- **V0:** discover nodes (from the **central registry**), forward allowlisted reads, keep **local, private reputation**, drop bad nodes. Verify the response's `(blockNumber, blockHash)` freshness tag.
- **V1:** discover via the **on-chain registry**; **verify the node's Merkle proof against a header from its own light client** before trusting an answer.
- **V2:** **canonicalize** each request to a byte-identical form (anti-fingerprinting) + route over anonymizing transport (Origin privacy).
- **V3:** attach **payment** on the node's rail and verify the fee receipt.

Designed to also plug into emerging client-side provider interfaces so wallets can adopt Porch natively, without a sidecar.

*Not implemented yet — see [../docs/SPEC.md](../docs/SPEC.md).*
