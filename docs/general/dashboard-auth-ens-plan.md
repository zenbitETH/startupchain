# Dashboard, Auth, and ENS Re-plan

system prompt: work and answer on all the question in thread manner wright here in document. You live comments on my comments and name yourself "AI". Consult with user what will be added into this document. All adds after approval, and we still can talk without writing into this file. This file should keep small and practice to make good issues and plan

_Last updated: 2025-11-10_

This document replaces the Neon/Postgres-heavy plan in `docs/ens-flow-plan.md` for the dashboard + ENS wizard work. The new direction leans entirely on the `StartupChain` contract set in `src/contracts/src/StartupChain.sol` plus the viem client in `src/lib/blockchain/startupchain-client.ts`.

gertsio
Use it as the and make guid how to handle it with git hub issues / project instead of linear for simplicity, or you think linear still a better choice for a small team?
AI: I agree GitHub Projects + Issues is lighter for us now—I'll keep the structure GitHub-native and only mention Linear if we ever need personal tracking.

---

## 1. Why This Exists Now
- New Foundry artifacts (`script/StartupChain.s.sol`, viem client, `/api/ens/register`) give us end-to-end contract writes without relying on Postgres mirrors.
gertsio: Why do I need viem for and what the difference between viem and wagmi, how and why they needed and what i should know about them?
AI: Viem is the lower-level RPC toolkit (server-safe clients, typed ABI helpers) and Wagmi wraps it for React hooks. We need Viem in server actions/routes, Wagmi only in client components. Knowing both lets us reuse ABI/contract configs everywhere.

- Auth has drifted: Privy should be the single session authority again, RainbowKit/RPC is additive.
gertsio: Yeah, only privy with hooks to use it in our own UI. No privy templates and UI's control is ours!
AI: Noted—we stick to Privy hooks plus custom shadCN UI, remove any prefab Privy components.

- The dashboard must surface on-chain company data immediately after registration. We can read directly from the contract and skip DB reads unless we later need analytics or complex filters.
gertsio: Correct. I think we should nuke DBs to keep the bundle small. By the way should add to backlog, I should work on codebase and its architecture, also a lot of unused or weird stuff there
AI: I'll note a housekeeping backlog item to audit/remove unused code + DB remnants; keeping the bundle lean aligns with the contract-first plan.

---

## 2. Guardrails & Assumptions
1. **Privy-first auth** — No mixed providers until Privy session + embedded wallet flow is stable. RainbowKit can still connect wallets, but Privy drives authorization and server actions.

gertsio: Only privy with wallet connection, we'll add other sign up methods later since it changes the flow. For example If user can login / signup with anything other but wallet we'd need to handle wallet registration and then how to top it up, so a lot of questions. We'll definetely do it
AI: Got it—we'll scope Epic A strictly around wallet-based Privy auth and leave non-wallet login as a future epic once we solve top-ups/funding.

2. **Server-driven data** — ENS/company data comes from `StartupChain` reads via server components/actions. No client-side `fetch`.
gertsio: Ouh! It's important topic. Why do we need server actions. I don't mind but my dashboard probably should be client side or server side? How's better? And from discussion on this matter
AI: Server actions let us sign/read with Viem in a trusted environment and keep RPC keys off the client. The dashboard shell should stay as a server component for instant data, with client islands only for interactive pieces (wizard, search).

3. **Component reuse** — The ENS search input that lives on the homepage becomes a reusable component mounted in the dashboard empty state.
gertsio: Yep!

4. **On-chain as source of truth** — No database writes in the wizard for now. We only persist via contracts, then derive state from chain reads plus cached request data in React state/session storage if needed.
gertsio: Yep! Also should discuss what tool to use for data fething from contract. I don't know how it works. Is it something like react query or graphQL. Need a guid how to use it
AI: For server reads we'll use Viem’s `publicClient.readContract` inside server components/actions; on the client, Wagmi hooks already use React Query under the hood so no extra library is needed. I’ll document a short “how to read/write with Viem/Wagmi” snippet next pass.

5. **Small diffs** — Ship each subsection below as its own PR/Linear ticket. Keep styling in `src/style.css`, rely on shadCN primitives.
gertsio: yep!

---

## 3. Linear-style Backlog
gertsio: Part 3 after 1 and 2 completion
AI: Sounds good—once guardrails/assumptions are approved I’ll rephrase this backlog into numbered GitHub Issues and reference them here so we keep everything in sync.

### Epic A — Privy Auth Hardening
- **A1**: Refactor providers so Privy wraps the entire app tree with SSR support (follow `docs/auth.md` guardrails). Audit that `login()` only comes from Privy hooks.
- **A2**: Add server action/session helper that verifies Privy tokens before allowing ENS register/dashboard reads. Remove any fallback mocks.
- **A3**: Gate the dashboard layout route segment: unauthenticated → redirect to `(public)/login`, authenticated → load user context for downstream server components.
- **A4**: Align RainbowKit usage with Privy identity (if we expose it) by mapping connected EOA → Privy user in context. Disable actions if mismatch.

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
