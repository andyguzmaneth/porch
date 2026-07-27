# tamper-demo — V1 correctness, live

The V1 thesis in one run: **the registry is a phone book, not a trust root.** A wallet
that verifies reads client-side stays safe even when the porch node it picked is
malicious — so sybil registrations and lying operators can't make it accept bad data.

Two wallets read the same balance through the same untrusted porch node:

| | honest node | `--lie` node (inflates every balance to 1,000,000 ETH) |
|---|---|---|
| **naive wallet** — bare `eth_getBalance` | 6.632 ETH | **1,000,000 ETH** — believes it |
| **verifying wallet** — Kohaku provider, Helios backend | 6.632 ETH ✅ VERIFIED | ❌ REJECTED — `invalid account proof` |

The verifying wallet never trusts the node's answer. Helios asks the node for
`eth_getProof` and re-derives the account leaf against the `stateRoot` of a header it
obtained from Ethereum consensus itself (sync-committee-verified light client). Tampering
with the balance breaks the Merkle proof; there is no way for the node to lie about state
without breaking it.

## Run it

```bash
npm install   # @kohaku-eth/provider + @a16z/helios (WASM light client)

# 1. honest node
node ../porch-node/porch-node.mjs --rpc https://ethereum-rpc.publicnode.com --port 8646 &
node wallet.mjs                              # -> ✅ VERIFIED (exit 0)

# 2. lying node
node ../porch-node/porch-node.mjs --rpc https://ethereum-rpc.publicnode.com --port 8647 --lie &
node wallet.mjs --rpc http://localhost:8647  # -> ❌ REJECTED (exit 2)
```

Options: `--address 0x…` (default vitalik.eth) · `--consensus <beacon api>` (default
publicnode) · `--rpc <porch node>` (default `http://localhost:8646`).

Helios syncs from a finalized checkpoint fetched from the consensus API (never from the
porch node) — takes a few seconds on first run.

## Notes

- `wallet.mjs` runs a small in-process shim in front of the consensus API: publicnode's
  `/eth/v1/beacon/light_client/updates` ignores `start_period`/`count` and returns its
  full history (observed 2026-07-26), which breaks Helios's period sequencing. The shim
  only re-filters that array — every update is still signature-verified client-side, so
  this changes nothing about the trust model.
- The `--lie` flag lives in [`../porch-node/porch-node.mjs`](../porch-node/porch-node.mjs):
  it tampers `eth_getBalance` (what naive wallets use) and the `balance` field of
  `eth_getProof` (what verifying wallets check).
- Toy code, like everything under `demo/`. Design of record: [`../../docs/SPEC.md`](../../docs/SPEC.md).
