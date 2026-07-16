# Porch — Design Decisions (V0)

The load-bearing choices behind the [spec](SPEC.md), with the rationale in one line each. These are decisions for the V0 design; several are deliberately revisited in later versions.

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Settlement topology | Shared vault, any node redeems | One deposit, node-agnostic; double-spend bounded by a minimal spent-flag (#20) |
| 2 | V0 correctness trust | Pure trust + tiny flat fee | Incl. the chain head (accepted risk, §7) |
| 3 | V0 privacy target | Payment unlinkability | Query content still visible; Content privacy is a later layer |
| 4 | Settlement venue | Ethereum mainnet | Vault + identity on L1 |
| 5 | Payment rails | Both; node advertises | Batch-voucher and nanopayment |
| 6 | Node package | Must run a real local node | No proxy — proxies inherit upstream trust/deanonymization |
| 7 | Registry | Curated list + ENR now; on-chain later | Fast to a live network; permissionless registry comes with V1 |
| 8 | Wallet integration | Sidecar now, native later | Works with any wallet unmodified |
| 9 | Node selection | Small rotating pool (~3) | Unlinkability vs voucher fan-out compromise |
| 10 | Method scope | Curated bounded-cost subset | Keeps a flat fee honest |
| 11 | Read vs write | Read-only in V0 | Transaction relay is a deliberate later step |
| 12 | Fee asset | ETH | Tiny wei-denominated constant |
| 13 | Reputation | Local, private, per-client | On-chain reputation is trivially griefed |
| 14 | Free/altruistic tier | Coexist free + paid, same API | Node signals whether it wants payment |
| 15 | V0 demand target | An aligned open wallet first | Design against a real consumer; validate willingness-to-pay separately |
| 16 | Fake-head defense | Pure-trust in V0 | Signed-head + slashing deferred to V1 |
| 17 | Standard relationship | Companion spec | Plugs into a client-side provider interface; stays independent |
| 18 | Deposit denomination | Fixed denominations + internal balance | Strong anonymity set + decent UX |
| 19 | Nanopayment lottery | Adopt an established proof-of-relay construction | No novel crypto risk |
| 20 | Cross-node solvency | Minimal on-chain spent-flag, lazy detection | No coordinator, no full slashing; bounded economic leakage in V0 |
| 21 | Node exposure | Serve freely, eat rare bounced tickets | Loss bounded & tiny |
| 22 | Withdrawal | None in V0 — use-it-or-expire | Removes withdrawal-proof machinery; small denominations bound waste |
| 23 | DoS floor | Small free probe, then require payment | Probe = fixed tiny method set + rate-limited |
| 24 | Privacy sequencing | Privacy-native from M2 | No milestone ships a linkable-payment path |
| 25 | Default payment rail | Batch-voucher default; nanopayment opt-in | Gas-flat, deterministic |
| 26 | Fee level | Low constant, governable | V0 doesn't fix an earnings regime |
| 27 | Free-node quality | No special handling — local reputation only | Free and paid equal in selection; reputation sorts them |

## Notable open questions (later versions)

- Who pays gas to update the V1 on-chain registry; supply-chain risk on discovery entries.
- Slashing severity when full rate-limit-nullifier slashing lands (bonded-portion vs full-deposit).
- Whether Content privacy (PIR) belongs in this spec or a companion.
