# Hydration Optimization Guide

This guide explains how to optimize the initial loading performance of StartupChain by removing redundant client-side checks.

system prompt: Work inside this doc: reply inline under comments (using `>`), name yourself **AI**, and mark open threads with `--> gertsio`. Ask before adding new sections, keep diffs small, and remind gertsio about unanswered blockers. Treat this file as the living roadmap + comms + discussion space for the project; only create GitHub issues when explicitly requested. Be proactive and there should not be threads where user's question / suggestion isn't answered
**

## The Goal

We want to preserve the Static Site Generation (SSG) benefits of the landing page while ensuring that interactive features (Wallet connection, Auth) hydrate as quickly as possible *after* the initial paint.

## Current Architecture

1. **`RootLayout` (`src/app/layout.tsx`)**: Wraps the entire application.
2. **`ProvidersShell` (`src/components/providers/providers-shell.tsx`)**:

   * Initially renders `children` directly (allowing SSG content to show immediately).
     --> gertsio  How exactly this SSG works, we have all the app wrapped in a client component with use client on top, and for some reason it doesn't affect SSG, I don't understand how it works
     > **AI** Great question. In Next.js (App Router), even if a component is marked `'use client'`, it is still **pre-rendered on the server** into HTML. This initial HTML is what gets sent to the browser (SSG/SSR).
     >
     > The `'use client'` directive just means "this component *also* has a JavaScript bundle that needs to run in the browser to become interactive (hydrate)."
     >
     > So, `ProvidersShell` is rendered to HTML on the server with its initial state (`activate = false`). This HTML includes the `children` (your landing page content) because the `else` block of `ProvidersShell` renders `{children}` directly.
     >
     > When the browser loads this HTML, the user sees the content immediately (SSG benefit). Then, the JS loads, `ProvidersShell` "hydrates", runs its `useEffect`, sets `activate = true`, and *then* switches to rendering the `ClientProviders`.
     >
     > --> gertsio: But if next.js renders client components as SSG imidiately why do we need this additional logic with iddle time? Why can't we just let client component render imidiatly so user see
     >
     > **AI** You are absolutely right that Next.js renders client components immediately as HTML.
     >
     > The problem is specifically with the **Providers** (`PrivyProvider`, `WagmiProvider`, `QueryClientProvider`). These libraries often have initialization logic that runs *only* on the client (in `useEffect` or `useLayoutEffect`).
     >
     > If we render them immediately during hydration:
     >
     > 1. The HTML matches (good).
     > 2. React hydrates.
     > 3. `PrivyProvider` or `WagmiProvider` starts initializing.
     > 4. **Crucially:** Some of these providers might suspend rendering or return `null` while they check for `window.ethereum` or local storage state.
     > 5. This causes the "flash" where the content disappears for a split second and then reappears.
     >
     > By using `ProvidersShell` with `requestIdleCallback`, we are saying: "Keep showing the static HTML (which is just the visual content). Don't even *try* to start the heavy Provider logic until the browser has finished painting the initial frame."
     >
     > This guarantees the user sees the content instantly and stably, and the "heavy machinery" loads in the background a few milliseconds later.
     >
     > --> Gertsio: :setTimeout for 150 ms, is it a good idea overall? In what sercumstances it would fire up? Why do we need it here?
     >
     > **AI** The `setTimeout` is a fallback for browsers that don't support `requestIdleCallback` (like Safari on iOS < 16.4, though support is good now).
     >
     > However, even with `requestIdleCallback`, we might want a timeout to ensure the providers *eventually* load if the browser is extremely busy.
     >
     > The 150ms is arbitrary but generally "fast enough" to feel instant but "slow enough" to let the main thread clear up.
     >
     > **Recommendation:** We can keep it as a safety net. If `requestIdleCallback` exists, it usually fires much faster than 150ms (often 1-50ms depending on load). The timeout is just the "worst case" scenario for older browsers or weird environments.
     >
     > --> Gertsio: Okay, so my numbers are from 5 milliseconds to about 30 milliseconds. So it's fast. But I guess from my energy understanding since this provider shell is basically runs on is basically runs on as a as as as as a first thing, but in use effect. That means that means everything that was hydrated not hydrated rendered it takes some time and only after the hy uh the rendering is finished this use effect fires up and the count is started I think I need to measure more performance like because I feel like from like when when I do refresh one two three four five six six seconds until I see connect the wallet it's weird I want to see where exactly we are losing time
     >
     > **AI** That 6-second delay is definitely too long. You are correct: `useEffect` runs *after* the component has mounted and painted.
     >
     > If `requestIdleCallback` is firing in 5-30ms, then the delay is happening **after** `setActivate(true)` is called.
     >
     > This means one of the providers (`PrivyProvider`, `WagmiProvider`, or `QueryClientProvider`) is taking a long time to initialize or become "ready".
     >
     > Let's profile this. We need to measure:
     >
     > 1. Time from `setActivate(true)` -> `ClientProviders` mounts.
     > 2. Time from `ClientProviders` mounts -> `PrivyProvider` is ready.
     > 3. Time from `PrivyProvider` ready -> `useWalletAuth` reports `ready: true`.
     >
     > I've added a **Profiling Plan** section below.
     >
3. * Waits for the browser to be idle (`requestIdleCallback`) or a short timeout.
   * Once idle, it switches to rendering `ClientProviders` wrapping the `children`.
4. **`ClientProviders` (`src/lib/providers.tsx`)**:

   * Wraps the app in `PrivyProvider`, `WagmiProvider`, and `QueryClientProvider`.
   * **The Issue:** It *currently* has its own `isMounted` state check.

## The Problem

When `ProvidersShell` decides it's time to load the providers, it renders `ClientProviders`.
Currently, `ClientProviders` initializes with `isMounted = false` and waits for *another* `useEffect` to set it to `true`.

This causes a potential "flash":

1. **Initial Load:** Static content is visible (Good!).
2. **Hydration Starts:** `ProvidersShell` activates.
3. **Flash:** `ClientProviders` renders, but `isMounted` is false, so it renders `null` (or just the providers without children). The content might briefly disappear or flicker.
4. **Final State:** `ClientProviders` effect runs, `isMounted` becomes true, content reappears.

## The Solution

Since `ProvidersShell` ensures that `ClientProviders` is only rendered on the client side (after the initial delay), the `isMounted` check inside `ClientProviders` is redundant and harmful to the user experience.

## Step-by-Step Implementation

### Step 1: Remove Redundant Check in `src/lib/providers.tsx`

Open `src/lib/providers.tsx`. We need to remove the `useState` and `useEffect` related to `isMounted`.

**Before:**

```tsx
export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  return (
    <PrivyProvider ... >
      <WagmiProvider ... >
        <QueryClientProvider ... >
          {isMounted && children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  )
}
```

**After:**

```tsx
export function ClientProviders({ children }: { children: React.ReactNode }) {
  // No need for isMounted check here, ProvidersShell handles the deferred loading
  return (
    <PrivyProvider ... >
      <WagmiProvider ... >
        <QueryClientProvider ... >
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  )
}
```

### Step 2: Document the Strategy in `src/components/providers/providers-shell.tsx`

It's good practice to leave a comment explaining *why* we are doing this complex conditional rendering.

Open `src/components/providers/providers-shell.tsx` and add a comment above the `return` statement or inside the component.

```tsx
// ... inside ProvidersShell ...

  // Strategy:
  // 1. Initially render children directly to allow immediate painting of SSG content.
  // 2. Wait for idle callback (client-side).
  // 3. Wrap children in ClientProviders to hydrate interactive features (Auth, Web3).
  // This prevents the heavy providers from blocking the First Contentful Paint (FCP).
  return activate ? (
    <ProvidersReadyContext.Provider value={contextValue}>
      <ClientProviders>{children}</ClientProviders>
    </ProvidersReadyContext.Provider>
  ) : (
// ...
```

### Step 3: Verify Safety

We have already checked `src/hooks/use-wallet-auth.ts`. It uses `useProvidersReady()` to check if the providers are actually ready before attempting to use `usePrivy` or `useWallets`.

```tsx
// src/hooks/use-wallet-auth.ts
export function useWalletAuth() {
  const { ready: providersReady } = useProvidersReady()

  if (!providersReady) {
    // Returns fallback/loading state safely
    return { ...fallbackAuth ... }
  }
  // ...
}
```

This ensures that even though the static content is visible immediately, components that *need* the providers (like the "Connect Wallet" button) will know to wait or show a loading state until `ProvidersShell` has finished its work.

## Profiling Plan (Debugging the 6s Delay)

To pinpoint where the time is being spent, we will use the **Performance API**. This will let you visualize the loading sequence in the Chrome DevTools Performance tab.

### 1. Instrument `ProvidersShell`

Mark when we start activating the providers.

```tsx
// src/components/providers/providers-shell.tsx
// ... inside useEffect ...
requestIdleCallback(() => {
  performance.mark('Providers-Start-Activation')
  setActivate(true)
})
```

### 2. Instrument `ClientProviders`

Mark when the providers component actually mounts.

```tsx
// src/lib/providers.tsx
export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    performance.mark('ClientProviders-Mounted')
    performance.measure('Activation -> Mount', 'Providers-Start-Activation', 'ClientProviders-Mounted')
  }, [])
  // ...
}
```

### 3. Instrument `useWalletAuth`

Mark when Privy actually reports being ready.

```tsx
// src/hooks/use-wallet-auth.ts
export function useWalletAuth() {
  const { ready: providersReady } = useProvidersReady()
  const { ready: privyReady } = usePrivy()

  useEffect(() => {
    if (providersReady && privyReady) {
      performance.mark('Auth-Ready')
      performance.measure('Mount -> Auth Ready', 'ClientProviders-Mounted', 'Auth-Ready')
      performance.measure('Total Activation Time', 'Providers-Start-Activation', 'Auth-Ready')

      console.log('Auth System Fully Ready')
    }
  }, [providersReady, privyReady])
  // ...
}
```

### How to View the Results

1. Open Chrome DevTools.
2. Go to the **Performance** tab.
3. Click the **Record** button (circle icon).
4. Refresh the page.
5. Wait for the "Connect Wallet" button to appear.
6. Click **Stop**.
7. Look for the **Timings** section in the flame chart. You will see colorful bars labeled "Activation -> Mount", "Mount -> Auth Ready", etc. This will visually show you exactly how long each step took.

## Checklist

- [ ] Modify `src/lib/providers.tsx` to remove `isMounted`.
- [ ] Add comments to `src/components/providers/providers-shell.tsx`.
- [ ] **(New)** Add profiling logs to `ProvidersShell`, `ClientProviders`, and `useWalletAuth`.
- [ ] Run the app and check the console for the "Providers Activation" timings.
- [ ] Verify that the "Connect Wallet" button still works correctly after hydration.
