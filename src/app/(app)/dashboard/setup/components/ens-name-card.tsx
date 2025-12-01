'use client'

interface EnsNameCardProps {
  ensName: string
}

export function EnsNameCard({ ensName }: EnsNameCardProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex items-center gap-3">
        <div className="from-secondary to-primary flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br">
          <div className="text-xl font-bold text-white">
            {ensName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <p className="text-foreground text-xl font-semibold">{ensName}.eth</p>
          <p className="text-muted-foreground text-sm">
            Your ENS business name
          </p>
        </div>
      </div>
    </div>
  )
}
