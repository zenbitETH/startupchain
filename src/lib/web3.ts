import { addEnsContracts } from '@ensdomains/ensjs'
import { ccipRequest } from '@ensdomains/ensjs/utils'
import { createClient as createViemClient } from 'viem'
import { createConfig, fallback, http } from 'wagmi'
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains'

const isDevelopment = process.env.NODE_ENV === 'development'

// Add ENS contracts to chains following ens-register-test pattern
export const sepoliaWithEns = {
  ...addEnsContracts(sepolia),
  contracts: {
    ...addEnsContracts(sepolia).contracts,
    ensEthRegistrarController: {
      address: '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72' as const,
    },
    ensPublicResolver: {
      address: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as const,
    },
    ensReverseRegistrar: {
      address: '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6' as const,
    },
  },
  subgraphs: {
    ens: {
      url: 'https://api.studio.thegraph.com/query/49574/enssepoliav2/version/latest',
    },
  },
} as const

export const mainnetWithEns = {
  ...addEnsContracts(mainnet),
  subgraphs: {
    ens: {
      url: 'https://api.studio.thegraph.com/query/49574/ens/version/latest',
    },
  },
} as const

const chains = isDevelopment
  ? ([sepoliaWithEns, mainnetWithEns, baseSepolia, base] as const)
  : ([mainnetWithEns, sepoliaWithEns, base, baseSepolia] as const)

const transports = {
  [mainnet.id]: fallback([http(), http('https://eth.llamarpc.com')]),
  [sepolia.id]: fallback([
    http(),
    http('https://ethereum-sepolia-rpc.publicnode.com'),
  ]),
  [base.id]: http(),
  [baseSepolia.id]: http(),
}

// Create ENS-compatible wagmi config similar to ens-register-test
const wagmiConfig_ = createConfig({
  chains,
  client: ({ chain }) => {
    return createViemClient({
      chain,
      batch: {
        multicall: {
          batchSize: 8196,
          wait: 50,
        },
      },
      transport: transports[chain.id as keyof typeof transports],
      ccipRead: {
        request: ccipRequest(chain),
      },
    })
  },
})

export const wagmiConfig = wagmiConfig_ as typeof wagmiConfig_ & {
  _isEns: true
}

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
