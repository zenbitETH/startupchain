import { BadgeCheck, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'

import type { Company } from '@/lib/blockchain/get-company'
import { shortenAddress } from '@/lib/utils'

import { formatDate } from '../utils'

interface CompanyCardProps {
  company: Company | null
  ensAppBase: string
  explorerBase: string
  latestEventTxHash?: string
  foundersSlot?: React.ReactNode
  statusSlot?: React.ReactNode
}

export function CompanyCard({
  company,
  ensAppBase,
  explorerBase,
  latestEventTxHash,
  foundersSlot,
  statusSlot,
}: CompanyCardProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-5 shadow-sm md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Current company</p>
          <h2 className="from-primary via-accent to-secondary animate-gradient-x bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            {company?.ensName ?? 'No ENS name registered'}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {company && (
            <Link
              href={`${ensAppBase}/${company.ensName}`}
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-semibold transition-colors motion-reduce:transition-none"
            >
              ENS App
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          {latestEventTxHash && (
            <a
              href={`${explorerBase}/tx/${latestEventTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-semibold transition-colors motion-reduce:transition-none"
            >
              Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {company ? (
            <BadgeCheck className="text-primary h-6 w-6" />
          ) : (
            <Info className="text-muted-foreground h-6 w-6" />
          )}
        </div>
      </div>

      {company ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Owner</p>
            <p className="font-mono text-sm">
              {shortenAddress(company.ownerAddress)}
            </p>
          </div>
          <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Created</p>
            <p className="text-sm">{formatDate(company.creationDate)}</p>
          </div>
          <div className="bg-muted/40 border-border/70 rounded-xl border p-4 sm:col-span-2">
            {foundersSlot ?? (
              <>
                <p className="text-muted-foreground text-xs">Founders</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {company.founders.map((founder) => (
                    <span
                      key={founder.wallet}
                      className="bg-background border-border rounded-full border px-3 py-1 font-mono text-xs"
                    >
                      {founder.wallet}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          {statusSlot && (
            <div className="bg-muted/40 border-border/70 rounded-xl border p-4 sm:col-span-2">
              {statusSlot}
            </div>
          )}
        </div>
      ) : (
        <div className="border-border/60 text-muted-foreground mt-4 rounded-xl border border-dashed p-6 text-sm">
          <p className="text-foreground mb-3 font-medium">
            No company found for your wallet.
          </p>
          <p>
            Start from the setup flow to register your company ENS name and
            we&apos;ll surface the on-chain events here.
          </p>
        </div>
      )}
    </section>
  )
}
