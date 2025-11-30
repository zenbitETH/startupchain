# StartupChain System Flow

> **Last Updated:** November 30, 2025
> **Status:** Early Production
> **Important:** Keep this diagram updated when making architectural changes.

## Overview

StartupChain is an onchain company OS that allows founders to:

- Search & claim an ENS name as their company identity
- Authenticate via Privy (wallet or create new)
- Configure company structure (solo/multi-founder with equity splits)
- **One-click registration:** Deploy Safe → Register ENS to Safe → Record company data
- Manage from a unified dashboard

**Core Flow:** `ENS Check → Auth → Setup Wizard → Prepay to Treasury → (Auto) Commit → Wait 60s → Deploy Safe → Register ENS (to Safe) → Record Company → Dashboard`

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 STARTUPCHAIN SYSTEM FLOW                                     │
│                           "Onchain Company OS for Founders"                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  1. ENTRY POINT - Landing Page (Public)                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════════════│
│                                                                                              │
│    User visits startupchain.io                                                              │
│              │                                                                               │
│              ▼                                                                               │
│    ┌────────────────────────────────────┐                                                   │
│    │     ENS Name Checker Component      │ ◄── Debounced input (500ms)                      │
│    │  ┌──────────────────────────────┐   │                                                   │
│    │  │  Enter company name: [____]  │   │                                                   │
│    │  └──────────────────────────────┘   │                                                   │
│    └────────────────────────────────────┘                                                   │
│              │                                                                               │
│              ▼                                                                               │
│    ┌────────────────────────────────────┐                                                   │
│    │  checkEnsAvailabilityAction()      │ Server Action                                     │
│    │  • Normalize ENS name              │                                                   │
│    │  • Query ENS registry via ensjs    │                                                   │
│    │  • Return: available/taken         │                                                   │
│    └────────────────────────────────────┘                                                   │
│              │                                                                               │
│              ├───────────────────────┐                                                       │
│              ▼                       ▼                                                       │
│    ┌──────────────┐       ┌──────────────┐                                                  │
│    │  AVAILABLE ✓ │       │   TAKEN ✗    │                                                  │
│    │  [Register]  │       │  Shows owner │                                                  │
│    └──────────────┘       └──────────────┘                                                  │
│              │                                                                               │
└──────────────┼──────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  2. AUTHENTICATION (Privy)                                                                   │
│  ═══════════════════════════════════════════════════════════════════════════════════════════│
│                                                                                              │
│    ┌─────────────────────────────────────────────────────────────────┐                      │
│    │                      ProvidersShell                              │                      │
│    │  ┌───────────────────────────────────────────────────────────┐  │                      │
│    │  │  PrivyProvider (appId, config)                            │  │                      │
│    │  │  ├── WagmiProvider (wagmiConfig)                          │  │                      │
│    │  │  │   └── QueryClientProvider                              │  │                      │
│    │  │  │       └── WalletAuthProvider                           │  │                      │
│    │  │  │           • connect() → Privy login modal              │  │                      │
│    │  │  │           • disconnect() → logout                      │  │                      │
│    │  │  │           • primaryAddress, chainId, authenticated     │  │                      │
│    │  │  └───────────────────────────────────────────────────────┘   │                      │
│    │  └───────────────────────────────────────────────────────────┘  │                      │
│    └─────────────────────────────────────────────────────────────────┘                      │
│                                                                                              │
│    Authentication Flow:                                                                      │
│    ┌──────────┐    ┌───────────────┐    ┌─────────────────┐    ┌──────────────────┐        │
│    │  User    │───▶│ Privy Modal   │───▶│ Wallet Connect  │───▶│ JWT Token Set    │        │
│    │  clicks  │    │ (MetaMask)    │    │ or Create New   │    │ in Cookie        │        │
│    └──────────┘    └───────────────┘    └─────────────────┘    └──────────────────┘        │
│                                                                                              │
│    Server Session (getServerSession):                                                        │
│    • Extracts privy-token from cookies                                                       │
│    • Verifies with Privy verification key                                                    │
│    • Fetches user profile & wallet address                                                   │
│    • Returns: { userId, walletAddress, expiresAt }                                          │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
               │
               │ Authenticated user redirected
               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  3. COMPANY SETUP (/dashboard/setup?ensName=xxx)                                             │
│  ═══════════════════════════════════════════════════════════════════════════════════════════│
│                                                                                              │
│    ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│    │                           SetupWizard Component                                      │  │
│    │                                                                                      │  │
│    │   Steps: [Company Details] ──▶ [Founders & Equity] ──▶ [Review & Deploy]            │  │
│    │                                                                                      │  │
│    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │  │
│    │   │  Company Structure Selection                                                 │   │  │
│    │   │  ┌─────────────────┐    ┌─────────────────┐                                 │   │  │
│    │   │  │  Solo Founder   │    │ Multiple Founders│                                │   │  │
│    │   │  │  (100% equity)  │    │ (Split equity %) │                                │   │  │
│    │   │  └─────────────────┘    └─────────────────┘                                 │   │  │
│    │   └─────────────────────────────────────────────────────────────────────────────┘   │  │
│    │                                                                                      │  │
│    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │  │
│    │   │  Founders Configuration                                                      │   │  │
│    │   │  • Wallet addresses (0x...)                                                  │   │  │
│    │   │  • Equity percentages (must = 100%)                                          │   │  │
│    │   │  • Optional: Register to different address                                   │   │  │
│    │   └─────────────────────────────────────────────────────────────────────────────┘   │  │
│    │                                                                                      │  │
│    │   State Management: useDraftStore (Zustand-like local store)                        │  │
│    │                                                                                      │  │
│    └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
               │
               │ User clicks "Continue to Payment"
               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  4. PREPAYMENT & REGISTRATION FLOW                                                           │
│  ═══════════════════════════════════════════════════════════════════════════════════════════│
│                                                                                              │
│    STEP 1: COST CALCULATION & PREPAYMENT                                                     │
│    ──────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                              │
│    ┌────────────────────────────────────┐                                                   │
│    │  useCompanyRegistration Hook       │  (Client-Side)                                    │
│    │                                    │                                                   │
│    │  1. calculateCosts() - show to user│                                                   │
│    │     • ENS registration cost        │                                                   │
│    │     • Safe deployment gas          │                                                   │
│    │     • Service fee (25%)            │                                                   │
│    │  2. initializeRegistration()       │                                                   │
│    │     • Validate founders & threshold│                                                   │
│    │     • status: "awaiting-payment"   │                                                   │
│    │  3. sendPayment()                  │                                                   │
│    │     • User sends ETH to treasury   │──────▶  Treasury Address (STARTUPCHAIN_SIGNER)    │
│    │     • status: "payment-pending"    │                                                   │
│    │     • Wait for tx confirmation     │                                                   │
│    │     • status: "payment-confirmed"  │                                                   │
│    └────────────────────────────────────┘                                                   │
│                      │                                                                       │
│                      ▼                                                                       │
│                                                                                              │
│    STEP 2: AUTOMATED REGISTRATION (Server Wallet Pays)                                       │
│    ──────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                              │
│    ┌────────────────────────────────────┐                                                   │
│    │  commitEnsRegistrationAction()     │  (Server Action)                                  │
│    │  ─────────────────────────────     │                                                   │
│    │  • Predict Safe address            │                                                   │
│    │  • Generate secret                 │                                                   │
│    │  • Call ENS commitName()      ─────│──────▶  ETH Mainnet/Sepolia                       │
│    │  • SERVER WALLET PAYS GAS          │         (ENS Controller)                          │
│    │  • status: "committing" → "waiting"│                                                   │
│    └────────────────────────────────────┘                                                   │
│                      │                                                                       │
│                      ▼ (60 second wait - automated)                                          │
│                                                                                              │
│    ┌────────────────────────────────────┐                                                   │
│    │  finalizeEnsRegistrationAction()   │  (Server Action)                                  │
│    │                                    │                                                   │
│    │  Step A: Safe Deployment           │                                                   │
│    │  ─────────────────────────────     │                                                   │
│    │  • status: "deploying-safe"        │                                                   │
│    │  • Deploy Safe multisig       ─────│──────▶  Safe Factory Contract                     │
│    │  • SERVER WALLET PAYS GAS          │                                                   │
│    │                                    │                                                   │
│    │  Step B: ENS Registration          │                                                   │
│    │  ─────────────────────────────     │                                                   │
│    │  • status: "registering-ens"       │                                                   │
│    │  • Call ENS registerName()    ─────│──────▶  ETH Mainnet/Sepolia                       │
│    │  • SERVER WALLET PAYS ENS + GAS    │         (ENS Controller)                          │
│    │                                    │                                                   │
│    │  Step C: Company Recording         │                                                   │
│    │  ─────────────────────────────     │                                                   │
│    │  • status: "registering-company"   │                                                   │
│    │  • Call recordCompany()       ─────│──────▶  StartupChain Contract                     │
│    │    args: [label, safeAddress,      │         (Sepolia/Mainnet)                         │
│    │           founders[], threshold]   │                                                   │
│    │  • SERVICE FEE sent to contract    │         → Fee goes to feeRecipient                │
│    │                                    │                                                   │
│    │  • status: "completed" or "failed" │                                                   │
│    │  • Redirect to /dashboard/ens      │                                                   │
│    └────────────────────────────────────┘                                                   │
│                      │                                                                       │
│                      ▼                                                                       │
│    Dashboard shows company data from contract read (getCompanyByFounderWallet).             │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
               │
               │ Registration complete - redirect to Dashboard
               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  5. DASHBOARD (Protected Routes)                                                             │
│  ═══════════════════════════════════════════════════════════════════════════════════════════│
│                                                                                              │
│    Layout: Sidebar + Main Content                                                            │
│    ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│    │  ┌────────────┐  ┌─────────────────────────────────────────────────────────────────┐ │ │
│    │  │  Sidebar   │  │                    Dashboard Content                            │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │ • Dashboard│  │  Data Loading (Server Component):                               │ │ │
│    │  │ • ENS      │  │  ┌──────────────────────────────────────────────────────────┐  │ │ │
│    │  │ • Settings │  │  │  getCompanyData()                                        │  │ │ │
│    │  │            │  │  │  1. Get server session (wallet address)                  │  │ │ │
│    │  │            │  │  │  2. Check pending registration (cookie)                  │  │ │ │
│    │  │            │  │  │  3. Query StartupChain contract:                         │  │ │ │
│    │  │            │  │  │     getCompanyByAddress(walletAddress)                   │  │ │ │
│    │  │            │  │  │  4. Return: company data or empty state                  │  │ │ │
│    │  │            │  │  └──────────────────────────────────────────────────────────┘  │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  ┌─────────────────────────────────────────────────────┐       │ │ │
│    │  │            │  │  │              CompanyOverview                        │       │ │ │
│    │  │            │  │  │  • Company Name (from ENS)                          │       │ │ │
│    │  │            │  │  │  • ENS Name: acmecorp.eth                           │       │ │ │
│    │  │            │  │  │  • Owner Address: 0x...                             │       │ │ │
│    │  │            │  │  │  • Founder Count, Threshold                         │       │ │ │
│    │  │            │  │  │  • Chain: Sepolia/Ethereum                          │       │ │ │
│    │  │            │  │  └─────────────────────────────────────────────────────┘       │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  ┌──────────────────────┐  ┌──────────────────────┐            │ │ │
│    │  │            │  │  │   TreasurySummary    │  │    CompanyToken      │            │ │ │
│    │  │            │  │  │   (placeholder)      │  │   (placeholder)      │            │ │ │
│    │  │            │  │  │   • Total Balance    │  │   • Token Name       │            │ │ │
│    │  │            │  │  │   • Transactions     │  │   • Symbol, Supply   │            │ │ │
│    │  │            │  │  └──────────────────────┘  └──────────────────────┘            │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  ┌─────────────────────────────────────────────────────┐       │ │ │
│    │  │            │  │  │              ActivityFeed                           │       │ │ │
│    │  │            │  │  │  • Recent company activity (placeholder)            │       │ │ │
│    │  │            │  │  └─────────────────────────────────────────────────────┘       │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  ┌─────────────────────────────────────────────────────┐       │ │ │
│    │  │            │  │  │    PendingEnsCard / RegistrationProgress (pending)  │       │ │ │
│    │  │            │  │  │  • Shows commit/register/company tx hashes          │       │ │ │
│    │  │            │  │  │  • Status: waiting → registering → creating → done/failed │ │ │ │
│    │  │            │  │  └─────────────────────────────────────────────────────┘       │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  └────────────┘  └─────────────────────────────────────────────────────────────────┘ │ │
│    └──────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts (On-Chain)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     StartupChain Contract (Sepolia/Mainnet)                                  │
│                                                                                              │
│   Functions:                                                                                 │
│   ├── recordCompany(label, safeAddress, founders[], threshold)                              │
│   ├── getCompanyByAddress(address) → (id, owner, ensName, createdAt, threshold)             │
│   ├── getCompanyByENS(ensLabel) → company data                                              │
│   ├── getCompanyFounders(companyId) → Founder[]                                             │
│   ├── createSubdomain(companyId, subdomain, owner) → create ENS subdomain                   │
│   ├── revokeSubdomain(companyId, subdomain) → revoke subdomain                              │
│   └── getTotalCompanies() → count                                                           │
│                                                                                              │
│   Note: ENS registration is handled OFF-CHAIN via server actions using @ensdomains/ensjs    │
│         The contract only records company data after ENS is already registered.             │
│                                                                                              │
│   Data Structures:                                                                           │
│   └── Founder { wallet: address, equityBps: uint256, role: string }                         │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     ENS Registry (Ethereum) - Via Server Actions                             │
│                                                                                              │
│   Via @ensdomains/ensjs (off-chain, server-side):                                           │
│   ├── getOwner(name) → check availability                                                   │
│   ├── getPrice(name, duration) → registration cost                                          │
│   ├── commitName(params) → phase 1 commitment (60s wait required)                           │
│   └── registerName(params, value) → phase 2 registration                                    │
│                                                                                              │
│   Why off-chain? The ENS commit-reveal scheme requires holding a secret for 60s.            │
│   This cannot be done on-chain without exposing the secret (defeating frontrun protection). │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

```
┌─────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────────┐
│  User   │ ───▶ │  Next.js App │ ───▶ │   Server    │ ───▶ │   Blockchain     │
│ Browser │      │  (React 19)  │      │   Actions   │      │  (ETH/Sepolia)   │
└─────────┘      └──────────────┘      └─────────────┘      └──────────────────┘
     │                  │                    │                       │
     │                  │                    │                       │
┌────▼────┐      ┌──────▼──────┐      ┌─────▼─────┐      ┌──────────▼──────────┐
│ Privy   │      │  Providers   │      │  Cookies  │      │   Contracts         │
│ Auth    │◀────▶│  (Wagmi,    │      │  (Session,│      │   • StartupChain    │
│ Modal   │      │   TanStack)  │      │   Pending)│      │   • ENS Registry    │
└─────────┘      └─────────────┘      └───────────┘      └───────────────────────┘
```

### State Management


| Layer  | Mechanism                              | Purpose                                  |
| -------- | ---------------------------------------- | ------------------------------------------ |
| Server | Cookies (`pending-ens`, `privy-token`) | Session & registration state             |
| Server | `getServerSession()`                   | Auth verification                        |
| Server | `TREASURY_ADDRESS`                     | Address for receiving user prepayments   |
| Client | `useDraftStore`                        | Setup wizard form state                  |
| Client | `useWalletAuth` context                | Auth state & methods                     |
| Client | `useCompanyRegistration`               | Full registration flow (prepayment mode) |
| Client | `useSendTransaction`                   | User payment to treasury                 |
| Client | React Query                            | Async data fetching                      |

---

## ****Key Technologies


| Category       | Technologies                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Frontend**   | Next.js 16 (App Router), React 19 (Server Components), TailwindCSS v4, shadcn/ui |
| **Auth**       | Privy (wallet auth), JWT tokens, HTTP-only cookies                               |
| **Blockchain** | Viem (client), Wagmi (hooks), @ensdomains/ensjs, Custom Solidity contracts       |
| **Chains**     | Ethereum Mainnet, Sepolia (testnet)                                              |

---

## Key Files Reference


| File                                                        | Purpose                                               |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| `src/app/(public)/page.tsx`                                 | Landing page with ENS checker                         |
| `src/components/ens-name-checker/EnsNameChecker.tsx`        | ENS availability checking UI                          |
| `src/app/(app)/dashboard/setup/page.tsx`                    | Company setup wizard page                             |
| `src/app/(app)/dashboard/setup/components/setup-wizard.tsx` | Setup wizard with payment step                        |
| `src/hooks/use-company-registration.ts`                     | Client-side registration hook (prepayment flow)       |
| `src/app/(app)/dashboard/setup/actions.ts`                  | Server actions for ENS/company + payment verification |
| `src/lib/blockchain/startupchain-client.ts`                 | Server wallet & TREASURY_ADDRESS export               |
| `src/lib/auth/pending-registration.ts`                      | Cookie-based registration state                       |
| `src/lib/auth/server-session.ts`                            | Server-side auth verification                         |
| `src/components/providers/providers-shell.tsx`              | Client providers wrapper                              |
| `src/lib/blockchain/startupchain-config.ts`                 | Chain & contract configuration                        |
| `src/lib/blockchain/get-company.ts`                         | Contract read functions (incl. getCompanyByFounderWallet) |

---

## Payment Model

**Prepayment model: User sends ETH to StartupChain treasury upfront, then server executes all transactions.**


| Cost Component                | Paid By      | Recipient                     |
| ------------------------------- | -------------- | ------------------------------- |
| ENS Registration (1 year)     | Server (from treasury) | ENS Protocol          |
| Safe Deployment Gas           | Server (from treasury) | Network               |
| Service Fee (25% of ENS cost) | Server (from treasury) | StartupChain (`feeRecipient`) |
| Gas fees (commit + register)  | Server (from treasury) | Network               |
| **User Prepayment**           | User         | StartupChain Treasury         |

**Flow:**
1. `useCompanyRegistration` calculates total costs (ENS + Safe gas + service fee + buffer)
2. User sends prepayment to `TREASURY_ADDRESS` via wagmi `useSendTransaction`
3. Payment confirmed → server actions execute all blockchain transactions
4. Server wallet (`STARTUPCHAIN_SIGNER_KEY`) pays for everything from treasury funds

The `TREASURY_ADDRESS` is the same as the server signer address for simplicity.
