import { describe, expect, it } from 'vitest'

import {
  buildRegistrationPhaseView,
  inferFailedPhaseFromStep,
} from './registration-progress-model'

describe('registration progress model', () => {
  it('maps waiting window to ENS running and downstream waiting', () => {
    const phases = buildRegistrationPhaseView({
      step: 'waiting',
      countdown: 37,
    })

    expect(phases).toEqual([
      expect.objectContaining({ id: 'ens', state: 'running' }),
      expect.objectContaining({ id: 'safe', state: 'waiting' }),
      expect.objectContaining({ id: 'startupchain', state: 'waiting' }),
    ])
    expect(phases[0].message).toContain('37s')
  })

  it('maps safe deploy step to ens completed and safe running', () => {
    const phases = buildRegistrationPhaseView({
      step: 'deploying-safe',
      countdown: null,
    })

    expect(phases).toEqual([
      expect.objectContaining({ id: 'ens', state: 'completed' }),
      expect.objectContaining({ id: 'safe', state: 'running' }),
      expect.objectContaining({ id: 'startupchain', state: 'waiting' }),
    ])
  })

  it('maps awaiting signature to startupchain running after ens and safe complete', () => {
    const phases = buildRegistrationPhaseView({
      step: 'awaiting-signature',
      countdown: null,
    })

    expect(phases).toEqual([
      expect.objectContaining({ id: 'ens', state: 'completed' }),
      expect.objectContaining({ id: 'safe', state: 'completed' }),
      expect.objectContaining({ id: 'startupchain', state: 'running' }),
    ])
  })

  it('pins failed ENS phase and keeps later phases waiting', () => {
    const phases = buildRegistrationPhaseView({
      step: 'failed',
      failedPhase: 'ens',
      error: 'Payment confirmation failed',
      countdown: null,
    })

    expect(phases).toEqual([
      expect.objectContaining({ id: 'ens', state: 'failed' }),
      expect.objectContaining({ id: 'safe', state: 'waiting' }),
      expect.objectContaining({ id: 'startupchain', state: 'waiting' }),
    ])
    expect(phases[0].error).toBe('Payment confirmation failed')
  })

  it('pins failed Safe phase and keeps later StartupChain waiting', () => {
    const phases = buildRegistrationPhaseView({
      step: 'failed',
      failedPhase: 'safe',
      error: 'Safe deployment reverted',
      countdown: null,
    })

    expect(phases).toEqual([
      expect.objectContaining({ id: 'ens', state: 'completed' }),
      expect.objectContaining({ id: 'safe', state: 'failed' }),
      expect.objectContaining({ id: 'startupchain', state: 'waiting' }),
    ])
  })

  it('pins failed StartupChain phase with prior phases completed', () => {
    const phases = buildRegistrationPhaseView({
      step: 'failed',
      failedPhase: 'startupchain',
      error: 'Transaction failed',
      countdown: null,
    })

    expect(phases).toEqual([
      expect.objectContaining({ id: 'ens', state: 'completed' }),
      expect.objectContaining({ id: 'safe', state: 'completed' }),
      expect.objectContaining({ id: 'startupchain', state: 'failed' }),
    ])
  })
})

describe('inferFailedPhaseFromStep', () => {
  it('infers safe for deploying-safe step', () => {
    expect(inferFailedPhaseFromStep('deploying-safe')).toBe('safe')
  })

  it('infers startupchain for signature step', () => {
    expect(inferFailedPhaseFromStep('awaiting-signature')).toBe('startupchain')
  })

  it('defaults to ens for payment and commit failures', () => {
    expect(inferFailedPhaseFromStep('payment-pending')).toBe('ens')
    expect(inferFailedPhaseFromStep('committing')).toBe('ens')
  })
})
