# contracts/ — Porch on-chain contracts

Nothing on-chain exists in **V0** (discovery is a central server). Two contracts arrive later:

**V1 — registry.** A permissionless registry: nodes register (operators pay their own gas; entries self-signed by the node key; optional **non-slashable** stake-to-be-featured). Wallets read it directly to discover nodes.

**V3 — payment vault.** A shared vault: fixed-denomination deposits into a unified internal balance; any registered node redeems; redemption is **unlinkable** to the deposit; a minimal **spent-flag** prevents double-redeem. **Slashing** (client RLN separate-bond + node signed-head/quorum) turns on here — **on cryptographic proof only, never on complaints**.

Deliberately **not** in earlier versions: no vault, payments, withdrawals, or slashing before **V3**; only the registry is V1.

*Not implemented yet — see [../docs/SPEC.md](../docs/SPEC.md) §4 / §6.*
