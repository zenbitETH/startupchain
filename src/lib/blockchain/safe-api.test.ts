import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSafeInfo, getSafeInfoForVerification } from './safe-api'

function createJsonResponse(
  body: unknown,
  init: { ok: boolean; status: number; statusText?: string }
) {
  return {
    ok: init.ok,
    status: init.status,
    statusText: init.statusText ?? '',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('safe-api', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns owners when Safe ownership verification succeeds', async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          address: '0x123',
          nonce: 1,
          threshold: 1,
          owners: ['0xabc'],
          masterCopy: '0x1',
          modules: [],
          fallbackHandler: '0x2',
          guard: '0x3',
          version: '1.4.1',
        },
        { ok: true, status: 200 }
      )
    )

    const result = await getSafeInfoForVerification('0x123', 11155111)

    expect(result).toEqual({
      status: 'ok',
      safeInfo: {
        address: '0x123',
        nonce: 1,
        threshold: 1,
        owners: ['0xabc'],
        masterCopy: '0x1',
        modules: [],
        fallbackHandler: '0x2',
        guard: '0x3',
        version: '1.4.1',
      },
    })
  })

  it('classifies Safe API 403 responses as auth errors', async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {},
        { ok: false, status: 403, statusText: 'Forbidden' }
      )
    )

    await expect(
      getSafeInfoForVerification('0x123', 11155111)
    ).resolves.toEqual({
      status: 'auth_error',
      statusCode: 403,
    })
  })

  it('classifies 404 responses as unavailable and keeps the legacy wrapper nullable', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse(
        {},
        { ok: false, status: 404, statusText: 'Not Found' }
      )
    )

    await expect(
      getSafeInfoForVerification('0x123', 11155111)
    ).resolves.toEqual({
      status: 'unavailable',
      statusCode: 404,
    })
    await expect(getSafeInfo('0x123', 11155111)).resolves.toBeNull()
  })

  it('retries 429 responses and returns unavailable after retries are exhausted', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse(
        {},
        { ok: false, status: 429, statusText: 'Too Many Requests' }
      )
    )

    const resultPromise = getSafeInfoForVerification('0x123', 11155111)
    await vi.runAllTimersAsync()

    await expect(resultPromise).resolves.toEqual({
      status: 'unavailable',
      statusCode: 429,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries 5xx responses and returns unavailable after retries are exhausted', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse(
        {},
        { ok: false, status: 503, statusText: 'Service Unavailable' }
      )
    )

    const resultPromise = getSafeInfoForVerification('0x123', 11155111)
    await vi.runAllTimersAsync()

    await expect(resultPromise).resolves.toEqual({
      status: 'unavailable',
      statusCode: 503,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries network errors and returns unavailable when retries are exhausted', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))

    const resultPromise = getSafeInfoForVerification('0x123', 11155111)
    await vi.runAllTimersAsync()

    await expect(resultPromise).resolves.toEqual({
      status: 'unavailable',
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
