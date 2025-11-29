/**
 * Combined cost estimation for company registration
 * Includes: ENS registration + Safe deployment + 25% service fee
 */
import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'

import { useEnsRegistration } from '@/hooks/use-ens-registration'
import {
  calculateThreshold,
  estimateSafeDeploymentGas,
} from '@/lib/blockchain/safe-factory'

// Service fee: 25% (2500 basis points)
const SERVICE_FEE_BPS = 2500n
const BPS_DENOMINATOR = 10000n

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
  const { getRegistrationCost } = useEnsRegistration()
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: [
      'company-registration-cost',
      ensName,
      founderCount,
      durationYears,
    ],
    queryFn: async (): Promise<CompanyRegistrationCost> => {
      // Get ENS registration cost
      const ensCostData = await getRegistrationCost(ensName, durationYears)
      const ensRegistrationCost = ensCostData?.costWei ?? 0n

      // Get current gas price
      const gasPrice = (await publicClient?.getGasPrice()) ?? 0n

      // Estimate Safe deployment gas
      const safeDeploymentGas = await estimateSafeDeploymentGas(founderCount)
      const safeDeploymentCost = safeDeploymentGas * gasPrice

      // Calculate subtotal (before service fee)
      const subtotal = ensRegistrationCost + safeDeploymentCost

      // Calculate service fee (25% of subtotal)
      const serviceFee = (subtotal * SERVICE_FEE_BPS) / BPS_DENOMINATOR

      // Calculate total
      const total = subtotal + serviceFee

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
        safeDeploymentGas,
        safeDeploymentCost,
        serviceFee,
        subtotal,
        total,
        threshold,
        founderCount,
        gasPrice,
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
  const { checkWalletBalance } = useEnsRegistration()
  const costQuery = useCompanyRegistrationCost({
    ensName,
    founderCount,
    durationYears,
    enabled,
  })

  return useQuery({
    queryKey: ['wallet-balance-check', ensName, founderCount],
    queryFn: async () => {
      const balanceData = await checkWalletBalance(ensName)
      const requiredAmount = costQuery.data?.total ?? 0n
      const balanceWei = BigInt(
        Math.floor(parseFloat(balanceData?.balance ?? '0') * 1e18)
      )

      return {
        balance: balanceWei,
        required: requiredAmount,
        sufficient: balanceWei >= requiredAmount,
        shortfall:
          requiredAmount > balanceWei ? requiredAmount - balanceWei : 0n,
      }
    },
    enabled: enabled && !!costQuery.data,
  })
}
