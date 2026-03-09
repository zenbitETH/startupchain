'use client'

import { ExternalLink, Loader2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSafeWallet } from '@/hooks/use-safe-wallet'
import {
  ENS_TRAIT_LABELS,
  type EnsTraitKey,
  type EnsTraits,
  buildSetEnsTraitTransaction,
} from '@/lib/blockchain/ens-management'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import {
  handleSafeProposalError,
  proposeSafeTransactionFromWallet,
} from '@/lib/blockchain/safe-proposal-client'
import { shortenAddress } from '@/lib/utils'

import { SafeProposalServiceNotice } from './safe-proposal-service-notice'

type PendingTraitUpdate = {
  value: string
  safeTxHash: string
}

type TraitSection = {
  title: string
  keys: EnsTraitKey[]
}

const traitSections: TraitSection[] = [
  { title: 'Profile', keys: ['avatar', 'description', 'url'] },
  { title: 'Social', keys: ['com.twitter', 'com.github', 'com.discord'] },
  { title: 'Other', keys: ['email', 'notice'] },
]

export function EnsTraitsCard({
  ensName,
  safeAddress,
  chainId,
  resolverAddress,
  traits,
}: {
  ensName: string
  safeAddress: `0x${string}`
  chainId: number
  resolverAddress: `0x${string}`
  traits: EnsTraits
}) {
  const router = useRouter()
  const { authenticated, ensureWalletReady } = useSafeWallet({ chainId })

  const [formValues, setFormValues] = useState<EnsTraits>(traits)
  const [busyKey, setBusyKey] = useState<EnsTraitKey | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [safeApiUnavailable, setSafeApiUnavailable] = useState(false)
  const [pending, setPending] = useState<
    Record<EnsTraitKey, PendingTraitUpdate | null>
  >({
    avatar: null,
    description: null,
    url: null,
    email: null,
    'com.twitter': null,
    'com.github': null,
    'com.discord': null,
    notice: null,
  })

  useEffect(() => {
    setFormValues(traits)
  }, [traits])

  useEffect(() => {
    setPending((current) => {
      let changed = false
      const next = { ...current }
      for (const key of Object.keys(current) as EnsTraitKey[]) {
        const pendingUpdate = current[key]
        if (!pendingUpdate) continue

        if (traits[key].trim() === pendingUpdate.value.trim()) {
          next[key] = null
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [traits])

  const hasPending = useMemo(
    () => Object.values(pending).some(Boolean),
    [pending]
  )

  useEffect(() => {
    if (!hasPending) return
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, 15_000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasPending, router])

  async function handleProposeTraitUpdate(key: EnsTraitKey) {
    const value = formValues[key].trim()
    const currentValue = traits[key].trim()

    if (value === currentValue) {
      return
    }

    try {
      setErrorMessage(null)
      setBusyKey(key)

      const { walletAddress, provider } = await ensureWalletReady()
      const transaction = buildSetEnsTraitTransaction({
        ensName,
        resolverAddress,
        key,
        value,
      })

      const { safeTxHash } = await proposeSafeTransactionFromWallet({
        provider,
        chainId,
        safeAddress,
        senderAddress: walletAddress,
        transaction,
        origin: `startupchain:ens-trait:${key}`,
      })

      setSafeApiUnavailable(false)
      setPending((current) => ({
        ...current,
        [key]: { value, safeTxHash },
      }))
      router.refresh()
    } catch (error) {
      handleSafeProposalError(error, 'Failed to propose ENS trait update', {
        onApiUnavailable: (msg) => {
          setSafeApiUnavailable(true)
          setErrorMessage(msg)
        },
        onError: (msg) => setErrorMessage(msg),
      })
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <section className="bg-card border-border hover-lift border-l-primary/30 rounded-2xl border border-l-2 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-lg font-semibold">
            ENS profile traits
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Propose updates via Safe and reflect values after onchain
            confirmation.
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="bg-muted/40 border-border/70 rounded-xl border p-3">
          <p className="text-muted-foreground text-xs">ENS name</p>
          <p className="text-sm font-semibold">{ensName}</p>
        </div>
        <div className="bg-muted/40 border-border/70 rounded-xl border p-3">
          <p className="text-muted-foreground text-xs">Resolver</p>
          <p className="font-mono text-sm">{shortenAddress(resolverAddress)}</p>
        </div>
      </div>

      {!authenticated && (
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

      {safeApiUnavailable && <SafeProposalServiceNotice />}

      <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
        {traitSections.map((section, sectionIndex) => (
          <Fragment key={section.title}>
            <h4
              className={[
                'text-muted-foreground text-xs font-semibold tracking-wide uppercase md:col-span-2 xl:col-span-3',
                sectionIndex > 0 && 'mt-2',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {section.title}
            </h4>
            {section.keys.map((key) => {
              const value = formValues[key]
              const isDirty = value.trim() !== traits[key].trim()
              const isBusy = busyKey === key
              const pendingUpdate = pending[key]
              const disabled =
                !isDirty || isBusy || !authenticated || safeApiUnavailable

              return (
                <div
                  key={key}
                  className="border-border/70 rounded-xl border p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`ens-trait-${key}`}
                    >
                      {ENS_TRAIT_LABELS[key]}
                    </label>
                    {pendingUpdate && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700">
                        Proposed
                      </span>
                    )}
                  </div>

                  {key === 'description' || key === 'notice' ? (
                    <textarea
                      id={`ens-trait-${key}`}
                      value={value}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      rows={3}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    />
                  ) : (
                    <Input
                      id={`ens-trait-${key}`}
                      value={value}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                    />
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">
                      Current: {traits[key] || 'not set'}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleProposeTraitUpdate(key)}
                      disabled={disabled}
                    >
                      {isBusy && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                      )}
                      Propose update
                    </Button>
                  </div>

                  {pendingUpdate && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Safe tx: {pendingUpdate.safeTxHash.slice(0, 12)}
                      ... Awaiting execution + indexing confirmation.
                    </p>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </section>
  )
}
