export type RegistrationStep =
  | 'idle'
  | 'checking'
  | 'awaiting-payment'
  | 'payment-pending'
  | 'committing'
  | 'waiting'
  | 'deploying-safe'
  | 'registering-ens'
  | 'awaiting-signature'
  | 'signing-company'
  | 'completed'
  | 'failed'

export type RegistrationPhaseId = 'ens' | 'safe' | 'startupchain'
export type PhaseState = 'waiting' | 'running' | 'completed' | 'failed'

export type RegistrationPhaseView = {
  id: RegistrationPhaseId
  label: string
  state: PhaseState
  message: string
  error?: string
}

type BuildRegistrationPhaseViewParams = {
  step: RegistrationStep
  countdown: number | null
  error?: string | null
  failedPhase?: RegistrationPhaseId | null
}

const PHASE_ORDER: RegistrationPhaseId[] = ['ens', 'safe', 'startupchain']
const ENS_RUNNING_STEPS: RegistrationStep[] = [
  'checking',
  'payment-pending',
  'committing',
  'waiting',
  'registering-ens',
]
const ENS_COMPLETED_STEPS: RegistrationStep[] = [
  'deploying-safe',
  'awaiting-signature',
  'signing-company',
  'completed',
]
const SAFE_RUNNING_STEPS: RegistrationStep[] = ['deploying-safe']
const SAFE_COMPLETED_STEPS: RegistrationStep[] = [
  'awaiting-signature',
  'signing-company',
  'completed',
]
const STARTUPCHAIN_RUNNING_STEPS: RegistrationStep[] = [
  'awaiting-signature',
  'signing-company',
]
const STARTUPCHAIN_COMPLETED_STEPS: RegistrationStep[] = ['completed']

function resolvePhaseStateForFailed(
  phase: RegistrationPhaseId,
  failedPhase: RegistrationPhaseId
): PhaseState {
  const phaseIndex = PHASE_ORDER.indexOf(phase)
  const failedIndex = PHASE_ORDER.indexOf(failedPhase)

  if (phaseIndex < failedIndex) return 'completed'
  if (phaseIndex > failedIndex) return 'waiting'
  return 'failed'
}

export function inferFailedPhaseFromStep(
  step: RegistrationStep,
  error?: string | null
): RegistrationPhaseId {
  const normalizedError = error?.toLowerCase() ?? ''

  if (step === 'deploying-safe' || normalizedError.includes('safe')) {
    return 'safe'
  }

  if (
    step === 'awaiting-signature' ||
    step === 'signing-company' ||
    normalizedError.includes('record') ||
    normalizedError.includes('signature') ||
    normalizedError.includes('wallet sign') ||
    normalizedError.includes('company transaction')
  ) {
    return 'startupchain'
  }

  return 'ens'
}

function resolvePhaseState(
  phase: RegistrationPhaseId,
  step: RegistrationStep,
  failedPhase?: RegistrationPhaseId | null
): PhaseState {
  if (step === 'failed') {
    return resolvePhaseStateForFailed(phase, failedPhase ?? 'ens')
  }

  if (phase === 'ens') {
    if (ENS_RUNNING_STEPS.includes(step)) return 'running'
    if (ENS_COMPLETED_STEPS.includes(step)) return 'completed'
    return 'waiting'
  }

  if (phase === 'safe') {
    if (SAFE_RUNNING_STEPS.includes(step)) return 'running'
    if (SAFE_COMPLETED_STEPS.includes(step)) return 'completed'
    return 'waiting'
  }

  if (STARTUPCHAIN_RUNNING_STEPS.includes(step)) return 'running'
  if (STARTUPCHAIN_COMPLETED_STEPS.includes(step)) return 'completed'
  return 'waiting'
}

function resolveMessage(
  phase: RegistrationPhaseId,
  state: PhaseState,
  step: RegistrationStep,
  countdown: number | null
): string {
  if (phase === 'ens') {
    if (state === 'failed') return 'ENS registration failed. Please retry this step.'
    if (state === 'completed') return 'ENS domain is now registered to your company Safe.'
    if (state === 'running') {
      if (step === 'payment-pending') return 'Confirming your payment onchain.'
      if (step === 'committing') return 'Submitting ENS commitment.'
      if (step === 'waiting') {
        return `Waiting for ENS safety window (${countdown ?? 0}s remaining).`
      }
      if (step === 'registering-ens') {
        return 'Registering your ENS domain to the Safe address.'
      }
      return 'Preparing ENS registration.'
    }
    if (step === 'awaiting-payment') return 'Waiting for your payment to begin.'
    return 'This step starts first.'
  }

  if (phase === 'safe') {
    if (state === 'failed') return 'Safe creation failed. Please retry this step.'
    if (state === 'completed') return 'Safe wallet created and linked.'
    if (state === 'running') return 'Creating your Safe wallet.'
    return 'Starts after ENS registration completes.'
  }

  if (state === 'failed') {
    return 'StartupChain registration failed. Please retry this step.'
  }
  if (state === 'completed') return 'Company recorded on StartupChain.'
  if (state === 'running') {
    if (step === 'awaiting-signature') {
      return 'Waiting for your signature to finalize registration.'
    }
    return 'Submitting company registration transaction.'
  }
  return 'Starts after Safe creation completes.'
}

export function buildRegistrationPhaseView({
  step,
  countdown,
  error,
  failedPhase,
}: BuildRegistrationPhaseViewParams): RegistrationPhaseView[] {
  const phases: Array<{ id: RegistrationPhaseId; label: string }> = [
    { id: 'ens', label: 'ENS domain registration' },
    { id: 'safe', label: 'Safe creation' },
    { id: 'startupchain', label: 'StartupChain company registration' },
  ]

  return phases.map(({ id, label }) => {
    const state = resolvePhaseState(id, step, failedPhase)
    const message = resolveMessage(id, state, step, countdown)

    if (state === 'failed' && error) {
      return {
        id,
        label,
        state,
        message,
        error,
      }
    }

    return {
      id,
      label,
      state,
      message,
    }
  })
}
