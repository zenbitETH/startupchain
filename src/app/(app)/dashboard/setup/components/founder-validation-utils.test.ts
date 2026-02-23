import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearFounderValidationTimer,
  createIdleFounderValidation,
  scheduleFounderValidation,
  shouldApplyFounderResolution,
} from './founder-validation-utils'

describe('founder-validation-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('debounces founder validation and only fires latest input once', () => {
    const timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {}
    const onDebouncedValidate = vi.fn()

    scheduleFounderValidation({
      founderId: 'f-1',
      input: 'p',
      delayMs: 350,
      timers,
      onDebouncedValidate,
    })
    scheduleFounderValidation({
      founderId: 'f-1',
      input: 'pe',
      delayMs: 350,
      timers,
      onDebouncedValidate,
    })
    scheduleFounderValidation({
      founderId: 'f-1',
      input: 'peter.eth',
      delayMs: 350,
      timers,
      onDebouncedValidate,
    })

    vi.advanceTimersByTime(349)
    expect(onDebouncedValidate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onDebouncedValidate).toHaveBeenCalledTimes(1)
    expect(onDebouncedValidate).toHaveBeenCalledWith('f-1', 'peter.eth')
  })

  it('applies resolution only when version and input still match', () => {
    const shouldApplyCurrent = shouldApplyFounderResolution({
      requestVersion: 3,
      latestVersion: 3,
      requestInput: 'peter.eth',
      latestInput: 'peter.eth',
    })
    expect(shouldApplyCurrent).toBe(true)

    const shouldIgnoreStaleVersion = shouldApplyFounderResolution({
      requestVersion: 2,
      latestVersion: 3,
      requestInput: 'peter.eth',
      latestInput: 'peter.eth',
    })
    expect(shouldIgnoreStaleVersion).toBe(false)

    const shouldIgnoreStaleInput = shouldApplyFounderResolution({
      requestVersion: 3,
      latestVersion: 3,
      requestInput: 'pet',
      latestInput: 'peter.eth',
    })
    expect(shouldIgnoreStaleInput).toBe(false)
  })

  it('clears timer for removed founder row', () => {
    const timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {}
    const onDebouncedValidate = vi.fn()

    scheduleFounderValidation({
      founderId: 'f-2',
      input: 'remove.me.eth',
      delayMs: 350,
      timers,
      onDebouncedValidate,
    })

    clearFounderValidationTimer('f-2', timers)
    vi.advanceTimersByTime(400)

    expect(onDebouncedValidate).not.toHaveBeenCalled()
    expect(timers['f-2']).toBeUndefined()
  })

  it('creates idle validation state when founder input is cleared', () => {
    expect(createIdleFounderValidation('')).toEqual({
      status: 'idle',
      input: '',
      resolvedAddress: null,
      ensName: null,
      source: null,
      error: null,
    })
  })
})
