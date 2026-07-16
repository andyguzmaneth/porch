# Porch — Design Spec (V0, draft/RFC)

**Porch = Paid · Onchain · Reads, · Correct & · Hidden.**

An open protocol for incentivized, privacy-preserving Ethereum reads served by home nodes. This document is an early design RFC — nothing here is implemented yet, and details will change.

### Conventions

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as in RFC 2119 and RFC 8174. Numbered normative requirements are collected in §12. Tunable parameters live in [`presets/porch.yaml`](../presets/porch.yaml), not inline. The served method set is defined by [`rpc/porch-profile.openrpc.json`](../rpc/porch-profile.openrpc.json) — a profile of [ethereum/execution-apis](https://github.com/ethereum/execution-apis), which remains authoritative for method shapes. Conformance vectors: [`tests/`](../tests/).

## 0. Summary

A node operator installs the Porch package alongside their existing Ethereum node. It opens a **separate, confined, paid RPC port**, advertises its capabilities, and is discoverable by clients. A wallet — via a local **sidecar** exposing an ordinary JSON-RPC endpoint — selects a small rotating pool of nodes, sends a read query, pays a **tiny flat fee in ETH** through a **shared, privacy-preserving vault on mainnet**, and receives an answer. V0 is **read-only**, **payment-unlinkable**, and deliberately trust-based on data correctness. Content privacy (PIR) and light-client proof-back come later.

## 1. Goals & non-goals

**Goals (V0)**
- Let ordinary home nodes earn a small fee for serving reads.
- Make payments unlinkable to the payer's identity and to each other.
- Work behind existing wallets unmodified, via a local sidecar.
- Keep the operator's main node untouched — a separate, confined port only.

**Non-goals (V0)** — see §9 for the full list. No PIR, no proof-back, no transaction relay, no on-chain registry, no withdrawals.

## 2. The three privacy layers

Porch separates three independent properties so it never advertises "private" while a lower layer leaks:

| Layer | Question | V0 | Later |
|-------|----------|-----|-------|
| **Origin** | *Who* is asking? | payment unlinkability + pluggable anonymizing transport (Tor / mixnet / OHTTP) | — |
| **Content** | *What* are they asking? | visible to the node (accepted, documented) | PIR — the node can't see which slot/address |
| **Correctness** | Is the answer *true*? | trust + tiny fee + local reputation | light-client proof-back |

A V0 deployment is honestly labeled **Origin-private / Content-visible / Correctness-trusted**.

## 3. Architecture

Four components:

1. **Node package** — installs alongside an existing full node. Opens a *separate confined process/port* (never reconfigures the main node's ACL). Serves only a curated, bounded-cost method set. Advertises a signed capability descriptor. Accepts payment and redeems earnings against the vault.
2. **Sidecar** — a local process exposing a standard JSON-RPC endpoint (`http://localhost:…`). A wallet points at it unmodified. It discovers nodes, selects a rotating pool, canonicalizes the request (anti-fingerprinting), attaches payment, verifies the response, and keeps **local, private reputation**. It is designed to also plug into emerging client-side "provider interface" standards (config-not-code provider selection) so wallets can adopt it natively later.
3. **Discovery** — V0 uses a curated public list plus capability broadcast over the existing node discovery layer (ENR). A permissionless on-chain registry is a later addition.
4. **Shared vault (mainnet)** — one contract. A client deposits once (in a fixed denomination); any registered node redeems payment against it. A minimal on-chain **spent-flag** prevents a credit chunk being redeemed twice. Redemption is **unlinkable** to the depositor.

## 4. Node capability descriptor

Signed by the node key, published in its discovery entry:

- `endpoint` (+ optional `.onion` / mixnet address)
- `real_node: bool` — runs its own node vs proxy (V0: must be `true`)
- `pir: bool` — Content-layer privacy (V0: `false`)
- `proof_back: bool` + `light_client` — Correctness proof (V0: `false`)
- `wants_payment: bool` — `false` = altruistic/free node (same API); `true` = charges
- `payment_rails: [batch_voucher (default) | nanopayment (opt-in)]`
- `methods: [...]` — supported subset
- `fee` — low governable constant when paid

### V0 method allowlist

Only bounded-cost reads, so a flat fee stays honest.

**Allowed:** `eth_chainId`, `eth_blockNumber`, `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode`, `eth_getStorageAt`, `eth_call` (gas-capped), `eth_estimateGas` (capped), `eth_gasPrice`, `eth_feeHistory` (bounded), `eth_getBlockByNumber`/`ByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`.

**Excluded (until priced, later):** wide-range `eth_getLogs`, `debug_*` / `trace_*`, stateful filters, subscriptions.

## 5. Protocol flows (V0)

**Deposit (once):** deposit ETH in a fixed denomination into the shared vault; derive a secret; receive an anonymous spendable credit. Spends carry a minimal spent-flag (§6) — not a full rate-limit-nullifier key-reveal.

**Discover & select:** pull the list + capability adverts, filter by required capabilities, pick a **rotating pool (~3)**, reshuffle periodically to bound any single node's view of a session.

**Request → pay → respond (per call):**
1. The sidecar canonicalizes the JSON-RPC request to a **byte-identical form across users** (fixed field order, lowercased addresses, normalized `id`, fixed batch shape) — this defeats payload watermarking.
2. It attaches payment on the node's rail (batch-voucher by default; nanopayment opt-in).
3. The node serves the answer from its real local node and returns the answer tagged with the `(blockNumber, blockHash)` it was answered at.
4. The sidecar updates **local private reputation** (latency, availability, correctness spot-checks) and drops misbehaving nodes.

**Redeem (node):** submit a batch-voucher proof (or a winning nanopayment ticket) to the vault; the spent-flag prevents double-redeem.

## 6. Payment design

- **Shared vault** underpins both rails; the deposit is node-agnostic so a rotating pool doesn't fragment funds.
- **Default rail: batch-voucher** — one redemption transaction per epoch regardless of volume, gas-flat and deterministic. **Nanopayment** (probabilistic proof-of-relay tickets, in the style of established payment-channel networks) is opt-in and only viable with a very small win-probability so settlements are rare.
- **Double-spend / solvency:** a **minimal on-chain spent-flag** checked lazily at redemption. No real-time coordinator, no full key-reveal-and-slash in V0. This flag is unavoidable for any prepaid/bearer instrument; with it, overspend is bounded economically (a cheater burns their own deposit to gain at most ~(pool−1)× tiny-fee service, gas-taxed per fresh identity). Full rate-limit-nullifier slashing is a later hardening if leakage proves material.
- **Fixed denominations + unified internal balance** keep the anonymity set from fragmenting on top-ups; redemption should be delayed/aggregated so timing doesn't correlate a redemption to a deposit.

### Why not one signer / per-node channels
A single stateful signer would re-introduce a trusted party and doesn't fit a rotating pool; per-node payment channels fragment a client's funds across nodes. The shared vault + spent-flag keeps one balance spendable across any node while staying unlinkable.

## 7. Threat model & accepted V0 risks

**Accepted (documented, not solved in V0):**
- **Fake chain head** — a dishonest node can serve a wrong head. This is a real, observed class of attack (malicious custom-RPC scams). Bounded by the tiny fee + local reputation; the signed-head + quorum-slash defense is deferred to **V3** (incentive hardening — nodes are slashed only on cryptographic proof, never on complaints). *Highest residual risk.*
- **Content visibility** — the node sees the query; the *set of addresses* in a session can re-link it to an on-chain identity even under perfect transport privacy. Partially mitigated by pool rotation + canonicalization; fully addressed only by PIR (later).
- **Can't prove state was *served*** — "I sent it / I never got it" is unresolvable; loss is bounded to one fee, not prevented.

**Cheap, high-leverage musts in V0:**
- **Payload canonicalization** + a reproducible/standardized client (client fingerprints deanonymize when clients differ).
- **Confined port/process** — never widen the main node's exposure.
- **Local private reputation** — never an on-chain reputation (trivially griefed).

## 8. Unit economics

Per-node earnings ≈ `calls_routed_per_day × fee − redemption_gas − marginal_infra`, with marginal infra ≈ 0 (the box already runs a node).

The binding variable is **calls routed per day**, which an operator can't control — it depends on client demand and how the sidecar spreads load. Supply (people willing to run a node for a little money) is easy; **demand is the gate.** A flat fee redeemed per-call on mainnet would lose to gas, which is why batch-voucher (one redemption per epoch) is the default and nanopayment needs a very small win-probability. The fee is a low, governable constant; V0 does not commit to an earnings regime.

## 9. Out of scope for V0

PIR / Content privacy · light-client proof-back · transaction relay (`eth_sendRawTransaction`) · heavy methods · on-chain registry contract · signed-head slashing · full rate-limit-nullifier slashing · withdrawals (credits are use-it-or-expire) · per-node pricing / QoS market · non-ETH fee assets · native (non-sidecar) wallet integration.

## 10. Roadmap

- **M1 — walking skeleton:** paid read, one node, deterministic settle, no privacy yet.
- **M2 — payment rails + vault (privacy-native):** fixed-denomination deposit, batch-voucher + nanopayment, spent-flag, **unlinkable-to-deposit is a definition-of-done from here on**.
- **M3 — marketplace:** discovery, rotating pool with health-check, local reputation, free+paid coexistence, DoS free-probe.
- **M4 — Origin transport hardening:** payload canonicalization + anonymizing transport.
- **V1 — decentralize discovery:** on-chain permissionless registry; stake-to-be-featured as a **non-slashable** sybil/quality bond; native wallet integration.
- **V2 — privacy + correctness:** PIR (companion spec), light-client proof-back (Correctness, `eth_getProof`), transaction relay.
- **V3 — incentive hardening (last):** slashing turns on — client full-RLN (separate bonded) + node signed-head/quorum, **on cryptographic proof only**.

Stakes may appear in V1 as non-slashable bonds; slashing (the enforcement layer) is deliberately last, only once real value is at stake. See [MILESTONES.md](MILESTONES.md) for definitions of done.

## 11. Prior art & reuse

Porch composes existing pieces rather than reinventing them:

- **Paid private RPC** — RPCh (later Gnosis VPN, over HOPR) built a paid private-RPC relay; a post-mortem of why it stalled is a prerequisite before building.
- **Decentralized state** — Portal Network serves state peer-to-peer but has no incentive layer.
- **DePIN RPC markets** — Pocket, Lava, dRPC pay providers but offer no read privacy.
- **Light clients** (correctness proof-back, later): Helios, Colibri.
- **PIR** (content privacy, later): recent single-server PIR schemes.
- **Anonymizing transport** (origin): Tor, Nym, OHTTP.
- **Probabilistic micropayments**: established proof-of-relay ticket constructions.

## 12. Normative requirements (RFC 2119)

Numbered so implementations and reviews can cite them. Values written `presets.<path>` come from [`presets/porch.yaml`](../presets/porch.yaml).

**Node**
- **N1.** A node MUST serve only the methods in the [RPC profile](../rpc/porch-profile.openrpc.json) and MUST reject any other method.
- **N2.** A node MUST run its own execution + consensus node in V0 (`real_node = true`) and MUST NOT proxy an upstream RPC.
- **N3.** A node MUST expose its paid interface on a separate, confined process/port and MUST NOT widen the main node's exposure.
- **N4.** A node MUST enforce the per-method caps in `presets.rpc.*` and MAY reject an over-cap call with a standard error.
- **N5.** Before serving a paid method a node MUST require a valid payment ticket; it MAY serve `presets.rpc.probe_methods` free and rate-limited.
- **N6.** A node MUST tag each response with the `(blockNumber, blockHash)` it was answered at.

**Client / sidecar**
- **C1.** The sidecar MUST canonicalize each request to the byte-exact form fixed by the canonicalization vectors before it leaves the process.
- **C2.** The sidecar MUST spread requests across `presets.selection.pool_size` nodes and MUST reshuffle per `presets.selection.*`.
- **C3.** The sidecar MUST keep reputation local and private and MUST NOT publish per-client reputation on-chain.
- **C4.** The sidecar SHOULD verify the response's block tag against its freshness policy.

**Vault / payment**
- **V1.** The vault MUST record a spent-flag at redemption and MUST reject a second redemption of the same credit chunk.
- **V2.** A deposit MUST use a denomination in `presets.vault.denominations_wei`.
- **V3.** V0 MUST NOT expose a withdrawal path; credit unspent past `presets.vault.credit_ttl_seconds` MUST settle to the treasury.
- **V4.** From M2 onward, payments MUST be unlinkable to the deposit; no release MUST ship a linkable-payment path.

**Privacy**
- **P1.** An implementation MUST NOT advertise "private" without stating which of Origin / Content / Correctness it provides (§2).
- **P2.** Clients SHOULD ship a reproducible/standard build so client fingerprints don't deanonymize (§7).

---
*Porch is an open design. Feedback and critique via issues welcome.*
