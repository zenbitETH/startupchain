import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetPrice = vi.fn()
const mockGetOwner = vi.fn()
const mockWaitForReceipt = vi.fn()
const mockSendTransaction = vi.fn()
const mockWriteContract = vi.fn()
const mockGetCode = vi.fn()
const mockStartupChainPublicClient = {
  waitForTransactionReceipt: mockWaitForReceipt,
  readContract: vi.fn(),
  getCode: mockGetCode,
}
const mockStartupChainWalletClient = {
  sendTransaction: mockSendTransaction,
  writeContract: mockWriteContract,
  chain: { id: 11155111 },
}
const mockStartupChainAccount = '0xserver' as const

const mockPredictSafeAddress = vi.fn()
const mockEstimateSafeDeploymentGas = vi.fn()
const mockDeploySafe = vi.fn()

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

const mockCommitMakeFunctionData = vi.fn()
const mockRegisterMakeFunctionData = vi.fn()

vi.mock('@ensdomains/ensjs/wallet', () => ({
  commitName: {
    makeFunctionData: (...args: unknown[]) => mockCommitMakeFunctionData(...args),
  },
  registerName: {
    makeFunctionData: (...args: unknown[]) => mockRegisterMakeFunctionData(...args),
  },
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

// Also mock the @/lib/ens alias used by ens-utils.ts
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

vi.mock('viem', () => {
  return {
    createPublicClient: vi.fn(() => ({})),
    http: vi.fn(() => ({})),
    formatEther: (wei: bigint) => (Number(wei) / 1e18).toString(),
    isAddress: (value: string) => value.startsWith('0x') && value.length > 3,
  }
})

vi.mock('../../../../lib/blockchain/startupchain-client', () => ({
  publicClient: mockStartupChainPublicClient,
  walletClient: mockStartupChainWalletClient,
  startupChainAccount: mockStartupChainAccount,
  startupChainChain: { id: 11155111 },
  getPublicClient: () => mockStartupChainPublicClient,
}))

vi.mock('../../../../lib/blockchain/safe-factory', () => ({
  predictSafeAddress: (...args: unknown[]) => mockPredictSafeAddress(...args),
  estimateSafeDeploymentGas: (...args: unknown[]) => mockEstimateSafeDeploymentGas(...args),
  calculateThreshold: (count: number) => Math.ceil(count / 2),
  deploySafe: (...args: unknown[]) => mockDeploySafe(...args),
}))

// Mock Next.js cookies
const mockCookieStore: Record<string, string> = {}
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore[name] ? { value: mockCookieStore[name] } : undefined,
    set: (name: string, value: string) => { mockCookieStore[name] = value },
    delete: (name: string) => { delete mockCookieStore[name] },
  }),
}))

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('ENS server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'
    process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_SEPOLIA =
      '0x0000000000000000000000000000000000000011'
    // Clear cookie store
    Object.keys(mockCookieStore).forEach(key => delete mockCookieStore[key])
    mockStartupChainPublicClient.readContract.mockRejectedValue(
      new Error('not found')
    )
    // Set default mock values
    mockPredictSafeAddress.mockResolvedValue('0xsafe-predicted')
    mockEstimateSafeDeploymentGas.mockResolvedValue(100000n)
    mockDeploySafe.mockResolvedValue({
      safeAddress: '0xsafe-deployed',
      deploymentTxHash: '0xsafe-deploy-tx',
    })
    mockGetCode.mockResolvedValue('0x') // Not deployed by default
  })

  it('returns unavailable for invalid names', async () => {
    const { checkEnsAvailabilityAction } = await import('./actions.js')

    const result = await checkEnsAvailabilityAction('ab')

    expect(result.available).toBe(false)
    expect(result.address).toBeNull()
  })

  it('returns availability data from the public client', async () => {
    mockGetOwner.mockResolvedValue({ owner: null })

    const { checkEnsAvailabilityAction } = await import('./actions.js')
    const result = await checkEnsAvailabilityAction('acme')

    expect(mockGetOwner).toHaveBeenCalled()
    expect(result.available).toBe(true)
    expect(result.name).toBe('acme.eth')
  })

  it('returns buffered registration cost', async () => {
    mockGetPrice.mockResolvedValue({
      base: 1_000_000_000_000_000_000n,
      premium: 0n,
    })

    const { getEnsRegistrationCostAction } = await import('./actions.js')
    const result = await getEnsRegistrationCostAction('acme', 1)

    // 1 ETH * 1.02 buffer = 1.02 ETH (plus safe gas and service fee)
    expect(result.costWei).toBe(
      ((1_000_000_000_000_000_000n * 102n) / 100n).toString()
    )
    expect(result.costEth).toBe('1.02')
  })

  it('returns owner when present and null when zero address', async () => {
    mockGetOwner.mockResolvedValueOnce({
      owner: '0x0000000000000000000000000000000000000000',
    })

    const { getEnsOwnerAction } = await import('./actions.js')
    const emptyResult = await getEnsOwnerAction('empty')
    expect(emptyResult.owner).toBeNull()

    mockGetOwner.mockResolvedValueOnce({ owner: '0xabc' })
    const ownedResult = await getEnsOwnerAction('owned')
    expect(ownedResult.owner).toBe('0xabc')
  })

  it('commits and later finalizes company registration on backend', async () => {
    const actions = await import('./actions.js')

    mockGetPrice.mockResolvedValue({
      base: 981n,
      premium: 0n,
    })
    mockGetOwner.mockResolvedValue({ owner: null })

    mockCommitMakeFunctionData.mockReturnValue({
      to: '0xcommit',
      data: '0x01',
      value: '0x0',
    })
    mockRegisterMakeFunctionData.mockReturnValue({
      to: '0xregister',
      data: '0x02',
      value: '0x3',
    })
    mockSendTransaction
      .mockResolvedValueOnce('0xcommit-tx')
      .mockResolvedValueOnce('0xregister-tx')
    mockWriteContract.mockResolvedValue('0xcompany-tx')
    mockWaitForReceipt.mockResolvedValue({ status: 'success' })

    const commitResult = await actions.commitEnsRegistrationAction({
      ensName: 'acme',
      founders: [
        { wallet: '0xabc', equityPercent: 60, role: 'CEO' },
        { wallet: '0xdef', equityPercent: 40, role: 'CTO' },
      ],
      threshold: 2,
      durationYears: 1,
    })

    expect(commitResult.commitTxHash).toBe('0xcommit-tx')
    expect(commitResult.safeAddress).toBe('0xsafe-predicted')

    // Update the pending registration in cookie to be ready
    const pendingRaw = mockCookieStore['pending-ens']
    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw)
      pending.readyAt = Date.now() - 1000
      mockCookieStore['pending-ens'] = JSON.stringify(pending)
    }

    const finalizeResult = await actions.finalizeEnsRegistrationAction({
      ensName: 'acme',
    })

    expect(mockSendTransaction).toHaveBeenCalledTimes(2)
    expect(mockWriteContract).toHaveBeenCalledWith({
      address: expect.any(String),
      abi: expect.any(Array),
      functionName: 'recordCompany',
      args: [
        'acme',
        '0xsafe-deployed',
        [
          { wallet: '0xabc', equityBps: 6000n, role: 'CEO' },
          { wallet: '0xdef', equityBps: 4000n, role: 'CTO' },
        ],
        2n,
      ],
      value: expect.any(BigInt),
      chain: mockStartupChainWalletClient.chain,
      account: mockStartupChainAccount,
    })
    expect(finalizeResult.registrationTxHash).toBe('0xregister-tx')
    expect(finalizeResult.companyTxHash).toBe('0xcompany-tx')
    expect(finalizeResult.status).toBe('completed')
  })
})
