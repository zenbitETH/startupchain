'use client'

import { Loader2 } from 'lucide-react'

const stepLabels: Record<string, string> = {
  checking: 'Checking availability...',
  'awaiting-payment': 'Waiting for payment...',
  'payment-pending': 'Confirming payment...',
  committing: 'Submitting commitment transaction...',
  waiting: 'Waiting for commitment window',
  'deploying-safe': 'Creating your Safe wallet...',
  'registering-ens': 'Registering ENS name to your Safe...',
  'awaiting-signature': 'Sign to record your company on-chain...',
  'signing-company': 'Confirming your transaction...',
  completed: 'Registration complete!',
  failed: 'Registration failed',
}

const stepProgress: Record<string, number> = {
  idle: 0,
  checking: 5,
  'awaiting-payment': 10,
  'payment-pending': 15,
  committing: 25,
  waiting: 40,
  'deploying-safe': 55,
  'registering-ens': 70,
  'awaiting-signature': 85,
  'signing-company': 92,
  completed: 100,
  failed: 0,
}

interface RegistrationProgressCardProps {
  step: string
  countdown: number | null
  paymentTxHash?: string | null
  onSign?: () => void
}

export function RegistrationProgressCard({
  step,
  countdown,
  paymentTxHash,
  onSign,
}: RegistrationProgressCardProps) {
  const label =
    step === 'waiting'
      ? `Waiting for commitment window (${countdown ?? 0}s remaining)`
      : stepLabels[step] || step

  return (
    <div className="border-primary/20 bg-primary/5 rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-3">
        {step !== 'completed' && step !== 'failed' && (
          <Loader2 className="text-primary h-4 w-4 animate-spin" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${stepProgress[step] ?? 0}%` }}
        />
      </div>
      {step === 'payment-pending' && paymentTxHash && (
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Tx: {paymentTxHash.slice(0, 10)}...{paymentTxHash.slice(-8)}
        </p>
      )}

      {step === 'awaiting-signature' && onSign && (
        <div className="mt-4">
          <button
            onClick={onSign}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Sign Transaction
          </button>
          <p className="text-muted-foreground mt-2 text-xs">
            Please sign the transaction in your wallet to record your company.
          </p>
        </div>
      )}
    </div>
  )
}
