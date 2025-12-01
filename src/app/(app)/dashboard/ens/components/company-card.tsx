import { BadgeCheck, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'

import { shortenAddress } from '@/lib/utils'

interface Founder {
  wallet: string
}

interface Company {
  ensName: string
  ownerAddress: `0x${string}`
  creationDate?: Date
  founders: Founder[]
}

interface CompanyCardProps {
  company: Company | null
  ensAppBase: string
  explorerBase: string
  latestEventTxHash?: string
}

function formatDate(value?: Date) {
  if (!value) return 'Pending'
  return value.toLocaleString()
}

export function CompanyCard({
  company,
  ensAppBase,
  explorerBase,
  latestEventTxHash,
}: CompanyCardProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Current company</p>
          <h2 className="text-foreground text-xl font-semibold">
            {company?.ensName ?? 'No ENS name registered'}
          </h2>
        </div>
        {company ? (
          <BadgeCheck className="text-primary h-6 w-6" />
        ) : (
          <Info className="text-muted-foreground h-6 w-6" />
        )}
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
          </div>
          <div className="bg-muted/40 border-border/70 flex flex-wrap gap-2 rounded-xl border p-4 sm:col-span-2">
            <Link
              href={`${ensAppBase}/${company.ensName}`}
              className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition"
            >
              Open in ENS App
              <ExternalLink className="h-3 w-3" />
            </Link>
            {latestEventTxHash && (
              <a
                href={`${explorerBase}/tx/${latestEventTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition"
              >
                View tx on explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
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
