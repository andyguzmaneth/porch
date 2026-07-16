# Porch — Design Decisions

The load-bearing choices behind the [spec](SPEC.md), one line each, **phased across V0–V3** (see Phasing below — it is authoritative). Several rows were first written for a payments-first V0; under the current roadmap **payments are V3 and privacy is V2**, so a decision applies at *its* version. Payment decisions (#1, #4, #5, #18–#23, #25, #26, #29) are **V3**; read-path privacy (#3, #24, #30) is **V2**; correctness (#2, #16) lands in **V1**.

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Settlement topology | Shared vault, any node redeems | One deposit, node-agnostic; double-spend bounded by a minimal spent-flag (#20) |
| 2 | Correctness | V0: pure trust; **V1: node Merkle proof + wallet light-client verify** | closes the fake-head risk in V1 |
| 3 | Read-path privacy | **Origin + Content together in V2**; payment-unlinkability in V3 | V0/V1 are explicitly *not private* |
| 4 | Settlement venue | Ethereum mainnet | Vault + identity on L1 |
| 5 | Payment rails | Both; node advertises | Batch-voucher and nanopayment |
| 6 | Node package | Must run a real local node | No proxy — proxies inherit upstream trust/deanonymization |
| 7 | Registry | **V0: central server**; **V1: on-chain contract** | wallet reads the contract directly in V1 |
| 8 | Wallet integration | Sidecar now, native later | Works with any wallet unmodified |
| 9 | Node selection | Small rotating pool (~3) | Unlinkability vs voucher fan-out compromise |
| 10 | Method scope | Curated bounded-cost subset | Keeps a flat fee honest |
| 11 | Read vs write | Read-only in V0 | Transaction relay is a deliberate later step |
| 12 | Fee asset | ETH | Tiny wei-denominated constant |
| 13 | Reputation | Local, private, per-client | On-chain reputation is trivially griefed |
| 14 | Free/altruistic tier | Coexist free + paid, same API | Node signals whether it wants payment |
| 15 | V0 demand target | An aligned open wallet first | Design against a real consumer; validate willingness-to-pay separately |
| 16 | Fake-head defense | Trust in V0; **wallet light-client verify in V1**; node signed-head slashing in V3 | V1 largely closes it |
| 17 | Standard relationship | Companion spec | Plugs into a client-side provider interface; stays independent |
| 18 | Deposit denomination | Fixed denominations + internal balance | Strong anonymity set + decent UX |
| 19 | Nanopayment lottery | Adopt an established proof-of-relay construction | No novel crypto risk |
| 20 | Cross-node solvency | Minimal on-chain spent-flag, lazy detection | No coordinator, no full slashing; bounded economic leakage (V3) |
| 21 | Node exposure | Serve freely, eat rare bounced tickets | Loss bounded & tiny |
| 22 | Withdrawal | None (V3) — use-it-or-expire | Removes withdrawal-proof machinery; small denominations bound waste |
| 23 | DoS floor | Small free probe, then require payment | Probe = fixed tiny method set + rate-limited |
| 24 | Privacy sequencing | Read-path privacy (Origin+Content) ships together in **V2**; payment-unlinkability in V3 | V0/V1 labeled *not private* |
| 25 | Default payment rail | Batch-voucher default; nanopayment opt-in | Gas-flat, deterministic |
| 26 | Fee level | Low constant, governable | V0 doesn't fix an earnings regime |
| 27 | Free-node quality | No special handling — local reputation only | Free and paid equal in selection; reputation sorts them |
| 28 | Registry gas + entries (V1) | Node operators pay their own registration/update gas; entries self-signed by the node key; capability flags are unverified hints until the node delivers | Permissionless + spam-taxed; clients never pay to discover |
| 29 | Slashing (V3 — last) | Deferred to the final incentive-hardening phase. Two stakes: **client** double-spend → small **separate RLN bond**, bonded slash (automatic/cryptographic); **node** misbehavior → slashed **only on cryptographic proof** (signed-head mismatch / failed light-client proof), **never on user complaints** (those feed private reputation only) | Slashing only once incentives/value warrant it; stakes may exist earlier as non-slashable bonds |
| 30 | PIR placement | **Companion spec** (`porch-content`), referenced via the `pir` capability flag + the `eth_getProof` proof hook | Keep core lean; PIR evolves on its own crypto timeline |

## Phasing (sequence) — authoritative

- **V0 — decentralized serving (free):** central-server registry; node serves the allowlist on a confined port; **wallet points at an RPC URL**. No payments, no privacy, no proofs, no contract.
- **V1 — on-chain discovery + correctness:** on-chain registry contract; wallet discovers via the contract; **correctness** = node returns a Merkle proof, **wallet verifies with a light client**. Optional non-slashable stake.
- **V2 — privacy:** **Origin** (network-layer / anonymizing transport) **+ Content (PIR)**; verifiable-PIR is the open research direction.
- **V3 — payments (last):** shared vault, fee, rails, **unlinkable payments**, and **slashing** (client RLN + node signed-head/quorum, cryptographic proof only).

Payment cryptography is entirely V3. V0–V2 serve altruistically.

## Still open

- Discovery-entry supply-chain hardening details (endpoint-hijack requires signed update; sybil handled by gas + stake).
