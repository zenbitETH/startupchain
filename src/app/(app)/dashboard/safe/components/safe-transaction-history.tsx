import { ArrowUpRight, BadgeCheck, ExternalLink, Info } from 'lucide-react'

import { shortenAddress } from '@/lib/utils'

interface Transaction {
  safeTxHash?: string
  txHash?: string
  to: string
  value: string
  txType?: string
  isSuccessful?: boolean
  executionDate?: string | null
  submissionDate?: string | null
}

interface SafeTransactionHistoryProps {
  transactions: Transaction[]
  safeWalletUrl: string
  explorerBase: string
  formatEth: (weiString: string) => string
  formatDate: (dateString: string | null) => string
}

export function SafeTransactionHistory({
  transactions,
  safeWalletUrl,
  explorerBase,
  formatEth,
  formatDate,
}: SafeTransactionHistoryProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BadgeCheck className="text-primary h-5 w-5" />
          <h3 className="text-foreground text-lg font-semibold">
            Recent Transactions
          </h3>
        </div>
        <a
          href={safeWalletUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          View all <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      {transactions.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No transactions yet. Fund your Safe to get started.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {transactions.map((tx, idx) => (
            <div
              key={tx.safeTxHash ?? tx.txHash ?? idx}
              className="bg-muted/40 border-border/70 flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    tx.isSuccessful === false
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {tx.isSuccessful === false ? (
                    <Info className="h-4 w-4" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {tx.txType === 'ETHEREUM_TRANSACTION'
                      ? 'Incoming transfer'
                      : `To ${shortenAddress(tx.to as `0x${string}`)}`}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatEth(tx.value)} ETH
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">
                  {formatDate(tx.executionDate ?? tx.submissionDate ?? null)}
                </p>
                {(tx.txHash || tx.safeTxHash) && (
                  <a
                    href={`${explorerBase}/tx/${tx.txHash ?? tx.safeTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
