'use client'

import { useEffect, useMemo, useRef } from 'react'
import { isAddress } from 'viem'

import { useProvidersReady } from '@/components/providers/providers-shell'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { useWallets } from '@/lib/privy'

import {
  type PrivyWalletLike,
  type SafeWalletProvider,
  findMatchingPrivyWallet,
  parseWalletChainId,
} from './safe-wallet-utils'

type SafeWalletReady = {
  walletAddress: `0x${string}`
  provider: SafeWalletProvider
}

export function useSafeWallet({ chainId }: { chainId: number }) {
  const { authenticated, connect, primaryAddress } = useWalletAuth()
  const { initialSession } = useProvidersReady()
  const walletsResult = useWallets()
  const wallets = useMemo(
    () => walletsResult?.wallets ?? [],
    [walletsResult?.wallets]
  )
  const walletsRef = useRef<PrivyWalletLike[]>(wallets as PrivyWalletLike[])
  const expectedWalletAddress = initialSession?.walletAddress ?? primaryAddress

  useEffect(() => {
    walletsRef.current = wallets as PrivyWalletLike[]
  }, [wallets])

  async function waitForMatchingWallet(): Promise<PrivyWalletLike | undefined> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const wallet = findMatchingPrivyWallet(
        walletsRef.current,
        expectedWalletAddress
      )
      if (wallet) return wallet
      await new Promise((resolve) => window.setTimeout(resolve, 100))
    }

    return undefined
  }

  async function ensureWalletReady(): Promise<SafeWalletReady> {
    if (!authenticated) {
      await connect()
    }

    const wallet = await waitForMatchingWallet()
    if (!wallet) {
      throw new Error('Connect the founder wallet that owns this Safe.')
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

  return { authenticated, ensureWalletReady, expectedWalletAddress }
}
