import { decodeFunctionData, namehash } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  buildCreateSubdomainTransaction,
  buildRevokeSubdomainTransaction,
  buildSetEnsTraitTransaction,
  ensResolverTextAbi,
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
      '0x1234567890abcdef1234567890abcdef12345678',
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
