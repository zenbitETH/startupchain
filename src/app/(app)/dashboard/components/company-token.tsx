import { ExternalLink, MessageCircle, Wallet2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'

import { MockBadge } from './mock-badge'

type CompanyTokenProps = {
  data: {
    name: string
    symbol: string
    totalSupply: string
    contract: string
  }
}

export function CompanyToken({ data }: CompanyTokenProps) {
  return (
    <section className="bg-card border-border flex h-full flex-col rounded-2xl border p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-lg font-semibold">
            Company Token
          </h3>
          <p className="text-muted-foreground text-sm">
            Ownership and incentives
          </p>
        </div>
        <MockBadge />
      </div>

      <div className="mt-6 space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Token</span>
          <span className="text-foreground font-semibold">
            {data.name} ({data.symbol})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total Supply</span>
          <span className="text-foreground font-mono font-semibold">
            {data.totalSupply}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Contract</span>
          <button className="text-primary inline-flex items-center gap-2 text-sm font-semibold">
            <Wallet2 className="h-4 w-4" />
            {shortenAddress(data.contract)}
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button className="w-full">Manage Token</Button>
      </div>
    </section>
  )
}
