import { decodeFunctionData, namehash } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  ENS_TRAIT_KEYS,
  buildBatchCreateSubdomainsTransactions,
  buildCreateSubdomainTransaction,
  buildRenewEnsTransaction,
  buildRevokeSubdomainTransaction,
  buildSetEnsTraitTransaction,
  buildSetPrimaryNameTransaction,
  createEmptyEnsTraits,
  ensControllerAbi,
  ensResolverTextAbi,
  ensReverseRegistrarAbi,
  normalizeEnsName,
  normalizeSubdomainLabel,
} from './ens-management'
import { startupChainAbi } from './startupchain-abi'

describe('normalizeEnsName', () => {
  it('normalizes and appends .eth', () => {
    expect(normalizeEnsName('Acme')).toBe('acme.eth')
    expect(normalizeEnsName('foo.eth')).toBe('foo.eth')
  })
})

describe('normalizeSubdomainLabel', () => {
  it('accepts simple labels', () => {
    expect(normalizeSubdomainLabel('Alice')).toBe('alice')
    expect(normalizeSubdomainLabel('ops-1')).toBe('ops-1')
  })

  it('rejects dotted labels', () => {
    expect(() => normalizeSubdomainLabel('alice.acme')).toThrow()
  })
})

describe('buildSetEnsTraitTransaction', () => {
  it('encodes setText for description trait', () => {
    const tx = buildSetEnsTraitTransaction({
      ensName: 'acme.eth',
      resolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
      key: 'description',
      value: 'Acme onchain company',
    })

    const decoded = decodeFunctionData({
      abi: ensResolverTextAbi,
      data: tx.data,
    })

    expect(decoded.functionName).toBe('setText')
    expect(decoded.args?.[0]).toBe(namehash('acme.eth'))
    expect(decoded.args?.[1]).toBe('description')
    expect(decoded.args?.[2]).toBe('Acme onchain company')
  })
})

describe('subdomain transaction builders', () => {
  it('encodes createSubdomain call', () => {
    const tx = buildCreateSubdomainTransaction({
      startupChainAddress: '0xE610acB5a74e65a1E0f234320954C12D67ec0b66',
      companyId: 7n,
      label: 'alice',
      owner: '0x1234567890abcdef1234567890abcdef12345678',
    })

    const decoded = decodeFunctionData({
      abi: startupChainAbi,
      data: tx.data,
    })

    expect(decoded.functionName).toBe('createSubdomain')
    expect(decoded.args?.[0]).toBe(7n)
    expect(decoded.args?.[1]).toBe('alice')
    expect(String(decoded.args?.[2]).toLowerCase()).toBe(
      '0x1234567890abcdef1234567890abcdef12345678'
    )
  })

  it('encodes revokeSubdomain call', () => {
    const tx = buildRevokeSubdomainTransaction({
      startupChainAddress: '0xE610acB5a74e65a1E0f234320954C12D67ec0b66',
      companyId: 7n,
      label: 'alice',
    })

    const decoded = decodeFunctionData({
      abi: startupChainAbi,
      data: tx.data,
    })

    expect(decoded.functionName).toBe('revokeSubdomain')
    expect(decoded.args?.[0]).toBe(7n)
    expect(decoded.args?.[1]).toBe('alice')
  })
})

describe('buildBatchCreateSubdomainsTransactions', () => {
  const startupChainAddress = '0xE610acB5a74e65a1E0f234320954C12D67ec0b66'
  const companyId = 7n

  it('returns one transaction per entry', () => {
    const entries = [
      { label: 'alice', owner: '0x1234567890abcdef1234567890abcdef12345678' },
      { label: 'bob', owner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
    ]

    const txs = buildBatchCreateSubdomainsTransactions({
      startupChainAddress,
      companyId,
      entries,
    })

    expect(txs).toHaveLength(2)

    const decoded0 = decodeFunctionData({
      abi: startupChainAbi,
      data: txs[0].data,
    })
    expect(decoded0.functionName).toBe('createSubdomain')
    expect(decoded0.args?.[1]).toBe('alice')

    const decoded1 = decodeFunctionData({
      abi: startupChainAbi,
      data: txs[1].data,
    })
    expect(decoded1.functionName).toBe('createSubdomain')
    expect(decoded1.args?.[1]).toBe('bob')
  })

  it('throws if entries array is empty', () => {
    expect(() =>
      buildBatchCreateSubdomainsTransactions({
        startupChainAddress,
        companyId,
        entries: [],
      })
    ).toThrow('At least one subdomain entry is required')
  })

  it('validates each entry label and owner', () => {
    expect(() =>
      buildBatchCreateSubdomainsTransactions({
        startupChainAddress,
        companyId,
        entries: [{ label: 'alice', owner: 'not-an-address' }],
      })
    ).toThrow('Invalid subdomain owner address')

    expect(() =>
      buildBatchCreateSubdomainsTransactions({
        startupChainAddress,
        companyId,
        entries: [
          {
            label: 'alice.eth',
            owner: '0x1234567890abcdef1234567890abcdef12345678',
          },
        ],
      })
    ).toThrow()
  })
})

describe('extended ENS traits', () => {
  it('ENS_TRAIT_KEYS includes all extended keys', () => {
    expect(ENS_TRAIT_KEYS).toContain('avatar')
    expect(ENS_TRAIT_KEYS).toContain('description')
    expect(ENS_TRAIT_KEYS).toContain('url')
    expect(ENS_TRAIT_KEYS).toContain('email')
    expect(ENS_TRAIT_KEYS).toContain('com.twitter')
    expect(ENS_TRAIT_KEYS).toContain('com.github')
    expect(ENS_TRAIT_KEYS).toContain('com.discord')
    expect(ENS_TRAIT_KEYS).toContain('notice')
  })

  it('createEmptyEnsTraits includes all keys with empty strings', () => {
    const traits = createEmptyEnsTraits()
    for (const key of ENS_TRAIT_KEYS) {
      expect(traits[key]).toBe('')
    }
    expect(Object.keys(traits)).toHaveLength(ENS_TRAIT_KEYS.length)
  })

  it('buildSetEnsTraitTransaction works with new keys', () => {
    const tx = buildSetEnsTraitTransaction({
      ensName: 'acme.eth',
      resolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
      key: 'com.twitter',
      value: '@acmecorp',
    })

    const decoded = decodeFunctionData({
      abi: ensResolverTextAbi,
      data: tx.data,
    })

    expect(decoded.functionName).toBe('setText')
    expect(decoded.args?.[1]).toBe('com.twitter')
    expect(decoded.args?.[2]).toBe('@acmecorp')
  })
})

describe('buildSetPrimaryNameTransaction', () => {
  const reverseRegistrarAddress = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD'

  it('encodes setName call', () => {
    const tx = buildSetPrimaryNameTransaction({
      reverseRegistrarAddress,
      name: 'acme.eth',
    })

    const decoded = decodeFunctionData({
      abi: ensReverseRegistrarAbi,
      data: tx.data,
    })

    expect(decoded.functionName).toBe('setName')
    expect(decoded.args?.[0]).toBe('acme.eth')
    expect(tx.to).toBe(reverseRegistrarAddress)
  })

  it('normalizes the name', () => {
    const tx = buildSetPrimaryNameTransaction({
      reverseRegistrarAddress,
      name: 'Acme',
    })

    const decoded = decodeFunctionData({
      abi: ensReverseRegistrarAbi,
      data: tx.data,
    })

    expect(decoded.args?.[0]).toBe('acme.eth')
  })

  it('throws for invalid address', () => {
    expect(() =>
      buildSetPrimaryNameTransaction({
        reverseRegistrarAddress: 'not-an-address',
        name: 'acme.eth',
      })
    ).toThrow('Invalid reverse registrar address')
  })
})

describe('buildRenewEnsTransaction', () => {
  const controllerAddress = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD'

  it('encodes renew call with label (without .eth)', () => {
    const tx = buildRenewEnsTransaction({
      controllerAddress,
      ensName: 'acme.eth',
      duration: 31536000n,
      value: 1000000000000000n,
    })

    const decoded = decodeFunctionData({
      abi: ensControllerAbi,
      data: tx.data,
    })

    expect(decoded.functionName).toBe('renew')
    expect(decoded.args?.[0]).toBe('acme')
    expect(decoded.args?.[1]).toBe(31536000n)
    expect(tx.value).toBe('1000000000000000')
  })

  it('throws for invalid controller address', () => {
    expect(() =>
      buildRenewEnsTransaction({
        controllerAddress: 'bad',
        ensName: 'acme.eth',
        duration: 31536000n,
        value: 0n,
      })
    ).toThrow('Invalid ENS controller address')
  })
})
