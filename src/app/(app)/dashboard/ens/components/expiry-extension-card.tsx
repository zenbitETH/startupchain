'use client'

import { ExternalLink, Loader2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useSafeWallet } from '@/hooks/use-safe-wallet'
import { buildRenewEnsTransaction } from '@/lib/blockchain/ens-management'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import {
  isSafeProposeClientError,
  proposeSafeTransactionFromWallet,
} from '@/lib/blockchain/safe-proposal-client'

const DURATION_OPTIONS = [
  { label: '1 year', seconds: 31536000n },
  { label: '2 years', seconds: 63072000n },
  { label: '5 years', seconds: 157680000n },
] as const

interface ExpiryExtensionCardProps {
  ensName: string
  ensAppBase: string
  safeWalletUrl?: string
  chainId?: number
  safeAddress?: `0x${string}`
  controllerAddress?: `0x${string}`
}

function parseRenewalValue(input: string): bigint | null {
  const trimmed = input.trim()
  if (!trimmed) return 0n
  try {
    return BigInt(trimmed)
  } catch {
    return null
  }
}

export function ExpiryExtensionCard({
  ensName,
  ensAppBase,
  safeWalletUrl,
  chainId,
  safeAddress,
  controllerAddress,
}: ExpiryExtensionCardProps) {
  const router = useRouter()
  const { authenticated, ensureWalletReady } = useSafeWallet({
    chainId: chainId ?? 0,
  })

  const [selectedDuration, setSelectedDuration] = useState(0)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [renewalValue, setRenewalValue] = useState('')

  const canPropose = Boolean(
    chainId && safeAddress && controllerAddress && authenticated && !isBusy
  )

  async function handleProposeRenewal() {
    if (!canPropose || !controllerAddress || !safeAddress || !chainId) return

    const duration = DURATION_OPTIONS[selectedDuration].seconds
    const value = parseRenewalValue(renewalValue)
    if (value === null) {
      setErrorMessage('Invalid value: enter a valid number in wei.')
      return
    }

    try {
      setIsBusy(true)
      setErrorMessage(null)

      const { walletAddress, provider } = await ensureWalletReady()
      const transaction = buildRenewEnsTransaction({
        controllerAddress,
        ensName,
        duration,
        value,
      })

      await proposeSafeTransactionFromWallet({
        provider,
        chainId,
        safeAddress,
        senderAddress: walletAddress,
        transaction,
        origin: 'startupchain:ens:renew',
      })

      router.refresh()
    } catch (error) {
      if (
        isSafeProposeClientError(error) &&
        error.code === 'SAFE_API_KEY_MISSING'
      ) {
        setErrorMessage(
          'Safe proposal service is not configured. Add SAFE_API_KEY on server.'
        )
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to propose renewal'
        )
      }
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="bg-card border-border hover-lift border-l-accent/30 rounded-2xl border border-l-2 p-6 shadow-sm">
      <h3 className="text-foreground text-lg font-semibold">
        Expiry extension
      </h3>
      <p className="text-muted-foreground mt-1 text-sm">
        {canPropose
          ? 'Propose a renewal via Safe to extend your ENS registration.'
          : 'Extend your ENS registration from the ENS app or Safe queue.'}
      </p>

      {!authenticated && chainId && safeAddress && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Wallet connection required to submit Safe proposals.</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-xl border border-current/20 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      {chainId && safeAddress && controllerAddress && (
        <div className="mt-4 space-y-3">
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              htmlFor="renewal-duration"
            >
              Duration
            </label>
            <select
              id="renewal-duration"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            >
              {DURATION_OPTIONS.map((opt, idx) => (
                <option key={opt.label} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              htmlFor="renewal-value"
            >
              Value (wei) - leave empty for 0
            </label>
            <input
              id="renewal-value"
              type="text"
              value={renewalValue}
              onChange={(e) => setRenewalValue(e.target.value)}
              placeholder="0"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              ENS renewal requires ETH. Query rentPrice on the controller for
              exact cost.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleProposeRenewal}
              disabled={!canPropose}
            >
              {isBusy && (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              )}
              Propose renewal
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`${ensAppBase}/${ensName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none"
        >
          Open ENS app
          <ExternalLink className="h-3 w-3" />
        </a>
        {safeWalletUrl && (
          <a
            href={safeWalletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none"
          >
            Open Safe Wallet
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {chainId && safeAddress && (
          <a
            href={getSafeQueueUrl(chainId, safeAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none"
          >
            Open Safe queue
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </section>
  )
}
