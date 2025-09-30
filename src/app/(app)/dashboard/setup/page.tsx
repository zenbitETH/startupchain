import Link from 'next/link'
import { Suspense } from 'react'

import { SetupWizard } from './components/setup-wizzard'

interface SetupPageProps {
  searchParams: {
    ensName?: string
  }
}

function SetupPageContent({ ensName }: { ensName: string }) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-10">
      <div>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Company Setup
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Finalize ownership details and deploy your business account.
        </p>
      </div>

      <SetupWizard initialEnsName={ensName} />
    </div>
  )
}

export default function SetupPage({ searchParams }: SetupPageProps) {
  const normalizedEnsName = searchParams.ensName?.trim().toLowerCase()

  if (!normalizedEnsName) {
    return (
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
            Go back to start
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground py-20 text-center">
          Loading setup…
        </div>
      }
    >
      <SetupPageContent ensName={normalizedEnsName} />
    </Suspense>
  )
}
