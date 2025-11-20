'use client'

import { useCallback, useMemo } from 'react'

import { useProvidersReady } from '@/components/providers/providers-shell'
import { usePrivy, useWallets } from '@/lib/privy'

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

  // Avoid calling Privy hooks until the provider is mounted; use initialSession as a hint.
  if (!providersReady) {
    return {
      ...fallbackAuth,
      authenticated: Boolean(initialSession),
      primaryAddress: initialSession?.walletAddress ?? undefined,
    }
  }

  let privyResult: ReturnType<typeof usePrivy> | null = null
  let privyError: unknown = null
  try {
    privyResult = usePrivy()
  } catch (error) {
    privyError = error
  }

  let walletsResult: ReturnType<typeof useWallets> | null = null
  try {
    walletsResult = useWallets()
  } catch {
    // ignore, will fall back below
  }

  if (privyError || !privyResult) {
    return fallbackAuth
  }

  const { login, logout, authenticated, ready, user } = privyResult
  const { wallets = [] } = walletsResult ?? { wallets: [] }

  const primaryWallet = wallets[0]
  const primaryAddress =
    primaryWallet?.address || user?.wallet?.address || undefined

  const displayLabel = useMemo(() => {
    if (user?.email?.address) return user.email.address
    if (!primaryAddress) return undefined
    return `${primaryAddress.slice(0, 6)}...${primaryAddress.slice(-4)}`
  }, [primaryAddress, user?.email?.address])

  const connect = useCallback(async () => {
    await login()
  }, [login])

  const disconnect = useCallback(async () => {
    await logout()
  }, [logout])

  return {
    ready,
    authenticated,
    user,
    primaryAddress,
    displayLabel,
    connect,
    disconnect,
  }
}
