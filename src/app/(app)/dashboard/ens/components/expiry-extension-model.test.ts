import { describe, expect, it } from 'vitest'

import {
  applyRenewalQuoteToValue,
  canSubmitRenewalProposal,
  createRenewalValueState,
  enableManualRenewalOverride,
  parseRenewalValue,
  resetRenewalValueToQuote,
  updateRenewalValueInput,
} from './expiry-extension-model'

describe('expiry-extension-model', () => {
  const quote = {
    baseWei: '10',
    premiumWei: '2',
    totalWei: '12',
    baseEth: '0.00000000000000001',
    premiumEth: '0.000000000000000002',
    totalEth: '0.000000000000000012',
    estimatedTotalUsd: '0.03',
    usdEstimateSource: 'coinbase-spot' as const,
  }

  it('prefills the renewal value from the fetched quote', () => {
    const state = applyRenewalQuoteToValue(createRenewalValueState(), quote)

    expect(state.renewalValue).toBe('12')
    expect(state.manualOverrideActive).toBe(false)
  })

  it('preserves a manual override when a fresh quote arrives', () => {
    const quotedState = applyRenewalQuoteToValue(
      createRenewalValueState(),
      quote
    )
    const manualState = updateRenewalValueInput(quotedState, '15')
    const refreshedState = applyRenewalQuoteToValue(manualState, {
      ...quote,
      totalWei: '14',
    })

    expect(refreshedState.renewalValue).toBe('15')
    expect(refreshedState.manualOverrideActive).toBe(true)
    expect(refreshedState.staleManualOverride).toBe(true)
  })

  it('can reset a manual override back to the quoted value', () => {
    const quotedState = applyRenewalQuoteToValue(
      createRenewalValueState(),
      quote
    )
    const manualState = updateRenewalValueInput(quotedState, '15')
    const resetState = resetRenewalValueToQuote(manualState)

    expect(resetState.renewalValue).toBe('12')
    expect(resetState.manualOverrideActive).toBe(false)
  })

  it('requires explicit manual override when quote fetch fails', () => {
    const state = updateRenewalValueInput(
      enableManualRenewalOverride(createRenewalValueState()),
      '15'
    )

    expect(
      canSubmitRenewalProposal({
        authenticated: true,
        chainId: 11155111,
        safeAddress: '0x1111111111111111111111111111111111111111',
        controllerAddress: '0x2222222222222222222222222222222222222222',
        isBusy: false,
        quoteStatus: 'error',
        valueState: state,
      })
    ).toBe(true)
  })

  it('disables submission while quote is loading', () => {
    const state = applyRenewalQuoteToValue(createRenewalValueState(), quote)

    expect(
      canSubmitRenewalProposal({
        authenticated: true,
        chainId: 11155111,
        safeAddress: '0x1111111111111111111111111111111111111111',
        controllerAddress: '0x2222222222222222222222222222222222222222',
        isBusy: false,
        quoteStatus: 'loading',
        valueState: state,
      })
    ).toBe(false)
  })

  it('parses valid wei values and rejects empty input', () => {
    expect(parseRenewalValue('12')).toBe(12n)
    expect(parseRenewalValue('')).toBeNull()
  })
})
