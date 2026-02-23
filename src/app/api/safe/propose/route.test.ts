import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockProposeTransaction,
  mockGetServerSession,
  mockGetCompanyByAddress,
} = vi.hoisted(() => ({
  mockProposeTransaction: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockGetCompanyByAddress: vi.fn(),
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

import { POST } from './route'

function makeValidBody() {
  return {
    chainId: 11155111,
    safeAddress: '0x1234567890abcdef1234567890abcdef12345678',
    safeTxHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    senderAddress: '0x1234567890abcdef1234567890abcdef12345678',
    senderSignature: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
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
      error: 'You are not authorized to propose for this Safe',
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
      payload.chainId,
    )
    expect(mockProposeTransaction).toHaveBeenCalledTimes(1)
  })
})
