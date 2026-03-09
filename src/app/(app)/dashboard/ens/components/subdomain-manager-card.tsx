'use client'

import { ExternalLink, Loader2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { isAddress } from 'viem'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSafeWallet } from '@/hooks/use-safe-wallet'
import {
  type SubdomainRecord,
  buildCreateSubdomainTransaction,
  buildRevokeSubdomainTransaction,
} from '@/lib/blockchain/ens-management'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import {
  handleSafeProposalError,
  proposeSafeTransactionFromWallet,
} from '@/lib/blockchain/safe-proposal-client'
import { shortenAddress } from '@/lib/utils'

import { SafeProposalServiceNotice } from './safe-proposal-service-notice'

type PendingSubdomainOperation =
  | {
      type: 'create'
      label: string
      owner?: string
      safeTxHash: string
    }
  | {
      type: 'revoke'
      label: string
      safeTxHash: string
    }

type BusySubdomainAction =
  | { type: 'create' }
  | { type: 'revoke'; label: string }
  | null

export function SubdomainManagerCard({
  companyId,
  ensName,
  chainId,
  safeAddress,
  startupChainAddress,
  subdomains,
  subdomainsSupported,
}: {
  companyId: string
  ensName: string
  chainId: number
  safeAddress: `0x${string}`
  startupChainAddress: `0x${string}`
  subdomains: SubdomainRecord[]
  subdomainsSupported: boolean
}) {
  const router = useRouter()
  const { authenticated, ensureWalletReady, expectedWalletAddress } =
    useSafeWallet({ chainId })

  const [customLabelInput, setCustomLabelInput] = useState('')
  const [ownerInput, setOwnerInput] = useState(expectedWalletAddress ?? '')
  const [ownerTouched, setOwnerTouched] = useState(false)
  const [busyAction, setBusyAction] = useState<BusySubdomainAction>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [safeApiUnavailable, setSafeApiUnavailable] = useState(false)
  const [pendingOps, setPendingOps] = useState<PendingSubdomainOperation[]>([])

  const hasPending = pendingOps.length > 0
  const activeSubdomains = useMemo(
    () => subdomains.filter((subdomain) => subdomain.active),
    [subdomains]
  )

  useEffect(() => {
    if (!ownerTouched && !ownerInput && expectedWalletAddress) {
      setOwnerInput(expectedWalletAddress)
    }
  }, [expectedWalletAddress, ownerInput, ownerTouched])

  useEffect(() => {
    if (!hasPending) return

    setPendingOps((current) =>
      current.filter((op) => {
        const currentItem = subdomains.find((sub) => sub.name === op.label)
        if (op.type === 'create') {
          return !(
            currentItem &&
            currentItem.active &&
            (!op.owner ||
              currentItem.owner.toLowerCase() === op.owner.toLowerCase())
          )
        }

        return !(currentItem && !currentItem.active)
      })
    )
  }, [hasPending, subdomains])

  useEffect(() => {
    if (!hasPending) return
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, 15_000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasPending, router])

  const anyActionBusy = Boolean(busyAction)
  const isActionDisabled =
    !authenticated ||
    anyActionBusy ||
    !subdomainsSupported ||
    safeApiUnavailable
  const proposalErrorCallbacks = {
    onApiUnavailable: (msg: string) => {
      setSafeApiUnavailable(true)
      setErrorMessage(msg)
    },
    onError: (msg: string) => setErrorMessage(msg),
  }

  async function handleCreateSubdomain() {
    if (isActionDisabled) return

    try {
      setBusyAction({ type: 'create' })
      setErrorMessage(null)

      if (!customLabelInput.trim()) {
        throw new Error('Subdomain label is required')
      }
      if (!isAddress(ownerInput)) {
        throw new Error('Owner address is invalid')
      }

      const { walletAddress, provider } = await ensureWalletReady()
      const transaction = buildCreateSubdomainTransaction({
        startupChainAddress,
        companyId: BigInt(companyId),
        label: customLabelInput,
        owner: ownerInput,
      })

      const { safeTxHash } = await proposeSafeTransactionFromWallet({
        provider,
        chainId,
        safeAddress,
        senderAddress: walletAddress,
        transaction,
        origin: 'startupchain:subdomain:create',
      })

      setSafeApiUnavailable(false)
      setPendingOps((current) => [
        ...current,
        {
          type: 'create',
          label: customLabelInput.trim().toLowerCase(),
          owner: ownerInput,
          safeTxHash,
        },
      ])
      setCustomLabelInput('')
      router.refresh()
    } catch (error) {
      handleSafeProposalError(
        error,
        'Failed to propose subdomain creation',
        proposalErrorCallbacks
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function handleRevokeSubdomain(label: string) {
    if (isActionDisabled) return

    try {
      setBusyAction({ type: 'revoke', label })
      setErrorMessage(null)

      const { walletAddress, provider } = await ensureWalletReady()
      const transaction = buildRevokeSubdomainTransaction({
        startupChainAddress,
        companyId: BigInt(companyId),
        label,
      })

      const { safeTxHash } = await proposeSafeTransactionFromWallet({
        provider,
        chainId,
        safeAddress,
        senderAddress: walletAddress,
        transaction,
        origin: 'startupchain:subdomain:revoke',
      })

      setSafeApiUnavailable(false)
      setPendingOps((current) => [
        ...current,
        {
          type: 'revoke',
          label,
          safeTxHash,
        },
      ])
      router.refresh()
    } catch (error) {
      handleSafeProposalError(
        error,
        'Failed to propose subdomain revoke',
        proposalErrorCallbacks
      )
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="bg-card border-border hover-lift border-l-chart-3/30 rounded-2xl border border-l-2 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-lg font-semibold">Subdomains</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage custom subdomains through Safe proposals.
          </p>
        </div>
        <a
          href={getSafeQueueUrl(chainId, safeAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-semibold transition-colors motion-reduce:transition-none"
        >
          Open Safe queue
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {!authenticated && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Wallet connection required to submit Safe proposals.</p>
        </div>
      )}

      {expectedWalletAddress && (
        <div className="text-muted-foreground mt-4 rounded-xl border border-dashed px-3 py-3 text-sm">
          Proposals must be signed by founder wallet{' '}
          <span className="font-mono">
            {shortenAddress(expectedWalletAddress)}
          </span>
          .
        </div>
      )}

      {!subdomainsSupported && (
        <div className="mt-4 rounded-xl border border-dashed px-3 py-3 text-sm">
          <p className="font-medium">
            Subdomain actions unavailable on current deployment.
          </p>
          <p className="text-muted-foreground mt-1">
            This deployment does not expose subdomain methods yet, so custom
            subdomain proposals are disabled.
          </p>
        </div>
      )}

      {safeApiUnavailable && <SafeProposalServiceNotice />}

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-xl border border-current/20 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border p-4">
          <p className="text-sm font-medium">Custom subdomain</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Use this for teammates or service addresses.
          </p>

          <div className="mt-3 grid gap-3">
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                htmlFor="subdomain-label"
              >
                Subdomain label
              </label>
              <Input
                id="subdomain-label"
                value={customLabelInput}
                onChange={(event) => setCustomLabelInput(event.target.value)}
                placeholder="e.g. ops"
                disabled={isActionDisabled}
              />
              {customLabelInput.trim() && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Preview: {customLabelInput.trim().toLowerCase()}.{ensName}
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                htmlFor="subdomain-owner"
              >
                Owner address
              </label>
              <Input
                id="subdomain-owner"
                value={ownerInput}
                onChange={(event) => {
                  setOwnerTouched(true)
                  setOwnerInput(event.target.value)
                }}
                placeholder="0x..."
                disabled={isActionDisabled}
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateSubdomain}
              disabled={
                isActionDisabled ||
                !customLabelInput.trim() ||
                !ownerInput.trim()
              }
            >
              {busyAction?.type === 'create' && (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              )}
              Create custom subdomain
            </Button>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Active subdomains</p>
            <span className="text-muted-foreground text-xs">
              {activeSubdomains.length} active
            </span>
          </div>

          {activeSubdomains.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active subdomains yet.
            </p>
          ) : (
            <div className="space-y-2">
              {activeSubdomains.map((subdomain) => (
                <div
                  key={`${subdomain.name}-${subdomain.owner}`}
                  className="bg-muted/40 border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {subdomain.name}.{ensName}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {shortenAddress(subdomain.owner)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevokeSubdomain(subdomain.name)}
                    disabled={isActionDisabled}
                  >
                    {busyAction?.type === 'revoke' &&
                      busyAction.label === subdomain.name && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                      )}
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingOps.length > 0 && (
        <div className="mt-4 rounded-xl border px-3 py-3 text-xs">
          <p className="mb-2 font-semibold">Pending Safe proposals</p>
          <div className="space-y-1">
            {pendingOps.map((op) => (
              <p key={`${op.safeTxHash}-${op.label}`}>
                {op.type === 'create' ? 'Create' : 'Revoke'} {op.label} -{' '}
                {op.safeTxHash.slice(0, 12)}...
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
