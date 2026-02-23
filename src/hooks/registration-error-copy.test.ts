import { describe, expect, it } from 'vitest'

import { toUserFacingRegistrationError } from './registration-error-copy'

describe('toUserFacingRegistrationError', () => {
  it('maps user-rejected payment errors to friendly ENS copy', () => {
    const output = toUserFacingRegistrationError(
      'User rejected the request',
      'ens'
    )

    expect(output).toBe('Transaction canceled. Nothing was sent. You can retry.')
  })

  it('maps 4001 signature errors to friendly startupchain copy', () => {
    const output = toUserFacingRegistrationError(
      'MetaMask Tx Signature: User denied transaction signature. code=4001',
      'startupchain'
    )

    expect(output).toBe(
      'Signature canceled. Your company was not recorded yet. Retry when ready.'
    )
  })

  it('strips long viem request/details noise from non-cancel errors', () => {
    const output = toUserFacingRegistrationError(
      'Execution reverted. Request Arguments: from: 0xabc to: 0xdef Details: MetaMask Tx Signature: something Version: viem@2.44.4',
      'safe'
    )

    expect(output).toBe('Execution reverted.')
  })

  it('returns fallback for unknown empty errors', () => {
    const output = toUserFacingRegistrationError(undefined, 'ens')
    expect(output).toBe('Something went wrong. Please retry.')
  })
})
