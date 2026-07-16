# node/ — Porch home-node package

The package a node operator installs alongside their existing Ethereum node. It opens a **separate, confined, paid RPC port** — it does *not* reconfigure or widen the main node.

Responsibilities:
- Serve the bounded-cost method allowlist from the real local node.
- Publish a signed capability descriptor (real-node, payment rails, fee, methods).
- Accept payment (batch-voucher by default; nanopayment opt-in) and redeem against the vault.
- Enforce the DoS floor: a small free probe, then require payment.

Intended distribution: as a package for the home-staker node distributions people already run.

*Not implemented yet — see [../docs/SPEC.md](../docs/SPEC.md) §3–§6.*
