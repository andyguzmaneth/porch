# Porch — Design Spec (draft/RFC)

**Porch = Paid · Onchain · Reads, · Correct & · Hidden.** *(the vision; the build order is the reverse — see §2.)*

An open protocol for decentralized, eventually-private, eventually-paid Ethereum reads served by home nodes. This is an early design RFC — nothing here is implemented yet, and details will change.

### Conventions

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY** are as in RFC 2119 / RFC 8174. Numbered normative requirements are in §12, tagged by the version they take effect. Tunable parameters live in [`presets/porch.yaml`](../presets/porch.yaml). The served method set is defined by [`rpc/porch-profile.openrpc.json`](../rpc/porch-profile.openrpc.json) — a profile of [ethereum/execution-apis](https://github.com/ethereum/execution-apis), authoritative for method shapes. Conformance vectors: [`tests/`](../tests/).

## 0. Summary

A node operator runs the Porch package alongside the Ethereum node already in their house. It opens a **separate, confined RPC port** serving a bounded set of read methods, and **self-registers** so wallets can find it. A wallet **points at a Porch node's URL** (or, later, discovers one via an on-chain registry) and reads the chain — spread across many independent homes instead of one central provider.

That's **V0**. The roadmap then adds, in order: **correctness** (the wallet can verify answers — V1), **privacy** (the network can't see who's asking or what — V2), and **payments** (nodes get paid — V3).

## 1. Why

Most wallets read the chain through a handful of centralized RPC providers. That provider sees the set of addresses you look up — effectively your identity — and you must trust the answers it returns. Porch decentralizes the read path: many home nodes, discoverable, interchangeable. Value shows up **before** privacy or payments — as **redundancy, choice, and censorship-resistance** (thousands of homes still answer when one provider is blocked or sanctions a query).

## 2. Phasing — the build order (authoritative)

Payments and privacy are **not** in the first cut. Each version is independently useful and adds exactly one capability:

| Version | Adds | Privacy layer (§3) | Incentive |
|---------|------|--------------------|-----------|
| **V0** | Central-server registration + read serving; **wallet points at an RPC URL**. Free. | none | altruistic |
| **V1** | **On-chain registry** (smart contract); node registers on-chain; **wallet integrates with the contract** to discover; **correctness proofs** — the node returns a Merkle proof, the **wallet verifies it with a light client** | **Correctness** | altruistic |
| **V2** | **Origin privacy** (network-layer / anonymizing transport) **+ Content privacy (PIR)** — hide *who* is asking and *what* | **Origin + Content** | altruistic |
| **V3 (last)** | **Payments** — shared vault, fee, rails, **private (unlinkable) payments**, and slashing | payment privacy | **paid** |

Consequences worth stating plainly:
- **All payment cryptography (vault, rails, unlinkable payments, RLN, slashing) is deferred to V3.** V0–V2 need none of it.
- **V0–V2 nodes serve altruistically** — the earning incentive lands only in V3. Early adoption leans on goodwill and censorship-resistance, not revenue.
- "Unlinkability" is split: **read-path privacy** (who/what you read) is **V2**; **payment unlinkability** is **V3**.

## 3. The three privacy layers (framework)

Porch never advertises "private" while a lower layer leaks. The layers map onto the phases above:

| Layer | Question | Lands in | How |
|-------|----------|----------|-----|
| **Correctness** | Is the answer *true*? | **V1** | node returns a Merkle proof; the **wallet verifies via a light client** (local, privacy-neutral) |
| **Origin** | *Who* is asking? | **V2** | anonymizing transport (Tor / mixnet / OHTTP) + payload canonicalization |
| **Content** | *What* are they asking? | **V2** | PIR — the node can't see which slot/address |

A V0/V1 deployment is honestly labeled **not private** (Origin- and Content-visible). Privacy arrives together in V2.

## 4. Architecture

- **Node package** — installs beside an existing full node. Opens a *separate, confined process/port* (never widens the main node). Serves only the allowlist (§5). Self-registers. *(V1+ also produces Merkle proofs; V2+ optional PIR; V3+ accepts payment.)*
- **Discovery** — **V0: a central registry server** (`register` / `nodes`). **V1: an on-chain registry contract** the node registers to and the wallet reads directly.
- **Wallet / client** — **V0: points at a node's RPC URL** (works unmodified behind a thin local sidecar, or natively). **V1: reads the on-chain registry + runs a light client to verify proofs.** May keep **local, private reputation** to drop bad nodes.
- **Payment vault (V3)** — a shared on-chain vault; deposit once, any node redeems; unlinkable to the depositor. Fully out of scope until V3 (see §8).

## 5. Node capability descriptor & method allowlist

Descriptor (self-signed, in the registry entry): `endpoint` · `real_node` · `proof_back` (+`light_client`) · `pir` · `wants_payment` (+`payment_rails`, `fee`) · `methods`. Capability flags are **unverified hints until the node delivers** (dropped/reputation-demoted if it lies).

**V0 allowlist** (bounded-cost reads, so pricing stays sane later): `eth_chainId`, `eth_blockNumber`, `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode`, `eth_getStorageAt`, `eth_call` (gas-capped), `eth_estimateGas` (capped), `eth_gasPrice`, `eth_feeHistory` (bounded), `eth_getBlockByNumber`/`ByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`. **Excluded:** wide `eth_getLogs`, `debug_*`/`trace_*`, stateful filters, subscriptions. **Reserved:** `eth_getProof` — served in **V1** as the proof hook.

## 6. Per-version design

### V0 — decentralized serving (free)
Flow: node opens the confined port → self-registers with the central server (heartbeats) → wallet fetches the node list (or is handed a URL) → wallet sends an allowlisted read → node serves from its own node, tagging the response with the `(blockNumber, blockHash)` it answered at. No payments, no privacy, trust-based correctness.

### V1 — on-chain discovery + correctness
- **On-chain registry contract:** nodes register (self-signed entry: endpoint, capabilities); **node operators pay their own gas**; the wallet reads the contract directly to discover. Stake-to-be-featured may appear here as a **non-slashable** sybil/quality bond.
- **Correctness = wallet-verified.** The node returns the answer **plus a Merkle proof** (`eth_getProof`). The wallet verifies it against a trusted header obtained from **its own light client** ("light lines" — e.g. Helios / lightspan). This is privacy-neutral: verification is local, and the proof reveals nothing the node didn't already see. *Rejected alternative:* the node generating a validity proof *of the specific query* — leaks, and collides with PIR.

### V2 — privacy (Origin + Content)
- **Origin (network-layer):** route wallet↔node over anonymizing transport (Tor / mixnet / OHTTP) + canonicalize the request to a byte-identical form across users (defeats payload fingerprinting) + a reproducible/standard client.
- **Content:** **PIR**, so the node can't learn which slot/address was read. Companion spec (`porch-content`).
- **Open direction — verifiable PIR:** combining PIR with correctness proofs (proving the answer is right *without revealing the queried index*) is the important, unsolved piece here. Not explored yet; flagged as the key V2 research problem so V1's plaintext Merkle-proof isn't assumed to compose with PIR for free.

### V3 — payments (last)
- **Shared vault (mainnet):** deposit once in a **fixed denomination** into a unified internal balance; any registered node redeems; **redemption is unlinkable to the deposit**.
- **Rails:** **batch-voucher** default (one redemption tx per epoch, gas-flat); **nanopayment** (probabilistic proof-of-relay tickets) opt-in with a small win-probability so settlements are rare.
- **Double-spend:** a **minimal on-chain spent-flag** at redemption bounds overspend economically (a cheater burns their own deposit; ~(pool−1)× tiny-fee leakage). **Full RLN key-reveal slashing** (via a *separate* small bond) and **node signed-head/quorum slashing** turn on here, **only on cryptographic proof, never on complaints**.
- **Fee:** a low, governable constant; no fixed earnings regime.
- Fixed denominations + delayed/aggregated redemption keep the anonymity set intact.

## 7. Threat model (by version)

- **Fake chain head** (all versions until V1 closes it) — a dishonest node can serve a wrong head; a real, observed scam. V0 bounds it by reputation only; **V1 largely closes it** (wallet-side light-client verification catches a wrong header). Node signed-head slashing is a V3 add.
- **Read-path exposure** (until V2) — the node sees who (IP) and what (query) you ask; the *set of addresses* in a session can re-link to identity. Addressed only in **V2** (Origin + Content). Be explicit that V0/V1 are **not private**.
- **Payment overspend / griefing** (V3 only) — bounded by the spent-flag + separate bond; slashing on proof, never complaints.
- **Can't prove state was *served*** — unresolvable; loss is bounded, not prevented.

## 8. Out of scope (per version)

- **Out of V0:** on-chain registry, correctness proofs, any privacy, any payments.
- **Out until V2:** PIR, anonymizing transport, payload canonicalization.
- **Out until V3:** the vault, fees, payment rails, unlinkable payments, withdrawals, slashing.
- **Not planned near-term:** transaction relay (`eth_sendRawTransaction`), heavy methods (wide `eth_getLogs`, traces), per-node pricing market, non-ETH fee assets.

## 9. Economics (V3)

Per-node earnings ≈ `calls_routed_per_day × fee − redemption_gas`. The binding variable is **calls routed per day**, set by demand and how clients spread load — **supply is easy, demand is the gate.** Batch-voucher (one redemption/epoch) keeps mainnet gas from eating a tiny fee. Because payments are V3, **the demand test happens earlier** (do wallets route to Porch nodes for free, on decentralization/censorship-resistance alone?) — if they don't, payments never matter.

## 10. Milestones

See [MILESTONES.md](MILESTONES.md). Summary: **M0/V0** register + serve (a runnable toy exists in [`../demo`](../demo)); **V1** on-chain registry + wallet light-client verification of Merkle proofs; **V2** Origin + Content privacy (+ verifiable-PIR research); **V3** payments + slashing.

## 11. Prior art & reuse

- **Paid private RPC** — RPCh (later Gnosis VPN, over HOPR) built this and stalled; post-mortem is a prerequisite before V3.
- **Decentralized state** — Portal Network (no incentive layer).
- **DePIN RPC** — Pocket, Lava, dRPC (no read privacy).
- **Light clients (V1):** Helios, Colibri, lightspan.
- **PIR (V2):** recent single-server PIR; verifiable-PIR is the open direction.
- **Anonymizing transport (V2):** Tor, Nym, OHTTP.
- **Micropayments (V3):** established proof-of-relay ticket constructions.

## 12. Normative requirements (RFC 2119)

Values written `presets.<path>` come from [`presets/porch.yaml`](../presets/porch.yaml). Each requirement is tagged with the version it takes effect.

**Node**
- **N1 (V0).** A node MUST serve only the methods in the [RPC profile](../rpc/porch-profile.openrpc.json) and MUST reject any other method.
- **N2 (V0).** A node MUST expose its interface on a separate, confined process/port and MUST NOT widen the main node's exposure.
- **N3 (V0).** A node MUST enforce the per-method caps in `presets.rpc.*` and MAY reject an over-cap call.
- **N4 (V0).** A node MUST tag each response with the `(blockNumber, blockHash)` it was answered at.
- **N5 (V1).** A node claiming `proof_back` MUST return a Merkle proof (`eth_getProof`-shaped) with the answer.
- **N6 (V3).** Before serving a *paid* method a node MUST require a valid payment ticket; a free node MAY serve without one.

**Client / wallet**
- **C1 (V1).** A verifying client MUST check the returned Merkle proof against a header from its own light client before trusting an answer.
- **C2 (V2).** The client MUST canonicalize each request to the byte-exact form fixed by the canonicalization vectors before it leaves the process.
- **C3 (all).** The client MUST keep reputation local and private and MUST NOT publish per-client reputation on-chain.

**Vault / payment (V3)**
- **V1p.** The vault MUST record a spent-flag at redemption and MUST reject a second redemption of the same credit chunk.
- **V2p.** A deposit MUST use a denomination in `presets.vault.denominations_wei`; payments MUST be unlinkable to the deposit.
- **V3p.** Slashing MUST fire only on cryptographic proof (double-signal / signed-head mismatch / failed proof), never on user complaints.

**Privacy**
- **P1 (all).** An implementation MUST NOT advertise "private" without stating which of Origin / Content / Correctness it provides (§3). V0 and V1 MUST be labeled **not private**.

---
*Porch is an open design. Feedback and critique via issues welcome.*
