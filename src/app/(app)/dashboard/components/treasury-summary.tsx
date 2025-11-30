import { ArrowDownLeft, ArrowUpRight, ExternalLink, Wallet } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export type Transaction = {
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
    safeWalletUrl?: string
    isLive?: boolean
  }
}

export function TreasurySummary({ data }: TreasurySummaryProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="text-primary h-5 w-5" />
          <div>
            <p className="text-muted-foreground text-sm">Treasury Summary</p>
            <h3 className="text-foreground text-lg font-semibold">
              Overview of your assets
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/safe"
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-semibold transition"
          >
            View All
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-muted-foreground text-xs">Total Balance</p>
        <p className="text-foreground text-4xl leading-tight font-bold">
          {data.totalBalance}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-muted-foreground text-sm">Recent Transactions</p>
        {data.transactions.length === 0 ? (
          <div className="bg-muted/40 border-border/80 rounded-xl border border-dashed p-4 text-center">
            <p className="text-muted-foreground text-sm">
              No transactions yet.{' '}
              {data.safeWalletUrl ? (
                <a
                  href={data.safeWalletUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Fund your Safe
                </a>
              ) : (
                'Fund your Safe to get started.'
              )}
            </p>
          </div>
        ) : (
          data.transactions.map((tx) => {
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
                    className={cn(
                      'bg-background/80 flex h-8 w-8 items-center justify-center rounded-full',
                      isOutgoing ? 'text-destructive' : 'text-primary'
                    )}
                  >
                    <DirectionIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      {tx.title}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {tx.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-mono text-sm">
                    {amountPrefix}
                    {tx.amount} {tx.token}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {tx.timestamp}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
