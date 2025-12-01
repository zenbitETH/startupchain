'use client'

interface EnsNameCardProps {
  ensName: string
}

export function EnsNameCard({ ensName }: EnsNameCardProps) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className="from-secondary to-primary flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br">
          <div className="text-lg font-bold text-white">
            {ensName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <p className="text-foreground text-lg font-semibold">{ensName}.eth</p>
          <p className="text-muted-foreground text-xs">
            Your ENS business name
          </p>
        </div>
      </div>
    </div>
  )
}
