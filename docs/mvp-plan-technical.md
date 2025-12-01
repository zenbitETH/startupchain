### Startupchain Inc.

**Team / Ownership**
- Habacuc — SEO, cofounder. Owns GTM narrative, VC/media comms, needs clear technical checkpoints.
- gertsio — CTO, cofounder. Owns architecture, infrastructure, auth/RBAC, API contracts.
- kira — Full-stack + smart contracts. Owns Solidity work, on-chain integrations, end-to-end testing.
- Marcus — Full-stack. Currently focused on adding RainbowKit alongside Privy and supporting UI tasks.

---

## Context Recap
- Product: ENS Company Registry dApp that lets founders register ENS names, choose single vs Safe multisig ownership, define treasury wallets, and configure revenue splits that can later be paid out on-chain.
- Current stack (from repo): Next.js 14 App Router, React 18, Tailwind v4 + shadCN UI, Privy, Wagmi/Viem, TanStack Query, React Hook Form, ENS + Safe integrations pending, Neon PostgreSQL.
- Guardrails (AGENTS.md): keep styles in `src/style.css`, no hard-coded colors, no new heavy deps w/o approval, avoid fetching directly in components, default to small components/diffs, use SSR/SSG when possible, leverage native forms / URL params / server actions for persistence, prefer built-in React patterns for shared state.
- `docs/about_not technical.md` says the SEO plan is only a conversation starter; every technical decision must be reviewed with the founders before locking it in. The document you are reading is the working technical plan that should evolve with those approvals.

---

## Delivery & Tracking
- Small team → keep coordination lightweight. Default tracker is GitHub Issues with short, implementation-ready tickets linked back to sections below.
- Linear can be used individually for personal planning, but it should mirror whatever gets filed on GitHub to avoid drift.
- No extra tooling (Jira, Notion, etc.) unless the team agrees; when in doubt, stick to GitHub Issues + PR checklist from `AGENTS.md`.

---

## MVP Goals (technical)
1. Let a user authenticate (email via Privy, EOA via RainbowKit) and land in a dashboard without hydration errors.
2. Provide a guided ENS-registration flow that captures company metadata, owner structure (single vs Safe multisig), treasury wallet, and revenue split percentages.
3. Deploy minimal but functional smart contracts (`CompanyRegistry`, `RevenueManager`) with Safe + ENS integration points and wire them to the UI through secure server actions.
4. Support gasless transactions for email users (Privy embedded wallets) while letting wallet users sign normally.
5. Ship an auditable revenue split + payout experience with on-chain state as the single source of truth.

Non-functional: SSR-first pages for SEO, deterministic builds, file-scoped type-checking, test-first where new flows appear, and no front-end data fetching side-effects in components.

---

## Architecture Snapshot
- **Rendering model:** App Router layouts + server components for all public/protected pages; promote SSR/SSG with revalidation windows. Client components only when user interaction or browser APIs are required (forms, wallet connect buttons).
- **State & data:** Server actions for mutations, `route.ts` handlers for complex blockchain orchestration, TanStack Query only for client-side cache when unavoidable (needs explicit justification per feature). Shared state via React context/hooks; no external stores.
- **Styling:** Tailwind v4 + shadCN primitives; keep overrides in `src/style.css`. Use CSS variables or theme tokens instead of hard-coded hex values.
- **Forms:** Native `<form>` with server actions or progressively enhanced client form handlers. Reach for React Hook Form only on high-complexity, multi-step forms after CTO approval (documented below).
- **Blockchain:** Wagmi + Viem for reads/writes, Safe SDK for multisig creation, ENS registrar interactions via Viem contracts. Smart contracts compiled via Foundry/Hardhat (confirm tool).
- **Auth:** Privy remains the primary auth. RainbowKit Web3 connectors run side-by-side for wallet owners; both feed a unified user session/context that server actions can read (via cookies/JWT from Privy).

---

## Workstreams & Detailed Plan

### 1. Authentication & Wallet UX
- **Privy integration hardening**
  - Move any Privy provider setup into a server component-friendly provider (`src/lib/providers.tsx`) that only hydrates client pieces where needed.
  - Ensure embedded wallets expose a deterministic signer accessible to server actions via Privy Access Tokens.
- **RainbowKit addition**
  - Marcus to add RainbowKit with the minimal connectors (MetaMask, WalletConnect, Coinbase). Place UI in shadCN sheet/dialog rather than custom divs.
  - Share wallet connection state through context so forms/server actions can differentiate between Privy-managed users and RainbowKit EOAs.
- **Session handling**
  - Use cookies set by Privy for server actions; for RainbowKit users, rely on JWT/session set via Next Auth-style route or lightweight custom session (decision pending approval).
  - Add a server-side guard in `(app)/` layouts to redirect anonymous users to `(public)/login`.
- **Decisions awaiting approval**
  1. Use built-in Next middleware for auth gating vs a lightweight `/api/auth/me` endpoint.
  2. Whether to keep React Hook Form for onboarding wizard or move to native forms + zod + server validation.

### 2. ENS Registration Flow (Frontend)
- **Wizard structure**
  - Multi-step form (company profile → ENS name → ownership model → revenue splits → confirmation). Each step is a small client component, but data persists via URLSearchParams or server actions storing draft state.
  - Use shadCN `Stepper` pattern (or Tabs) to avoid custom div wrappers.
- **Data validation**
  - Synchronous validation with Zod schemas; server action re-validation before on-chain writes.
  - ENS availability check implemented via server action (SSG path). No `fetch` directly in components—call a server action that uses Viem to read registrar data.
- **UI/UX**
  - Input components pulled from shadCN library to respect design guardrails.
  - Provide realtime ENS cost estimate + gas estimate via server action using cached price oracle.
- **Persistence**
  - Draft data persisted in URL query params for shareable flows; final submission hits a server action that orchestrates contract calls.

### 3. Ownership Models & Safe Integration
- **Single owner**
  - Capture single EOA (or Privy wallet). Use server action to call `CompanyRegistry.registerSingleOwner`.
- **Multisig (Safe)**
  - UI to collect owner EOAs + threshold. Use Safe SDK server-side (Node) to create Safe, returning the Safe address before writing to registry.
  - Provide read-only summary of Safe status (pending signatures, etc.) via server actions scheduled with revalidation.
- **RBAC**
  - gertsio owns definition of user roles (founder, collaborator, auditor). Frontend consumes RBAC decisions via server action returning capabilities for UI gating (no client-only RBAC).

### 4. Revenue Split Configuration & Distribution
- **Config UI**
  - Use percentage sliders/inputs with validation that totals 100%. Keep colors via CSS vars (no hardcoding).
  - Persist splits to `CompanyRegistry` or `RevenueManager` (see contract plan).
- **On-chain execution**
  - Server action batches: (1) register ENS, (2) deploy or connect to Safe, (3) write revenue split config, (4) optionally queue initial deposit.
  - Revenue distributions triggered either manually from dashboard or scheduled via backend job (cron) hitting server action (requires approval).
- **Gasless**
  - For Privy wallets, leverage sponsored transactions API (confirm vendor). Need approval on provider (Biconomy vs Privy out-of-box). Track in open questions.

### 5. Dashboard & Reporting
- **Server components for summary cards** with incremental static regeneration for public data; client components only for live updates (e.g., payout status).
- **Data fetching**
  - Aggregated company state served via server action hitting Viem reads + caching. TanStack Query only wraps that action in the dashboard client component for refetch-on-focus.
- **Activity log**
  - Append-only log stored either on-chain (events) or in a lightweight database (Supabase/Planetscale). Need approval for DB selection. Until then, rely on indexed on-chain events surfaced via server action.

### 6. Smart Contract Plan (kira ownership)
- **CompanyRegistry.sol**
  - Stores: `bytes32 ensLabel`, `address treasury`, `OwnerType {Single, Safe}`, `address[] owners`, `uint16[] revenueSplits`, `metadataURI`.
  - Functions: `registerSingle`, `registerSafe`, `updateMetadata`, `setRevenueSplits`, getters. Emits events for off-chain indexing.
- **RevenueManager.sol**
  - Holds funds, enforces split percentages, supports pull-based withdrawals per owner, exposes `distribute(uint256 amount)` for forced payouts.
  - Integrate with Safe modules if Safe is treasury (module-based or separate contract). Decide w/ CTO whether RevenueManager owns treasury or merely tracks splits referencing Safe.
- **ENS + Safe integration**
  - Use ENS Base Registrar + Controller via Viem for register/commit/reveal cycle. Safe integration via Safe Factory contract; wrap in helper library.
- **Security**
  - Add re-entrancy guards, access control using `Ownable` or custom role manager. Include unit + property-based tests.
- **Tooling**
  - Need confirmation: Hardhat vs Foundry. Default to Foundry for speed unless legacy scripts require Hardhat. Document once approved.

### 7. Backend Infrastructure & DevOps
- **Server actions + API routes** for blockchain orchestration, protected by session validation.
- **Background jobs**
  - If scheduled payouts or ENS renewals are needed, use Next Cron or external job runner (need approval).
- **Secrets management**
  - `.env` for local, Vercel encrypted env variables for deploy.
- **Monitoring**
  - Add basic logging (pino) piped to Vercel logs; consider simple health endpoint.

### 8. Testing & QA
- **Unit tests**
  - `yarn vitest run path/to/file.test.tsx` for UI/business logic. Follow "test first" rule for new flows (contracts + server actions).
- **Contract tests**
  - Solidity tests (Foundry/Hardhat). Add integration tests that simulate ENS + Safe flows on anvil.
- **E2E smoke**
  - Lightweight Playwright script for onboarding path (ask approval if we need to add dependency; otherwise manual script).
- **Type checks & lint**
  - File-scoped `yarn tsc --noEmit src/...` before commits, targeted linting per AGENT instructions.

---

## Open Decisions Requiring Founder Approval
1. **Form library** — stick with native + server actions, or continue using React Hook Form for the onboarding wizard?
2. **Session strategy for RainbowKit users** — Next middleware-only vs dedicated `/api/auth/session` route storing JWT.
3. **Database usage** — Do we introduce a lightweight DB (e.g., Supabase) for logs/off-chain data, or rely solely on on-chain events + edge caching?
4. **Gasless provider** — Privy-sponsored tx vs integrating a service like Biconomy or thirdweb Gasless. Impacts timeline.
5. **Contract toolchain** — Hardhat (existing ecosystem) vs Foundry (faster). Need alignment before kira proceeds.
6. **Background jobs** — Should we schedule ENS renewals/payout reminders via external cron (needs infra) or keep manual for MVP?

Once we have answers, we can break each workstream into executable tickets with estimates and start Test-First implementation per section above. Let me know which decisions to lock first.***
