import { createConfig, http } from 'wagmi'
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains'

const chains = [mainnet, sepolia, baseSepolia, base] as const

export const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})
