import { describe, expect, it, vi } from 'vitest'

import {
  COMPANY_REGISTRATION_PENDING_MESSAGE,
  shouldBlockRecordCompanySubmit,
} from './record-company-submit-guard'

describe('record-company submit guard', () => {
  it('allows first submit when awaiting signature with no in-flight transaction', () => {
    const blocked = shouldBlockRecordCompanySubmit({
      step: 'awaiting-signature',
      isLocked: false,
      isSigningCompany: false,
      isConfirmingCompany: false,
      hasRecordCompanyTxHash: false,
    })

    expect(blocked).toBe(false)
  })

  it('blocks immediate second submit and keeps writer invocation count at one', () => {
    let isLocked = false
    const writeRecordCompany = vi.fn()

    const trySubmit = () => {
      const blocked = shouldBlockRecordCompanySubmit({
        step: 'awaiting-signature',
        isLocked,
        isSigningCompany: false,
        isConfirmingCompany: false,
        hasRecordCompanyTxHash: false,
      })

      if (blocked) return COMPANY_REGISTRATION_PENDING_MESSAGE

      isLocked = true
      writeRecordCompany()
      return 'submitted'
    }

    expect(trySubmit()).toBe('submitted')
    expect(trySubmit()).toBe(COMPANY_REGISTRATION_PENDING_MESSAGE)
    expect(writeRecordCompany).toHaveBeenCalledTimes(1)
  })

  it('blocks when a transaction hash already exists', () => {
    const blocked = shouldBlockRecordCompanySubmit({
      step: 'awaiting-signature',
      isLocked: false,
      isSigningCompany: false,
      isConfirmingCompany: false,
      hasRecordCompanyTxHash: true,
    })

    expect(blocked).toBe(true)
  })
})
