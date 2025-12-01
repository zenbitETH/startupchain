import { ExternalLink, Info, Shield } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'

interface SafeEmptyStateProps {
  type: 'no-safe' | 'not-indexed'
  safeAddress?: string
  explorerBase?: string
}

export function SafeEmptyState({
  type,
  safeAddress,
  explorerBase,
}: SafeEmptyStateProps) {
  if (type === 'no-safe') {
    return (
      <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
        <Shield className="text-muted-foreground mx-auto h-12 w-12" />
        <h2 className="text-foreground mt-4 text-xl font-semibold">
          No Safe Found
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md">
          Register your company first to deploy a Safe multisig wallet. Your
          Safe will be used to manage your company treasury.
        </p>
        <Link href="/dashboard/setup">
          <Button className="mt-6">Register Company</Button>
        </Link>
      </section>
    )
  }

  return (
    <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
      <Info className="text-muted-foreground mx-auto h-12 w-12" />
      <h2 className="text-foreground mt-4 text-xl font-semibold">
        Safe Not Indexed Yet
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md">
        Your Safe at{' '}
        <span className="font-mono text-sm">
          {shortenAddress(safeAddress as `0x${string}`)}
        </span>{' '}
        hasn&apos;t been indexed by the Safe Transaction Service yet. This
        usually takes a few minutes after deployment.
      </p>
      {explorerBase && safeAddress && (
        <a
          href={`${explorerBase}/address/${safeAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-4 inline-flex items-center gap-1 text-sm hover:underline"
        >
          View on Explorer <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </section>
  )
}
