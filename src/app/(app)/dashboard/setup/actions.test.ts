import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetPrice = vi.fn()
const mockGetOwner = vi.fn()
const mockPredictSafeAddress = vi.fn()
const mockEstimateSafeDeploymentGas = vi.fn()

vi.mock('@ensdomains/ensjs/public', () => ({
  getOwner: (...args: unknown[]) => mockGetOwner(...args),
  getPrice: (...args: unknown[]) => mockGetPrice(...args),
}))

vi.mock('@ensdomains/ensjs', () => ({
  addEnsContracts: vi.fn((chain) => ({
    ...chain,
    rpcUrls: { default: { http: ['https://example-rpc'] } },
  })),
}))

vi.mock('@ensdomains/ensjs/wallet', () => ({
  commitName: { makeFunctionData: vi.fn() },
  registerName: { makeFunctionData: vi.fn() },
}))

vi.mock('viem/ens', () => ({
  normalize: (name: string) => name.toLowerCase(),
}))

vi.mock('../../../../lib/ens.js', () => ({
  isValidEnsName: (name: string) => {
    const nameToCheck = name.replace('.eth', '')
    if (nameToCheck.length < 3) return false
    if (nameToCheck.length > 63) return false
    const validPattern = /^[a-z0-9-]+$/
    if (!validPattern.test(nameToCheck.toLowerCase())) return false
    if (nameToCheck.startsWith('-') || nameToCheck.endsWith('-')) return false
    return true
  },
}))

vi.mock('@/lib/ens', () => ({
  isValidEnsName: (name: string) => {
    const nameToCheck = name.replace('.eth', '')
    if (nameToCheck.length < 3) return false
    if (nameToCheck.length > 63) return false
    const validPattern = /^[a-z0-9-]+$/
    if (!validPattern.test(nameToCheck.toLowerCase())) return false
    if (nameToCheck.startsWith('-') || nameToCheck.endsWith('-')) return false
    return true
  },
}))

vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({})),
  http: vi.fn(() => ({})),
  formatEther: (wei: bigint) => (Number(wei) / 1e18).toString(),
  isAddress: (value: string) => value.startsWith('0x') && value.length > 3,
}))

vi.mock('../../../../lib/blockchain/startupchain-client', () => ({
  publicClient: {
    waitForTransactionReceipt: vi.fn(),
    readContract: vi.fn(),
    getCode: vi.fn(),
  },
  walletClient: {
    sendTransaction: vi.fn(),
    writeContract: vi.fn(),
    chain: { id: 11155111 },
  },
  startupChainAccount: '0xserver',
  startupChainChain: { id: 11155111 },
  getPublicClient: () => ({}),
}))

vi.mock('../../../../lib/blockchain/safe-factory', () => ({
  predictSafeAddress: (...args: unknown[]) => mockPredictSafeAddress(...args),
  estimateSafeDeploymentGas: (...args: unknown[]) =>
    mockEstimateSafeDeploymentGas(...args),
  calculateThreshold: (count: number) => Math.ceil(count / 2),
  deploySafe: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => { },
    delete: () => { },
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('checkEnsAvailabilityAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'
  })

  it('returns unavailable for names shorter than 3 chars', async () => {
    const { checkEnsAvailabilityAction } = await import('./actions.js')
    const result = await checkEnsAvailabilityAction('ab')

    expect(result.available).toBe(false)
    expect(result.address).toBeNull()
  })

  it('returns available when ENS has no owner', async () => {
    mockGetOwner.mockResolvedValue({ owner: null })

    const { checkEnsAvailabilityAction } = await import('./actions.js')
    const result = await checkEnsAvailabilityAction('acme')

    expect(mockGetOwner).toHaveBeenCalled()
    expect(result.available).toBe(true)
    expect(result.name).toBe('acme.eth')
  })

  it('returns unavailable when ENS has owner', async () => {
    mockGetOwner.mockResolvedValue({
      owner: '0x1234567890abcdef1234567890abcdef12345678',
    })

    const { checkEnsAvailabilityAction } = await import('./actions.js')
    const result = await checkEnsAvailabilityAction('taken')

    expect(result.available).toBe(false)
    expect(result.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
  })
})

describe('getEnsRegistrationCostAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'
    mockEstimateSafeDeploymentGas.mockResolvedValue(100000n)
  })

  it('returns buffered ENS cost with 2% buffer', async () => {
    mockGetPrice.mockResolvedValue({
      base: 1_000_000_000_000_000_000n,
      premium: 0n,
    })

    const { getEnsRegistrationCostAction } = await import('./actions.js')
    const result = await getEnsRegistrationCostAction('acme', 1)

    expect(result.costWei).toBe(
      ((1_000_000_000_000_000_000n * 102n) / 100n).toString()
    )
    expect(result.costEth).toBe('1.02')
  })

  it('includes Safe deployment gas estimate', async () => {
    mockGetPrice.mockResolvedValue({ base: 0n, premium: 0n })
    mockEstimateSafeDeploymentGas.mockResolvedValue(250000n)

    const { getEnsRegistrationCostAction } = await import('./actions.js')
    const result = await getEnsRegistrationCostAction('test', 1, 3)

    expect(mockEstimateSafeDeploymentGas).toHaveBeenCalledWith(3)
    expect(result.safeGasWei).toBe('250000')
  })
})

describe('getEnsOwnerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'
  })

  it('returns null for zero address owner', async () => {
    mockGetOwner.mockResolvedValue({
      owner: '0x0000000000000000000000000000000000000000',
    })

    const { getEnsOwnerAction } = await import('./actions.js')
    const result = await getEnsOwnerAction('empty')

    expect(result.owner).toBeNull()
  })

  it('returns owner address when present', async () => {
    mockGetOwner.mockResolvedValue({ owner: '0xabc123' })

    const { getEnsOwnerAction } = await import('./actions.js')
    const result = await getEnsOwnerAction('owned')

    expect(result.owner).toBe('0xabc123')
  })

  it('returns null for invalid ENS name', async () => {
    const { getEnsOwnerAction } = await import('./actions.js')
    const result = await getEnsOwnerAction('ab')

    expect(result.owner).toBeNull()
    expect(mockGetOwner).not.toHaveBeenCalled()
  })
})
