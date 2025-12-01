'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'

import { usePrivy, useWallets } from '@/lib/privy'

type User = ReturnType<typeof usePrivy>['user']

export type WalletAuthContextValue = {
  ready: boolean
  authenticated: boolean
  user: User
  primaryAddress: string | undefined
  displayLabel: string | undefined
  chainId: number | undefined
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const WalletAuthContext = createContext<WalletAuthContextValue | null>(null)

export function WalletAuthProvider({ children }: { children: React.ReactNode }) {
  const privyResult = usePrivy()
  const walletsResult = useWallets()

  const { login, logout, authenticated, ready, user } = privyResult
  const { wallets = [] } = walletsResult || { wallets: [] }

  const primaryWallet = wallets[0]
  const primaryAddress =
    primaryWallet?.address || user?.wallet?.address || undefined
  const chainId = toNumericChainId(primaryWallet?.chainId)

  const displayLabel = useMemo(() => {
    if (user?.email?.address) return user.email.address
    if (!primaryAddress) return undefined
    return `${primaryAddress.slice(0, 6)}...${primaryAddress.slice(-4)}`
  }, [primaryAddress, user?.email?.address])

  const connect = useCallback(async () => {
    await login()
  }, [login])

  const disconnect = useCallback(async () => {
    try {
      await logout()
    } finally {
      if (user?.id) {
        localStorage.removeItem(`business-${user.id}`)
      }
    }
  }, [logout, user?.id])

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      user,
      primaryAddress,
      displayLabel,
      chainId,
      connect,
      disconnect,
    }),
    [
      ready,
      authenticated,
      user,
      primaryAddress,
      displayLabel,
      chainId,
      connect,
      disconnect,
    ]
  )

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  )
}

export function useWalletAuthContext() {
  return useContext(WalletAuthContext)
}

function toNumericChainId(chainId?: string | number) {
  if (typeof chainId === 'number') return chainId
  if (!chainId) return undefined

  const normalized = chainId.includes(':') ? chainId.split(':')[1] : chainId
  const parsed = Number(normalized)

  return Number.isNaN(parsed) ? undefined : parsed
}
