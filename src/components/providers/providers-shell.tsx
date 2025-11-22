'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { ClientProviders } from '@/lib/providers'

type InitialSession = {
  userId: string
  walletAddress?: string
  expiresAt: Date
}

type ProvidersContextValue = {
  ready: boolean
  initialSession?: InitialSession
}

const ProvidersReadyContext = createContext<ProvidersContextValue>({
  ready: false,
})

type ProvidersShellProps = {
  children: React.ReactNode
  initialSession?: InitialSession
  mountImmediately?: boolean
}

// Strategy:
// 1. Initially render children directly to allow immediate painting of SSG content.
// 2. Wait for idle callback (client-side).
// 3. Wrap children in ClientProviders to hydrate interactive features (Auth, Web3).
// This prevents the heavy providers from blocking the First Contentful Paint (FCP).

export function ProvidersShell({
  children,
  initialSession,
  mountImmediately = false,
}: ProvidersShellProps) {
  const shouldActivate = mountImmediately || Boolean(initialSession)
  const [activate, setActivate] = useState(shouldActivate)

  useEffect(() => {
    if (activate || typeof window === 'undefined') return

    const id =
      'requestIdleCallback' in window
        ? requestIdleCallback(() => setActivate(true))
        : setTimeout(() => setActivate(true), 150)

    return () => {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(id as number)
      } else {
        clearTimeout(id as ReturnType<typeof setTimeout>)
      }
    }
  }, [activate])

  const contextValue = useMemo(
    () => ({ ready: activate, initialSession }),
    [activate, initialSession]
  )

  return activate ? (
    <ProvidersReadyContext.Provider value={contextValue}>
      <ClientProviders>{children}</ClientProviders>
    </ProvidersReadyContext.Provider>
  ) : (
    <ProvidersReadyContext.Provider value={contextValue}>
      {children}
    </ProvidersReadyContext.Provider>
  )
}

export function useProvidersReady() {
  return useContext(ProvidersReadyContext)
}
