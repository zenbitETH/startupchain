# StartupChain System Flow

> **Last Updated:** December 11, 2025
> **Status:** Early Production
> **Important:** Keep this diagram updated when making architectural changes.

## Overview

StartupChain is an onchain company OS that allows founders to:

- Search & claim an ENS name as their company identity
- Authenticate via Privy (wallet or create new)
- Configure company structure (solo/multi-founder with equity splits)
- **Hybrid registration:** Server handles ENS commit/register/Safe deploy → **User signs** final `recordCompany()` tx
- Manage from a unified dashboard
- **Session persistence:** Registration state saved in cookie for page refresh resilience

**Core Flow:** `ENS Check → Auth → Setup Wizard → Prepay to Treasury → (Auto) Commit → Wait 60s → Deploy Safe → Register ENS (to Safe) → **User Signs recordCompany()** → Dashboard`

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
│    │   State Management: useDraftStore (Zustand store with persistence)                  │  │
│    │                                                                                      │  │
│    └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
               │
               │ User clicks "Continue to Payment"
               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  4. PREPAYMENT & REGISTRATION FLOW (HYBRID: Server + User-Signed)                            │
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
│    │     • Auto-proceed on confirmation │                                                   │
│    └────────────────────────────────────┘                                                   │
│                      │                                                                       │
│                      ▼                                                                       │
│                                                                                              │
│    STEP 2: SERVER-SIDE REGISTRATION (ENS + Safe)                                             │
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
│    │  • status: "ready-to-record"       │  ◄── NEW: Awaits user signature                   │
│    └────────────────────────────────────┘                                                   │
│                      │                                                                       │
│                      ▼                                                                       │
│                                                                                              │
│    STEP 3: USER-SIGNED COMPANY RECORDING                                                     │
│    ──────────────────────────────────────────────────────────────────────────────────────   │
│                                                                                              │
│    ┌────────────────────────────────────┐                                                   │
│    │  signRecordCompany()               │  (Client-Side - User's Wallet)                    │
│    │  ─────────────────────────────     │                                                   │
│    │  • status: "awaiting-signature"    │  ◄── User sees wallet prompt                      │
│    │  • getRecordCompanyDataAction()    │      (retrieves contract args from session)       │
│    │  • writeRecordCompany() via wagmi  │                                                   │
│    │    args: [label, safeAddress,      │                                                   │
│    │           founders[], threshold]   │                                                   │
│    │  • USER WALLET SIGNS TX       ─────│──────▶  StartupChain Contract                     │
│    │  • User pays only gas (0 value)    │         (User is msg.sender on-chain!)            │
│    │                                    │                                                   │
│    │  • status: "signing-company"       │  ◄── Waiting for tx confirmation                  │
│    │  • confirmRecordCompanyAction()    │      (updates session, clears pending state)      │
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
│    │  │ • Safe     │  │  │  getCompanyData()                                        │  │ │ │
│    │  │ • Tokens   │  │  │  1. Get server session (wallet address)                  │  │ │ │
│    │  │ • Settings │  │  │  2. Check pending registration (cookie)                  │  │ │ │
│    │  │            │  │  │  3. Query StartupChain contract:                         │  │ │ │
│    │  │            │  │  │     getCompanyByFounderWallet(walletAddress)             │  │ │ │
│    │  │            │  │  │  4. Fetch Safe data via Safe Transaction Service API     │  │ │ │
│    │  │            │  │  │  5. Return: company data + Safe balances or empty state  │  │ │ │
│    │  │            │  │  └──────────────────────────────────────────────────────────┘  │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  ┌─────────────────────────────────────────────────────┐       │ │ │
│    │  │            │  │  │              CompanyOverview                        │       │ │ │
│    │  │            │  │  │  • Company Name (from ENS)                          │       │ │ │
│    │  │            │  │  │  • ENS Name: acmecorp.eth                           │       │ │ │
│    │  │            │  │  │  • Safe Address: 0x... (links to Safe{Wallet})      │       │ │ │
│    │  │            │  │  │  • Founder Count, Threshold                         │       │ │ │
│    │  │            │  │  │  • Chain: Sepolia/Ethereum                          │       │ │ │
│    │  │            │  │  └─────────────────────────────────────────────────────┘       │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  ┌──────────────────────┐  ┌──────────────────────┐            │ │ │
│    │  │            │  │  │   TreasurySummary    │  │    CompanyToken      │            │ │ │
│    │  │            │  │  │   (live data)        │  │   (coming soon)      │            │ │ │
│    │  │            │  │  │   • Safe ETH Balance │  │   • Deploy Token CTA │            │ │ │
│    │  │            │  │  │   • Recent Safe txs  │  │   • Cap Table Preview│            │ │ │
│    │  │            │  │  │   • Link to /safe    │  │   • Founder Equity % │            │ │ │
│    │  │            │  │  └──────────────────────┘  └──────────────────────┘            │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  ┌─────────────────────────────────────────────────────┐       │ │ │
│    │  │            │  │  │              ActivityFeed                           │       │ │ │
│    │  │            │  │  │  • Recent company activity from Safe + contract     │       │ │ │
│    │  │            │  │  └─────────────────────────────────────────────────────┘       │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  │            │  │  │    PendingEnsCard / RegistrationProgress (pending)  │       │ │ │
│    │  │            │  │  │  • Shows commit/register/company tx hashes          │       │ │ │
│    │  │            │  │  │  • Status: waiting → registering → ready-to-record  │       │ │ │
│    │  │            │  │  │            → awaiting-signature → completed/failed  │       │ │ │
│    │  │            │  │  └─────────────────────────────────────────────────────┘       │ │ │
│    │  │            │  │                                                                 │ │ │
│    │  └────────────┘  └─────────────────────────────────────────────────────────────────┘ │ │
│    └──────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│    Sub-Pages:                                                                                │
│    ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│    │  /dashboard/safe - Safe Management Page                                            │   │
│    │  ┌──────────────────────────────────────────────────────────────────────────────┐  │   │
│    │  │  • Safe owners list with addresses                                           │  │   │
│    │  │  • Signature threshold (e.g., 2 of 3)                                        │  │   │
│    │  │  • ETH balance + token balances                                              │  │   │
│    │  │  • Pending transactions requiring signatures                                 │  │   │
│    │  │  • Transaction history (recent 10)                                           │  │   │
│    │  │  • Link to Safe{Wallet} app for full management                              │  │   │
│    │  │  Data: Safe Transaction Service API (server-side, SAFE_API_KEY)              │  │   │
│    │  └──────────────────────────────────────────────────────────────────────────────┘  │   │
│    └────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│    ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│    │  /dashboard/tokens - Company Token Page                                            │   │
│    │  ┌──────────────────────────────────────────────────────────────────────────────┐  │   │
│    │  │  • Cap table visualization (pie chart)                                       │  │   │
│    │  │  • Founder equity breakdown                                                  │  │   │
│    │  │  • "Deploy Token" CTA (coming soon - user-initiated)                         │  │   │
│    │  │  • Token features: vesting, transfer restrictions, role-based access         │  │   │
│    │  │  Contract: CompanyToken.sol (ERC-20 with vesting)                            │  │   │
│    │  └──────────────────────────────────────────────────────────────────────────────┘  │   │
│    └────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│    ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│    │  /dashboard/ens - ENS Management Page                                              │   │
│    │  ┌──────────────────────────────────────────────────────────────────────────────┐  │   │
│    │  │  • ENS name display with expiry                                              │  │   │
│    │  │  • Registration history (from cookie fallback or blockchain events)          │  │   │
│    │  │  • Safe deployment tx, ENS registration tx, Company recording tx             │  │   │
│    │  │  • Links to block explorer for each transaction                              │  │   │
│    │  └──────────────────────────────────────────────────────────────────────────────┘  │   │
│    └────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```



---

## Smart Contracts (On-Chain)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     StartupChain Contract (Sepolia/Mainnet)                                  │
│                     Address: 0x4511d1d2B9C1BBA33D1B25c3E547835b5BA1F3aC (Sepolia)            │
│                                                                                              │
│   Functions:                                                                                 │
│   ├── recordCompany(label, safeAddress, founders[], threshold)                              │
│   ├── getCompanyByAddress(address) → (id, owner, ensName, safeAddress, createdAt, threshold)│
│   ├── getCompanyByFounderWallet(address) → company data (preferred for dashboard)           │
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
│                     CompanyToken Contract (Not Yet Deployed)                                 │
│                                                                                              │
│   ERC-20 token with:                                                                         │
│   ├── Vesting schedules for founders                                                        │
│   ├── Transfer restrictions (only unlocked tokens)                                          │
│   ├── Role-based access control (Safe as admin)                                             │
│   └── Cliff + linear vesting support                                                        │
│                                                                                              │
│   Deployment: User-initiated from /dashboard/tokens (coming soon)                           │
│   Admin: Company Safe multisig                                                              │
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

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     Safe Transaction Service API (Off-Chain)                                 │
│                                                                                              │
│   Server-side integration via SAFE_API_KEY:                                                  │
│   ├── getSafeInfo(address) → owners, threshold, nonce                                       │
│   ├── getSafeBalances(address) → ETH + token balances                                       │
│   ├── getPendingTransactions(address) → queued txs needing signatures                       │
│   └── getTransactionHistory(address) → executed transactions                                │
│                                                                                              │
│   Rate limits: 5 requests/second (free tier)                                                │
│   Networks: Mainnet + Sepolia supported                                                      │
│   File: src/lib/blockchain/safe-api.ts                                                      │
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


| Layer  | Mechanism                              | Purpose                                 |
| -------- | ---------------------------------------- | ----------------------------------------- |
| Server | Cookies (`pending-ens`, `privy-token`) | Session & registration state            |
| Server | `getServerSession()`                   | Auth verification                       |
| Server | `TREASURY_ADDRESS`                     | Address for receiving user prepayments  |
| Server | `SAFE_API_KEY`                         | Safe Transaction Service authentication |
| Client | `useDraftStore`                        | Setup wizard form state (chain-aware)   |
| Client | `useWalletAuth` context                | Auth state, chainId & methods           |
| Client | `useCompanyRegistration`               | Full registration flow (hybrid mode)    |
| Client | `useSendTransaction`                   | User payment to treasury                |
| Client | `useWriteContract`                     | User signs recordCompany() tx           |
| Client | `resumeRegistrationAction()`           | Session resume on page refresh          |
| Client | React Query                            | Async data fetching (chainId in keys)   |
| URL    | `?chain=<chainId>` search param        | Chain selection for server components   |

**Registration States (PendingStatus):**

- `awaiting-payment` → `committing` → `waiting` → `deploying-safe` → `registering` → `ready-to-record` → `completed`
- New: `ready-to-record` - ENS registered, awaiting user signature for recordCompany()

**Client-Side Steps:**

- `awaiting-signature` - User sees wallet prompt for recordCompany()
- `signing-company` - Waiting for recordCompany() tx confirmation

---

## Multi-Chain Support

The app supports multiple chains (Sepolia, Mainnet) with chain-aware data fetching:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           CHAIN-AWARE DATA FLOW                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

   NetworkSwitcher (Client)                    Dashboard Pages (Server)
   ┌───────────────────┐                       ┌───────────────────────┐
   │ wallet.switchChain│                       │ searchParams.chain    │
   │ router.push(?chain)───────────────────────▶│ parseChainId()       │
   └───────────────────┘                       │ getCompanyData(chainId)│
                                               └───────────────────────┘
                                                          │
                                                          ▼
                                               ┌───────────────────────┐
                                               │ getPublicClient(chainId)│
                                               │ (cached per chain)    │
                                               └───────────────────────┘
```

**Key Components:**


| Component                            | Chain Handling                                              |
| -------------------------------------- | ------------------------------------------------------------- |
| `NetworkSwitcher`                    | Switches wallet chain + pushes`?chain=<id>` URL param       |
| `getPublicClient(chainId)`           | Returns cached Viem client for specific chain               |
| `getCompanyByAddress(addr, chainId)` | Queries correct chain's StartupChain contract               |
| `useEnsCheck`                        | Includes`chainId` in React Query key for cache invalidation |
| `useDraftStore`                      | Stores`chainId` in draft, clears on chain mismatch          |
| Dashboard pages                      | Read`chain` from searchParams, pass to all data fetchers    |

**Supported Chains:**

- Sepolia (11155111) - Primary testnet
- Ethereum Mainnet (1) - Production (contract not yet deployed)

---

## Key Technologies


| Category       | Technologies                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Frontend**   | Next.js 16 (App Router), React 19 (Server Components), TailwindCSS v4, shadcn/ui |
| **Auth**       | Privy (wallet auth), JWT tokens, HTTP-only cookies                               |
| **Blockchain** | Viem (client), Wagmi (hooks), @ensdomains/ensjs, Custom Solidity contracts       |
| **Treasury**   | Safe{Wallet} multisig, Safe Transaction Service API                              |
| **Chains**     | Ethereum Mainnet, Sepolia (testnet)                                              |

---

## Key Files Reference


| File                                                        | Purpose                                               |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| `src/app/(public)/page.tsx`                                 | Landing page with ENS checker                         |
| `src/components/ens-name-checker/EnsNameChecker.tsx`        | ENS availability checking UI                          |
| `src/components/ens-name-checker/useEnsCheck.ts`            | ENS check hook (chain-aware query keys)               |
| `src/components/ui/network-switcher.tsx`                    | Chain switcher (updates URL params)                   |
| `src/app/(app)/dashboard/setup/page.tsx`                    | Company setup wizard page                             |
| `src/app/(app)/dashboard/setup/components/setup-wizard.tsx` | Setup wizard with payment step (chain-aware)          |
| `src/hooks/use-company-registration.ts`                     | Client-side registration hook (prepayment flow)       |
| `src/app/(app)/dashboard/setup/actions.ts`                  | Server actions for ENS/company + payment verification |
| `src/lib/blockchain/startupchain-client.ts`                 | Chain-aware public client factory + server wallet     |
| `src/lib/auth/pending-registration.ts`                      | Cookie-based registration state                       |
| `src/lib/auth/server-session.ts`                            | Server-side auth verification                         |
| `src/components/providers/providers-shell.tsx`              | Client providers wrapper                              |
| `src/lib/blockchain/startupchain-config.ts`                 | Chain & contract configuration                        |
| `src/lib/blockchain/get-company.ts`                         | Contract read functions (chain-aware)                 |
| `src/lib/blockchain/get-company-events.ts`                  | Company events fetcher (chain-aware)                  |
| `src/lib/blockchain/safe-api.ts`                            | Safe Transaction Service API wrapper (chain-aware)    |
| `src/lib/store/draft.ts`                                    | Setup wizard state (includes chainId)                 |
| `src/app/(app)/dashboard/page.tsx`                          | Main dashboard (reads chain from URL)                 |
| `src/app/(app)/dashboard/safe/page.tsx`                     | Safe management page (owners, balances, txs)          |
| `src/app/(app)/dashboard/tokens/page.tsx`                   | Company token page with cap table preview             |
| `src/app/(app)/dashboard/ens/page.tsx`                      | ENS management (chain-aware)                          |
| `src/app/(app)/dashboard/components/treasury-summary.tsx`   | Treasury widget showing Safe balance                  |
| `src/app/api/ens/check/route.ts`                            | ENS check API (accepts chainId param)                 |

---

## Payment Model

**Hybrid model: User sends ETH to treasury for ENS/Safe costs, server executes ENS + Safe txs, then user signs final recordCompany() tx.**


| Cost Component                   | Paid By                | Recipient                     |
| ---------------------------------- | ------------------------ | ------------------------------- |
| ENS Registration (1 year)        | Server (from treasury) | ENS Protocol                  |
| Safe Deployment Gas              | Server (from treasury) | Network                       |
| Service Fee (25% of ENS cost)    | Server (from treasury) | StartupChain (`feeRecipient`) |
| Gas fees (commit + register ENS) | Server (from treasury) | Network                       |
| **recordCompany() Gas**          | **User**               | Network                       |
| **User Prepayment**              | User                   | StartupChain Treasury         |

**Flow:**

1. `useCompanyRegistration` calculates total costs (ENS + Safe gas + service fee + buffer)
2. User sends prepayment to `TREASURY_ADDRESS` via wagmi `useSendTransaction`
3. Payment confirmed → server actions execute ENS commit/register + Safe deployment
4. Server wallet (`STARTUPCHAIN_SIGNER_KEY`) pays for ENS + Safe from treasury funds
5. Status becomes `ready-to-record` → user prompted to sign `recordCompany()` tx
6. User signs with their wallet → user is `msg.sender` on-chain (pays only gas)

The `TREASURY_ADDRESS` is the same as the server signer address for simplicity.
