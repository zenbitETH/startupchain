import { addEnsContracts } from '@ensdomains/ensjs'
import {
  type PublicClient,
  createPublicClient,
  createWalletClient,
  http,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet, sepolia } from 'viem/chains'

import {
  getEnsControllerAddress,
  getEnsResolverAddress,
  getEnsReverseRegistrarAddress,
} from './startupchain-config'

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

const sepoliaEnsContracts = addEnsContracts(sepolia)
const CHAIN_DEFINITIONS = {
  '1': {
    chain: addEnsContracts(mainnet),
  },
  '11155111': {
    chain: {
      ...sepoliaEnsContracts,
      contracts: {
        ...sepoliaEnsContracts.contracts,
        ensEthRegistrarController: {
          address: getEnsControllerAddress(sepolia.id),
        },
        ensPublicResolver: {
          address: getEnsResolverAddress(sepolia.id),
        },
        ensReverseRegistrar: {
          address: getEnsReverseRegistrarAddress(sepolia.id),
        },
      },
    },
  },
} as const

type SupportedChainKey = keyof typeof CHAIN_DEFINITIONS
type SupportedChain = (typeof CHAIN_DEFINITIONS)[SupportedChainKey]['chain']
type SupportedChainConfig = {
  chain: SupportedChain
  rpcUrl: string
}

function getDefaultChainKey(): SupportedChainKey {
  const defaultChainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? '11155111'
  if (defaultChainId in CHAIN_DEFINITIONS) {
    return defaultChainId as SupportedChainKey
  }

  throw new Error(`Unsupported chain id: ${defaultChainId}`)
}

function getRpcUrl(chainKey: SupportedChainKey): string {
  const envVarName = chainKey === '1' ? 'MAINNET_RPC_URL' : 'SEPOLIA_RPC_URL'
  const rpcUrl = process.env[envVarName]?.trim()

  if (!rpcUrl) {
    throw new Error(`${envVarName} is not set`)
  }

  return rpcUrl
}

function getChainConfigByKey(
  chainKey: SupportedChainKey
): SupportedChainConfig {
  return {
    chain: CHAIN_DEFINITIONS[chainKey].chain,
    rpcUrl: getRpcUrl(chainKey),
  }
}

function getDefaultChainConfig(): SupportedChainConfig {
  return getChainConfigByKey(getDefaultChainKey())
}

let accountCache: ReturnType<typeof privateKeyToAccount> | null = null

function getStartupChainAccountValue() {
  if (accountCache) {
    return accountCache
  }

  accountCache = privateKeyToAccount(
    normalizePrivateKey(process.env.STARTUPCHAIN_SIGNER_KEY)
  )
  return accountCache
}

export function getStartupChainAccount() {
  return getStartupChainAccountValue()
}

function getDefaultChainNumber(): number {
  return Number(getDefaultChainKey())
}

const publicClientCache: Partial<Record<SupportedChainKey, PublicClient>> = {}

function createConfiguredWalletClient(chainKey: SupportedChainKey) {
  const chainConfig = getChainConfigByKey(chainKey)

  return createWalletClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
    account: getStartupChainAccountValue(),
  })
}

type StartupChainWalletClient = ReturnType<typeof createConfiguredWalletClient>

const walletClientCache: Partial<
  Record<SupportedChainKey, StartupChainWalletClient>
> = {}

/**
 * Get a public client for a specific chain ID.
 * Clients are cached to avoid recreation.
 */
export function getPublicClient(chainId: number): PublicClient {
  const chainKey = String(chainId) as SupportedChainKey

  if (publicClientCache[chainKey]) {
    return publicClientCache[chainKey]
  }

  const chainConfigKey =
    chainKey in CHAIN_DEFINITIONS ? chainKey : getDefaultChainKey()

  if (!(chainKey in CHAIN_DEFINITIONS)) {
    console.warn(`Unsupported chain id: ${chainId}, falling back to default`)
  }

  const chainConfig = getChainConfigByKey(chainConfigKey)
  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  })

  publicClientCache[chainConfigKey] = client
  return client
}

/**
 * Get a wallet client for a specific chain ID.
 * Used for server-side transactions.
 */
export function getWalletClient(chainId: number): StartupChainWalletClient {
  const chainKey = String(chainId) as SupportedChainKey

  if (walletClientCache[chainKey]) {
    return walletClientCache[chainKey]
  }

  if (!(chainKey in CHAIN_DEFINITIONS)) {
    console.warn(`Unsupported chain id: ${chainId}, falling back to default`)
    return getWalletClient(getDefaultChainNumber())
  }

  const client = createConfiguredWalletClient(chainKey)

  walletClientCache[chainKey] = client
  return client
}

/**
 * Get chain configuration for a specific chain ID.
 */
export function getChainConfig(chainId: number) {
  const chainKey = String(chainId) as SupportedChainKey
  if (!(chainKey in CHAIN_DEFINITIONS)) {
    return getDefaultChainConfig()
  }

  return getChainConfigByKey(chainKey)
}

function createLazyProxy<T extends object>(getValue: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, _receiver) {
      const resolved = getValue()
      const value = Reflect.get(resolved as object, prop)
      return typeof value === 'function' ? value.bind(resolved) : value
    },
    has(_target, prop) {
      return prop in getValue()
    },
    ownKeys() {
      return Reflect.ownKeys(getValue() as object)
    },
    getOwnPropertyDescriptor(_target, prop) {
      const descriptor = Object.getOwnPropertyDescriptor(
        getValue() as object,
        prop
      )

      if (!descriptor) {
        return undefined
      }

      return {
        ...descriptor,
        configurable: true,
      }
    },
  })
}

function getDefaultPublicClient() {
  return getPublicClient(getDefaultChainNumber())
}

function getDefaultWalletClient() {
  return getWalletClient(getDefaultChainNumber())
}

function getStartupChainChainValue() {
  return getDefaultChainConfig().chain
}

export function getStartupChainChain() {
  return getStartupChainChainValue()
}

export function getTreasuryAddress(): `0x${string}` {
  return getStartupChainAccountValue().address as `0x${string}`
}

// Legacy exports for backward compatibility - use chain-aware functions above
export const publicClient = createLazyProxy<PublicClient>(() =>
  getDefaultPublicClient()
)

export const walletClient = createLazyProxy<StartupChainWalletClient>(() =>
  getDefaultWalletClient()
)

export const startupChainAccount = createLazyProxy<
  ReturnType<typeof getStartupChainAccount>
>(() => getStartupChainAccount())

export const startupChainChain = createLazyProxy<
  ReturnType<typeof getStartupChainChain>
>(() => getStartupChainChain())

export const startupChainClient = async () => ({
  publicClient: getDefaultPublicClient(),
  walletClient: getDefaultWalletClient(),
  account: getStartupChainAccountValue(),
  chain: getStartupChainChainValue(),
})
