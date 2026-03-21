import { mainnet, sepolia } from 'wagmi/chains'

// Supported chains
export const SUPPORTED_CHAINS = [sepolia.id, mainnet.id] as const
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]

// Multi-chain contract addresses
const STARTUPCHAIN_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  [sepolia.id]: (process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_SEPOLIA ||
    process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS ||
    // default to deployed simple contract on Sepolia so dashboard works even if env is missing
    '0xE610acB5a74e65a1E0f234320954C12D67ec0b66') as `0x${string}`,
  [mainnet.id]: (process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_MAINNET ||
    process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS ||
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
}

// Default chain ID (Sepolia for dev, Mainnet for prod)
const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '11155111')
export const STARTUPCHAIN_CHAIN_ID: SupportedChainId = (
  envChainId === mainnet.id ? mainnet.id : sepolia.id
) as SupportedChainId

// Get contract address for a specific chain
export function getStartupChainAddress(chainId: number): `0x${string}` {
  if (!isSupportedChain(chainId)) {
    throw new Error(`No StartupChain contract address for chain ${chainId}`)
  }
  return STARTUPCHAIN_ADDRESSES[chainId]
}

// Default address (for backward compatibility)
export const STARTUPCHAIN_ADDRESS = getStartupChainAddress(
  STARTUPCHAIN_CHAIN_ID
)

// ENS Resolver addresses per chain
const ENS_RESOLVER_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  [sepolia.id]: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as `0x${string}`,
  [mainnet.id]: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63' as `0x${string}`, // ENS Public Resolver
}

export function getEnsResolverAddress(chainId: number): `0x${string}` {
  if (isSupportedChain(chainId)) {
    return ENS_RESOLVER_ADDRESSES[chainId]
  }
  return ENS_RESOLVER_ADDRESSES[sepolia.id]
}

export const DEFAULT_ENS_RESOLVER = getEnsResolverAddress(STARTUPCHAIN_CHAIN_ID)

// ENS Reverse Registrar addresses per chain
const ENS_REVERSE_REGISTRAR_ADDRESSES: Record<SupportedChainId, `0x${string}`> =
  {
    [sepolia.id]: '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6' as `0x${string}`,
    [mainnet.id]: '0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb' as `0x${string}`,
  }

export function getEnsReverseRegistrarAddress(chainId: number): `0x${string}` {
  if (isSupportedChain(chainId)) {
    return ENS_REVERSE_REGISTRAR_ADDRESSES[chainId]
  }
  return ENS_REVERSE_REGISTRAR_ADDRESSES[sepolia.id]
}

// ENS Controller (ETHRegistrarController) addresses per chain
const ENS_CONTROLLER_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  [sepolia.id]: '0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968' as `0x${string}`,
  [mainnet.id]: '0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547' as `0x${string}`,
}

export function getEnsControllerAddress(chainId: number): `0x${string}` {
  if (isSupportedChain(chainId)) {
    return ENS_CONTROLLER_ADDRESSES[chainId]
  }
  return ENS_CONTROLLER_ADDRESSES[sepolia.id]
}

export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAINS.includes(chainId as SupportedChainId)
}

// Chain names for display
export const CHAIN_NAMES: Record<SupportedChainId, string> = {
  [sepolia.id]: 'Sepolia',
  [mainnet.id]: 'Ethereum',
}

// Block explorers
export const BLOCK_EXPLORERS: Record<SupportedChainId, string> = {
  [sepolia.id]: 'https://sepolia.etherscan.io',
  [mainnet.id]: 'https://etherscan.io',
}

export function getExplorerUrl(
  chainId: number,
  type: 'tx' | 'address',
  hash: string
): string {
  const baseUrl =
    BLOCK_EXPLORERS[chainId as SupportedChainId] ?? BLOCK_EXPLORERS[sepolia.id]
  return `${baseUrl}/${type}/${hash}`
}
