import { Wallet } from 'lucide-react'

interface TokenBalance {
  tokenAddress: string | null
  balance: string
  token?: {
    name?: string
    symbol?: string
    decimals?: number
    logoUri?: string
  } | null
}

interface SafeTokenBalancesProps {
  tokenBalances: TokenBalance[]
}

export function SafeTokenBalances({ tokenBalances }: SafeTokenBalancesProps) {
  if (tokenBalances.length === 0) return null

  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Wallet className="text-primary h-5 w-5" />
        <h3 className="text-foreground text-lg font-semibold">Token Balances</h3>
      </div>
      <div className="mt-4 space-y-2">
        {tokenBalances.map((token, index) => (
          <div
            key={token.tokenAddress ?? index}
            className="bg-muted/40 border-border/70 flex items-center justify-between rounded-xl border p-4"
          >
            <div className="flex items-center gap-3">
              {token.token?.logoUri && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={token.token.logoUri}
                  alt={token.token.symbol}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div>
                <p className="text-foreground text-sm font-medium">
                  {token.token?.name ?? 'Unknown Token'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {token.token?.symbol ?? '???'}
                </p>
              </div>
            </div>
            <p className="text-foreground font-mono text-sm">
              {(
                Number(token.balance) / 10 ** (token.token?.decimals ?? 18)
              ).toFixed(4)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
