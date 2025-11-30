# ENS Registration Flow — Implementation Plan

**Status:** Active (Source of Truth)  
**Created:** 2025-11-29  
**Supersedes:** Redis-polling approach in `dashboard-auth-ens-plan.md` Epic B5

---

## Goal

One-click ENS company registration with real-time progress on dashboard. User clicks "Create Company" → immediately redirects to Dashboard ENS tab → sees live progress → survives page refresh → completes automatically.

## Architecture Decision

**Cookie + localStorage for state, Alchemy blockchain for truth, client-side timer for countdown.**

### Why This Approach

| Approach | Cost/Month | Users/Month | Chosen |
|----------|------------|-------------|--------|
| Redis polling (3s interval) | ~$10+ | ~1,000 | ❌ |
| Alchemy RPC (blockchain truth) | $0 | ~28,700 | ✅ |

Alchemy free tier provides 30M compute units/month. Each registration uses ~1,044 CU. This scales to **28,700 users/month** at zero cost.

### State Storage

| Data | Storage | Why |
|------|---------|-----|
| Pending registration (ensName, readyAt, commitTxHash) | HTTP-only cookie | Survives browser close, server-readable for recovery |
| Founder details backup | localStorage | Larger data, client-only fallback |
| Company data (after registration) | Blockchain query | Source of truth, already implemented |
| Progress step | Derived from cookie + time | No storage needed |

---

## Implementation Steps

### Step 1: Pending Registration Cookie Utilities

**File:** `src/lib/auth/pending-registration.ts` (new)

```typescript
// Cookie operations for pending ENS registration
// - setPendingRegistration(data) — sets HTTP-only cookie
// - getPendingRegistration() — reads cookie (server-side)
// - clearPendingRegistration() — deletes cookie
// Cookie format: { ensName, commitTxHash, readyAt, owner, founders, threshold, status }
```

**Status field values:**
- `"committing"` — commit tx being sent
- `"waiting"` — waiting for 60s commitment window
- `"registering"` — register tx being sent  
- `"creating"` — company contract tx being sent
- `"completed"` — all done
- `"failed"` — error occurred (with error message)

### Step 2: Simplify Server Actions

**File:** `src/app/(app)/dashboard/setup/actions.ts`

Changes:
1. Remove `redisSet` calls from `commitEnsRegistrationAction`
2. Set pending cookie instead: `cookies().set('pending-ens', JSON.stringify(data))`
3. Return minimal data: `{ ensName, commitTxHash, readyAt, owner }`
4. Keep Redis as optional backup (can remove entirely later)

`finalizeEnsRegistrationAction` changes:
1. Make idempotent — check blockchain state first
2. If ENS already registered to correct owner AND company exists → return success
3. Update cookie status at each step
4. Clear cookie on success

### Step 3: Registration Progress Component

**File:** `src/app/(app)/dashboard/components/registration-progress.tsx` (new)

Client component showing 4-step progress:

```
[●] Commitment sent     → tx confirmed
[●] Waiting for ENS     → countdown timer (no polling!)
[○] Registering name    → pending
[○] Creating company    → pending
```

Props:
- `ensName: string`
- `readyAt: number` — timestamp when registration can proceed
- `commitTxHash: string`
- `initialStatus: PendingStatus`

Behavior:
- Uses `useState` + `useEffect` for countdown timer
- When countdown reaches 0 → auto-calls `finalizeEnsRegistrationAction`
- Shows "Registering..." state during finalization
- On success → calls `router.refresh()` to reload with company data

### Step 4: Update Setup Wizard

**File:** `src/app/(app)/dashboard/setup/components/setup-wizard.tsx`

Changes:
1. After `commitEnsRegistrationAction` succeeds:
   - Store backup in localStorage (founder details)
   - `router.push('/dashboard/ens')` immediately
2. Remove `CountdownModal` usage
3. Remove `CongratulationsModal` — success shows on dashboard

### Step 5: Update ENS Dashboard Page

**File:** `src/app/(app)/dashboard/ens/page.tsx`

Changes:
1. Server component reads pending cookie via `cookies()`
2. If pending exists and not completed:
   - Check if `readyAt` passed — if yes, call `finalizeEnsRegistrationAction` server-side
   - Render `<RegistrationProgress />` at top
3. If company exists (from blockchain query) — show normal view
4. Pass props to client component: `ensName`, `readyAt`, `status`

### Step 6: Dashboard Recovery Logic

**File:** `src/app/(app)/dashboard/page.tsx`

Add to `getCompanyData()`:
1. Read pending cookie
2. If `readyAt` passed but `status === 'waiting'`:
   - Call `finalizeEnsRegistrationAction` server-side
   - This handles users who closed browser and returned
3. Continue with normal company query

### Step 7: API Route for Retry

**File:** `src/app/api/ens/finalize/route.ts` (new)

Simple endpoint:
1. Read pending cookie
2. Validate session
3. Call `finalizeEnsRegistrationAction`
4. Return result

Used by retry button if auto-finalize fails.

### Step 8: Clean Up Redis

**File:** `src/app/(app)/dashboard/setup/actions.ts`

Remove:
- All `redisSet` / `redisGet` / `redisDel` calls from registration flow
- Keep `src/lib/redis/upstash.ts` for other features if needed

---

## User Flow

```
Homepage
    ↓ Enter ENS name, click "Proceed"
    ↓ (Login if needed)
    
/dashboard/setup?ensName=acme
    ↓ Fill founder details
    ↓ Click "Create Business"
    ↓ Server: commitEnsRegistrationAction
    ↓   - Sends commit tx
    ↓   - Sets pending cookie
    ↓   - Returns { ensName, readyAt }
    ↓ Client: router.push('/dashboard/ens')
    
/dashboard/ens
    ↓ Server reads pending cookie
    ↓ Renders <RegistrationProgress /> with countdown
    ↓ 
    ↓ [User can refresh, close browser, come back - cookie persists]
    ↓
    ↓ Countdown reaches 0
    ↓ Client calls finalizeEnsRegistrationAction
    ↓   - Sends register tx
    ↓   - Sends company tx
    ↓   - Updates cookie status
    ↓   - Clears cookie on success
    ↓ router.refresh()
    ↓
    ↓ Page reloads, company exists in blockchain
    ↓ Normal dashboard view
```

---

## Error Handling

| Error | UX |
|-------|-----|
| Commit tx fails | Show error inline, "Retry" button |
| Register tx fails | Show error, "Retry" button (idempotent) |
| Company tx fails | Show error, "Retry" button (idempotent) |
| Insufficient funds | Show balance + faucet link |
| ENS already taken | Show error, link to search new name |

---

## Migration Notes

### Files to Remove/Deprecate

- `src/components/modals/countdown-modal.tsx` — no longer needed
- `src/components/modals/congratulations-modal.tsx` — success shows on dashboard
- Redis polling logic in `src/hooks/use-smart-wallet.ts`

### Files to Update

- `src/app/(app)/dashboard/setup/actions.ts` — remove Redis, add cookie
- `src/app/(app)/dashboard/setup/components/setup-wizard.tsx` — redirect flow
- `src/app/(app)/dashboard/ens/page.tsx` — add progress component
- `src/app/(app)/dashboard/page.tsx` — add recovery logic

### Docs to Update

- `docs/general/dashboard-auth-ens-plan.md` — Epic B5 superseded by this plan
- `docs/EnsFlow/README.md` — update "Wizard: after tx success" section

---

## Cost Analysis

| Resource | Free Tier | Usage/Registration | Registrations/Month |
|----------|-----------|-------------------|---------------------|
| Alchemy RPC | 30M CU | ~1,044 CU | 28,700 |
| Vercel | 100GB bandwidth | ~50KB | unlimited |
| Cookies | N/A | ~500 bytes | unlimited |

**Total monthly cost at 1,000 users: $0**

---

## Open Questions

1. **Founders data in cookie:** Cookie limit is ~4KB. With many founders (10+), should we use localStorage for founder details and only store addresses in cookie?
   - **Decision:** Store minimal data in cookie (addresses only), full founder details in localStorage as backup.

2. **Cookie TTL:** How long should pending cookie last before auto-expiring?
   - **Decision:** 24 hours. After that, user must restart registration.

3. **Clear on success:** Delete cookie immediately or keep as "receipt" for 1 hour?
   - **Decision:** Clear immediately, show success state from blockchain query.

---

## Changelog

- **2025-11-29:** Initial plan created, supersedes Redis polling approach
