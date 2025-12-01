'use client'

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  RotateCw,
} from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { finalizeEnsRegistrationAction } from '../setup/actions'
import { type PendingStatus } from '@/lib/auth/pending-registration'

type PendingRecord = {
  ensName: string
  owner: string
  commitTxHash: string
  registrationTxHash?: string
  companyTxHash?: string
  readyAt: number
  status: PendingStatus
  error?: string
}

const statusLabel: Record<PendingStatus, string> = {
  committing: 'Committing',
  waiting: 'Waiting',
  'deploying-safe': 'Deploying Safe',
  registering: 'Registering',
  creating: 'Creating',
  completed: 'Completed',
  failed: 'Failed',
}

export function PendingEnsCard({
  record,
  explorerBase,
}: {
  record: PendingRecord
  explorerBase: string
}) {
  const router = useRouter()
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.ceil((record.readyAt - Date.now()) / 1000))
  )
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const id = window.setInterval(() => {
      const newRemaining = Math.max(
        0,
        Math.ceil((record.readyAt - Date.now()) / 1000)
      )
      setRemaining(newRemaining)
      if (newRemaining <= 0) {
        window.clearInterval(id)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [record.readyAt])

  const canFinalize =
    (record.status === 'waiting' || record.status === 'failed') &&
    remaining === 0 &&
    !isPending

  const handleFinalize = () => {
    startTransition(async () => {
      await finalizeEnsRegistrationAction({ ensName: record.ensName })
      router.refresh()
    })
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {record.status === 'completed' ? (
            <CheckCircle className="text-primary h-5 w-5" aria-label="Completed" />
          ) : record.status === 'failed' ? (
            <AlertTriangle className="text-destructive h-5 w-5" aria-label="Failed" />
          ) : (
            <Clock className="text-primary h-5 w-5" aria-label="In progress" />
          )}
          <h3 className="text-foreground text-lg font-semibold">
            ENS registration in progress
          </h3>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {statusLabel[record.status]}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-muted/40 border-border/60 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">ENS</p>
          <p className="text-foreground font-medium">{record.ensName}</p>
        </div>
        <div className="bg-muted/40 border-border/60 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Safe owner</p>
          <p className="font-mono text-xs">{record.owner}</p>
        </div>
        <div className="bg-muted/40 border-border/60 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Commit tx</p>
          <a
            href={`${explorerBase}/tx/${record.commitTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            {record.commitTxHash.slice(0, 10)}… <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {record.registrationTxHash && (
          <div className="bg-muted/40 border-border/60 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Registration tx</p>
            <a
              href={`${explorerBase}/tx/${record.registrationTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            >
              {record.registrationTxHash.slice(0, 10)}…{' '}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {record.companyTxHash && (
          <div className="bg-muted/40 border-border/60 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Company tx</p>
            <a
              href={`${explorerBase}/tx/${record.companyTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            >
              {record.companyTxHash.slice(0, 10)}…{' '}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {(record.status === 'waiting' || record.status === 'failed') && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="bg-muted/60 text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
            {remaining > 0
              ? `Ready to register in ${remaining}s`
              : 'Ready to register'}
          </div>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={!canFinalize}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finalizing…
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4" />
                Finalize & link
              </>
            )}
          </button>
        </div>
      )}

      {record.status === 'registering' && (
        <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Registering ENS… waiting for receipt
        </p>
      )}

      {record.status === 'creating' && (
        <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating company… waiting for receipt
        </p>
      )}

      {record.status === 'completed' && (
        <p className="text-primary mt-4 text-sm font-semibold">
          Registration mined—your company will appear below once revalidated.
        </p>
      )}

      {record.status === 'failed' && record.error && (
        <div className="text-destructive bg-destructive/10 border-destructive/40 mt-4 rounded-lg border px-3 py-2 text-sm">
          {record.error}
        </div>
      )}
    </div>
  )
}
