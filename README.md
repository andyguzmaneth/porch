<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/porch-lockup-dark.svg">
  <img alt="porch" src="assets/porch-lockup-light.svg" width="340">
</picture>

**P**aid **O**nchain **R**eads. **C**orrect & **H**idden.

![status](https://img.shields.io/badge/status-experimental-orange) ![license](https://img.shields.io/badge/license-MIT-blue)

</div>

> ⚠️ **Experimental.** Early-stage design/RFC — unaudited, unimplemented, and subject to breaking change. Not for production use. Do not rely on anything here.

**Decentralized Ethereum reads, served from the nodes people already run at home** — becoming *correct*, then *private*, then *paid*.

Porch turns the thousands of full nodes already sitting in people's homes into a directory a wallet can read the chain through — instead of trusting one central RPC provider that sees every address you look up. A node opens a *separate, confined RPC port*, self-registers, and a wallet points at it. That's **V0**: decentralization, redundancy, censorship-resistance. The roadmap then layers on **correctness** (V1), **privacy** (V2), and **payments** (V3) — in that order.

## Status

**Early design / RFC.** This repo holds the design spec, the milestone scaffold, a **conceptual guided tour** of the idea ([`demo/toy-demo`](demo/toy-demo/) — a click-through mockup, deployable), and throwaway **prototype code** ([`demo/porch-node`](demo/porch-node/) + [`demo/registry`](demo/registry/)). The real implementation isn't built yet. Design feedback via issues is very welcome.

## Why

Most wallets read the chain through a handful of centralized RPC providers. That provider sees the set of addresses you query — effectively your identity — and you must trust the answers it returns. Porch decentralizes the read path, one layer at a time:

- **Decentralized & censorship-resistant** — thousands of independent homes answer; no single provider to block or pressure. *(V0)*
- **Correct** — the node returns a Merkle proof; your wallet verifies it with a light client. *(V1)*
- **Private** — anonymizing transport + PIR hide *who* is asking and *what*. *(V2)*
- **Paid** — a tiny fee makes serving worth an operator's while, no token required. *(V3)*

## The three layers

Porch never claims "private" while a lower layer leaks — and it's honest that **V0 and V1 are not private** (privacy arrives in V2):

| Layer | Question | Lands in |
|-------|----------|----------|
| **Correctness** | Is the answer *true*? | **V1** — node Merkle proof, wallet verifies via light client |
| **Origin** | *Who* is asking? | **V2** — anonymizing transport (Tor / mixnet / OHTTP) |
| **Content** | *What* are they asking? | **V2** — PIR |

## Docs

- [Design spec](docs/SPEC.md)
- [Design decisions](docs/DECISIONS.md)
- [Milestones](docs/MILESTONES.md)

## Repo layout

```
demo/       runnable prototype + a conceptual guided-tour mockup of the idea
node/       the home-node package (confined RPC port; V1+ proofs, V3 payments)
sidecar/    local JSON-RPC endpoint a wallet points at (discover + verify; V3 payment)
contracts/  on-chain registry (V1) and payment vault (V3)
rpc/        OpenRPC profile — the served-method allowlist, a subset of execution-apis
presets/    every tunable parameter (caps, pool, and V3 fee/denominations)
tests/      conformance test-vector plan (canonicalization, proofs, vault)
docs/       spec, decisions, milestones
```

## Rigor & conformance

Porch follows the discipline of the Ethereum spec repos, scaled to its stage:
- **Method shapes** are not redefined — [`rpc/`](rpc/) is a *profile* of [execution-apis](https://github.com/ethereum/execution-apis), so a node can be validated with hive's `rpc-compat` for free.
- **Parameters** live in [`presets/porch.yaml`](presets/porch.yaml), never inline in prose.
- **Normative requirements** (RFC 2119) are collected in [spec §12](docs/SPEC.md#12-normative-requirements-rfc-2119).
- **Conformance vectors** for the Porch-specific layers (canonicalization, proofs, vault) are planned in [`tests/`](tests/); they'll be generated from the reference implementation when it lands (the execution-specs pattern).

## License

MIT — see [LICENSE](LICENSE).
