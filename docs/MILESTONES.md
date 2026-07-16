# Porch — Milestones

Build order and definitions of done. Phase 0 is due diligence, not code.

## Phase 0 — Due diligence (no code)

- **RPCh post-mortem** — the closest prior product (paid private RPC over an incentivized relay) stalled; understand *why* (demand? UX? economics? latency?) before building.
- **Portal Network post-mortem** — closest decentralized-state substrate; no incentive layer.
- **Demand validation** — confirm a real consumer (a wallet that already pays for RPC is the strongest signal). Lead with censorship-resistance, not only privacy.

Gate: a short go/no-go memo.

## M1 — Walking skeleton

Node package serves the allowlist on a confined port; sidecar (localhost JSON-RPC) → one node; deposit + a *deterministic* on-chain micro-settle (skip the lottery); no unlinkability yet.

**Done when:** a wallet pointed at the sidecar gets a *paid* `eth_getBalance` end-to-end.

## M2 — Payment rails + vault (privacy-native)

Fixed-denomination deposit + internal balance; batch-voucher (default) and nanopayment tickets with the spent-flag; node redemption; rerandomized commitments so redemption is unlinkable to the deposit.

**Done when:** one deposit funds ≥1k calls; only the right settlements land on-chain; a double-redeem bounces; **payments are unlinkable to the deposit** (a definition-of-done from here on).

## M3 — Marketplace

Curated list + ENR capability adverts; sidecar selects a rotating pool of ~3 with health-check/evict; local private reputation; free+paid coexistence; DoS free-probe.

**Done when:** the sidecar survives a pool node dropping mid-session; free and paid nodes interoperate.

## M4 — Origin transport hardening

Payload canonicalization + a reproducible/standard client; anonymizing transport (Tor / mixnet / OHTTP).

**Done when:** two users' identical requests are byte-identical on the wire (payment-unlinkability already gating since M2).

## Later

- **V1 — decentralize discovery:** on-chain permissionless registry; **stake-to-be-featured as a non-slashable** sybil/quality bond; native wallet integration.
- **V2 — privacy + correctness:** PIR (companion spec, Content privacy); light-client proof-back (Correctness, `eth_getProof`); transaction relay.
- **V3 — incentive hardening (last):** slashing turns on — **client** full-RLN double-spend (separate bonded) + **node** signed-head/quorum, slashed **only on cryptographic proof, never on user complaints**. Deferred to the very end: slashing only matters once incentives put real value at stake.
