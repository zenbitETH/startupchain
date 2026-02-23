'use client'

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from 'lucide-react'

import {
  buildRegistrationPhaseView,
  type RegistrationPhaseId,
  type RegistrationStep,
} from '@/hooks/registration-progress-model'

type RegistrationProgressCardProps = {
  step: RegistrationStep
  countdown: number | null
  error?: string | null
  failedPhase?: RegistrationPhaseId | null
  paymentAmountEth?: string | null
  isPaymentInFlight?: boolean
  isSignSubmitting?: boolean
  permissionDenied?: boolean
  onPayAndStart?: () => void
  onSign?: () => void
  onRetry?: () => void
  onBackToEdit?: () => void
}

const statusLabel: Record<string, string> = {
  waiting: 'Waiting',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
}

const rowProgress: Record<string, number> = {
  waiting: 16,
  running: 56,
  completed: 100,
  failed: 100,
}

function StateIcon({ state }: { state: string }) {
  if (state === 'completed') {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  }

  if (state === 'failed') {
    return <AlertTriangle className="h-5 w-5 text-destructive" />
  }

  if (state === 'running') {
    return <Loader2 className="text-primary h-5 w-5 animate-spin motion-reduce:animate-none" />
  }

  return <div className="bg-muted h-4 w-4 rounded-full" aria-hidden />
}

export function RegistrationProgressCard({
  step,
  countdown,
  error,
  failedPhase,
  paymentAmountEth,
  isPaymentInFlight = false,
  isSignSubmitting = false,
  permissionDenied = false,
  onPayAndStart,
  onSign,
  onRetry,
  onBackToEdit,
}: RegistrationProgressCardProps) {
  const phases = buildRegistrationPhaseView({
    step,
    countdown,
    error,
    failedPhase,
  })
  const activePhase = phases.find((phase) => phase.state === 'running')
  const activeDescription =
    step === 'awaiting-payment'
      ? 'Ready to start. One payment kicks off all three phases.'
      : step === 'payment-pending'
        ? 'Payment is being confirmed onchain.'
        : step === 'waiting'
          ? `ENS commitment submitted. Waiting for security window (${countdown ?? 0}s).`
          : step === 'awaiting-signature'
            ? 'Final step. Sign once to record your company.'
            : step === 'failed'
              ? 'One phase failed. You can safely retry.'
              : step === 'completed'
                ? 'All done. Redirecting to your dashboard.'
                : activePhase
                  ? `${activePhase.label} is in progress.`
                  : 'Preparing launch state.'

  const canPayAndStart =
    step === 'awaiting-payment' &&
    !permissionDenied &&
    Boolean(onPayAndStart) &&
    !isPaymentInFlight

  const canSign = step === 'awaiting-signature' && Boolean(onSign)
  const canRetry = step === 'failed' && Boolean(onRetry)

  const primaryAction = canPayAndStart
    ? {
        label: paymentAmountEth ? `Pay + Start (${paymentAmountEth} ETH)` : 'Pay + Start',
        action: onPayAndStart,
        disabled: false,
      }
    : canSign
      ? {
          label: isSignSubmitting ? 'Submitting signature...' : 'Sign to finish',
          action: onSign,
          disabled: isSignSubmitting,
        }
      : canRetry
        ? {
            label: 'Retry this step',
            action: onRetry,
            disabled: false,
          }
        : {
            label:
              step === 'completed'
                ? 'Completed'
                : isPaymentInFlight
                  ? 'Confirming payment...'
                  : 'In progress',
            action: undefined,
            disabled: true,
          }

  return (
    <section className="border-primary/30 bg-card/80 relative overflow-hidden rounded-3xl border p-7 shadow-sm backdrop-blur-sm md:p-8">
      <div className="bg-primary/8 pointer-events-none absolute inset-x-0 top-0 h-24" />

      <header className="relative mb-7 space-y-2.5">
        <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
          Company Launch
        </p>
        <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          Three steps. About two minutes.
        </h2>
        <p
          className="text-muted-foreground text-sm md:text-base"
          aria-live="polite"
          role="status"
        >
          {activeDescription}
        </p>
      </header>

      <ol className="relative space-y-4">
        {phases.map((phase) => {
          const isActive = phase.state === 'running'
          const isFailed = phase.state === 'failed'

          return (
            <li
              key={phase.id}
              className="border-border/70 bg-background/80 rounded-2xl border px-5 py-4 transition-all duration-300 ease-out motion-reduce:transition-none"
              aria-live={isActive ? 'polite' : undefined}
            >
              <div className="flex items-start gap-3">
                <StateIcon state={phase.state} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                    <p className="text-foreground text-base font-semibold">{phase.label}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${
                        isFailed
                          ? 'bg-destructive/15 text-destructive'
                          : isActive
                            ? 'bg-primary/15 text-primary'
                            : phase.state === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {statusLabel[phase.state]}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm md:text-base">{phase.message}</p>
                  {phase.error && (
                    <p className="text-destructive mt-2 break-words text-sm font-medium md:text-base">
                      {phase.error}
                    </p>
                  )}
                  <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ease-out motion-reduce:transition-none ${
                        isFailed ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${rowProgress[phase.state]}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {permissionDenied && step === 'awaiting-payment' && (
        <p className="text-destructive mt-4 text-sm font-medium">
          Connect your wallet to continue with payment.
        </p>
      )}

      <div className="border-border/70 mt-7 flex flex-wrap gap-3 border-t pt-5">
        <button
          type="button"
          onClick={primaryAction.action}
          disabled={primaryAction.disabled}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
        >
          {step === 'failed' ? <RotateCcw className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          {primaryAction.label}
        </button>

        {step === 'awaiting-payment' && onBackToEdit && (
          <button
            type="button"
            onClick={onBackToEdit}
            className="border-border text-foreground hover:bg-muted focus-visible:ring-ring rounded-full border px-5 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
          >
            Back to edit founders
          </button>
        )}
      </div>

      <details className="border-border/70 mt-4 rounded-2xl border p-3 text-sm">
        <summary className="text-foreground cursor-pointer font-medium">
          View details
        </summary>
        <p className="text-muted-foreground mt-2">
          We run ENS registration, Safe creation, and StartupChain recording in order.
          If anything fails, only that phase needs a retry.
        </p>
      </details>
    </section>
  )
}
