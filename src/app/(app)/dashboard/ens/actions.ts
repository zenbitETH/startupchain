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

type UsdEstimate =
  | { estimatedTotalUsd: string; usdEstimateSource: 'coinbase-spot' }
  | { estimatedTotalUsd: null; usdEstimateSource: null }

const NULL_USD_ESTIMATE: UsdEstimate = {
  estimatedTotalUsd: null,
  usdEstimateSource: null,
}

async function fetchEthSpotPriceUsd(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.coinbase.com/v2/prices/ETH-USD/spot',
      { signal: AbortSignal.timeout(2000) }
    )

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as {
      data?: { amount?: string }
    }
    const spotPrice = json.data?.amount

    if (!spotPrice || isNaN(Number(spotPrice))) {
      return null
    }

    return Number(spotPrice)
  } catch {
    return null
  }
}

export type EnsRenewalQuoteResult =
  | ({
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
    } & UsdEstimate)
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

    const [price, spotPriceUsd] = await Promise.all([
      client.readContract({
        address: controllerAddress,
        abi: ensControllerAbi,
        functionName: 'rentPrice',
        args: [label, durationSeconds],
      }),
      fetchEthSpotPriceUsd(),
    ])

    const total = price.base + price.premium
    const totalEth = formatEther(total)

    const usdEstimate: UsdEstimate =
      spotPriceUsd !== null
        ? {
            estimatedTotalUsd: (Number(totalEth) * spotPriceUsd).toFixed(2),
            usdEstimateSource: 'coinbase-spot',
          }
        : NULL_USD_ESTIMATE

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
      totalEth,
      ...usdEstimate,
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
