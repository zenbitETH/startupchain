import useSWR from 'swr'

import { isValidEnsName } from '../../lib/ens'
import { fetcher } from '../../lib/swr/fetcher'

interface EnsCheckResult {
  name: string
  available: boolean
  address: string | null
  checked: boolean
}

export function useEnsCheck(ensName: string) {
  const normalizedName = ensName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')

  const { data, error, isLoading } = useSWR<EnsCheckResult>(
    isValidEnsName(ensName) && normalizedName.length >= 3
      ? `/api/ens/check?name=${encodeURIComponent(normalizedName)}`
      : null,
    fetcher,
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

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
  }
}
