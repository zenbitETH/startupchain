# ENS Company Model (Draft)

This captures the company representation we just aligned on: a Safe-centric company identity with ENS ownership, cap table, and governance hooks.

## 1) Treasury: Safe-first
- **Company Safe** is the primary owner of the ENS name and resolver; founders control the Safe.
- **Network**: default to chain in `NEXT_PUBLIC_CHAIN_ID` (Sepolia/mainnet); support later multi-chain by mapping chain → Safe address.
- **Ownership**: add founder EOAs + optional embedded wallet as Safe owners; set threshold based on team size (see below).
- **ENS pointer**: set resolver addr to the company Safe; do not leave ENS owned by a founder EOA.

## 2) Identity & Cap Table
- **ENS**: register via `StartupChain.registerCompany(ens, owner=CompanySafe, founders[])`; emit `CompanyRegistered`.
- **Cap table**: store founders and stakes on-chain (extend `StartupChain` or companion registry). Each entry: `address, equityBps, role?`.
- **Metadata** (optional): JSON in resolver text records: `company:name`, `company:safe`, `company:founders`.

## 3) Governance & Threshold Options
- **Threshold presets**:
  - 1 founder → threshold 1 (solo)
  - 2 founders → threshold 2 (both sign) or 1-of-2 (fast) toggle
  - 3–5 founders → threshold 2 or 3 (recommended: ceil(n/2))
  - >5 founders → threshold 3–5 and delegate roles (finance/legal)
- **Roles** (later): tag founders with roles; map to Safe modules (spending limits, session keys).
- **Upgrades**: allow owner set changes via Safe; emit `OwnersUpdated(threshold, owners[])`.

## 4) Event & Dashboard Surface
- Emit: `CompanyRegistered`, `OwnersUpdated`, `ThresholdUpdated`, `SafeLinked`, `TokenAllocated` (if token), `MetadataUpdated`.
- Dashboard (server): read `getCompanyByAddress`, `CompanyRegistered` logs; show ENS, Safe address, founders, threshold, latest tx hashes + explorer links.
- Wizard: after tx success, deep-link to `/dashboard/ens?tx=...` and refresh on-chain reads.

## Open Items
- Cap table storage location: extend `StartupChain` vs. new lightweight registry contract.
- Governance scope: start with Safe-only, add proposal/voting later or keep to modules.
- Multi-chain handling: single ENS on mainnet but per-chain treasury mapping—need UI to select active chain/Safe.
