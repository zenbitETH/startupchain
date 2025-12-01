'use client'

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  PauseCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  finalizeEnsRegistrationAction,
  type EnsRegistrationRecord,
} from '../setup/actions'
import { type PendingStatus } from '@/lib/auth/pending-registration'

type Props = {
  ensName: string
  readyAt: number
  commitTxHash: `0x${string}`
  status: PendingStatus
  registrationTxHash?: `0x${string}`
  companyTxHash?: `0x${string}`
  explorerBase?: string
}

const STATUS_ORDER: PendingStatus[] = [
  'committing',
  'waiting',
  'registering',
  'creating',
  'completed',
  'failed',
]

function formatHash(hash?: string) {
  if (!hash) return 'Pending'
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`
}

export function RegistrationProgress({
  ensName,
  readyAt,
  commitTxHash,
  status: initialStatus,
  registrationTxHash,
  companyTxHash,
  explorerBase,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<PendingStatus>(initialStatus)
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.ceil((readyAt - Date.now()) / 1000))
  )
  const [hashes, setHashes] = useState({
    registrationTxHash,
    companyTxHash,
  })
  const [error, setError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false)
  const hasTriggered = useRef(false)

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  useEffect(() => {
    setHashes({
      registrationTxHash,
      companyTxHash,
    })
  }, [companyTxHash, registrationTxHash])

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((readyAt - Date.now()) / 1000)))
    }, 1000)
    return () => window.clearInterval(id)
  }, [readyAt])

  const progressIndex = useMemo(() => {
    const idx = STATUS_ORDER.indexOf(status)
    return idx === -1 ? 1 : idx
  }, [status])

  const triggerFinalize = useCallback(() => {
    if (hasTriggered.current || isPending) return
    hasTriggered.current = true
    setIsPending(true)
    setError(undefined)

    finalizeEnsRegistrationAction({ ensName })
      .then((result: EnsRegistrationRecord) => {
        setStatus(result.status)
        setHashes({
          registrationTxHash: result.registrationTxHash,
          companyTxHash: result.companyTxHash,
        })
        router.refresh()
      })
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to finalize ENS registration'
        setStatus('failed')
        setError(message)
        hasTriggered.current = false
      })
      .finally(() => {
        setIsPending(false)
      })
  }, [ensName, router, isPending])

  useEffect(() => {
    if (status === 'waiting' && remaining === 0) {
      triggerFinalize()
    }
  }, [remaining, status, triggerFinalize])

  const stepState = (stepIndex: number) => {
    if (status === 'failed') return 'failed'
    if (progressIndex > stepIndex) return 'done'
    if (progressIndex === stepIndex) return 'active'
    return 'pending'
  }

  const steps = [
    { title: 'Commitment sent', description: 'Commit tx confirmed' },
    { title: 'Waiting for ENS', description: '60s commitment window' },
    { title: 'Registering name', description: 'Sending register tx' },
    { title: 'Creating company', description: 'Writing to StartupChain' },
  ]

  const canFinalizeNow =
    (status === 'waiting' || status === 'failed') && remaining === 0 && !isPending

  return (
    <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">ENS</p>
          <p className="text-foreground text-lg font-semibold">{ensName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {status === 'completed'
              ? 'Completed'
              : status === 'failed'
                ? 'Failed'
                : status === 'creating'
                  ? 'Creating'
                  : status === 'registering'
                    ? 'Registering'
                    : 'Waiting'}
          </span>
          {status === 'completed' ? (
            <CheckCircle2 className="text-primary h-5 w-5" />
          ) : status === 'failed' ? (
            <AlertTriangle className="text-destructive h-5 w-5" />
          ) : (
            <Clock className="text-primary h-5 w-5" />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="bg-muted/60 rounded-full px-3 py-1 font-semibold text-foreground">
          {remaining > 0 ? `Ready in ${remaining}s` : 'Ready to finalize'}
        </span>
        <span className="font-mono text-xs">Commit tx {formatHash(commitTxHash)}</span>
        {hashes.registrationTxHash && (
          <span className="font-mono text-xs">
            Register tx {formatHash(hashes.registrationTxHash)}
          </span>
        )}
        {hashes.companyTxHash && (
          <span className="font-mono text-xs">
            Company tx {formatHash(hashes.companyTxHash)}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {steps.map((step, idx) => {
          const state = stepState(idx)
          const isActive = state === 'active'
          const isDone = state === 'done'
          const isFailed = state === 'failed'

          return (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3"
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="text-primary h-5 w-5" />
                ) : isActive ? (
                  <Loader2 className="text-primary h-5 w-5 animate-spin" />
                ) : isFailed ? (
                  <AlertTriangle className="text-destructive h-5 w-5" />
                ) : (
                  <PauseCircle className="text-muted-foreground h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">{step.title}</p>
                <p className="text-muted-foreground text-xs">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 border-destructive/40 mt-4 rounded-lg border px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={triggerFinalize}
          disabled={!canFinalizeNow}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalizing…
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              Finalize now
            </>
          )}
        </button>

        {explorerBase && (
          <Link
            href={`${explorerBase}/tx/${commitTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-semibold"
          >
            View commit on explorer
          </Link>
        )}
      </div>
    </div>
  )
}
