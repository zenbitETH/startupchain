import { describe, expect, it, vi } from 'vitest'

import {
  SafeProposeClientError,
  handleSafeProposalError,
} from './safe-proposal-client'

describe('handleSafeProposalError', () => {
  it('treats SAFE_API_KEY_MISSING as a persistent service failure', () => {
    const onApiUnavailable = vi.fn()
    const onError = vi.fn()

    handleSafeProposalError(
      new SafeProposeClientError('Safe proposal service is not configured', {
        code: 'SAFE_API_KEY_MISSING',
        status: 503,
      }),
      'fallback',
      {
        onApiUnavailable,
        onError,
      }
    )

    expect(onApiUnavailable).toHaveBeenCalledWith(
      'Safe proposal service is not configured'
    )
    expect(onError).not.toHaveBeenCalled()
  })

  it('treats SAFE_API_AUTH_ERROR as a persistent service failure', () => {
    const onApiUnavailable = vi.fn()
    const onError = vi.fn()

    handleSafeProposalError(
      new SafeProposeClientError(
        'Could not verify Safe ownership because server access to the Safe Transaction Service was rejected.',
        {
          code: 'SAFE_API_AUTH_ERROR',
          status: 503,
        }
      ),
      'fallback',
      {
        onApiUnavailable,
        onError,
      }
    )

    expect(onApiUnavailable).toHaveBeenCalledWith(
      'Could not verify Safe ownership because server access to the Safe Transaction Service was rejected.'
    )
    expect(onError).not.toHaveBeenCalled()
  })

  it('keeps SAFE_API_UNAVAILABLE retryable', () => {
    const onApiUnavailable = vi.fn()
    const onError = vi.fn()

    handleSafeProposalError(
      new SafeProposeClientError(
        'Could not verify Safe ownership right now because the Safe Transaction Service is unavailable.',
        {
          code: 'SAFE_API_UNAVAILABLE',
          status: 503,
        }
      ),
      'fallback',
      {
        onApiUnavailable,
        onError,
      }
    )

    expect(onError).toHaveBeenCalledWith(
      'Could not verify Safe ownership right now because the Safe Transaction Service is unavailable.'
    )
    expect(onApiUnavailable).not.toHaveBeenCalled()
  })
})
