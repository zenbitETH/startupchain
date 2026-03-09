export type RenewalQuoteSnapshot = {
  baseWei: string
  premiumWei: string
  totalWei: string
  baseEth: string
  premiumEth: string
  totalEth: string
}

export type RenewalValueState = {
  renewalValue: string
  quotedValue: string | null
  manualOverrideEnabled: boolean
  manualOverrideActive: boolean
  staleManualOverride: boolean
}

export function parseRenewalValue(input: string): bigint | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    return BigInt(trimmed)
  } catch {
    return null
  }
}

export function createRenewalValueState(): RenewalValueState {
  return {
    renewalValue: '',
    quotedValue: null,
    manualOverrideEnabled: false,
    manualOverrideActive: false,
    staleManualOverride: false,
  }
}

export function applyRenewalQuoteToValue(
  current: RenewalValueState,
  quote: RenewalQuoteSnapshot
): RenewalValueState {
  if (!current.manualOverrideActive) {
    return {
      renewalValue: quote.totalWei,
      quotedValue: quote.totalWei,
      manualOverrideEnabled: false,
      manualOverrideActive: false,
      staleManualOverride: false,
    }
  }

  return {
    ...current,
    quotedValue: quote.totalWei,
    staleManualOverride: current.renewalValue.trim() !== quote.totalWei,
  }
}

export function updateRenewalValueInput(
  current: RenewalValueState,
  nextValue: string
): RenewalValueState {
  const trimmedValue = nextValue.trim()
  const hasQuotedValue = current.quotedValue !== null
  const matchesQuote = hasQuotedValue && trimmedValue === current.quotedValue
  const manualOverrideActive = hasQuotedValue
    ? !matchesQuote
    : trimmedValue.length > 0

  return {
    ...current,
    renewalValue: nextValue,
    manualOverrideActive,
    staleManualOverride:
      current.quotedValue !== null && manualOverrideActive
        ? trimmedValue !== current.quotedValue
        : false,
  }
}

export function enableManualRenewalOverride(
  current: RenewalValueState
): RenewalValueState {
  return {
    ...current,
    manualOverrideEnabled: true,
  }
}

export function resetRenewalValueToQuote(
  current: RenewalValueState
): RenewalValueState {
  if (!current.quotedValue) {
    return current
  }

  return {
    renewalValue: current.quotedValue,
    quotedValue: current.quotedValue,
    manualOverrideEnabled: false,
    manualOverrideActive: false,
    staleManualOverride: false,
  }
}

export function canSubmitRenewalProposal({
  authenticated,
  chainId,
  safeAddress,
  controllerAddress,
  isBusy,
  quoteStatus,
  valueState,
}: {
  authenticated: boolean
  chainId?: number
  safeAddress?: `0x${string}`
  controllerAddress?: `0x${string}`
  isBusy: boolean
  quoteStatus: 'idle' | 'loading' | 'ready' | 'error'
  valueState: RenewalValueState
}): boolean {
  if (
    !authenticated ||
    !chainId ||
    !safeAddress ||
    !controllerAddress ||
    isBusy ||
    quoteStatus === 'idle' ||
    quoteStatus === 'loading'
  ) {
    return false
  }

  const parsedValue = parseRenewalValue(valueState.renewalValue)
  if (parsedValue === null) {
    return false
  }

  if (quoteStatus === 'ready') {
    return true
  }

  return quoteStatus === 'error' && valueState.manualOverrideEnabled
}
