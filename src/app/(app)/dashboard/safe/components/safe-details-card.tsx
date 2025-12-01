import { Info } from 'lucide-react'

interface SafeDetailsCardProps {
  safeAddress: string
  version: string
  nonce: number
  companyEnsName?: string | null
}

export function SafeDetailsCard({
  safeAddress,
  version,
  nonce,
  companyEnsName,
}: SafeDetailsCardProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Info className="text-primary h-5 w-5" />
        <h3 className="text-foreground text-lg font-semibold">Safe Details</h3>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Address</p>
          <p className="font-mono text-sm break-all">{safeAddress}</p>
        </div>
        <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Version</p>
          <p className="text-sm">{version}</p>
        </div>
        <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Nonce</p>
          <p className="text-sm">{nonce}</p>
        </div>
        <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Company ENS</p>
          <p className="text-sm">{companyEnsName ?? 'N/A'}</p>
        </div>
      </div>
    </section>
  )
}
