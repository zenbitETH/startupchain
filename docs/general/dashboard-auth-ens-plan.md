# Dashboard,\*\*\*\* Auth, and ENS Re-plan

system prompt: Work inside this doc: reply inline under comments (using `>`), name yourself **AI**, and mark open threads with `--> gertsio`. Ask before adding new sections, keep diffs small, and remind gertsio about unanswered blockers. Treat this file as the living roadmap + comms + discussion space for the project; only create GitHub issues when explicitly requested. Be proactive and there should not be threads where user's question / suggestion isn't answered

_Last updated: 2025-11-10_

This document replaces the Neon/Postgres-heavy plan in `docs/ens-flow-plan.md` for the dashboard + ENS wizard work. The new direction leans entirely on the `StartupChain` contract set in `src/contracts/src/StartupChain.sol` plus the viem client in `src/lib/blockchain/startupchain-client.ts`.

> **gertsio** _(11/11/25 11:01pm)_ — Use it as the guide and tie it to GitHub Issues/Projects instead of Linear for simplicity, or do you think Linear is still better for a small team?
>
> **AI** _(11/11/25 11:01pm)_ — GitHub Projects + Issues is lighter for us now—I'll keep everything GitHub-native and only mention Linear if we ever need personal tracking.

---

## 1. Why This Exists Now

- New Foundry artifacts (`script/StartupChain.s.sol`, viem client, `/api/ens/register`) give us end-to-end contract writes without relying on Postgres mirrors.

> **gertsio** _(11/11/25 11:01pm)_ — Why do I need Viem, how is it different from Wagmi, and what should I know about them?
>
> **AI** _(11/11/25 11:01pm)_ — Viem is the lower-level RPC toolkit (server-safe clients, typed ABI helpers) and Wagmi wraps it for React hooks. We need Viem in server actions/routes, Wagmi only in client components, so we can reuse ABI/contract configs everywhere.

- Auth has drifted: Privy should be the single session authority again, RainbowKit/RPC is additive.

> **gertsio** _(11/11/25 11:01pm)_ — Only Privy with hooks to use it in our own UI. No Privy templates and UI control stays with us.
>
> **AI** _(11/11/25 11:01pm)_ — Noted—we'll stick to Privy hooks plus custom shadCN UI, removing any prefab Privy components.

- The dashboard must surface on-chain company data immediately after registration. We can read directly from the contract and skip DB reads unless we later need analytics or complex filters.

> **gertsio** _(11/11/25 11:01pm)_ — Correct. We should nuke DBs to keep the bundle small and add a backlog item to clean up unused/weird architecture pieces.
>
> **AI** _(11/11/25 11:01pm)_ — I'll note a housekeeping backlog item to audit/remove unused code and DB remnants; staying contract-first keeps the bundle lean.

---

## 2. Guardrails & Assumptions

1. **Privy-first auth** — No mixed providers until Privy session + embedded wallet flow is stable. RainbowKit can still connect wallets, but Privy drives authorization and server actions.

> **gertsio** _(11/11/25 11:01pm)_ — Only Privy with wallet connection right now. Other sign-up methods come later because they change the flow (wallet registration, top-ups, etc.).
>
> **AI** _(11/11/25 11:01pm)_ — Got it—we’ll scope Epic A strictly around wallet-based Privy auth and leave non-wallet login as a future epic once we solve top-ups/funding.

2. **Server-driven data** — ENS/company data comes from `StartupChain` reads via server components/actions. No client-side `fetch`.

> **gertsio** _(11/11/25 11:01pm)_ — Why do we need server actions? Should the dashboard be client-side or server-side? Let’s discuss.
>
> **AI** _(11/11/25 11:01pm)_ — Server actions let us sign/read with Viem in a trusted environment and keep RPC keys off the client. The dashboard shell should stay as a server component for instant data, with client islands only for interactive pieces (wizard, search).
>
> **gertsio** _(11/12/25 12:20am)_ — Agree. Let’s explore using Privy on the server; here’s the doc: https://docs.privy.io/llms-full.txt
>
> **AI** _(11/12/25 12:20am)_ — Thanks—I'll review that guide and fold a “server-side Privy usage” note into the next revision so the dashboard plan reflects how we authenticate from server actions.
>
> **gertsio** _(11/12/25 12:55am)_ — Yeah we should do it. Next step is to move to section 3 and build the plan step by step.
>
> **AI** _(11/12/25 12:55am)_ — Copy that—I’ll translate section 3 into a sequenced action list (Auth → Wizard → Dashboard) so we can execute in order. I’ll start by breaking Epic A into concrete first tickets in the next edit unless you prefer a different order.
>
> gertsio - got it, do

3. **Component reuse** — The ENS search input that lives on the homepage becomes a reusable component mounted in the dashboard empty state.

> **gertsio** _(11/11/25 11:01pm)_ — Yep!
>
> **AI** _(11/11/25 11:01pm)_ — Copy that—I'll keep ENS search as a shared component in the backlog.

4. **On-chain as source of truth** — No database writes in the wizard for now. We only persist via contracts, then derive state from chain reads plus cached request data in React state/session storage if needed.

> **gertsio** _(11/11/25 11:01pm)_ — Yep! Also, what tool do we use for data fetching from the contract? Is it like React Query or GraphQL? Need a guide.
>
> **AI** _(11/11/25 11:01pm)_ — For server reads we'll use Viem’s `publicClient.readContract`; on the client, Wagmi hooks already ride on React Query, so no extra library is needed. I’ll document a short “how to read/write with Viem/Wagmi” guide next pass.
>
> **gertsio** _(11/12/25 12:20am)_ — Good. Create a new `use-guid-viem-vagmi.md` doc with examples showing where to use Wagmi hooks vs Viem, and how they fit the flow.
>
> **AI** _(11/12/25 12:20am)_ — On it—I’ll add the guide under `docs/general/` with practical read/write examples tied to the wizard and dashboard paths.
>
> **AI** _(11/12/25 12:45am)_ — Done. `docs/general/use-guid-viem-vagmi.md` now covers Viem server actions, Wagmi hooks, and a flow map for dashboard + wizard usage. Feel free to drop follow-up notes there.
>
> gertsio - ok

5. **Small diffs** — Ship each subsection below as its own PR/Linear ticket. Keep styling in `src/style.css`, rely on shadCN primitives.

> **gertsio** _(11/11/25 11:01pm)_ — yep!
>
> **AI** _(11/11/25 11:01pm)_ — Noted—small diffs and centralized styling only.

---

## 3. Linear-style Backlog

### Step-by-step rollout

1. **Step 1 – Privy auth foundation**: Deliver Epic A so server actions + dashboard shell can trust Privy sessions (includes server-side Privy integration from section 2).
2. **Step 2 – ENS wizard contract writes**: Tackle Epic B once Step 1 is green; wizard depends on the authenticated server actions.
3. **Step 3 – Dashboard UX + ENS embed**: Ship Epic C immediately after wizard work so new registrations surface in-app.
4. **Step 4 – Data strategy & performance**: Fold in Epic D items (caching, future DB hooks) after dashboard basics land.
5. **Step 5 – Testing/tooling sweep**: Lock Epic E deliverables as soon as each prior step stabilizes so we exit with coverage.

Use the epics below as the task bank for each step; we can check them off sequentially instead of juggling everything at once.

> **gertsio** _(11/11/25 11:01pm)_ — Part 3 after sections 1 and 2 are complete.
>
> **AI** _(11/11/25 11:01pm)_ — Sounds good—once guardrails/assumptions are appr„oved I'll rephrase this backlog into numbered GitHub Issues and reference them here so we keep everything in sync.
>
> ** gertsio** _(11/12/25 12:32am)_ — Ok, and we can probably automate it; there should be MCP and/or API/CLI hooks.
>
> **AI** _(11/12/25 12:32am)_ — Agreed—once sections 1–2 are locked I’ll script the issue creation via GitHub’s CLI/API (or MCP if faster) so the backlog stays in sync without manual copy/paste.
>
> ** gertsio** _(11/12/25 12:40am)_ — Hmm, maybe GH Issues isn’t even the best way; this doc + AI feels more efficient.
>
> **AI** _(11/12/25 12:40am)_ — Fair point—let’s keep iterating in this doc and only spin up GitHub issues when we specifically need async tracking or outside collaborators. I’ll keep expanding the plan + linked guides here by default.
>
> gertsio - ok it's time to move forward i guess

### Epic A — Privy Auth Hardening

- **A1**: Refactor providers so Privy wraps the entire app tree with SSR support (follow `docs/auth.md` guardrails). Audit that `login()` only comes from Privy hooks.
- **A2**: Add server action/session helper that verifies Privy tokens before allowing ENS register/dashboard reads. Remove any fallback mocks.
- **A3**: Gate the dashboard layout route segment: unauthenticated → redirect to `(public)/login`, authenticated → load user context for downstream server components.
- **A4**: Align RainbowKit usage with Privy identity (if we expose it) by mapping connected EOA → Privy user in context. Disable actions if mismatch.

> **AI** _(2025-01-27)_ — **Recommended starting point: A2 first, then A3, then A1 if needed.**
>
> **Rationale**: A2 (server session helper) is the foundation—we need Privy token verification before we can gate routes (A3) or refactor providers (A1). Current state: middleware checks cookies but doesn't verify tokens; dashboard is client-only with no server guard.
>
> **Execution order**:
>
> 1. Review Privy server-side docs (https://docs.privy.io/llms-full.txt) to understand token verification APIs
> 2. Create `src/lib/auth/server-session.ts` helper that verifies Privy access tokens from cookies/headers
> 3. Use helper in middleware for A3 (route guard)
> 4. Use helper in server actions for contract reads/writes
> 5. A1 (provider refactor) may not be needed if current setup already supports SSR boundaries correctly
>
> **Blockers**: Need to understand Privy server SDK APIs for token verification. Once A2 is done, A3 becomes straightforward.
>
> --> gertsio

> **AI** _(2025-11-15)_ — Read and aligned. I’ll start with A2: add `src/lib/auth/server-session.ts` to verify Privy access tokens (per server doc), then wire middleware + server actions to it so A3 is unblocked. If you prefer a different order or want a checkpoint before wiring middleware, flag it. --> gertsio

### Epic B — ENS Wizard & Contract Writes

- **B1**: Fix `startupChainClient` to return a viem `walletClient` with `.writeContract` (current helper just returns `{ chain, transport, account }`). Expose paired `publicClient` for reads.
- **B2**: Move `/api/ens/register` logic into a server action that runs `walletClient.writeContract` and returns the tx hash; keep API route only if required for legacy callers.
- **B3**: Convert the ENS wizard to a multi-step form that saves interim state in React (or URL search params) and only performs contract writes at confirmation. Provide a "Review" step before signing.
- **B4**: Support granular contract writes: if contract evolves to store metadata per founder, add helper functions; otherwise batch-write once and keep front-end state authoritative until tx confirms.
- **B5**: Add status polling (via server action `revalidatePath` + `publicClient.getTransactionReceipt`) so the wizard transitions to the dashboard once the `CompanyRegistered` event is mined.

### Epic C — Dashboard UX & ENS Search Embed

- **C1**: Server component `DashboardCompanyInfo` reads from `StartupChain` using the caller's Privy-linked address. Show company ENS, owner, creation timestamp, founders array.
- **C2**: Build the empty state card: "No registered company yet" with CTA `Register company`. Clicking expands the shared ENS search component inline (reuse homepage version via a new `EnsSearchPanel` component).
- **C3**: After ENS availability check succeeds, invoke the wizard (modal or route) without leaving the dashboard context. Pass selected ENS via URL params.
- **C4**: Display a small “Info” section for registered companies: ENS, owner wallet, founders, registration block number. Use shadCN `Card`, `Badge`, etc.—no custom div wrappers.
- **C5**: Add a "Register another ENS" CTA that re-opens the ENS panel but prevents duplicates by checking contract state via `getCompanyByAddress`.

### Epic D — Data Strategy & Future DB Hooks

- **D1**: Document how we cache contract reads (e.g., Next data cache + revalidate tags per account). Aim for sub-1s loads with RPC.
- **D2**: Track scenarios that might still need a DB later:
  - Activity feeds or analytics.
  - Multi-chain snapshots for search.
  - Draft wizard data you don’t want on-chain yet.
  - Audit logs or off-chain KYC traces.
- **D3**: If/when we need those, plan for a light Drizzle/SQLite or Neon layer, but treat it as an opt-in module separate from the core flow.

### Epic E — Testing & Tooling

- **E1**: Write Foundry tests covering `registerCompany`, duplicate ENS guard, founder array validation, ENS transfer (if exposed).
- **E2**: Add Vitest coverage for the new server actions (mock viem client) and React components (empty vs populated dashboard).
- **E3**: Configure file-scoped type checks + lint per `AGENTS.md` commands for every PR touching these features.

---

## 4. Implementation Notes

- **ENS search reuse**: Extract the existing homepage ENS checker into `src/components/ens/ens-search.tsx` (client) plus a server helper for availability (`/api/ens/check` already exists). Pass callbacks so dashboard can either launch wizard or show errors.
- **Wizard layout**: Prefer a dedicated route under `(app)/dashboard/register/@modal` so we keep SSR and share context. Each step should be a small component to satisfy the “small components/diffs” guardrail.
- **Server actions vs API routes**: Default to server actions for contract writes so we can rely on React’s mutation lifecycle. Keep API routes only where we must expose HTTP endpoints (e.g., external automation).
- **Event sourcing**: `StartupChain` emits `CompanyRegistered`. Use viem `getLogs` on dashboard load to enrich UI (e.g., registration block/time) without DB storage.
- **Performance**: Cache RPC responses with short revalidate intervals (15–30s) to avoid rate limits. For immediate updates after a write, revalidate the dashboard path and optimistically append the new company card client-side.

---

## 5. Open Questions

1. Do we need a lightweight place to store wizard drafts before hitting the contract (e.g., browser `localStorage`, Privy encrypted storage, or tiny KV)? Decide before B3.
2. Should we extend `StartupChain` to support metadata updates post-registration? If yes, add ABI method(s) and align UI with partial saves.
3. How do we handle ENS renewals/expirations? Dashboard could show expiry from ENS resolver, but we need UX + contract hooks.
4. Any compliance/logging needs that still push us toward a DB sooner rather than later?

Document answers here as they land so the rest of the team can follow along without digging through PR descriptions.
