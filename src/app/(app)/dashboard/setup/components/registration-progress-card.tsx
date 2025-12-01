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
  'registering-company': 'Recording company on-chain...',
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
  'registering-company': 85,
  completed: 100,
  failed: 0,
}

interface RegistrationProgressCardProps {
  step: string
  countdown: number | null
  paymentTxHash?: string | null
}

export function RegistrationProgressCard({
  step,
  countdown,
  paymentTxHash,
}: RegistrationProgressCardProps) {
  const label =
    step === 'waiting'
      ? `Waiting for commitment window (${countdown ?? 0}s remaining)`
      : stepLabels[step] || step

  return (
    <div className="border-primary/20 bg-primary/5 rounded-2xl border p-6">
      <div className="mb-3 flex items-center gap-3">
        {step !== 'completed' && step !== 'failed' && (
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        )}
        <span className="font-medium">{label}</span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${stepProgress[step] ?? 0}%` }}
        />
      </div>
      {step === 'payment-pending' && paymentTxHash && (
        <p className="text-muted-foreground mt-3 font-mono text-xs">
          Tx: {paymentTxHash.slice(0, 10)}...{paymentTxHash.slice(-8)}
        </p>
      )}
    </div>
  )
}
