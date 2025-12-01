import { ExternalLink, Users } from 'lucide-react'

import { shortenAddress } from '@/lib/utils'

interface SafeOwnersCardProps {
  owners: string[]
  explorerBase: string
}

export function SafeOwnersCard({ owners, explorerBase }: SafeOwnersCardProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="text-primary h-5 w-5" />
          <h3 className="text-foreground text-lg font-semibold">Safe Owners</h3>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
          {owners.length} owner(s)
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {owners.map((owner, index) => (
          <div
            key={owner}
            className="bg-muted/40 border-border/70 flex items-center justify-between rounded-xl border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                {index + 1}
              </div>
              <span className="font-mono text-sm">
                {shortenAddress(owner as `0x${string}`)}
              </span>
            </div>
            <a
              href={`${explorerBase}/address/${owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
