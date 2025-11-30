import { addEnsContracts } from '@ensdomains/ensjs'
import {
  type PublicClient,
  createPublicClient,
  createWalletClient,
  http,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet, sepolia } from 'viem/chains'

const mainnetRpcUrl = process.env.MAINNET_RPC_URL
if (!mainnetRpcUrl) throw new Error('MAINNET_RPC_URL is not set')

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL
if (!sepoliaRpcUrl) throw new Error('SEPOLIA_RPC_URL is not set')

function normalizePrivateKey(value?: string): `0x${string}` {
  if (!value) {
    throw new Error('STARTUPCHAIN_SIGNER_KEY is not set')
  }

  const trimmed = value.trim()
  const withPrefix =
    trimmed.startsWith('0x') && trimmed.length === 66
      ? trimmed
      : /^[0-9a-fA-F]{64}$/.test(trimmed)
        ? `0x${trimmed}`
        : null

  if (!withPrefix) {
    throw new Error(
      'STARTUPCHAIN_SIGNER_KEY must be a 32-byte hex string, e.g. 0xabc...'
    )
  }

  return withPrefix as `0x${string}`
}

const signerKey = normalizePrivateKey(process.env.STARTUPCHAIN_SIGNER_KEY)

const sepoliaEnsContracts = addEnsContracts(sepolia)
const CHAINS = {
  '1': {
    chain: addEnsContracts(mainnet),
    rpcUrl: mainnetRpcUrl,
  },
  '11155111': {
    chain: {
      ...sepoliaEnsContracts,
      contracts: {
        ...sepoliaEnsContracts.contracts,
        ensEthRegistrarController: {
          address:
            '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72' as `0x${string}`,
        },
        ensPublicResolver: {
          address:
            '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as `0x${string}`,
        },
        ensReverseRegistrar: {
          address:
            '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6' as `0x${string}`,
        },
      },
    },
    rpcUrl: sepoliaRpcUrl,
  },
} as const

type SupportedChainKey = keyof typeof CHAINS

const defaultChainId = (process.env.NEXT_PUBLIC_CHAIN_ID ??
  '11155111') as SupportedChainKey
const target = CHAINS[defaultChainId]
if (!target) throw new Error(`Unsupported chain id: ${defaultChainId}`)

const account = privateKeyToAccount(signerKey)
const transport = http(target.rpcUrl)

// Cache for chain-specific public clients
const publicClientCache: Record<string, PublicClient> = {}

/**
 * Get a public client for a specific chain ID.
 * Clients are cached to avoid recreation.
 */
export function getPublicClient(chainId: number): PublicClient {
  const chainKey = String(chainId) as SupportedChainKey

  if (publicClientCache[chainKey]) {
    return publicClientCache[chainKey]
  }

  const chainConfig = CHAINS[chainKey]
  if (!chainConfig) {
    // Fall back to default chain if unsupported
    console.warn(`Unsupported chain id: ${chainId}, falling back to default`)
    return getPublicClient(Number(defaultChainId))
  }

  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  })

  publicClientCache[chainKey] = client
  return client
}

/**
 * Get a wallet client for a specific chain ID.
 * Used for server-side transactions.
 */
export function getWalletClient(chainId: number) {
  const chainKey = String(chainId) as SupportedChainKey
  const chainConfig = CHAINS[chainKey]

  if (!chainConfig) {
    console.warn(`Unsupported chain id: ${chainId}, falling back to default`)
    return getWalletClient(Number(defaultChainId))
  }

  return createWalletClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
    account,
  })
}

/**
 * Get chain configuration for a specific chain ID.
 */
export function getChainConfig(chainId: number) {
  const chainKey = String(chainId) as SupportedChainKey
  const chainConfig = CHAINS[chainKey]

  if (!chainConfig) {
    return CHAINS[defaultChainId]
  }

  return chainConfig
}

// Legacy exports for backward compatibility - use chain-aware functions above
export const publicClient = createPublicClient({
  chain: target.chain,
  transport,
})

export const walletClient = createWalletClient({
  chain: target.chain,
  transport,
  account,
})

export const startupChainAccount = account
export const startupChainChain = target.chain

// Treasury address where users send prepayments - uses the signer's address
export const TREASURY_ADDRESS = account.address

export const startupChainClient = async () => ({
  publicClient,
  walletClient,
  account,
  chain: target.chain,
})
