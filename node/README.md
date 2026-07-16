# node/ — Porch home-node package

The package a node operator installs beside the Ethereum node already in their house. It opens a **separate, confined RPC port** — it does *not* widen or reconfigure the main node.

**V0 (free serving):**
- Serve the bounded-cost method allowlist from the real local node.
- Publish a signed capability descriptor (endpoint, methods, `real_node`).
- Self-register — **V0: to the central registry server**.
- DoS floor: a small free probe, then rate-limit. **No payments in V0.**

**Later versions:**
- **V1:** register to the **on-chain registry contract**; return a **Merkle proof** (`eth_getProof`) alongside each answer so the wallet can verify it with its own light client.
- **V2:** optional PIR serving (Content privacy).
- **V3:** accept payment (rails, fee) and redeem against the vault.

Intended distribution: a package for the home-staker node distributions people already run.

*Not implemented yet — see [../docs/SPEC.md](../docs/SPEC.md).*
