import { encodeFunctionData, isAddress, namehash } from 'viem'

import { startupChainAbi } from './startupchain-abi'

export type EnsTraitKey =
  | 'avatar'
  | 'description'
  | 'url'
  | 'email'
  | 'com.twitter'
  | 'com.github'
  | 'com.discord'
  | 'notice'

export const ENS_TRAIT_KEYS: readonly EnsTraitKey[] = [
  'avatar',
  'description',
  'url',
  'email',
  'com.twitter',
  'com.github',
  'com.discord',
  'notice',
] as const

export type EnsTraits = Record<EnsTraitKey, string>

export interface SubdomainRecord {
  name: string
  owner: `0x${string}`
  createdAt: string
  active: boolean
}

export interface SafeTransactionRequest {
  to: `0x${string}`
  value: string
  data: `0x${string}`
  operation: 0 | 1
}

export const ensRegistryResolverAbi = [
  {
    type: 'function',
    name: 'resolver',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export const ensResolverTextAbi = [
  {
    type: 'function',
    name: 'text',
    stateMutability: 'view',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'setText',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
  },
] as const

export function normalizeEnsName(ensName: string): string {
  const normalized = ensName.trim().toLowerCase()
  if (!normalized) throw new Error('ENS name is required')

  return normalized.endsWith('.eth') ? normalized : `${normalized}.eth`
}

export function normalizeSubdomainLabel(label: string): string {
  const normalized = label.trim().toLowerCase()
  if (!normalized) {
    throw new Error('Subdomain label is required')
  }

  if (normalized.includes('.')) {
    throw new Error('Use subdomain label only (without .company.eth)')
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new Error(
      'Subdomain supports lowercase letters, numbers, and hyphens'
    )
  }

  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    throw new Error('Subdomain cannot start or end with a hyphen')
  }

  return normalized
}

export const ENS_TRAIT_LABELS: Record<EnsTraitKey, string> = {
  avatar: 'Avatar URL',
  description: 'Description',
  url: 'Website URL',
  email: 'Email',
  'com.twitter': 'Twitter / X',
  'com.github': 'GitHub',
  'com.discord': 'Discord',
  notice: 'Notice',
}

export function createEmptyEnsTraits(): EnsTraits {
  return {
    avatar: '',
    description: '',
    url: '',
    email: '',
    'com.twitter': '',
    'com.github': '',
    'com.discord': '',
    notice: '',
  }
}

export function buildSetEnsTraitTransaction({
  ensName,
  resolverAddress,
  key,
  value,
}: {
  ensName: string
  resolverAddress: string
  key: EnsTraitKey
  value: string
}): SafeTransactionRequest {
  if (!isAddress(resolverAddress)) {
    throw new Error('Invalid ENS resolver address')
  }

  const normalizedEnsName = normalizeEnsName(ensName)
  const node = namehash(normalizedEnsName)

  return {
    to: resolverAddress as `0x${string}`,
    value: '0',
    data: encodeFunctionData({
      abi: ensResolverTextAbi,
      functionName: 'setText',
      args: [node, key, value.trim()],
    }),
    operation: 0,
  }
}

export function buildCreateSubdomainTransaction({
  startupChainAddress,
  companyId,
  label,
  owner,
}: {
  startupChainAddress: string
  companyId: bigint
  label: string
  owner: string
}): SafeTransactionRequest {
  if (!isAddress(startupChainAddress)) {
    throw new Error('Invalid StartupChain contract address')
  }
  if (!isAddress(owner)) {
    throw new Error('Invalid subdomain owner address')
  }

  const normalizedLabel = normalizeSubdomainLabel(label)

  return {
    to: startupChainAddress as `0x${string}`,
    value: '0',
    data: encodeFunctionData({
      abi: startupChainAbi,
      functionName: 'createSubdomain',
      args: [companyId, normalizedLabel, owner as `0x${string}`],
    }),
    operation: 0,
  }
}

export function buildBatchCreateSubdomainsTransactions({
  startupChainAddress,
  companyId,
  entries,
}: {
  startupChainAddress: string
  companyId: bigint
  entries: readonly { label: string; owner: string }[]
}): SafeTransactionRequest[] {
  if (entries.length === 0) {
    throw new Error('At least one subdomain entry is required')
  }

  return entries.map((entry) =>
    buildCreateSubdomainTransaction({
      startupChainAddress,
      companyId,
      label: entry.label,
      owner: entry.owner,
    })
  )
}

export function buildRevokeSubdomainTransaction({
  startupChainAddress,
  companyId,
  label,
}: {
  startupChainAddress: string
  companyId: bigint
  label: string
}): SafeTransactionRequest {
  if (!isAddress(startupChainAddress)) {
    throw new Error('Invalid StartupChain contract address')
  }

  const normalizedLabel = normalizeSubdomainLabel(label)

  return {
    to: startupChainAddress as `0x${string}`,
    value: '0',
    data: encodeFunctionData({
      abi: startupChainAbi,
      functionName: 'revokeSubdomain',
      args: [companyId, normalizedLabel],
    }),
    operation: 0,
  }
}

export const ensReverseRegistrarAbi = [
  {
    type: 'function',
    name: 'setName',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const

export const ensControllerAbi = [
  {
    type: 'function',
    name: 'renew',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'rentPrice',
    stateMutability: 'view',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [
      {
        name: 'price',
        type: 'tuple',
        components: [
          { name: 'base', type: 'uint256' },
          { name: 'premium', type: 'uint256' },
        ],
      },
    ],
  },
] as const

export function buildSetPrimaryNameTransaction({
  reverseRegistrarAddress,
  name,
}: {
  reverseRegistrarAddress: string
  name: string
}): SafeTransactionRequest {
  if (!isAddress(reverseRegistrarAddress)) {
    throw new Error('Invalid reverse registrar address')
  }

  const normalizedName = normalizeEnsName(name)

  return {
    to: reverseRegistrarAddress as `0x${string}`,
    value: '0',
    data: encodeFunctionData({
      abi: ensReverseRegistrarAbi,
      functionName: 'setName',
      args: [normalizedName],
    }),
    operation: 0,
  }
}

export function buildRenewEnsTransaction({
  controllerAddress,
  ensName,
  duration,
  value,
}: {
  controllerAddress: string
  ensName: string
  duration: bigint
  value: bigint
}): SafeTransactionRequest {
  if (!isAddress(controllerAddress)) {
    throw new Error('Invalid ENS controller address')
  }

  const normalizedName = normalizeEnsName(ensName)
  const label = normalizedName.replace(/\.eth$/, '')

  return {
    to: controllerAddress as `0x${string}`,
    value: value.toString(),
    data: encodeFunctionData({
      abi: ensControllerAbi,
      functionName: 'renew',
      args: [label, duration],
    }),
    operation: 0,
  }
}
