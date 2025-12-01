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
    <div className="border-primary/20 bg-primary/5 space-y-4 rounded-2xl border p-6">
      <h3 className="text-lg font-semibold">Confirm Payment</h3>
      <p className="text-muted-foreground text-sm">
        Send {costBreakdown.totalEth} ETH to the StartupChain treasury to
        begin registration. This covers ENS registration, Safe deployment,
        and service fees.
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
        className="bg-primary text-background hover:bg-primary/90 w-full rounded-2xl px-8 py-4 text-lg font-semibold transition-all duration-200 disabled:opacity-50"
      >
        {isPaymentInProgress ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {isSendingPayment
              ? 'Confirm in wallet...'
              : 'Confirming payment...'}
          </span>
        ) : (
          `Pay ${costBreakdown.totalEth} ETH`
        )}
      </button>
    </div>
  )
}
