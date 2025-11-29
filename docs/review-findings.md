# Review notes — feat/frontend-in-charge-dashboard

Scope: static workspace review only (no remote PR diffs). Checks are against `AGENTS.md` guardrails plus `docs/general/modern-react-nextjs-guide.md`.

## Issues / gaps

- Dashboard data flow: `src/app/(app)/dashboard/page.tsx` is all mock data and doesn’t read Privy/chain state. Per dashboard plan, move to a server component that uses `getServerSession` + `getCompanyByAddress` with revalidation tags and drop the mocks.
- Wizard state/store: `src/app/(app)/dashboard/setup/components/setup-wizzard.tsx` relies on Zustand (`src/lib/store/draft.ts` + persist). Guardrails prefer built-in React/server actions and URL/search params for persistence; replace the store with `useActionState` + form actions and rename the file to `setup-wizard` for clarity.
- ENS registration flow: `src/hooks/use-smart-wallet.ts` and `src/hooks/use-ens-registration.ts` run the full registration client-side with long blocking waits, verbose logging, and secrets in `localStorage`. Shift reads/cost checks into server actions with a viem public client, keep only the signature step client-side, swap the 61s loop for a timer-driven UI, and drop debug logging/localStorage secrets.
- ENS cost check accuracy: `checkWalletBalance` in `src/hooks/use-ens-registration.ts` calls `getRegistrationCost('samplename', 1)` instead of the requested name, so balance gating can be wrong.
- Blockchain client shape: `src/lib/blockchain/startupchain-client.ts` returns a config object rather than a viem `walletClient` with `writeContract` (see `docs/general/server-side-dashboard-guide.md` B1). It also throws on missing env at import time; prefer lazy init and keep the signer strictly server-side.
- Contract read helper: `src/lib/blockchain/get-company.ts` throws on missing `NEXT_PUBLIC_STARTUPCHAIN_ADDRESS` at import and uses an inline ABI without caching. Make the address server-only, add `next: { revalidate }`/tags, and normalize return types.
- Redirect handling: `setup-wizzard.tsx` uses `window.location.href` post-success; use Next routing/`router.refresh()`/`redirect` to preserve app shell state.



## Testing / coverage

- No targeted tests or type checks around auth/middleware (`src/proxy.ts`, `src/lib/auth/server-session.ts`) or hooks (`use-smart-wallet`, `use-ens-registration`). Add Vitest with mocked Privy/viem and run `yarn tsc --noEmit` on touched files.
