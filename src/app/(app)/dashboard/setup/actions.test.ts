import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockClient = {
  getEnsAddress: vi.fn(),
}

const mockGetPrice = vi.fn()
const mockGetOwner = vi.fn()
const mockWaitForReceipt = vi.fn()
const mockSendTransaction = vi.fn()
const mockWriteContract = vi.fn()
const mockStartupChainPublicClient = {
  waitForTransactionReceipt: mockWaitForReceipt,
  readContract: vi.fn(),
}
const mockStartupChainWalletClient = {
  sendTransaction: mockSendTransaction,
  writeContract: mockWriteContract,
  chain: { id: 11155111 },
}
const mockStartupChainAccount = '0xserver' as const
let redisStore: Record<string, unknown> = {}

vi.mock('@ensdomains/ensjs/public', () => ({
  getOwner: mockGetOwner,
  getPrice: mockGetPrice,
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
    makeFunctionData: mockCommitMakeFunctionData,
  },
  registerName: {
    makeFunctionData: mockRegisterMakeFunctionData,
  },
}))

vi.mock('viem/ens', () => ({
  normalize: (name: string) => name.toLowerCase(),
}))

vi.mock('../../../../lib/ens.js', () => import('../../../../lib/ens.js'))

vi.mock('viem', () => {
  return {
    createPublicClient: vi.fn(() => mockClient),
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
}))

vi.mock('../../../../lib/redis/upstash', () => ({
  redisGet: vi.fn(async (key: string) => redisStore[key] ?? null),
  redisSet: vi.fn(async (key: string, value: unknown) => {
    redisStore[key] = value
  }),
  redisDel: vi.fn(async (key: string) => {
    delete redisStore[key]
  }),
}))

const loadActions = async () => {
  vi.resetModules()
  return import('./actions.js')
}

describe('ENS server actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'
    process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS_SEPOLIA =
      '0x0000000000000000000000000000000000000011'
    redisStore = {}
    mockStartupChainPublicClient.readContract.mockRejectedValue(
      new Error('not found')
    )
  })

  it('returns unavailable for invalid names', async () => {
    const { checkEnsAvailabilityAction } = await loadActions()

    const result = await checkEnsAvailabilityAction('ab')

    expect(result.available).toBe(false)
    expect(result.address).toBeNull()
  })

  it('returns availability data from the public client', async () => {
    mockClient.getEnsAddress.mockResolvedValue(null)

    const { checkEnsAvailabilityAction } = await loadActions()
    const result = await checkEnsAvailabilityAction('acme')

    expect(mockClient.getEnsAddress).toHaveBeenCalledWith({
      name: 'acme.eth',
    })
    expect(result.available).toBe(true)
    expect(result.name).toBe('acme.eth')
  })

  it('returns buffered registration cost', async () => {
    mockGetPrice.mockResolvedValue({
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
    mockGetOwner.mockResolvedValueOnce({
      owner: '0x0000000000000000000000000000000000000000',
    })

    const { getEnsOwnerAction } = await loadActions()
    const emptyResult = await getEnsOwnerAction('empty')
    expect(emptyResult.owner).toBeNull()

    mockGetOwner.mockResolvedValueOnce({ owner: '0xabc' })
    const ownedResult = await getEnsOwnerAction('owned')
    expect(ownedResult.owner).toBe('0xabc')
  })

  it('commits and later finalizes company registration on backend', async () => {
    const actions = await loadActions()

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
      safeAddress: '0xsafe',
      founders: [
        { wallet: '0xabc', equityPercent: 60, role: 'CEO' },
        { wallet: '0xdef', equityPercent: 40, role: 'CTO' },
      ],
      threshold: 2,
      durationYears: 1,
    })

    expect(commitResult.commitTxHash).toBe('0xcommit-tx')

    // fast-forward to ready
    const record = redisStore['ens-reg:acme'] as any
    record.readyAt = Date.now() - 1000
    redisStore['ens-reg:acme'] = record
    redisStore['ens-reg-owner:0xsafe'] = record

    const finalizeResult =
      await actions.finalizeEnsRegistrationAction({
        ensName: 'acme',
      })

    expect(mockSendTransaction).toHaveBeenCalledTimes(2)
    expect(mockWriteContract).toHaveBeenCalledWith({
      address: expect.any(String),
      abi: expect.any(Array),
      functionName: 'registerCompany',
      args: [
        'acme',
        '0xsafe',
        [
          { wallet: '0xabc', equityBps: 6000n, role: 'CEO' },
          { wallet: '0xdef', equityBps: 4000n, role: 'CTO' },
        ],
        2n,
      ],
      chain: mockStartupChainWalletClient.chain,
      account: mockStartupChainAccount,
    })
    expect(finalizeResult.registrationTxHash).toBe('0xregister-tx')
    expect(finalizeResult.companyTxHash).toBe('0xcompany-tx')
    expect(finalizeResult.status).toBe('registered')
  })
})
