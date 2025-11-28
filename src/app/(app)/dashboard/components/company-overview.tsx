import { BadgeCheck, Settings, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MockBadge } from './mock-badge'

type CompanyOverviewProps = {
  data: {
    name: string
    ensName: string
    safeAddress: string
  }
}

const shorten = (value: string) =>
  value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value

export function CompanyOverview({ data }: CompanyOverviewProps) {
  return (
    <section className="bg-card border-border shadow-sm rounded-2xl border p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Company Overview</p>
          <h2 className="text-foreground text-2xl font-semibold leading-tight">
            {data.name}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <MockBadge />
          <Button variant="outline" size="sm" className="rounded-full">
            <Settings className="h-4 w-4" />
            Manage Company
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="bg-muted/40 border-border/80 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">ENS Name</p>
          <div className="flex items-center gap-2 pt-2 text-sm font-semibold">
            <BadgeCheck className="text-primary h-4 w-4" />
            <span>{data.ensName}</span>
          </div>
        </div>

        <div className="bg-muted/40 border-border/80 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Primary Safe Wallet</p>
          <div className="flex items-center gap-2 pt-2 text-sm font-semibold">
            <Wallet className="text-primary h-4 w-4" />
            <span className="font-mono">{shorten(data.safeAddress)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
