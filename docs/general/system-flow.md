# StartupChain System Flow

> **Last Updated:** November 29, 2025
> **Status:** Early Production
> **Important:** Keep this diagram updated when making architectural changes.

## Overview

StartupChain is an onchain company OS that allows founders to:

- Search & claim an ENS name as their company identity
- Authenticate via Privy (wallet or create new)
- Configure company structure (solo/multi-founder with equity splits)
- **One-click registration:** Deploy Safe → Register ENS to Safe → Record company data
- Manage from a unified dashboard

**Core Flow:** `ENS Check → Auth → Setup Wizard → Commit → Wait 60s → Deploy Safe → Register ENS (to Safe) → Record Company → Dashboard`

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
               │ User clicks "Create Business"
               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  4. ENS REGISTRATION FLOW (Two-Phase Commit)                                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════════════│
│                                                                                              │
│    PHASE 1: COMMITMENT                                                                       │
│    ──────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                              │
│    ┌────────────────────────────────────┐                                                   │
│    │  commitEnsRegistrationAction()     │                                                   │
│    │                                    │                                                   │
│    │  1. Normalize ENS name             │                                                   │
│    │  2. Validate founders & threshold  │                                                   │
│    │  3. Check ENS availability         │                                                   │
│    PHASE 1: COMMITMENT (User Pays)                                                           │
│    ──────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                              │
│    ┌────────────────────────────────────┐                                                   │
│    │  useCompanyRegistration Hook       │  (Client-Side)                                    │
│    │                                    │                                                   │
│    │  1. calculateCosts() - show to user│                                                   │
│    │     • ENS registration cost        │                                                   │
│    │     • Service fee (25%)            │                                                   │
│    │     • Estimated gas                │                                                   │
│    │  2. User approves total cost       │                                                   │
│    │  3. startRegistration()            │                                                   │
│    │     • Check ENS availability       │                                                   │
│    │     • Generate random secret       │                                                   │
│    │     • Call ENS commitName()   ─────│──────▶  ETH Mainnet/Sepolia (USER PAYS GAS)       │
│    │     • Store state in hook          │                                                   │
│    │     • status: "waiting"            │                                                   │
│    └────────────────────────────────────┘                                                   │
│                      │                                                                       │
│                      ▼                                                                       │
│    SetupWizard shows RegistrationProgress component with countdown timer.                   │
│                      │                                                                       │
│                      ▼ (after 60s)                                                           │
│                                                                                              │
│    PHASE 2: REGISTRATION + COMPANY CREATION (User Pays All)                                  │
│    ──────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                              │
│    ┌────────────────────────────────────┐                                                   │
│    │ completeRegistration()             │  (Client-Side)                                    │
│    │                                    │                                                   │
│    │  Step A: ENS Registration          │                                                   │
│    │  ─────────────────────────────     │                                                   │
│    │  • status: "registering-ens"       │                                                   │
│    │  • Call ENS registerName()    ─────│──────▶  ETH Mainnet/Sepolia                       │
│    │  • USER PAYS: ENS cost + gas       │         (ENS Controller)                          │
│    │  • Wait for tx receipt             │                                                   │
│    │                                    │                                                   │
│    │  Step B: Company Creation          │                                                   │
│    │  ─────────────────────────────     │                                                   │
│    │  • status: "registering-company"   │                                                   │
│    │  • Call registerCompany() ─────────│──────▶  StartupChain Contract                     │
│    │    args: [label, owner,            │         (Sepolia/Mainnet)                         │
│    │           founders[], threshold]   │                                                   │
│    │  • USER PAYS: Service fee (25%)    │         → Fee goes to feeRecipient                │
│    │  • Wait for tx receipt             │                                                   │
│    │                                    │                                                   │
│    │  3. status: "completed" or "failed"│                                                   │
│    │  4. Redirect to /dashboard/ens     │                                                   │
│    └────────────────────────────────────┘                                                   │
│                      │                                                                       │
│                      ▼                                                                       │
│    Dashboard shows company data from contract read (getCompanyByFounderWallet).             │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
               │
               │ User clicks "Continue to Dashboard"
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
│   ├── registerCompany(label, owner, founders[], threshold)                                  │
│   ├── getCompanyByAddress(address) → (id, owner, ensName, createdAt, threshold)             │
│   ├── getCompanyByENS(ensLabel) → company data                                              │
│   ├── getCompanyFounders(companyId) → Founder[]                                             │
│   └── getTotalCompanies() → count                                                           │
│                                                                                              │
│   Data Structures:                                                                           │
│   └── Founder { wallet: address, equityBps: uint256, role: string }                         │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     ENS Registry (Ethereum)                                                  │
│                                                                                              │
│   Via @ensdomains/ensjs:                                                                     │
│   ├── getOwner(name) → check availability                                                   │
│   ├── getPrice(name, duration) → registration cost                                          │
│   ├── commitName(params) → phase 1 commitment                                               │
│   └── registerName(params, value) → phase 2 registration                                    │
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


| Layer  | Mechanism                              | Purpose                            |
| -------- | ---------------------------------------- | ------------------------------------ |
| Server | Cookies (`pending-ens`, `privy-token`) | Session & registration state       |
| Server | `getServerSession()`                   | Auth verification                  |
| Client | `useDraftStore`                        | Setup wizard form state            |
| Client | `useWalletAuth` context                | Auth state & methods               |
| Client | `useCompanyRegistration`               | Full registration flow (user pays) |
| Client | React Query                            | Async data fetching                |

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


| File                                                        | Purpose                                                   |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/app/(public)/page.tsx`                                 | Landing page with ENS checker                             |
| `src/components/ens-name-checker/EnsNameChecker.tsx`        | ENS availability checking UI                              |
| `src/app/(app)/dashboard/setup/page.tsx`                    | Company setup wizard page                                 |
| `src/app/(app)/dashboard/setup/components/setup-wizard.tsx` | Setup wizard with cost breakdown                          |
| `src/hooks/use-company-registration.ts`                     | Client-side registration hook (user pays)                 |
| `src/app/(app)/dashboard/setup/actions.ts`                  | Server actions for ENS/company validation                 |
| `src/lib/auth/pending-registration.ts`                      | Cookie-based registration state                           |
| `src/lib/auth/server-session.ts`                            | Server-side auth verification                             |
| `src/components/providers/providers-shell.tsx`              | Client providers wrapper                                  |
| `src/lib/blockchain/startupchain-config.ts`                 | Chain & contract configuration                            |
| `src/lib/blockchain/get-company.ts`                         | Contract read functions (incl. getCompanyByFounderWallet) |

---

## Payment Model

**User pays for everything with a 25% service fee:**


| Cost Component                         | Paid By | Recipient                     |
| ---------------------------------------- | --------- | ------------------------------- |
| ENS Registration (1 year)              | User    | ENS Protocol                  |
| Service Fee (25% of ENS cost)          | User    | StartupChain (`feeRecipient`) |
| Gas fees (commit + register + company) | User    | Network                       |

The `useCompanyRegistration` hook calculates and displays costs before user confirms. Service fee is collected by the StartupChain contract when `registerCompany()` is called with `msg.value`.
