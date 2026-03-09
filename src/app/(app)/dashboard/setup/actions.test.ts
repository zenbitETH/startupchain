import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetPrice = vi.fn()
const mockGetOwner = vi.fn()
const mockPredictSafeAddress = vi.fn()
const mockEstimateSafeDeploymentGas = vi.fn()
const mockCommitNameMakeFunctionData = vi.fn()
const mockRegisterNameMakeFunctionData = vi.fn()
const mockWaitForTransactionReceipt = vi.fn()
const mockReadContract = vi.fn()
const mockGetCode = vi.fn()
const mockSendTransaction = vi.fn()
const mockWriteContract = vi.fn()
const mockDeploySafe = vi.fn()
const mockGetPendingRegistration = vi.fn()
const mockSetPendingRegistration = vi.fn()
const mockUpdatePendingRegistration = vi.fn()
const mockClearPendingRegistration = vi.fn()

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
  commitName: {
    makeFunctionData: (...args: unknown[]) =>
      mockCommitNameMakeFunctionData(...args),
  },
  registerName: {
    makeFunctionData: (...args: unknown[]) =>
      mockRegisterNameMakeFunctionData(...args),
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
    waitForTransactionReceipt: (...args: unknown[]) =>
      mockWaitForTransactionReceipt(...args),
    readContract: (...args: unknown[]) => mockReadContract(...args),
    getCode: (...args: unknown[]) => mockGetCode(...args),
  },
  walletClient: {
    sendTransaction: (...args: unknown[]) => mockSendTransaction(...args),
    writeContract: (...args: unknown[]) => mockWriteContract(...args),
    chain: { id: 11155111 },
  },
  startupChainAccount: '0xserver',
  startupChainChain: { id: 11155111 },
  getPublicClient: () => ({
    waitForTransactionReceipt: (...args: unknown[]) =>
      mockWaitForTransactionReceipt(...args),
    readContract: (...args: unknown[]) => mockReadContract(...args),
    getCode: (...args: unknown[]) => mockGetCode(...args),
  }),
  getWalletClient: () => ({
    sendTransaction: (...args: unknown[]) => mockSendTransaction(...args),
    writeContract: (...args: unknown[]) => mockWriteContract(...args),
    chain: { id: 11155111 },
  }),
  getStartupChainAccount: () => '0xserver',
  getStartupChainChain: () => ({ id: 11155111 }),
  getTreasuryAddress: () => '0x00000000000000000000000000000000000000aa',
}))

vi.mock('../../../../lib/blockchain/safe-factory', () => ({
  predictSafeAddress: (...args: unknown[]) => mockPredictSafeAddress(...args),
  estimateSafeDeploymentGas: (...args: unknown[]) =>
    mockEstimateSafeDeploymentGas(...args),
  calculateThreshold: (count: number) => Math.ceil(count / 2),
  deploySafe: (...args: unknown[]) => mockDeploySafe(...args),
}))

vi.mock('../../../../lib/auth/pending-registration', () => ({
  getPendingRegistration: (...args: unknown[]) =>
    mockGetPendingRegistration(...args),
  setPendingRegistration: (...args: unknown[]) =>
    mockSetPendingRegistration(...args),
  updatePendingRegistration: (...args: unknown[]) =>
    mockUpdatePendingRegistration(...args),
  clearPendingRegistration: (...args: unknown[]) =>
    mockClearPendingRegistration(...args),
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

describe('resolveFounderIdentityAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'
  })

  it('returns direct address payload for valid 0x address input', async () => {
    const { resolveFounderIdentityAction } = await import('./actions.js')
    const result = await resolveFounderIdentityAction(
      '0x1234567890abcdef1234567890abcdef12345678'
    )

    expect(result).toEqual({
      input: '0x1234567890abcdef1234567890abcdef12345678',
      source: 'address',
      resolvedAddress: '0x1234567890abcdef1234567890abcdef12345678',
      ensName: null,
      error: null,
    })
    expect(mockGetOwner).not.toHaveBeenCalled()
  })

  it('resolves owned ENS input to owner address', async () => {
    mockGetOwner.mockResolvedValue({
      owner: '0x00000000000000000000000000000000000000aa',
    })

    const { resolveFounderIdentityAction } = await import('./actions.js')
    const result = await resolveFounderIdentityAction('founder')

    expect(result).toEqual({
      input: 'founder',
      source: 'ens',
      resolvedAddress: '0x00000000000000000000000000000000000000aa',
      ensName: 'founder.eth',
      error: null,
    })
  })

  it('returns actionable message for invalid ENS format', async () => {
    const { resolveFounderIdentityAction } = await import('./actions.js')
    const result = await resolveFounderIdentityAction('ab')

    expect(result.resolvedAddress).toBeNull()
    expect(result.error).toBe(
      'Enter a valid ENS name (like yourname.eth) or a 0x address.'
    )
  })

  it('returns actionable message for unregistered ENS names', async () => {
    mockGetOwner.mockResolvedValue({
      owner: '0x0000000000000000000000000000000000000000',
    })

    const { resolveFounderIdentityAction } = await import('./actions.js')
    const result = await resolveFounderIdentityAction('available-name')

    expect(result.resolvedAddress).toBeNull()
    expect(result.error).toContain(
      'available-name.eth is not registered yet. Enter a registered ENS name or a 0x address.'
    )
  })

  it('returns actionable message when ENS resolution fails', async () => {
    mockGetOwner.mockRejectedValue(new Error('rpc down'))

    const { resolveFounderIdentityAction } = await import('./actions.js')
    const result = await resolveFounderIdentityAction('founder')

    expect(result.resolvedAddress).toBeNull()
    expect(result.error).toBe(
      'Unable to resolve ENS right now. Try again or use a 0x address.'
    )
  })
})

describe('finalizeEnsRegistrationAction', () => {
  const safeAddress = '0x00000000000000000000000000000000000000aa' as const
  const existingRegistrationTxHash =
    '0x00000000000000000000000000000000000000000000000000000000000000bb' as const
  const deterministicRetryMessage =
    'ENS registration transaction already submitted. Waiting for confirmation. Retry in a moment.'
  const revertedTxMessage =
    'ENS registration transaction reverted. Please retry to submit a new transaction.'

  const buildPending = () => ({
    ensLabel: 'acme',
    ensName: 'acme.eth',
    commitTxHash:
      '0x00000000000000000000000000000000000000000000000000000000000000cc' as `0x${string}`,
    readyAt: Date.now() - 1000,
    owner: safeAddress,
    founders: [
      {
        wallet: '0x00000000000000000000000000000000000000d1' as `0x${string}`,
        equityBps: 10000,
      },
    ],
    threshold: 1,
    status: 'registering' as const,
    secret:
      '0x00000000000000000000000000000000000000000000000000000000000000dd' as `0x${string}`,
    durationYears: 1,
    createdAt: Date.now() - 5000,
    updatedAt: Date.now() - 5000,
    registrationTxHash: existingRegistrationTxHash,
    safeAddress,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
    process.env.ALCHEMY_API_KEY = 'https://example-rpc'

    mockGetPrice.mockResolvedValue({ base: 1_000n, premium: 0n })
    mockEstimateSafeDeploymentGas.mockResolvedValue(0n)
    mockReadContract.mockResolvedValue([0n, safeAddress])
    mockGetCode.mockResolvedValue('0x1234')
    mockUpdatePendingRegistration.mockResolvedValue(null)
    mockSetPendingRegistration.mockResolvedValue(undefined)
    mockClearPendingRegistration.mockResolvedValue(undefined)
  })

  it('reuses existing registration tx hash and does not submit another tx', async () => {
    const pending = buildPending()
    mockGetPendingRegistration.mockResolvedValue(pending)
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' })
    mockGetOwner
      .mockResolvedValueOnce({
        owner: '0x0000000000000000000000000000000000000000',
      })
      .mockResolvedValueOnce({
        owner: safeAddress,
      })

    const { finalizeEnsRegistrationAction } = await import('./actions.js')
    const result = await finalizeEnsRegistrationAction({ ensName: 'acme' })

    expect(mockSendTransaction).not.toHaveBeenCalled()
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({
      hash: existingRegistrationTxHash,
    })
    expect(result.status).toBe('ready-to-record')
    expect(result.registrationTxHash).toBe(existingRegistrationTxHash)
  })

  it('returns deterministic retry message and keeps state retryable when existing tx is unresolved', async () => {
    const pending = buildPending()
    mockGetPendingRegistration.mockResolvedValue(pending)
    mockWaitForTransactionReceipt.mockRejectedValue(
      new Error('transaction still pending')
    )
    mockGetOwner.mockResolvedValue({
      owner: '0x0000000000000000000000000000000000000000',
    })

    const { finalizeEnsRegistrationAction } = await import('./actions.js')

    await expect(
      finalizeEnsRegistrationAction({ ensName: 'acme' })
    ).rejects.toThrow(deterministicRetryMessage)

    expect(mockSendTransaction).not.toHaveBeenCalled()
    expect(mockUpdatePendingRegistration).toHaveBeenCalledWith({
      status: 'registering',
      error: deterministicRetryMessage,
    })
    expect(mockUpdatePendingRegistration).not.toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
      })
    )
  })

  it('clears existing registration tx hash when stored tx is reverted', async () => {
    const pending = buildPending()
    mockGetPendingRegistration.mockResolvedValue(pending)
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'reverted' })
    mockGetOwner.mockResolvedValue({
      owner: '0x0000000000000000000000000000000000000000',
    })

    const { finalizeEnsRegistrationAction } = await import('./actions.js')

    await expect(
      finalizeEnsRegistrationAction({ ensName: 'acme' })
    ).rejects.toThrow(revertedTxMessage)

    expect(mockSendTransaction).not.toHaveBeenCalled()
    expect(mockUpdatePendingRegistration).toHaveBeenCalledWith({
      registrationTxHash: undefined,
    })
    expect(mockUpdatePendingRegistration).toHaveBeenCalledWith({
      status: 'registering',
      registrationTxHash: undefined,
      error: revertedTxMessage,
    })
  })

  it('marks finalize as failed when ownership verification mismatches after confirmed tx', async () => {
    const pending = buildPending()
    mockGetPendingRegistration.mockResolvedValue(pending)
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' })
    mockGetOwner
      .mockResolvedValueOnce({
        owner: '0x0000000000000000000000000000000000000000',
      })
      .mockResolvedValueOnce({
        owner: '0x00000000000000000000000000000000000000ff',
      })

    const { finalizeEnsRegistrationAction } = await import('./actions.js')

    await expect(
      finalizeEnsRegistrationAction({ ensName: 'acme' })
    ).rejects.toThrow(/ENS registration verification failed\. Expected owner/)

    expect(mockSendTransaction).not.toHaveBeenCalled()
    expect(mockUpdatePendingRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error: expect.stringMatching(
          /ENS registration verification failed\. Expected owner/
        ),
      })
    )
    expect(mockUpdatePendingRegistration).not.toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'registering',
        error: deterministicRetryMessage,
      })
    )
  })
})
