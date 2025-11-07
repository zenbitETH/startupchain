# ENS Flow & Database Integration Plan

## 1. Goals
- Remove reliance on Privy-only session state so UI/UX works without repeated logins.
- Persist company registrations in Postgres (Neon) to power dashboards and guard rails.
- Keep ENS registry as the source of truth for ownership while mirroring essentials for fast reads.
- Enable a single onboarding flow that branches: fresh users to registration, returning users to their dashboard.

## 2. System Overview
```
Client ENS Checker → Auth (Privy or mock) → Next.js server actions/API →
Neon Postgres (business tables) ↔ ENS Contracts (ownership verification) →
Dashboard UI / Setup Wizard
```

### Key Principles
- Treat Neon as the canonical store for product state (registrations, wizard progress).
- Confirm on-chain ownership when mutating critical state, but avoid blocking reads on RPC calls.
- Keep server-side logic in server actions or API routes; client components stay presentational.
- Use feature flags/env vars to keep Privy mock and real provider swappable.

## 3. Database Schema (Postgres)
| Table | Purpose | Key Columns |
| ----- | ------- | ----------- |
| `business_accounts` | One row per company registration | `id`, `privy_user_id`, `ens_name`, `status`, `registered_at`, `smart_wallet`, `embedded_wallet`, `chain_id` |
| `founders` | Founding members & equity splits | `id`, `business_id`, `address`, `equity_percent`, `role` |
| `registration_events` | Audit log & ENS tx hashes | `id`, `business_id`, `event_type`, `tx_hash`, `payload`, `created_at` |
| `wizard_progress` | Saved state for partial onboarding | `id`, `business_id`, `step`, `data`, `updated_at` |

Indexes:
- `business_accounts(privy_user_id)` for quick dashboard lookups.
- `business_accounts(ens_name)` unique to prevent duplicates.

Migration strategy:
1. Add Prisma/Drizzle migration files (decision pending).
2. Apply schema locally via CLI; run the same migrations in Neon.
3. Provide seed script for local development.

## 4. ENS Availability Flow Changes
1. **Homepage Search**
   - Debounced ENS availability remains via `/api/ens/check`.
   - Display message + “Proceed” CTA.
2. **Proceed Button Behaviour**
   - If unauthenticated → call `login()` and redirect to `/dashboard/setup?ensName=...`.
   - If authenticated → call server action `getOrCreateBusiness(ensName)`.
     - Action checks Neon: `SELECT * FROM business_accounts WHERE privy_user_id = ?`.
     - If business exists with matching ENS name → redirect to `/dashboard`.
     - If no business → insert placeholder row with status `pending_registration`, attach normalized ENS name, and redirect to setup wizard.
3. **Duplicate Guard**
   - If user already has a business (any status >= registered) show toast “You already registered {ens}. Go to dashboard” and redirect without new row.

## 5. Dashboard Updates
- On load, call server action `getBusinessesForUser`.
- If zero rows → show empty state with “Register a business” button (opens wizard).
- If one or more rows → show summary cards:
  - ENS name
  - Registration status (Pending ENS commit, Awaiting tx, Registered, etc.)
  - Smart wallet address, last updated timestamp.
- CTA “Register another name” stays but respects duplicate guard.

## 6. Registration Flow
1. **Setup Wizard Start**
   - Fetch persisted `wizard_progress` for user+ens name to pre-fill fields.
   - Optionally allow editing of founders/equity before committing.
2. **ENS Commitment**
   - When user confirms, call existing `useEnsRegistration` logic via server action (extract into reusable module).
   - On success, update `business_accounts.status = 'commit_submitted'` and log tx in `registration_events`.
3. **Commit Wait / Countdown**
   - Continue storing countdown state in React, but also persist start timestamp in `wizard_progress` to recover after refresh.
4. **Final Registration**
   - After commit wait, execute registration tx.
   - On success, set `status = 'registered'`, store final tx hash, owner address, and mark wizard as completed.
5. **On-chain Verification**
   - After registration, background job or server action verifies ENS owner via `getOwner` (viem). If mismatch, set status `verification_failed`.

## 7. Authentication & Authorization
- Persist `privy_user_id`, `wallet_address`, and `smart_wallet` in DB rows.
- Server actions must cross-check `user.id` before reading/writing business rows.
- Middleware: once mock mode is disabled, check Neon for session state if needed; keep existing cookie guard for now.

## 8. Contract Registration & Wallet Handling
- Reuse embedded wallet for tx signing in development; swap with smart wallet when available.
- Store both wallet addresses in DB for cross-reference.
- If future contracts manage state (e.g., `CompanyRegistry.sol`), store contract address and network ID in `business_accounts`.

## 9. Testing & Validation
- Add integration tests for server actions using Neon test URL (or local Postgres).
- Unit-test new helper modules (e.g., business repository, ENS service).
- Manual QA checklist:
  - New user registers name → wizard persists progress → dashboard shows card.
  - Returning user with existing registration clicks “Proceed” → redirected to dashboard without duplicate row.
  - Database rows created for founders, events, wizard progress.

## 10. Rollout Plan
1. Ship DB schema + client helper (already scaffolded).
2. Implement repository layer (`src/lib/db/business.ts`) for CRUD with type-safe queries.
3. Refactor `useSmartWallet` / `useEnsRegistration` to call server actions for side effects.
4. Update ENS checker + dashboard UI to use new actions.
5. Add admin script (`scripts/verify-ens.ts`) to reconcile DB with on-chain state.
6. After QA, update deployment docs with Neon URL and migration commands.

## 11. Open Questions
- Choose ORM vs. raw SQL (Prisma/Drizzle recommended for migrations).
- How to handle multi-tenant data (future: allow multiple businesses per user?).
- Should we store raw transaction receipts for auditing? (likely yes in `registration_events`).
- Background job runner (Next Cron, Vercel Scheduler, or external queue) for periodic ENS verification.

---
Use this document as the working contract for the ENS flow rework; adjust as we learn more from implementation. All teammates should keep edits additive and track open questions in this file.
