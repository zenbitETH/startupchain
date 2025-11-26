import { useQuery } from '@tanstack/react-query'
import { useEnsRegistration } from '@/hooks/use-ens-registration'

export function useEnsCost(ensName: string, isOpen: boolean) {
  const { getRegistrationCost, checkWalletBalance } = useEnsRegistration()

  return useQuery({
    queryKey: ['ens-cost', ensName],
    queryFn: async () => {
      // Get registration cost
      const costData = await getRegistrationCost(ensName, 1) // 1 year

      // Get wallet balance (optional, might not be connected yet)
      let balanceData = null
      try {
        balanceData = await checkWalletBalance()
      } catch (err) {
        // Ignore no wallet error, user might not be connected yet
        console.log('Could not check balance (user might not be connected):', err)
      }

      return {
        costs: costData,
        balance: balanceData,
      }
    },
    enabled: isOpen && !!ensName,
    staleTime: 1000 * 60, // 1 minute
  })
}
