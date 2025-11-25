import { useQuery } from '@tanstack/react-query'

interface CoinGeckoResponse {
  ethereum: {
    usd: number
  }
}

export function useEthPrice() {
  return useQuery({
    queryKey: ['eth-price'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
      if (!response.ok) {
        throw new Error('Failed to fetch ETH price')
      }
      const data = (await response.json()) as CoinGeckoResponse
      return data.ethereum.usd
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}
