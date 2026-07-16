<div align="center">

<img src="assets/porch-logo.svg" alt="Porch" width="150" />

# porch

**Private, paid Ethereum reads — served at the door.**

![status](https://img.shields.io/badge/status-experimental-orange) ![license](https://img.shields.io/badge/license-MIT-blue)

</div>

> ⚠️ **Experimental.** Early-stage design/RFC — unaudited, unimplemented, and subject to breaking change. Not for production use. Do not rely on anything here.

**Incentivized, privacy-preserving Ethereum reads, served from home nodes.**

> **P**aid · **O**nchain · **R**eads, · **C**orrect & · **H**idden

Porch is an open protocol for turning the thousands of full nodes people already run at home into a marketplace for **private, paid RPC reads**. A node operator installs Porch, which opens a *separate, confined, paid RPC port*. Nodes advertise what they offer and are discoverable; a wallet — through a small local sidecar — picks a few nodes, asks a read (`eth_getBalance`, `eth_call`, …), pays a tiny fee through a shared privacy-preserving vault, and gets an answer that can't be linked back to it.

The goal: an alternative to trusting one centralized RPC provider that sees every address you look up.

## Status

**Early design / RFC.** This repo currently holds the design spec and an empty scaffold for the first milestone (M1). Nothing is implemented yet. Design feedback via issues is very welcome.

## Why

Most wallets read the chain through a handful of centralized RPC providers. That provider sees the set of addresses you query — which is effectively your identity — and you have to trust the answers it returns. Porch decentralizes the *read path*:

- **Private** — payments are unlinkable to your identity and to each other; queries spread across a rotating pool of nodes.
- **Paid** — a tiny flat fee makes serving reads worth an operator's while, without a token.
- **Home-served** — every node runs a real Ethereum node; no reselling someone else's RPC.
- **Correct (roadmap)** — nodes can return light-client proofs so answers verify themselves.

## The three privacy layers

Porch is explicit about what it protects, so it never claims "private" while a lower layer leaks:

| Layer | Question | V0 | Later |
|-------|----------|-----|-------|
| **Origin** | *Who* is asking? | payment-unlinkable + pluggable anonymizing transport | — |
| **Content** | *What* are they asking? | visible to the node (documented) | Private Information Retrieval (PIR) |
| **Correctness** | Is the answer *true*? | trust + tiny fee + local reputation | light-client proof-back |

## Docs

- [Design spec](docs/SPEC.md)
- [Design decisions](docs/DECISIONS.md)
- [Milestones](docs/MILESTONES.md)

## Repo layout

```
node/       the home-node package (opens the confined paid RPC port)
sidecar/    local JSON-RPC endpoint a wallet points at (selection + payment + verification)
contracts/  the shared on-chain payment vault
rpc/        OpenRPC profile — the served-method allowlist, a subset of execution-apis
presets/    every tunable parameter (fee, pool size, denominations, caps)
tests/      conformance test-vector plan (canonicalization, tickets, vault)
docs/       spec, decisions, milestones
```

## Rigor & conformance

Porch follows the discipline of the Ethereum spec repos, scaled to its stage:
- **Method shapes** are not redefined — [`rpc/`](rpc/) is a *profile* of [execution-apis](https://github.com/ethereum/execution-apis), so a node can be validated with hive's `rpc-compat` for free.
- **Parameters** live in [`presets/porch.yaml`](presets/porch.yaml), never inline in prose.
- **Normative requirements** (RFC 2119) are collected in [spec §12](docs/SPEC.md#12-normative-requirements-rfc-2119).
- **Conformance vectors** for the Porch-specific layers (canonicalization, payment, vault) are planned in [`tests/`](tests/); they'll be generated from the M2 reference implementation (the execution-specs pattern).

## License

MIT — see [LICENSE](LICENSE).
