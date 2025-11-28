import { ArrowDownLeft, ArrowUpRight, Link2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MockBadge } from './mock-badge'

type Transaction = {
  id: string
  title: string
  subtitle: string
  amount: string
  token: string
  direction: 'in' | 'out'
  timestamp: string
}

type TreasurySummaryProps = {
  data: {
    totalBalance: string
    transactions: Transaction[]
  }
}

export function TreasurySummary({ data }: TreasurySummaryProps) {
  return (
    <section className="bg-card border-border shadow-sm rounded-2xl border p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Treasury Summary</p>
          <h3 className="text-foreground text-lg font-semibold">
            Overview of your assets
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <MockBadge />
          <Button variant="link" size="sm" className="px-0 text-sm font-semibold">
            View All
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-muted-foreground text-xs">Total Balance</p>
        <p className="text-foreground text-4xl font-bold leading-tight">
          {data.totalBalance}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-muted-foreground text-sm">Recent Transactions</p>
        {data.transactions.map((tx) => {
          const isOutgoing = tx.direction === 'out'
          const DirectionIcon = isOutgoing ? ArrowUpRight : ArrowDownLeft
          const amountPrefix = isOutgoing ? '-' : '+'

          return (
            <div
              key={tx.id}
              className="bg-muted/40 border-border/80 flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`${
                    isOutgoing ? 'text-destructive' : 'text-primary'
                  } flex h-8 w-8 items-center justify-center rounded-full bg-background/80`}
                >
                  <DirectionIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {tx.title}
                  </p>
                  <p className="text-muted-foreground text-xs">{tx.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-foreground font-mono text-sm">
                  {amountPrefix}
                  {tx.amount} {tx.token}
                </p>
                <p className="text-muted-foreground text-xs">{tx.timestamp}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
