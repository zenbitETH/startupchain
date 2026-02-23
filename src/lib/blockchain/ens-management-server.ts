import { isAddress, namehash, zeroAddress } from 'viem'

import {
  ENS_TRAIT_KEYS,
  createEmptyEnsTraits,
  ensRegistryResolverAbi,
  ensResolverTextAbi,
  normalizeEnsName,
  type EnsTraits,
  type SubdomainRecord,
} from './ens-management'
import { startupChainAbi } from './startupchain-abi'
import { getChainConfig, getPublicClient } from './startupchain-client'
import {
  getEnsResolverAddress,
  getStartupChainAddress,
  STARTUPCHAIN_CHAIN_ID,
} from './startupchain-config'

const ENS_REGISTRY_FALLBACK
  = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const

function getEnsRegistryAddress(chainId: number): `0x${string}` {
  const config = getChainConfig(chainId)
  const maybeAddress = (
    config.chain as { contracts?: { ensRegistry?: { address?: string } } }
  ).contracts?.ensRegistry?.address

  if (maybeAddress && isAddress(maybeAddress)) {
    return maybeAddress as `0x${string}`
  }

  return ENS_REGISTRY_FALLBACK
}

export async function getEnsTraitsSnapshot(
  ensName: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID,
): Promise<{ traits: EnsTraits, resolverAddress: `0x${string}` }> {
  const client = getPublicClient(chainId)
  const normalizedEnsName = normalizeEnsName(ensName)
  const node = namehash(normalizedEnsName)

  const registryAddress = getEnsRegistryAddress(chainId)
  const resolverFromRegistry = await client.readContract({
    address: registryAddress,
    abi: ensRegistryResolverAbi,
    functionName: 'resolver',
    args: [node],
  })

  const fallbackResolverAddress = getEnsResolverAddress(chainId)
  const resolverAddress
    = isAddress(resolverFromRegistry) && resolverFromRegistry !== zeroAddress
      ? (resolverFromRegistry as `0x${string}`)
      : fallbackResolverAddress

  const traits = createEmptyEnsTraits()
  for (const key of ENS_TRAIT_KEYS) {
    try {
      const value = await client.readContract({
        address: resolverAddress,
        abi: ensResolverTextAbi,
        functionName: 'text',
        args: [node, key],
      })
      traits[key] = value ?? ''
    }
    catch {
      traits[key] = ''
    }
  }

  return {
    traits,
    resolverAddress,
  }
}

function toSubdomainRecord(
  value: readonly [string, string, bigint, boolean],
): SubdomainRecord {
  return {
    name: value[0],
    owner: value[1] as `0x${string}`,
    createdAt: value[2].toString(),
    active: value[3],
  }
}

function isMethodUnsupportedError(error: unknown): boolean {
  const message
    = error instanceof Error ? error.message : String(error ?? '')
  return (
    message.includes('Function selector was not recognized')
    || message.includes('encoded function signature')
    || message.includes('returned no data')
    || message.includes('missing revert data')
  )
}

function parseCompanyId(companyId: string): bigint {
  const normalizedCompanyId = companyId.trim()
  if (!/^\d+$/.test(normalizedCompanyId)) {
    throw new Error('Company ID is invalid')
  }

  return BigInt(normalizedCompanyId)
}

export async function getCompanySubdomainsSnapshot(
  companyId: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID,
): Promise<{ supported: boolean, subdomains: SubdomainRecord[] }> {
  const client = getPublicClient(chainId)
  const startupChainAddress = getStartupChainAddress(chainId)
  const parsedCompanyId = parseCompanyId(companyId)

  try {
    const names = await client.readContract({
      address: startupChainAddress,
      abi: startupChainAbi,
      functionName: 'getCompanySubdomains',
      args: [parsedCompanyId],
    })
    const uniqueNames: string[] = []
    const seenNames = new Set<string>()
    for (const name of names) {
      const dedupeKey = name.toLowerCase()
      if (seenNames.has(dedupeKey)) {
        continue
      }
      seenNames.add(dedupeKey)
      uniqueNames.push(name)
    }

    const subdomains = await Promise.all(
      uniqueNames.map(async (name) => {
        const details = await client.readContract({
          address: startupChainAddress,
          abi: startupChainAbi,
          functionName: 'getSubdomain',
          args: [parsedCompanyId, name],
        })

        return toSubdomainRecord(details)
      }),
    )

    return {
      supported: true,
      subdomains: subdomains.sort((a, b) => {
        if (a.active !== b.active) {
          return a.active ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      }),
    }
  }
  catch (error) {
    if (isMethodUnsupportedError(error)) {
      return {
        supported: false,
        subdomains: [],
      }
    }

    throw error
  }
}

export async function getEnsManagementSnapshot({
  ensName,
  companyId,
  chainId = STARTUPCHAIN_CHAIN_ID,
}: {
  ensName: string
  companyId: string
  chainId?: number
}) {
  const [{ traits, resolverAddress }, { supported, subdomains }] = await Promise.all([
    getEnsTraitsSnapshot(ensName, chainId),
    getCompanySubdomainsSnapshot(companyId, chainId),
  ])

  return {
    traits,
    resolverAddress,
    subdomains,
    subdomainsSupported: supported,
  }
}
