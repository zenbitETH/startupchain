'use server'

import { formatEther } from 'viem'

import {
  ensControllerAbi,
  normalizeEnsName,
} from '@/lib/blockchain/ens-management'
import { getPublicClient } from '@/lib/blockchain/startupchain-client'
import {
  getEnsControllerAddress,
  isSupportedChain,
} from '@/lib/blockchain/startupchain-config'

export type EnsRenewalQuoteResult =
  | {
      ok: true
      ensName: string
      durationSeconds: string
      controllerAddress: `0x${string}`
      baseWei: string
      premiumWei: string
      totalWei: string
      baseEth: string
      premiumEth: string
      totalEth: string
    }
  | {
      ok: false
      error: string
    }

export async function getEnsRenewalQuoteAction({
  ensName,
  durationSeconds,
  chainId,
}: {
  ensName: string
  durationSeconds: bigint
  chainId?: number
}): Promise<EnsRenewalQuoteResult> {
  if (!chainId || !isSupportedChain(chainId)) {
    return {
      ok: false,
      error: 'Unsupported chain for ENS renewal quote.',
    }
  }

  if (durationSeconds <= 0n) {
    return {
      ok: false,
      error: 'Renewal duration must be greater than zero.',
    }
  }

  try {
    const normalizedEnsName = normalizeEnsName(ensName)
    const label = normalizedEnsName.replace(/\.eth$/, '')
    const controllerAddress = getEnsControllerAddress(chainId)
    const client = getPublicClient(chainId)

    const price = await client.readContract({
      address: controllerAddress,
      abi: ensControllerAbi,
      functionName: 'rentPrice',
      args: [label, durationSeconds],
    })

    const total = price.base + price.premium

    return {
      ok: true,
      ensName: normalizedEnsName,
      durationSeconds: durationSeconds.toString(),
      controllerAddress,
      baseWei: price.base.toString(),
      premiumWei: price.premium.toString(),
      totalWei: total.toString(),
      baseEth: formatEther(price.base),
      premiumEth: formatEther(price.premium),
      totalEth: formatEther(total),
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch ENS renewal quote.',
    }
  }
}
