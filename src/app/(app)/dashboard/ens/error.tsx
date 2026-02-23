'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function EnsDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('ENS dashboard error boundary', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold">Couldn&apos;t load ENS dashboard</h2>
      <p className="text-muted-foreground text-sm">
        Please retry. If this keeps happening, check network and Safe API availability.
      </p>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </div>
  )
}
