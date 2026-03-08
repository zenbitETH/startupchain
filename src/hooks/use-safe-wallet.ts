'use client'

import { useEffect, useMemo, useRef } from 'react'
import { isAddress } from 'viem'

import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { useWallets } from '@/lib/privy'

export type SafeWalletProvider = {
  request: (args: {
    method: string
    params?: unknown[] | object
  }) => Promise<unknown>
}

type PrivyWallet = {
  address?: string
  chainId?: number | string
  switchChain?: (chainId: number) => Promise<void>
  getEthereumProvider?: () => Promise<SafeWalletProvider>
}

function parseWalletChainId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) {
      return parsed
    }
  }
  return null
}

type SafeWalletReady = {
  walletAddress: `0x${string}`
  provider: SafeWalletProvider
}

export function useSafeWallet({ chainId }: { chainId: number }) {
  const { authenticated, connect } = useWalletAuth()
  const walletsResult = useWallets()
  const wallets = useMemo(
    () => walletsResult?.wallets ?? [],
    [walletsResult?.wallets]
  )
  const walletsRef = useRef<PrivyWallet[]>(wallets as PrivyWallet[])

  useEffect(() => {
    walletsRef.current = wallets as PrivyWallet[]
  }, [wallets])

  async function waitForPrimaryWallet(): Promise<PrivyWallet | undefined> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const wallet = walletsRef.current[0]
      if (wallet) return wallet
      await new Promise((resolve) => window.setTimeout(resolve, 100))
    }
    return walletsRef.current[0]
  }

  async function ensureWalletReady(): Promise<SafeWalletReady> {
    if (!authenticated) {
      await connect()
    }

    const wallet = await waitForPrimaryWallet()
    if (!wallet) {
      throw new Error('Connect a founder wallet to submit Safe proposals')
    }

    if (wallet.switchChain) {
      const walletChain = parseWalletChainId(wallet.chainId)
      if (walletChain === null || walletChain !== chainId) {
        try {
          await wallet.switchChain(chainId)
        } catch {
          throw new Error(
            'Failed to switch to required network. Please switch manually.'
          )
        }
      }
    }

    const provider = await wallet.getEthereumProvider?.()
    if (!provider) {
      throw new Error('Wallet provider is unavailable')
    }

    const providerChainId = parseWalletChainId(
      await provider.request({ method: 'eth_chainId' })
    )
    if (providerChainId !== null && providerChainId !== chainId) {
      throw new Error(
        'Wallet is on the wrong network. Please switch and try again.'
      )
    }

    if (!wallet.address || !isAddress(wallet.address)) {
      throw new Error('Wallet address is unavailable')
    }

    return {
      walletAddress: wallet.address as `0x${string}`,
      provider,
    }
  }

  return { authenticated, ensureWalletReady }
}
