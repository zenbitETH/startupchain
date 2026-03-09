import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getEnsRenewalQuoteAction } from './actions'

const { mockReadContract } = vi.hoisted(() => ({
  mockReadContract: vi.fn(),
}))

vi.mock('@/lib/blockchain/startupchain-client', () => ({
  getPublicClient: () => ({
    readContract: (...args: unknown[]) => mockReadContract(...args),
  }),
}))

describe('getEnsRenewalQuoteAction', () => {
  beforeEach(() => {
    mockReadContract.mockReset()
  })

  it('returns base, premium, and total quote values', async () => {
    mockReadContract.mockResolvedValue({
      base: 10000000000000000n,
      premium: 2000000000000000n,
    })

    const result = await getEnsRenewalQuoteAction({
      ensName: 'acme.eth',
      durationSeconds: 31536000n,
      chainId: 11155111,
    })

    expect(result).toMatchObject({
      ok: true,
      baseWei: '10000000000000000',
      premiumWei: '2000000000000000',
      totalWei: '12000000000000000',
      totalEth: '0.012',
    })
    expect(mockReadContract).toHaveBeenCalled()
  })

  it('returns an error for unsupported chains', async () => {
    const result = await getEnsRenewalQuoteAction({
      ensName: 'acme.eth',
      durationSeconds: 31536000n,
      chainId: 10,
    })

    expect(result).toEqual({
      ok: false,
      error: 'Unsupported chain for ENS renewal quote.',
    })
    expect(mockReadContract).not.toHaveBeenCalled()
  })

  it('returns an error for invalid durations', async () => {
    const result = await getEnsRenewalQuoteAction({
      ensName: 'acme.eth',
      durationSeconds: 0n,
      chainId: 11155111,
    })

    expect(result).toEqual({
      ok: false,
      error: 'Renewal duration must be greater than zero.',
    })
    expect(mockReadContract).not.toHaveBeenCalled()
  })
})
