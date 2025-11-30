# ENS Company Model (Draft)

This captures the company representation we just aligned on: a Safe-centric company identity with ENS ownership, cap table, and governance hooks.

## Payment Model (Prepay)

**User prepays to StartupChain treasury, then StartupChain executes all transactions:**

| Cost Component | Flow | Recipient |
|----------------|------|-----------|
| ENS Registration (1 year) | User → Treasury → ENS Protocol | ENS Protocol |
| Safe Deployment Gas | User → Treasury → Network | Network |
| Service Fee (25% of ENS cost) | User → Treasury | StartupChain |
| Gas fees (commit + register + company) | User → Treasury → Network | Network |

### How It Works

1. **User sees cost breakdown** in setup wizard
2. **User sends total amount** (ETH) to StartupChain treasury address
3. **Payment confirmed** on-chain
4. **StartupChain server executes** all transactions using treasury funds:
   - ENS commitment (60s wait)
   - Safe wallet deployment
   - ENS registration (to Safe address)
   - Company recording on StartupChain contract

The treasury address is derived from `STARTUPCHAIN_SIGNER_KEY` - the same key that signs all transactions.
| Service Fee (25% of ENS cost) | User | StartupChain (feeRecipient) |
| Gas fees (commit + register + company) | User | Network |

The service fee is collected automatically by the StartupChain contract when `registerCompany()` is called with `msg.value`.

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

## 4) Registration Flow (User Pays)

> **See also:** `docs/general/ens-registration-plan.md` for detailed implementation.

### Client-Side Flow (useCompanyRegistration hook)

```
┌─────────────────────────────────────────────────────────────────┐
│  SETUP WIZARD - Cost Breakdown                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   ENS Registration (1 year):     0.003 ETH                      │
│   Service Fee (25%):             0.00075 ETH                    │
│   Estimated Gas:                ~0.005 ETH                      │
│   ─────────────────────────────────────────                     │
│   Total:                         0.00875 ETH                    │
│                                                                  │
│   [Pay 0.00875 ETH & Register]                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: COMMITMENT (User's Wallet)                            │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  1. User approves transaction                                    │
│  2. commitName() sent from user's wallet                         │
│  3. User pays gas (~0.001 ETH)                                  │
│  4. Status: "committing" → "waiting"                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ (60 second wait)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: ENS REGISTRATION (User's Wallet)                      │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  1. registerName() sent from user's wallet                       │
│  2. User pays ENS cost + gas                                    │
│  3. ENS name registered to Safe/owner address                   │
│  4. Status: "registering-ens"                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: COMPANY CREATION (User's Wallet)                      │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  1. registerCompany() on StartupChain contract                   │
│  2. msg.value = service fee (25%)                               │
│  3. Contract collects fee → feeRecipient                        │
│  4. CompanyRegistered event emitted                             │
│  5. Status: "registering-company" → "completed"                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/hooks/use-company-registration.ts` | Client-side registration hook (user pays) |
| `src/app/(app)/dashboard/setup/components/setup-wizard.tsx` | Setup wizard with cost breakdown |
| `src/lib/blockchain/get-company.ts` | Company lookup (incl. by founder wallet) |

## 5) Event & Dashboard Surface

- Emit: `CompanyRegistered`, `OwnersUpdated`, `ThresholdUpdated`, `SafeLinked`, `FeeCollected`, `MetadataUpdated`.
- Dashboard (server): read `getCompanyByAddress`, `getCompanyByFounderWallet`, `getCompanyByENS`; show ENS, Safe address, founders, threshold, latest tx hashes + explorer links.
- Wizard: shows cost breakdown, user pays from connected wallet, progress displayed inline.

## Open Items
- Cap table storage location: extend `StartupChain` vs. new lightweight registry contract.
- Governance scope: start with Safe-only, add proposal/voting later or keep to modules.
- Multi-chain handling: single ENS on mainnet but per-chain treasury mapping—need UI to select active chain/Safe.
