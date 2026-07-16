# Porch — Milestones

Build order. Each version is independently useful and adds exactly one capability. **Payments are last (V3).**

## Phase 0 — due diligence (no code)

- **RPCh post-mortem** — the closest prior product (paid private RPC over an incentivized relay) stalled; understand *why* before committing to the **V3** payment layer.
- **Portal Network post-mortem** — closest decentralized-state substrate; no incentive layer.
- **Demand check** — because payments are V3, the demand test happens *inside V0/V1*: will wallets route to Porch nodes for free, on decentralization + censorship-resistance alone? If not, payments never matter.

## V0 — decentralized serving (free)

Central-server registry + node serves the allowlist on a confined port; a wallet points at a node's URL (or the server's list). No payments, no privacy, trust-based correctness.

**Done when:** a wallet pointed at a Porch node gets a correct `eth_getBalance`, and the node self-registers and appears in the directory. *(A runnable toy of exactly this already lives in [`../demo`](../demo).)*

## V1 — on-chain discovery + correctness

- On-chain **registry contract**: nodes register (operators pay their own gas); the wallet reads the contract directly to discover. Optional **non-slashable** stake-to-be-featured.
- **Correctness:** the node returns the answer **+ a Merkle proof** (`eth_getProof`); the **wallet verifies it with its own light client** (Helios / lightspan). Privacy-neutral.

**Done when:** a wallet discovers a node via the contract and **rejects a tampered answer** because the Merkle proof fails against its light-client header.

## V2 — privacy (Origin + Content)

- **Origin:** anonymizing transport (Tor / mixnet / OHTTP) + byte-identical request canonicalization + reproducible client.
- **Content:** **PIR** (companion spec) — the node can't see which slot/address you read.
- **Research:** **verifiable PIR** — proofs that don't reveal the queried index (PIR + correctness together). The key open problem here.

**Done when:** two users' identical requests are byte-identical on the wire, and a PIR read returns correct data without the node learning the index.

## V3 — payments (last)

Shared vault (fixed-denomination deposit, unlinkable redemption); batch-voucher (default) + nanopayment rails; spent-flag; low governable fee. **Slashing turns on** — client full-RLN (separate bonded) + node signed-head/quorum, **cryptographic proof only, never complaints**.

**Done when:** one deposit funds ≥1k calls; only correct settlements land on-chain; a double-redeem bounces; payments are unlinkable to the deposit.
