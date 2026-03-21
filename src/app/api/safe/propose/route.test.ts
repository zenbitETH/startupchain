import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'

const {
  mockProposeTransaction,
  mockGetServerSession,
  mockGetCompanyByAddress,
  mockGetSafeInfoForVerification,
} = vi.hoisted(() => ({
  mockProposeTransaction: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockGetCompanyByAddress: vi.fn(),
  mockGetSafeInfoForVerification: vi.fn(),
}))

vi.mock('@safe-global/api-kit', () => {
  return {
    default: class SafeApiKitMock {
      constructor() {}

      proposeTransaction = mockProposeTransaction
    },
  }
})

vi.mock('../../../../lib/auth/server-session', () => {
  return {
    getServerSession: mockGetServerSession,
  }
})

vi.mock('../../../../lib/blockchain/get-company', () => {
  return {
    getCompanyByAddress: mockGetCompanyByAddress,
  }
})

vi.mock('../../../../lib/blockchain/safe-api', () => {
  return {
    getSafeInfoForVerification: mockGetSafeInfoForVerification,
  }
})

function makeValidBody() {
  return {
    chainId: 11155111,
    safeAddress: '0x1234567890abcdef1234567890abcdef12345678',
    safeTxHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    senderAddress: '0x1234567890abcdef1234567890abcdef12345678',
    senderSignature:
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    safeTransactionData: {
      to: '0x1234567890abcdef1234567890abcdef12345678',
      value: '0',
      data: '0x',
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: 1,
    },
  }
}

describe('/api/safe/propose', () => {
  beforeEach(() => {
    mockProposeTransaction.mockReset()
    mockGetServerSession.mockReset()
    mockGetCompanyByAddress.mockReset()
    mockGetSafeInfoForVerification.mockReset()
    vi.stubEnv('SAFE_API_KEY', 'test-safe-api-key')

    mockGetServerSession.mockResolvedValue({
      userId: 'privy-user-id',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      expiresAt: new Date('2026-02-23T00:00:00.000Z'),
    })
    mockGetCompanyByAddress.mockResolvedValue({
      founders: [
        {
          wallet: '0x1234567890abcdef1234567890abcdef12345678',
        },
      ],
    })
    mockGetSafeInfoForVerification.mockResolvedValue({
      status: 'ok',
      safeInfo: {
        owners: ['0x1234567890abcdef1234567890abcdef12345678'],
      },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 503 with SAFE_API_KEY_MISSING when key is absent', async () => {
    vi.stubEnv('SAFE_API_KEY', '')
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeValidBody()),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      error: 'Safe proposal service is not configured',
      code: 'SAFE_API_KEY_MISSING',
    })
  })

  it('returns 400 for invalid payload', async () => {
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainId: 11155111 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(mockGetCompanyByAddress).not.toHaveBeenCalled()
  })

  it('returns 401 when session is missing', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeValidBody()),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Authentication required' })
    expect(mockProposeTransaction).not.toHaveBeenCalled()
  })

  it('returns 403 when wallet is not a founder for the Safe', async () => {
    mockGetCompanyByAddress.mockResolvedValueOnce({
      founders: [
        {
          wallet: '0x0000000000000000000000000000000000000001',
        },
      ],
    })
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeValidBody()),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toEqual({
      error:
        'Your authenticated wallet is not authorized for this company Safe.',
    })
    expect(mockProposeTransaction).not.toHaveBeenCalled()
  })

  it('returns 403 when senderAddress differs from the authenticated session wallet', async () => {
    const payload = {
      ...makeValidBody(),
      senderAddress: '0x9999999999999999999999999999999999999999',
    }
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toEqual({
      error:
        'Connect the same founder wallet used for your authenticated session before submitting a Safe proposal.',
    })
    expect(mockGetSafeInfoForVerification).not.toHaveBeenCalled()
    expect(mockProposeTransaction).not.toHaveBeenCalled()
  })

  it('returns 403 when sender/session wallet is not a Safe owner', async () => {
    mockGetSafeInfoForVerification.mockResolvedValueOnce({
      status: 'ok',
      safeInfo: {
        owners: ['0x0000000000000000000000000000000000000001'],
      },
    })
    const payload = makeValidBody()
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toEqual({
      error: 'Only Safe owners can submit ENS proposals for this company.',
    })
    expect(mockProposeTransaction).not.toHaveBeenCalled()
  })

  it('returns 503 with SAFE_API_AUTH_ERROR when Safe ownership lookup is rejected', async () => {
    mockGetSafeInfoForVerification.mockResolvedValueOnce({
      status: 'auth_error',
      statusCode: 403,
    })
    const payload = makeValidBody()
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      error:
        'Could not verify Safe ownership because server access to the Safe Transaction Service was rejected.',
      code: 'SAFE_API_AUTH_ERROR',
    })
    expect(mockProposeTransaction).not.toHaveBeenCalled()
  })

  it('returns 503 with SAFE_API_UNAVAILABLE when Safe ownership lookup cannot be verified', async () => {
    mockGetSafeInfoForVerification.mockResolvedValueOnce({
      status: 'unavailable',
      statusCode: 503,
    })
    const payload = makeValidBody()
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      error:
        'Could not verify Safe ownership right now because the Safe Transaction Service is unavailable.',
      code: 'SAFE_API_UNAVAILABLE',
    })
    expect(mockProposeTransaction).not.toHaveBeenCalled()
  })

  it('returns safeTxHash on success', async () => {
    mockProposeTransaction.mockResolvedValue(undefined)
    const payload = makeValidBody()
    const request = new Request('http://localhost/api/safe/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ safeTxHash: payload.safeTxHash })
    expect(mockGetCompanyByAddress).toHaveBeenCalledWith(
      payload.safeAddress,
      payload.chainId
    )
    expect(mockGetSafeInfoForVerification).toHaveBeenCalledWith(
      payload.safeAddress,
      payload.chainId
    )
    expect(mockProposeTransaction).toHaveBeenCalledTimes(1)
  })
})
