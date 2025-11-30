/**
 * Combined cost estimation for company registration
 * Includes: ENS registration + Safe deployment + 25% service fee
 */
import { useQuery } from '@tanstack/react-query'
import { useBalance } from 'wagmi'

import { getEnsRegistrationCostAction } from '@/app/(app)/dashboard/setup/actions'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { calculateThreshold } from '@/lib/blockchain/safe-factory'

export type CompanyRegistrationCost = {
  // ENS costs
  ensRegistrationCost: bigint

  // Safe deployment costs
  safeDeploymentGas: bigint
  safeDeploymentCost: bigint

  // Service fee (25% of total)
  serviceFee: bigint

  // Totals
  subtotal: bigint // Before service fee
  total: bigint // Final amount to pay

  // Metadata
  threshold: number
  founderCount: number
  gasPrice: bigint

  // For display
  breakdown: {
    label: string
    amount: bigint
    percentage?: number
  }[]
}

export function useCompanyRegistrationCost({
  ensName,
  founderCount,
  durationYears = 1,
  enabled = true,
}: {
  ensName: string
  founderCount: number
  durationYears?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [
      'company-registration-cost',
      ensName,
      founderCount,
      durationYears,
    ],
    queryFn: async (): Promise<CompanyRegistrationCost> => {
      // Get all costs from server action (includes ENS, Safe gas, service fee)
      const costData = await getEnsRegistrationCostAction(ensName, durationYears, founderCount)

      const ensRegistrationCost = BigInt(costData.costWei)
      const safeDeploymentCost = BigInt(costData.safeGasWei)
      const serviceFee = BigInt(costData.serviceFeeWei)
      const total = BigInt(costData.totalWei)
      const subtotal = ensRegistrationCost + safeDeploymentCost

      // Calculate threshold for display
      const threshold = calculateThreshold(founderCount)

      // Build breakdown for UI
      const breakdown = [
        {
          label: `ENS Registration (${durationYears} year${durationYears > 1 ? 's' : ''})`,
          amount: ensRegistrationCost,
        },
        {
          label: 'Safe Deployment',
          amount: safeDeploymentCost,
        },
        {
          label: 'StartupChain Service Fee',
          amount: serviceFee,
          percentage: 25,
        },
      ]

      return {
        ensRegistrationCost,
        safeDeploymentGas: 0n, // Not needed anymore, server calculates cost directly
        safeDeploymentCost,
        serviceFee,
        subtotal,
        total,
        threshold,
        founderCount,
        gasPrice: 0n, // Not needed anymore
        breakdown,
      }
    },
    enabled: enabled && !!ensName && founderCount > 0,
    staleTime: 1000 * 30, // 30 seconds - gas prices change frequently
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

/**
 * Format wei to ETH string for display
 */
export function formatEthCost(wei: bigint, decimals = 4): string {
  const eth = Number(wei) / 1e18
  return eth.toFixed(decimals)
}

/**
 * Format USD cost (requires ETH price)
 */
export function formatUsdCost(wei: bigint, ethPriceUsd: number): string {
  const eth = Number(wei) / 1e18
  const usd = eth * ethPriceUsd
  return usd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Hook to get wallet balance and check if sufficient for registration
 */
export function useWalletBalanceCheck({
  ensName,
  founderCount,
  durationYears = 1,
  enabled = true,
}: {
  ensName: string
  founderCount: number
  durationYears?: number
  enabled?: boolean
}) {
  const { primaryAddress } = useWalletAuth()
  const { data: balanceData } = useBalance({
    address: primaryAddress as `0x${string}` | undefined,
  })
  const costQuery = useCompanyRegistrationCost({
    ensName,
    founderCount,
    durationYears,
    enabled,
  })

  return useQuery({
    queryKey: ['wallet-balance-check', ensName, founderCount, primaryAddress],
    queryFn: async () => {
      const requiredAmount = costQuery.data?.total ?? 0n
      const balanceWei = balanceData?.value ?? 0n

      return {
        balance: balanceWei,
        required: requiredAmount,
        sufficient: balanceWei >= requiredAmount,
        shortfall:
          requiredAmount > balanceWei ? requiredAmount - balanceWei : 0n,
      }
    },
    enabled: enabled && !!costQuery.data && !!primaryAddress,
  })
}
