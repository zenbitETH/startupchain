# Auth Plan: Privy SDK + Metamask

## Why this document exists
- We are migrating the app to a *wallet-first* authentication model. Privy stays in place, but email/social flows are disabled until we deliberately re-enable them.
- The dashboard is the first surface that must enforce this: if you cannot connect a wallet (MetaMask or compatible EOA), you cannot reach `/dashboard` nor trigger ENS flows.
- Navbar login needs to open MetaMask directly (via Privy’s `connectWallet`) while keeping the marketing homepage fully SSG.
- `docs/stack-docs/privy.md` currently links to Privy’s long-form docs. This file distills exactly what we need, where to put it, and how to wire it to the dashboard.

---

## Requirements & guardrails
1. Wallet-only login: `loginMethods = ['wallet']`, `walletList = ['metamask', 'walletconnect', 'coinbase_wallet']` (MetaMask first, others optional).
2. Privy provider stays global so `usePrivy()` and `useWallets()` work in both `(public)` and `(app)` trees.
3. Homepage remains SSG/ISR-friendly. Only the login button hydrates on the client.
4. Navbar login triggers MetaMask via Privy’s `connectWallet` API; success routes to `/dashboard`.
5. Dashboard loads behind auth guard (server-side redirect preferred) and assumes at least one connected wallet (embedded or EOA).
6. No fetching inside components beyond what Privy hooks already provide; mutations happen via server actions later.

---

## Provider placement (current architecture)
- `src/app/layout.tsx` renders the entire tree server-side (pure SSG) and wraps it with `ProvidersShell`. The shell renders children immediately, then—after `requestIdleCallback` fires—mounts `ClientProviders` (Privy + Wagmi + TanStack). Result: the home page ships HTML/CSS with zero JS blocking first paint, but the entire app hydrates in the background with a single provider boundary.
- `ProvidersShell` exposes `useProvidersReady()` so client components know when Privy is mounted. Until it’s ready, UI renders shadcn placeholders (skeleton buttons) instead of crashing.
- Because the shell now lives in the root layout, both `(public)` and `(app)` routes share the exact same provider instance; no more per-route wrappers or duplicate navbars.

---

## Configuring Privy for wallet-only login
Update `src/lib/providers.tsx`:

```tsx
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
  config={{
    loginMethods: ['wallet'],              // disables email/social
    walletList: ['metamask', 'walletconnect', 'coinbase_wallet'],
    defaultChain: 'ethereum',              // ensure MetaMask opens mainnet by default
    appearance: {
      theme: 'dark',
      walletChainType: 'ethereum',
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
  }}
>
  {/* Wagmi + Query providers */}
</PrivyProvider>
```

Key notes:
- `walletList` accepts the union defined in Privy types (`metamask`, `coinbase_wallet`, etc.). Ordering controls the UI order.
- Keep embedded wallets enabled for future gasless flows; users still sign with MetaMask but have a Privy-managed smart wallet ready.
- `defaultChain` ensures MetaMask opens the right network (swap to Base/Sepolia in non-prod via env gate).

---

## Navbar + auth UX (current implementation)
- Only one navbar exists (`src/components/navigation/navbar.tsx`) and it’s client-side. It renders immediately (static markup) but watches `useProvidersReady()` to know when Privy/Wagmi are mounted.
- Buttons use shadcn’s `Button` component. Before providers are ready we show disabled ghost buttons with the shared spinner; once ready, the navbar calls `useWalletAuth()` (see next section) to decide between “Connect wallet” and “Dashboard.”
- The connect action simply calls `connect()` from the hook, which wraps Privy’s `login`/`connectWallet`. When authentication succeeds, the router pushes to `/dashboard`.
- Because the root provider shell hydrates after first paint, the navbar can safely mount on the marketing page without harming SSG performance—we pay the JS cost only after the page has painted.

---

## Auth hook (`useWalletAuth`)
- Location: `src/hooks/use-wallet-auth.ts`.
- Responsibilities:
  - Call `usePrivy()` and `useWallets()` once providers are ready.
  - Derive a `displayLabel` (email or truncated wallet address) for UI.
  - Expose `connect()` / `disconnect()` helpers that wrap Privy `login`/`logout`.
  - Surface `ready`, `authenticated`, `primaryAddress`, and the raw `user`.
- Consumers: navbar, `LoginButton`, future onboarding flows. This keeps UI components “dumb”—they render shadcn buttons and call the hook instead of embedding Privy logic themselves.

Example:
```tsx
const { ready, authenticated, connect, displayLabel } = useWalletAuth()
return authenticated ? (
  <Button asChild><Link href="/dashboard">Dashboard</Link></Button>
) : (
  <Button onClick={connect} disabled={!ready}>Connect wallet</Button>
)
```

---

## Dashboard expectations
1. **Route guard**: still pending—client redirect exists, but we plan to add middleware/server guard reading Privy JWT once we store it server-side.
2. **Wallet availability**: `useWalletAuth()` already exposes `primaryAddress`; show reconnect CTA if missing.
3. **MetaMask prompt**: reuse `connect()` for “Reconnect” or “Continue setup” CTAs in dashboard flows.
4. **Hydration data**: Server components still feed data via props; we’re avoiding client `fetch` per AGENT rules.

---

## Implementation checklist
1. **ProvidersShell** already lives in root layout; keep it as the single place to mount Privy/Wagmi/TanStack after first paint.
2. **Privy config**: maintain wallet-only settings (MetaMask first) in `src/lib/providers.tsx`.
3. **Use `useWalletAuth()` everywhere** for auth-aware UI controls.
4. **Dashboard guard**: add middleware/server redirect once Privy server APIs are in place.
5. **QA**:
   - `/` shows static HTML instantly; DevTools waterfall only loads the provider bundle after idle.
   - Navbar buttons hydrate into shadcn buttons once providers are ready.
   - Clicking “Connect wallet” launches MetaMask; success routes to `/dashboard`.
   - `/dashboard` still redirects out if the session isn’t authenticated (current client guard).

---

## Appendix: Helpful Privy APIs
- `usePrivy()` exposes `{ ready, authenticated, user, connectWallet, login, logout }`. We prefer `connectWallet` for direct MetaMask prompts; `login` is still available if we later re-enable other methods.
- `useWallets()` returns an ordered list of linked wallets; use this to display the active address and hook into Wagmi (`useBalance`, `useEnsAddress` already use it).
- `connectWallet(options)` accepts `walletList`, `description`, and `preSelectedWalletId`. Use `walletList: ['metamask']` to skip the selector entirely.
- Privy modal inherits styling from the provider config; keep `appearance.theme = 'dark'` to match `src/style.css`.

This guide should be enough context to refactor the dashboard auth flow without blocking on the full Privy documentation dump. Ping before implementing server-side guards or if we decide to reintroduce non-wallet login options.***
