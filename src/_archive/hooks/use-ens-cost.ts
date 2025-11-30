import { useQuery } from '@tanstack/react-query'

import { getEnsRegistrationCostAction } from '@/app/(app)/dashboard/setup/actions'

/**
 * Hook to get ENS registration cost using server action
 * @param ensName - The ENS name to check cost for
 * @param isOpen - Whether the component requesting cost is visible
 */
export function useEnsCost(ensName: string, isOpen: boolean) {
  return useQuery({
    queryKey: ['ens-cost', ensName],
    queryFn: async () => {
      const costData = await getEnsRegistrationCostAction(ensName, 1, 1)

      return {
        costs: {
          costWei: BigInt(costData.costWei),
          costEth: costData.costEth,
        },
        totalCost: {
          totalWei: BigInt(costData.totalWei),
          totalEth: costData.totalEth,
        },
      }
    },
    enabled: isOpen && !!ensName,
    staleTime: 1000 * 60, // 1 minute
  })
}
