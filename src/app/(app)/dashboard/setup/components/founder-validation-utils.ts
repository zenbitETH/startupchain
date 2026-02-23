export type FounderValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export interface FounderValidationState {
  status: FounderValidationStatus
  input: string
  resolvedAddress: string | null
  ensName: string | null
  source: 'address' | 'ens' | null
  error: string | null
}

export function createIdleFounderValidation(input = ''): FounderValidationState {
  return {
    status: 'idle',
    input,
    resolvedAddress: null,
    ensName: null,
    source: null,
    error: null,
  }
}

interface ScheduleFounderValidationParams {
  founderId: string
  input: string
  delayMs: number
  timers: Record<string, ReturnType<typeof setTimeout> | undefined>
  onDebouncedValidate: (founderId: string, input: string) => void
  setTimeoutFn?: typeof setTimeout
  clearTimeoutFn?: typeof clearTimeout
}

export function scheduleFounderValidation({
  founderId,
  input,
  delayMs,
  timers,
  onDebouncedValidate,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
}: ScheduleFounderValidationParams) {
  const existingTimer = timers[founderId]
  if (existingTimer) {
    clearTimeoutFn(existingTimer)
  }

  timers[founderId] = setTimeoutFn(() => {
    onDebouncedValidate(founderId, input)
  }, delayMs)
}

export function clearFounderValidationTimer(
  founderId: string,
  timers: Record<string, ReturnType<typeof setTimeout> | undefined>,
  clearTimeoutFn: typeof clearTimeout = clearTimeout
) {
  const existingTimer = timers[founderId]
  if (existingTimer) {
    clearTimeoutFn(existingTimer)
    delete timers[founderId]
  }
}

interface ShouldApplyFounderResolutionParams {
  requestVersion: number
  latestVersion: number
  requestInput: string
  latestInput: string
}

export function shouldApplyFounderResolution({
  requestVersion,
  latestVersion,
  requestInput,
  latestInput,
}: ShouldApplyFounderResolutionParams) {
  return requestVersion === latestVersion && requestInput === latestInput.trim()
}
