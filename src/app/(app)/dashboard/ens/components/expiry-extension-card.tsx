import { ExternalLink } from 'lucide-react'

interface ExpiryExtensionCardProps {
  ensName: string
  ensAppBase: string
  safeWalletUrl?: string
}

export function ExpiryExtensionCard({
  ensName,
  ensAppBase,
  safeWalletUrl,
}: ExpiryExtensionCardProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <h3 className="text-foreground text-lg font-semibold">Expiry extension</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Renewal automation is deferred in this release. Extend manually from ENS app or Safe queue.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`${ensAppBase}/${ensName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none"
        >
          Open ENS app
          <ExternalLink className="h-3 w-3" />
        </a>
        {safeWalletUrl && (
          <a
            href={safeWalletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none"
          >
            Open Safe Wallet
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </section>
  )
}
