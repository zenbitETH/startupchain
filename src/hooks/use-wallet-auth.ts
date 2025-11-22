'use client'

import { useProvidersReady } from '@/components/providers/providers-shell'
import { useWalletAuthContext } from '@/components/providers/wallet-auth-provider'

const fallbackAuth = {
  ready: false,
  authenticated: false,
  user: null,
  primaryAddress: undefined,
  displayLabel: undefined,
  connect: async () => {},
  disconnect: async () => {},
} as const

export function useWalletAuth() {
  const { ready: providersReady, initialSession } = useProvidersReady()
  const context = useWalletAuthContext()

  // If providers aren't ready or the context is missing (e.g. during SSG or before hydration),
  // return the fallback state with any hints we have from the initial session.
  if (!providersReady || !context) {
    return {
      ...fallbackAuth,
      authenticated: Boolean(initialSession),
      primaryAddress: initialSession?.walletAddress ?? undefined,
    }
  }

  return context
}
