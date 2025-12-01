import Link from 'next/link'
import { Suspense } from 'react'

import { DashboardHeader } from '../components/dashboard-header'
import { SetupWizard } from './components/setup-wizard'

type SetupPageProps = {
  searchParams: Promise<{
    ensName?: string
  }>
}

function SetupPageContent({ ensName }: { ensName: string }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="md:hidden">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Company Setup
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Finalize ownership details and deploy your business account.
        </p>
      </div>

      <SetupWizard initialEnsName={ensName} />
    </div>
  )
}

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const params = await searchParams
  const normalizedEnsName = params.ensName?.trim().toLowerCase()

  if (!normalizedEnsName) {
    return (
      <div className="bg-background text-foreground">
        <DashboardHeader title="Company Setup" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 md:px-6">
          <div className="mx-auto max-w-2xl py-20 text-center">
            <h1 className="text-foreground text-2xl font-semibold">
              ENS name required
            </h1>
            <p className="text-muted-foreground mt-2">
              Start from the ENS checker to select a name before configuring your
              company.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition"
              >
                Check ENS Availability
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="Company Setup" />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 md:px-6">
        <Suspense
          fallback={
            <div className="text-muted-foreground py-20 text-center">
              Loading setup…
            </div>
          }
        >
          <SetupPageContent ensName={normalizedEnsName} />
        </Suspense>
      </div>
    </div>
  )
}
