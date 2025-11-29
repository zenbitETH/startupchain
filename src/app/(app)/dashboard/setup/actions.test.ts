import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@ensdomains/ensjs/public', () => ({
  getOwner: vi.fn(),
  getPrice: vi.fn(),
}))

vi.mock('@ensdomains/ensjs', () => ({
  addEnsContracts: vi.fn((chain) => ({
    ...chain,
    rpcUrls: { default: { http: ['https://example-rpc'] } },
  })),
}))

vi.mock('viem/ens', () => ({
  normalize: (name: string) => name.toLowerCase(),
}))

vi.mock('../../../../lib/ens.js', () => import('../../../../lib/ens.js'))

vi.mock('viem', () => {
  const mockClient = {
    getEnsAddress: vi.fn(),
  }

  return {
    __mockClient: mockClient,
    createPublicClient: vi.fn(() => mockClient),
    http: vi.fn(() => ({})),
    formatEther: (wei: bigint) => (Number(wei) / 1e18).toString(),
  }
})

const loadActions = async () => {
  vi.resetModules()
  return import('./actions.js')
}

describe('ENS server actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'
  })

  it('returns unavailable for invalid names', async () => {
    const { checkEnsAvailabilityAction } = await loadActions()

    const result = await checkEnsAvailabilityAction('ab')

    expect(result.available).toBe(false)
    expect(result.address).toBeNull()
  })

  it('returns availability data from the public client', async () => {
    const { __mockClient } = await import('viem')
    __mockClient.getEnsAddress.mockResolvedValue(null)

    const { checkEnsAvailabilityAction } = await loadActions()
    const result = await checkEnsAvailabilityAction('acme')

    expect(__mockClient.getEnsAddress).toHaveBeenCalledWith({
      name: 'acme.eth',
    })
    expect(result.available).toBe(true)
    expect(result.name).toBe('acme.eth')
  })

  it('returns buffered registration cost', async () => {
    const { getPrice } = await import('@ensdomains/ensjs/public')
    getPrice.mockResolvedValue({
      base: BigInt(1_000_000_000_000_000_000n),
      premium: BigInt(0),
    })

    const { getEnsRegistrationCostAction } = await loadActions()
    const result = await getEnsRegistrationCostAction('acme', 1)

    // 1 ETH * 1.02 buffer = 1.02 ETH
    expect(result.costWei).toBe(
      ((BigInt(1_000_000_000_000_000_000) * 102n) / 100n).toString()
    )
    expect(result.costEth).toBe('1.02')
  })

  it('returns owner when present and null when zero address', async () => {
    const { getOwner } = await import('@ensdomains/ensjs/public')
    getOwner.mockResolvedValueOnce({
      owner: '0x0000000000000000000000000000000000000000',
    })

    const { getEnsOwnerAction } = await loadActions()
    const emptyResult = await getEnsOwnerAction('empty')
    expect(emptyResult.owner).toBeNull()

    getOwner.mockResolvedValueOnce({ owner: '0xabc' })
    const ownedResult = await getEnsOwnerAction('owned')
    expect(ownedResult.owner).toBe('0xabc')
  })
})
