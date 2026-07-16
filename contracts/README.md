# contracts/ — Porch shared payment vault

One on-chain contract on Ethereum mainnet.

Responsibilities:
- Accept fixed-denomination deposits into a unified internal balance.
- Let any registered node redeem payment (batch-voucher proof or winning nanopayment ticket).
- Maintain a **minimal spent-flag** so a credit chunk can't be redeemed twice.
- No withdrawal path in V0 — credits are use-it-or-expire (unclaimed → treasury).

Deliberately *not* included in V0: withdrawal / escape-hatch proofs, full rate-limit-nullifier key-reveal slashing, an on-chain node registry (these come in V1).

*Not implemented yet — see [../docs/SPEC.md](../docs/SPEC.md) §3, §6.*
