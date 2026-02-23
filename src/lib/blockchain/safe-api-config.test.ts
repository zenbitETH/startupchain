import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  SafeApiConfigurationError,
  getSafeApiKitConfig,
} from './safe-api-config'

describe('getSafeApiKitConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns resolved config when SAFE_API_KEY is present', () => {
    vi.stubEnv('SAFE_API_KEY', 'test-safe-api-key')

    expect(getSafeApiKitConfig(11155111)).toEqual({
      chainId: 11155111n,
      apiKey: 'test-safe-api-key',
    })
  })

  it('throws SAFE_API_KEY_MISSING when key is absent', () => {
    vi.stubEnv('SAFE_API_KEY', '')

    try {
      getSafeApiKitConfig(11155111)
      throw new Error('Expected getSafeApiKitConfig to throw')
    }
    catch (error) {
      expect(error).toBeInstanceOf(SafeApiConfigurationError)
      expect((error as SafeApiConfigurationError).code).toBe('SAFE_API_KEY_MISSING')
      expect((error as SafeApiConfigurationError).message).toBe(
        'Safe proposal service is not configured',
      )
    }
  })

  it('throws explicit error when chainId is invalid', () => {
    vi.stubEnv('SAFE_API_KEY', 'test-safe-api-key')

    expect(() => getSafeApiKitConfig(Number.NaN)).toThrow('Safe chain ID is invalid')
  })
})
