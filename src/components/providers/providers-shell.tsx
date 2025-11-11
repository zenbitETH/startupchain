'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { ClientProviders } from '@/lib/providers'

const ProvidersReadyContext = createContext(false)

export function ProvidersShell({ children }: { children: React.ReactNode }) {
  const [activate, setActivate] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

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
  }, [])

  const contextValue = useMemo(() => activate, [activate])

  if (!activate) {
    return (
      <ProvidersReadyContext.Provider value={contextValue}>
        {children}
      </ProvidersReadyContext.Provider>
    )
  }

  return (
    <ProvidersReadyContext.Provider value={contextValue}>
      <ClientProviders>{children}</ClientProviders>
    </ProvidersReadyContext.Provider>
  )
}

export function useProvidersReady() {
  return useContext(ProvidersReadyContext)
}
