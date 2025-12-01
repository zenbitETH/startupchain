import { ArrowUpRight, Clock } from 'lucide-react'

import { shortenAddress } from '@/lib/utils'

interface PendingTransaction {
  safeTxHash: string
  to: string
  value: string
  nonce: number
  confirmations: unknown[]
  confirmationsRequired: number
  submissionDate: string | null
}

interface SafePendingTransactionsProps {
  transactions: PendingTransaction[]
  safeWalletUrl: string
  formatEth: (weiString: string) => string
  formatDate: (dateString: string | null) => string
}

export function SafePendingTransactions({
  transactions,
  safeWalletUrl,
  formatEth,
  formatDate,
}: SafePendingTransactionsProps) {
  if (transactions.length === 0) return null

  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="text-primary h-5 w-5" />
          <h3 className="text-foreground text-lg font-semibold">
            Pending Transactions
          </h3>
        </div>
        <a
          href={safeWalletUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Sign in Safe{'{Wallet}'} <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      <div className="mt-4 space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.safeTxHash}
            className="bg-muted/40 border-border/70 rounded-xl border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-foreground text-sm font-medium">
                  Transfer to {shortenAddress(tx.to as `0x${string}`)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatEth(tx.value)} ETH • Nonce #{tx.nonce}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600">
                  {tx.confirmations.length}/{tx.confirmationsRequired} signed
                </span>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDate(tx.submissionDate)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
