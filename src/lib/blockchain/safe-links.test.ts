import { describe, expect, it } from 'vitest'

import {
  getSafeApiBaseUrl,
  getSafeQueueUrl,
  getSafeWalletUrl,
} from './safe-links'

describe('safe-links', () => {
  it('resolves known chain prefixes for Safe URLs', () => {
    expect(getSafeApiBaseUrl(1)).toBe('https://api.safe.global/tx-service/eth/api')
    expect(getSafeApiBaseUrl(11155111)).toBe('https://api.safe.global/tx-service/sep/api')
    expect(getSafeApiBaseUrl(8453)).toBe('https://api.safe.global/tx-service/base/api')
  })

  it('builds Safe app URLs with queue and wallet paths', () => {
    const safeAddress = '0x1234567890abcdef1234567890abcdef12345678'
    expect(getSafeQueueUrl(11155111, safeAddress)).toBe(
      `https://app.safe.global/transactions/queue?safe=sep:${safeAddress}`,
    )
    expect(getSafeWalletUrl(safeAddress, 1)).toBe(
      `https://app.safe.global/home?safe=eth:${safeAddress}`,
    )
  })
})
