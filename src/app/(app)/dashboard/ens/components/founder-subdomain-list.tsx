'use client'

import { Check, Clock, ExternalLink, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSafeWallet } from '@/hooks/use-safe-wallet'
import {
  type SubdomainRecord,
  buildBatchCreateSubdomainsTransactions,
} from '@/lib/blockchain/ens-management'
import type { Founder } from '@/lib/blockchain/get-company'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import {
  handleSafeProposalError,
  proposeBatchSafeTransactionFromWallet,
} from '@/lib/blockchain/safe-proposal-client'
import { shortenAddress } from '@/lib/utils'

import { SafeProposalServiceNotice } from './safe-proposal-service-notice'

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

type PendingBatch = {
  labels: string[]
  safeTxHash: string
}

type FounderSubdomainListProps = {
  companyId: string
  ensName: string
  chainId: number
  safeAddress: `0x${string}`
  startupChainAddress: `0x${string}`
  founders: Founder[]
  subdomains: SubdomainRecord[]
  subdomainsSupported: boolean
}

export function FounderSubdomainList({
  companyId,
  ensName,
  chainId,
  safeAddress,
  startupChainAddress,
  founders,
  subdomains,
  subdomainsSupported,
}: FounderSubdomainListProps) {
  const router = useRouter()
  const { authenticated, ensureWalletReady } = useSafeWallet({ chainId })

  const subdomainByOwner = useMemo(
    () => buildSubdomainLookup(subdomains),
    [subdomains]
  )

  const [labelInputs, setLabelInputs] = useState<Record<string, string>>({})
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [safeApiUnavailable, setSafeApiUnavailable] = useState(false)
  const [pendingBatch, setPendingBatch] = useState<PendingBatch | null>(null)

  const filledEntries = useMemo(() => {
    const entries: { label: string; owner: string }[] = []
    for (const founder of founders) {
      const label = labelInputs[founder.wallet]?.trim()
      const existing = subdomainByOwner.get(founder.wallet.toLowerCase())
      if (label && !existing) {
        entries.push({ label, owner: founder.wallet })
      }
    }
    return entries
  }, [labelInputs, founders, subdomainByOwner])

  // Clear pending batch once all labels are confirmed on-chain
  useEffect(() => {
    if (!pendingBatch) return
    const allConfirmed = pendingBatch.labels.every((label) =>
      subdomains.some((sub) => sub.active && sub.name === label)
    )
    if (allConfirmed) {
      setPendingBatch(null)
    }
  }, [pendingBatch, subdomains])

  // Poll for updates while a batch is pending
  useEffect(() => {
    if (!pendingBatch) return
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, 15_000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [pendingBatch, router])

  const isDisabled =
    !authenticated ||
    !subdomainsSupported ||
    isBusy ||
    Boolean(pendingBatch) ||
    safeApiUnavailable
  const canSubmit = filledEntries.length > 0 && !isDisabled

  async function handleBatchAssign() {
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

      setPendingBatch({
        labels: filledEntries.map((e) => e.label),
        safeTxHash,
      })
      setSafeApiUnavailable(false)
      setLabelInputs({})
      router.refresh()
    } catch (error) {
      handleSafeProposalError(error, 'Failed to assign subdomains', {
        onApiUnavailable: (msg: string) => {
          setSafeApiUnavailable(true)
          setErrorMessage(msg)
        },
        onError: (msg: string) => setErrorMessage(msg),
      })
    } finally {
      setIsBusy(false)
    }
  }

  const foundersWithoutSubdomain = founders.filter(
    (f) => !subdomainByOwner.get(f.wallet.toLowerCase())
  )

  return (
    <TooltipProvider>
      <p className="text-muted-foreground text-xs">Founders</p>

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-2 rounded-lg border border-current/20 px-3 py-2 text-xs">
          {errorMessage}
        </div>
      )}

      {safeApiUnavailable && <SafeProposalServiceNotice />}

      <div className="mt-3 space-y-3">
        {founders.map((founder) => {
          const existing = subdomainByOwner.get(founder.wallet.toLowerCase())
          return (
            <div key={founder.wallet} className="flex items-center gap-4">
              {/* Role / equity label */}
              <span className="text-muted-foreground w-20 shrink-0 truncate text-xs">
                {founder.role || 'Founder'}
                <span className="ml-1 opacity-60">
                  {founder.equityPercent}%
                </span>
              </span>

              {existing ? (
                /* Has active subdomain */
                <div className="flex min-w-0 items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="border-border bg-background inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                        <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                        {existing.name}.{ensName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">{founder.wallet}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : pendingBatch ? (
                /* Batch pending approval */
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3 shrink-0" />
                  Awaiting Safe approval
                </span>
              ) : (
                /* Editable: label input */
                <div className="flex min-w-0 items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="border-border bg-background shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs">
                        {shortenAddress(founder.wallet)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">{founder.wallet}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    value={labelInputs[founder.wallet] ?? ''}
                    onChange={(event) =>
                      setLabelInputs((current) => ({
                        ...current,
                        [founder.wallet]: event.target.value,
                      }))
                    }
                    placeholder="subdomain label"
                    className="h-7 w-56 text-xs"
                    disabled={isDisabled}
                  />
                  {(labelInputs[founder.wallet] ?? '').trim() && (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {(labelInputs[founder.wallet] ?? '').trim().toLowerCase()}
                      .{ensName}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Batch assign button - only when there are unassigned founders and no pending batch */}
      {foundersWithoutSubdomain.length > 0 && !pendingBatch && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleBatchAssign}
            disabled={!canSubmit}
          >
            {isBusy && (
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
            )}
            Assign subdomains
            {filledEntries.length > 0 && (
              <span className="bg-primary-foreground/20 ml-1 rounded-full px-1.5 text-[10px]">
                {filledEntries.length}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Pending batch banner */}
      {pendingBatch && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">
              Awaiting Safe approval for{' '}
              <span className="font-medium">
                {pendingBatch.labels.join(', ')}
              </span>
            </p>
          </div>
          <a
            href={getSafeQueueUrl(chainId, safeAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 inline-flex shrink-0 items-center gap-1 text-xs font-semibold transition-colors"
          >
            Open Safe
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </TooltipProvider>
  )
}
