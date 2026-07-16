# rpc/ — Porch RPC profile

[`porch-profile.openrpc.json`](porch-profile.openrpc.json) is a **profile** (strict subset) of the Ethereum JSON-RPC API defined by [ethereum/execution-apis](https://github.com/ethereum/execution-apis).

Design rule: **Porch does not redefine method shapes.** The canonical params/results for `eth_getBalance`, `eth_call`, etc. are whatever execution-apis says. This file only declares:
- **which** methods a Porch V0 node serves (the allowlist),
- the **tier** of each (free `probe` vs `paid`),
- and Porch-specific **caps** (`gas_cap`, `max_block_count`, …), whose values live in [`../presets/porch.yaml`](../presets/porch.yaml).

## Conformance for free

Because a Porch node speaks standard JSON-RPC, the allowlisted methods can be validated against the canonical schemas using **hive's `rpc-compat`** suite (the same conformance harness the execution clients use). Porch adds only its own vectors for the *payment* and *canonicalization* layers — see [`../tests/`](../tests/).

## The proof hook

`eth_getProof` (defined in execution-apis) is **reserved, not served** in V0. It is the exact mechanism for the future Correctness layer: a node returns a Merkle proof that the sidecar verifies against a trusted header. See spec §2, §10.
