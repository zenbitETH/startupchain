'use client'

import { ExternalLink, Loader2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSafeWallet } from '@/hooks/use-safe-wallet'
import {
  type SubdomainRecord,
  buildBatchCreateSubdomainsTransactions,
} from '@/lib/blockchain/ens-management'
import type { Founder } from '@/lib/blockchain/get-company'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import {
  isSafeProposeClientError,
  proposeBatchSafeTransactionFromWallet,
} from '@/lib/blockchain/safe-proposal-client'
import { shortenAddress } from '@/lib/utils'

type PendingBatchOperation = {
  labels: string[]
  safeTxHash: string
}

function buildSubdomainLookup(
  subdomains: SubdomainRecord[]
): Map<string, SubdomainRecord> {
  const map = new Map<string, SubdomainRecord>()
  for (const sub of subdomains) {
    if (sub.active) {
      map.set(sub.owner.toLowerCase(), sub)
    }
  }
  return map
}

export function CompanyCardFounders({
  companyId,
  ensName,
  chainId,
  safeAddress,
  startupChainAddress,
  founders,
  subdomains,
  subdomainsSupported,
}: {
  companyId: string
  ensName: string
  chainId: number
  safeAddress: `0x${string}`
  startupChainAddress: `0x${string}`
  founders: Founder[]
  subdomains: SubdomainRecord[]
  subdomainsSupported: boolean
}) {
  const router = useRouter()
  const { authenticated, ensureWalletReady } = useSafeWallet({ chainId })

  const subdomainByOwner = useMemo(
    () => buildSubdomainLookup(subdomains),
    [subdomains]
  )

  const [labels, setLabels] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const founder of founders) {
      const existing = subdomainByOwner.get(founder.wallet.toLowerCase())
      initial[founder.wallet] = existing?.name ?? ''
    }
    return initial
  })
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [safeApiUnavailable, setSafeApiUnavailable] = useState(false)
  const [pendingOps, setPendingOps] = useState<PendingBatchOperation[]>([])

  const hasPending = pendingOps.length > 0

  // Sync labels when subdomains are confirmed on-chain
  useEffect(() => {
    setLabels((current) => {
      let changed = false
      const next = { ...current }
      for (const founder of founders) {
        const existing = subdomainByOwner.get(founder.wallet.toLowerCase())
        if (existing && next[founder.wallet] !== existing.name) {
          next[founder.wallet] = existing.name
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [subdomainByOwner, founders])

  // Clear pending ops when subdomains appear on-chain
  useEffect(() => {
    if (!hasPending) return
    setPendingOps((current) =>
      current.filter((op) => {
        const allCreated = op.labels.every((label) =>
          subdomains.some((s) => s.active && s.name === label)
        )
        return !allCreated
      })
    )
  }, [subdomains, hasPending])

  useEffect(() => {
    if (!hasPending) return
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, 15_000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasPending, router])

  const filledEntries = useMemo(() => {
    const entries: { label: string; owner: string }[] = []
    for (const founder of founders) {
      const label = labels[founder.wallet]?.trim()
      const existing = subdomainByOwner.get(founder.wallet.toLowerCase())
      if (label && !existing) {
        entries.push({ label, owner: founder.wallet })
      }
    }
    return entries
  }, [founders, labels, subdomainByOwner])

  const isFormDisabled =
    !authenticated || isBusy || !subdomainsSupported || safeApiUnavailable

  const canSubmit = filledEntries.length > 0 && !isFormDisabled

  async function handleBatchCreate() {
    if (!canSubmit) return

    try {
      setIsBusy(true)
      setErrorMessage(null)

      const { walletAddress, provider } = await ensureWalletReady()
      const transactions = buildBatchCreateSubdomainsTransactions({
        startupChainAddress,
        companyId: BigInt(companyId),
        entries: filledEntries,
      })

      const { safeTxHash } = await proposeBatchSafeTransactionFromWallet({
        provider,
        chainId,
        safeAddress,
        senderAddress: walletAddress,
        transactions,
        origin: 'startupchain:subdomain:batch-create',
      })

      setSafeApiUnavailable(false)
      setPendingOps((current) => [
        ...current,
        {
          labels: filledEntries.map((e) => e.label),
          safeTxHash,
        },
      ])
      router.refresh()
    } catch (error) {
      if (
        isSafeProposeClientError(error) &&
        error.code === 'SAFE_API_KEY_MISSING'
      ) {
        setSafeApiUnavailable(true)
        setErrorMessage(
          'Safe proposal service is not configured. Add SAFE_API_KEY on server.'
        )
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Failed to propose batch subdomain creation'
        )
      }
    } finally {
      setIsBusy(false)
    }
  }

  if (founders.length === 0) return null

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">Founder subdomains</p>
        <a
          href={getSafeQueueUrl(chainId, safeAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-semibold transition-colors motion-reduce:transition-none"
        >
          Safe queue
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {!authenticated && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Wallet connection required to submit Safe proposals.</p>
        </div>
      )}

      {!subdomainsSupported && (
        <div className="mt-3 rounded-xl border border-dashed px-3 py-3 text-sm">
          <p className="font-medium">
            Subdomain actions unavailable on current deployment.
          </p>
          <p className="text-muted-foreground mt-1">
            This network contract does not expose subdomain methods yet.
          </p>
        </div>
      )}

      {safeApiUnavailable && (
        <div className="mt-3 rounded-xl border border-dashed px-3 py-3 text-sm">
          <p className="font-medium">
            Safe proposal service is not configured.
          </p>
          <p className="text-muted-foreground mt-1">
            Proposal actions are disabled until{' '}
            <code className="font-mono">SAFE_API_KEY</code> is configured on the
            server.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-3 rounded-xl border border-current/20 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {founders.map((founder) => {
          const existing = subdomainByOwner.get(founder.wallet.toLowerCase())
          const hasActiveSubdomain = Boolean(existing)
          const label = labels[founder.wallet] ?? ''

          return (
            <div
              key={founder.wallet}
              className="border-border/70 rounded-xl border p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {founder.role || 'Founder'}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {shortenAddress(founder.wallet)} ({founder.equityPercent}%)
                  </p>
                </div>
                {hasActiveSubdomain && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {existing?.name}.{ensName}
                  </span>
                )}
              </div>
              <Input
                value={hasActiveSubdomain ? (existing?.name ?? '') : label}
                onChange={(event) => {
                  if (hasActiveSubdomain) return
                  setLabels((current) => ({
                    ...current,
                    [founder.wallet]: event.target.value,
                  }))
                }}
                placeholder={`label.${ensName}`}
                disabled={hasActiveSubdomain || isFormDisabled}
              />
              {!hasActiveSubdomain && label.trim() && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Preview: {label.trim().toLowerCase()}.{ensName}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {filledEntries.length} subdomain
          {filledEntries.length !== 1 ? 's' : ''} to create
        </p>
        <Button
          type="button"
          size="sm"
          onClick={handleBatchCreate}
          disabled={!canSubmit}
        >
          {isBusy && (
            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
          )}
          Create subdomains
        </Button>
      </div>

      {pendingOps.length > 0 && (
        <div className="mt-3 rounded-xl border px-3 py-3 text-xs">
          <p className="mb-2 font-semibold">Pending batch proposals</p>
          <div className="space-y-1">
            {pendingOps.map((op) => (
              <p key={op.safeTxHash}>
                Create {op.labels.join(', ')} - {op.safeTxHash.slice(0, 12)}...
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
