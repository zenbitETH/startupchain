import { Clock, Shield, Wallet } from 'lucide-react'

interface SafeOverviewCardsProps {
  ethBalanceFormatted: string
  tokenCount: number
  threshold: number
  ownerCount: number
  pendingTxCount: number
}

export function SafeOverviewCards({
  ethBalanceFormatted,
  tokenCount,
  threshold,
  ownerCount,
  pendingTxCount,
}: SafeOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Balance Card */}
      <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Wallet className="text-primary h-5 w-5" />
          <p className="text-muted-foreground text-sm">Total Balance</p>
        </div>
        <p className="text-foreground mt-2 text-3xl font-bold">
          {ethBalanceFormatted} ETH
        </p>
        {tokenCount > 0 && (
          <p className="text-muted-foreground mt-1 text-xs">
            + {tokenCount} token(s)
          </p>
        )}
      </section>

      {/* Threshold Card */}
      <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="text-primary h-5 w-5" />
          <p className="text-muted-foreground text-sm">Threshold</p>
        </div>
        <p className="text-foreground mt-2 text-3xl font-bold">
          {threshold} of {ownerCount}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">signatures required</p>
      </section>

      {/* Pending Txs Card */}
      <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="text-primary h-5 w-5" />
          <p className="text-muted-foreground text-sm">Pending</p>
        </div>
        <p className="text-foreground mt-2 text-3xl font-bold">{pendingTxCount}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          transactions awaiting signatures
        </p>
      </section>
    </div>
  )
}
