# tests/ — Conformance test vectors (plan)

Modeled on the Ethereum spec repos: consensus-specs and execution-specs both ship **generated fixtures** that every implementation must reproduce, under a documented "general test format." Porch adopts the same idea for the layers execution-apis doesn't cover.

**Split of responsibility:**
- **RPC method shapes** (`eth_getBalance` result format, etc.) — NOT our job. Reuse execution-apis + hive `rpc-compat` against the allowlisted methods (see [`../rpc/`](../rpc/)).
- **Porch-specific layers** — our vectors, below.

## Vector sets (to be generated from the M2 reference implementation)

| Set | Directory | What it pins | Format |
|-----|-----------|--------------|--------|
| **Canonicalization** | `vectors/canonicalization/` | A raw JSON-RPC request → the exact canonical bytes on the wire. This is the anti-fingerprinting core (spec §5, §7); two implementations MUST produce byte-identical output. | `{input, expected_canonical_hex}` |
| **Payment tickets** | `vectors/tickets/` | Deterministic ticket/voucher construction: given (secret, index, node_pubkey, params) → the ticket bytes, spent-flag, and win predicate. | `{witness, expected}` |
| **Vault transitions** | `vectors/vault/` | Deposit / redeem / double-redeem-bounce / expiry state transitions of the shared vault contract. | `{pre, action, post \| error}` |

## Status

Vectors are **not generated yet** — they come from the M2 reference implementation (the EELS pattern: the runnable reference *is* the vector generator). This directory currently holds one hand-written seed vector to fix the format. A `speccheck`-style validator (cf. execution-apis) will check implementations against these.

See [`vectors/canonicalization/example.json`](vectors/canonicalization/example.json) for the seed.
