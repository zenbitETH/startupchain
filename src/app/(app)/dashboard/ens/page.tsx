import {
  ArrowRight,
  BadgeCheck,
  Clock,
  ExternalLink,
  Info,
  ListChecks,
} from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'
import { getServerSession } from '@/lib/auth/server-session'
import { getCompanyByAddress } from '@/lib/blockchain/get-company'
import { getCompanyEvents } from '@/lib/blockchain/get-company-events'
import { STARTUPCHAIN_CHAIN_ID } from '@/lib/blockchain/startupchain-config'

const explorerBase =
  STARTUPCHAIN_CHAIN_ID === 1
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io'
const ensAppBase =
  STARTUPCHAIN_CHAIN_ID === 1
    ? 'https://app.ens.domains/name'
    : 'https://sepolia.app.ens.domains/name'

function formatDate(value?: Date) {
  if (!value) return 'Pending'
  return value.toLocaleString()
}

export default async function EnsDashboardPage() {
  const cookieStore = await cookies()
  const session = await getServerSession({ cookies: cookieStore })
  const walletAddress = session?.walletAddress

  const company = walletAddress
    ? await getCompanyByAddress(walletAddress)
    : null
  const events = walletAddress ? await getCompanyEvents(walletAddress) : []

  const latestEvent = events[0]

  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="ENS Company Names" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-foreground text-3xl leading-tight font-bold">
              ENS Company Names
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              View your registered company name, on-chain logs, and quick links
              to the explorer and ENS app.
            </p>
          </div>
          <Link
            href="/dashboard/setup"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            Register new name
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
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
                  <p className="font-mono text-sm">{company.ownerAddress}</p>
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
                  {latestEvent?.transactionHash && (
                    <a
                      href={`${explorerBase}/tx/${latestEvent.transactionHash}`}
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
                  Start from the setup flow to register your company ENS name
                  and we&apos;ll surface the on-chain events here.
                </p>
              </div>
            )}
          </section>

          <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ListChecks className="text-primary h-5 w-5" />
              <h3 className="text-foreground text-lg font-semibold">
                Registration status
              </h3>
            </div>
            {latestEvent ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ENS</span>
                  <span className="font-semibold">{latestEvent.ensName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Block</span>
                  <span className="font-mono">
                    {latestEvent.blockNumber.toString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Registered</span>
                  <span>{formatDate(latestEvent.createdAt)}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                No registration logs yet. Complete a registration to see history
                here.
              </p>
            )}
          </section>
        </div>

        <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-lg font-semibold">
              Registration history
            </h3>
          </div>

          {events.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              No on-chain registration events found for this wallet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div
                  key={event.transactionHash}
                  className="border-border bg-muted/40 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="text-primary h-4 w-4" />
                      <div>
                        <p className="text-sm font-semibold">
                          {event.ensName}.eth
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Company #{event.companyId}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
                    <span className="bg-background border-border rounded-full border px-3 py-1">
                      Block {event.blockNumber.toString()}
                    </span>
                    <a
                      href={`${explorerBase}/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-1 transition"
                    >
                      Tx {event.transactionHash.slice(0, 10)}…
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-muted-foreground">
                      Threshold: {event.threshold}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
