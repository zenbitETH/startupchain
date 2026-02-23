import { type RegistrationPhaseId } from '@/hooks/registration-progress-model'

const CANCEL_PATTERNS = [
  'user rejected the request',
  'user denied transaction signature',
  'user denied',
  'action_rejected',
  'rejected',
  '4001',
]

const REQUEST_ARGS_PATTERN = /\s*request arguments:\s*/i
const DETAILS_PATTERN = /\s*details:\s*/i
const VERSION_PATTERN = /\s*version:\s*viem@/i

function toMessageText(input: unknown): string {
  if (typeof input === 'string') return input
  if (input instanceof Error) return input.message
  if (input && typeof input === 'object') {
    const maybeMessage = (input as { message?: unknown }).message
    if (typeof maybeMessage === 'string') return maybeMessage
  }
  return ''
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripLowLevelDetails(message: string): string {
  let output = message

  output = output.split(REQUEST_ARGS_PATTERN)[0] ?? output
  output = output.split(DETAILS_PATTERN)[0] ?? output
  output = output.split(VERSION_PATTERN)[0] ?? output
  output = output.replace(/^error:\s*/i, '')

  return normalizeWhitespace(output)
}

function isCancelError(message: string): boolean {
  const normalized = message.toLowerCase()
  return CANCEL_PATTERNS.some((pattern) => normalized.includes(pattern))
}

export function toUserFacingRegistrationError(
  input: unknown,
  phase: RegistrationPhaseId
): string {
  const raw = normalizeWhitespace(toMessageText(input))

  if (!raw) {
    return 'Something went wrong. Please retry.'
  }

  if (isCancelError(raw)) {
    if (phase === 'startupchain') {
      return 'Signature canceled. Your company was not recorded yet. Retry when ready.'
    }

    return 'Transaction canceled. Nothing was sent. You can retry.'
  }

  const cleaned = stripLowLevelDetails(raw)
  if (!cleaned) {
    return 'Something went wrong. Please retry.'
  }

  return cleaned
}
