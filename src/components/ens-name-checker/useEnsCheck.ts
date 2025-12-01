import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useWalletAuth } from '@/hooks/use-wallet-auth'

import { STARTUPCHAIN_CHAIN_ID } from '../../lib/blockchain/startupchain-config'
import { isValidEnsName } from '../../lib/ens'

interface EnsCheckResult {
  name: string
  available: boolean
  address: string | null
  checked: boolean
}

export function useEnsCheck(ensName: string) {
  const { chainId: walletChainId } = useWalletAuth()

  // Use wallet chain ID if available, otherwise fall back to default
  const chainId = walletChainId ?? STARTUPCHAIN_CHAIN_ID

  const normalizedName = ensName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')

  const shouldCheck = isValidEnsName(ensName) && normalizedName.length >= 3

  const { data, error, isLoading } = useQuery<EnsCheckResult>({
    // Include chainId in query key to refetch on chain change
    queryKey: ['ens-check', normalizedName, chainId],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/ens/check?name=${encodeURIComponent(normalizedName)}&chainId=${chainId}`,
        { signal }
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
          details?: string
        } | null
        const message =
          body?.error || body?.details || 'Failed to check ENS availability'
        throw new Error(message)
      }

      return (await response.json()) as EnsCheckResult
    },
    enabled: shouldCheck,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const isAvailable = data?.available ?? false
  const isTaken = !isAvailable && data?.checked === true
  const resolvedAddress = data?.address ?? null

  return {
    normalizedName,
    data,
    error,
    isLoading,
    isAvailable,
    isTaken,
    resolvedAddress,
    chainId,
  }
}
