'use client'

import { Info, Loader2 } from 'lucide-react'

import { type CostBreakdown } from '@/hooks/use-company-registration'

interface CostBreakdownCardProps {
  costs: CostBreakdown | null
  isLoading: boolean
}

export function CostBreakdownCard({ costs, isLoading }: CostBreakdownCardProps) {
  if (isLoading) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">
            Calculating costs...
          </span>
        </div>
      </div>
    )
  }

  if (!costs) return null

  const formatCost = (val: string) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00000' : num.toFixed(5)
  }

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Info className="h-4 w-4" />
        Registration Cost
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            ENS Registration (1 year)
          </span>
          <span className="font-mono">
            {formatCost(costs.ensRegistrationCostEth)} ETH
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Safe Wallet Deployment</span>
          <span className="font-mono">
            ~{formatCost(costs.safeDeploymentCostEth)} ETH
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Service Fee (25%)</span>
          <span className="font-mono">
            {formatCost(costs.serviceFeeEth)} ETH
          </span>
        </div>
        <div className="border-border mt-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-primary font-mono text-base font-bold">
              {formatCost(costs.totalEth)} ETH
            </span>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        You will pay this amount from your connected wallet. The service fee
        helps maintain and improve StartupChain.
      </p>
    </div>
  )
}
