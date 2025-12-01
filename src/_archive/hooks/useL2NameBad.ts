// ! Archived 2025-11-20
// This hook fakes L2 Primary Name resolution, allowing use on mainnet even though ENS DAO hasn't approved it yet.
//
// This is not advisable, and should only be used for testing purposes.
import { useQuery } from '@tanstack/react-query'
import { Hex, parseAbi } from 'viem'
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  sepolia,
} from 'viem/chains'
import { useChainId, usePublicClient } from 'wagmi'

import { wagmiConfig } from '@/lib/web3'

const l2ReverseRegistrarDeployments = new Map<number, Hex>([
  [arbitrum.id, '0x0000000000D8e504002cC26E3Ec46D81971C1664'],
  [base.id, '0x0000000000D8e504002cC26E3Ec46D81971C1664'],
  [linea.id, '0x0000000000D8e504002cC26E3Ec46D81971C1664'],
  [optimism.id, '0x0000000000D8e504002cC26E3Ec46D81971C1664'],
  [scroll.id, '0x0000000000D8e504002cC26E3Ec46D81971C1664'],
  [arbitrumSepolia.id, '0x00000BeEF055f7934784D6d81b6BC86665630dbA'],
  [baseSepolia.id, '0x00000BeEF055f7934784D6d81b6BC86665630dbA'],
  [lineaSepolia.id, '0x00000BeEF055f7934784D6d81b6BC86665630dbA'],
  [optimismSepolia.id, '0x00000BeEF055f7934784D6d81b6BC86665630dbA'],
  [scrollSepolia.id, '0x00000BeEF055f7934784D6d81b6BC86665630dbA'],
])

const l2ReverseRegistrarAbi = parseAbi([
  'function nameForAddr(address) view returns (string)',
])

const l1ChainIds = [mainnet.id, sepolia.id, holesky.id] as const
type L1ChainId = (typeof l1ChainIds)[number]

const l2ChainIds = [
  arbitrumSepolia.id,
  base.id,
  baseSepolia.id,
  lineaSepolia.id,
  optimismSepolia.id,
  scroll.id,
  scrollSepolia.id,
]
type L2ChainId = (typeof l2ChainIds)[number]

const wagmiConfigChainIds = wagmiConfig.chains.map((chain) => chain.id)
type WagmiConfigChainId = (typeof wagmiConfigChainIds)[number]

type Props = {
  address: Hex
  l1ChainId?: L1ChainId
  l2ChainId?: L2ChainId
}

const evmChainIdToCoinType = (chainId: number): bigint =>
  BigInt((0x80000000 | chainId) >>> 0)

export function useL2NameBad({ address, l1ChainId, l2ChainId }: Props) {
  const connectedChainId = useChainId() as WagmiConfigChainId
  const chainId = (l2ChainId ?? connectedChainId) as WagmiConfigChainId
  const resolvedL1ChainId = l1ChainId ?? mainnet.id

  if (!l2ChainIds.includes(chainId as L2ChainId)) {
    throw new Error('`l2ChainId` must be one of the supported L2 networks')
  }

  if (!wagmiConfigChainIds.includes(chainId)) {
    throw new Error('`l2ChainId` is not in the wagmi config')
  }

  if (l1ChainIds.includes(chainId as L1ChainId)) {
    throw new Error("Use wagmi's native `useEnsName` hook for L1")
  }

  if (!wagmiConfigChainIds.includes(resolvedL1ChainId as WagmiConfigChainId)) {
    throw new Error(
      '`l1ChainId` is not in the wagmi config. Must have `mainnet`, `sepolia` or `holesky`'
    )
  }

  const l2Client = usePublicClient({
    config: wagmiConfig,
    chainId: chainId as WagmiConfigChainId,
  })

  const l1Client = usePublicClient({
    config: wagmiConfig,
    chainId: resolvedL1ChainId as WagmiConfigChainId,
  })

  return useQuery({
    queryKey: ['l2-name', l1ChainId, chainId, address],
    queryFn: async () => {
      if (!l2Client) {
        throw new Error('`l2Client` is undefined')
      }

      const l2ReverseRegistrar = l2ReverseRegistrarDeployments.get(chainId)
      if (!l2ReverseRegistrar) {
        throw new Error(`No reverse registrar found on chain ${chainId}`)
      }

      const reverseName = await l2Client.readContract({
        address: l2ReverseRegistrar,
        abi: l2ReverseRegistrarAbi,
        functionName: 'nameForAddr',
        args: [address],
      })

      const forwardAddr = await l1Client.getEnsAddress({
        name: reverseName,
        coinType: evmChainIdToCoinType(chainId),
      })

      if (forwardAddr?.toLowerCase() === address.toLowerCase()) {
        return reverseName
      }

      return null
    },
  })
}
