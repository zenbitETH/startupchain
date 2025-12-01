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
      <div className="border-border bg-card rounded-2xl border p-6">
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

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Info className="h-5 w-5" />
        Registration Cost
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            ENS Registration (1 year)
          </span>
          <span className="font-mono">{costs.ensRegistrationCostEth} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Safe Wallet Deployment</span>
          <span className="font-mono">~{costs.safeDeploymentCostEth} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Service Fee (25%)
            <span className="ml-1 text-xs opacity-70">
              — supports StartupChain development
            </span>
          </span>
          <span className="font-mono">{costs.serviceFeeEth} ETH</span>
        </div>
        <div className="border-border border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-primary font-mono text-lg font-bold">
              {costs.totalEth} ETH
            </span>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        You will pay this amount from your connected wallet. The service fee
        helps maintain and improve StartupChain.
      </p>
    </div>
  )
}
