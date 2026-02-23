'use client'

import { Loader2 } from 'lucide-react'

import { type CostBreakdown } from '@/hooks/use-company-registration'

interface PaymentStepProps {
  costBreakdown: CostBreakdown
  treasuryAddress: string | null
  isSendingPayment: boolean
  isConfirmingPayment: boolean
  onSendPayment: () => void
}

export function PaymentStep({
  costBreakdown,
  treasuryAddress,
  isSendingPayment,
  isConfirmingPayment,
  onSendPayment,
}: PaymentStepProps) {
  const isPaymentInProgress = isSendingPayment || isConfirmingPayment

  return (
    <div className="border-primary/30 bg-card space-y-4 rounded-2xl border p-5">
      <h3 className="text-base font-semibold tracking-tight">Pay + Start</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        One payment starts the full launch flow. This covers ENS registration,
        Safe deployment, and service fee.
      </p>
      {treasuryAddress && (
        <p className="text-muted-foreground font-mono text-xs">
          Treasury: {treasuryAddress}
        </p>
      )}
      <button
        type="button"
        onClick={onSendPayment}
        disabled={isPaymentInProgress}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring w-full rounded-xl px-6 py-3 text-base font-semibold transition-all duration-200 disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-none"
      >
        {isPaymentInProgress ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isSendingPayment
              ? 'Confirm in wallet...'
              : 'Confirming payment...'}
          </span>
        ) : (
          `Pay ${parseFloat(costBreakdown.totalEth).toFixed(5)} ETH`
        )}
      </button>
    </div>
  )
}
