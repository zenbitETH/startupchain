'use client'

import { ExternalLink, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSafeProposalError } from '@/hooks/use-safe-proposal-error'
import { useSafeWallet } from '@/hooks/use-safe-wallet'
import {
  ENS_TRAIT_KEYS,
  ENS_TRAIT_LABELS,
  type EnsTraitKey,
  type EnsTraits,
  type SubdomainRecord,
  buildSetEnsTraitTransaction,
  buildSetPrimaryNameTransaction,
} from '@/lib/blockchain/ens-management'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import { proposeSafeTransactionFromWallet } from '@/lib/blockchain/safe-proposal-client'

import { SafeProposalServiceNotice } from './safe-proposal-service-notice'
import { WalletConnectionWarning } from './wallet-connection-warning'

export function SubdomainProfileCard({
  ensName,
  chainId,
  safeAddress,
  resolverAddress,
  reverseRegistrarAddress,
  subdomains,
}: {
  ensName: string
  chainId: number
  safeAddress: `0x${string}`
  resolverAddress: `0x${string}`
  reverseRegistrarAddress: `0x${string}`
  subdomains: SubdomainRecord[]
}) {
  const router = useRouter()
  const { authenticated, ensureWalletReady } = useSafeWallet({ chainId })

  const activeSubdomains = useMemo(
    () => subdomains.filter((s) => s.active),
    [subdomains]
  )

  const [selectedSubdomain, setSelectedSubdomain] = useState<string>(
    activeSubdomains[0]?.name ?? ''
  )
  const [formValues, setFormValues] = useState<EnsTraits>(() => {
    const empty: Record<string, string> = {}
    for (const key of ENS_TRAIT_KEYS) {
      empty[key] = ''
    }
    return empty as EnsTraits
  })
  useEffect(() => {
    const empty: Record<string, string> = {}
    for (const key of ENS_TRAIT_KEYS) {
      empty[key] = ''
    }
    setFormValues(empty as EnsTraits)
  }, [selectedSubdomain])

  const {
    errorMessage,
    safeApiUnavailable,
    handleError,
    clearError,
    markApiAvailable,
  } = useSafeProposalError()
  const [busyKey, setBusyKey] = useState<EnsTraitKey | 'primary' | null>(null)

  const fullSubdomainName = selectedSubdomain
    ? `${selectedSubdomain}.${ensName}`
    : ''

  async function handleProposeTraitUpdate(key: EnsTraitKey) {
    const value = formValues[key].trim()
    if (!value || !fullSubdomainName) return

    try {
      clearError()
      setBusyKey(key)

      const { walletAddress, provider } = await ensureWalletReady()
      const transaction = buildSetEnsTraitTransaction({
        ensName: fullSubdomainName,
        resolverAddress,
        key,
        value,
      })

      await proposeSafeTransactionFromWallet({
        provider,
        chainId,
        safeAddress,
        senderAddress: walletAddress,
        transaction,
        origin: `startupchain:subdomain-trait:${key}`,
      })

      markApiAvailable()
      router.refresh()
    } catch (error) {
      handleError(error, 'Failed to propose trait update')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSetPrimaryName() {
    if (!fullSubdomainName) return

    try {
      clearError()
      setBusyKey('primary')

      const { walletAddress, provider } = await ensureWalletReady()
      const transaction = buildSetPrimaryNameTransaction({
        reverseRegistrarAddress,
        name: fullSubdomainName,
      })

      await proposeSafeTransactionFromWallet({
        provider,
        chainId,
        safeAddress,
        senderAddress: walletAddress,
        transaction,
        origin: 'startupchain:subdomain:set-primary',
      })

      markApiAvailable()
      router.refresh()
    } catch (error) {
      handleError(error, 'Failed to propose primary name')
    } finally {
      setBusyKey(null)
    }
  }

  if (activeSubdomains.length === 0) return null

  return (
    <section className="bg-card border-border hover-lift border-l-chart-5/30 rounded-2xl border border-l-2 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-lg font-semibold">
            Subdomain profile
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Set traits and primary name for a subdomain via Safe proposals.
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

      {!authenticated && <WalletConnectionWarning />}

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-xl border border-current/20 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      {safeApiUnavailable && <SafeProposalServiceNotice />}

      <div className="mt-4">
        <label
          className="mb-1 block text-xs font-medium"
          htmlFor="subdomain-select"
        >
          Subdomain
        </label>
        <select
          id="subdomain-select"
          value={selectedSubdomain}
          onChange={(e) => setSelectedSubdomain(e.target.value)}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
        >
          {activeSubdomains.map((sub) => (
            <option key={sub.name} value={sub.name}>
              {sub.name}.{ensName}
            </option>
          ))}
        </select>
      </div>

      {fullSubdomainName && (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Set as primary name</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleSetPrimaryName}
              disabled={
                !authenticated || busyKey !== null || safeApiUnavailable
              }
            >
              {busyKey === 'primary' && (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              )}
              Set primary name
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {ENS_TRAIT_KEYS.map((key) => {
              const value = formValues[key]
              const isBusy = busyKey === key

              return (
                <div
                  key={key}
                  className="border-border/70 rounded-xl border p-3"
                >
                  <label
                    className="mb-1 block text-xs font-medium"
                    htmlFor={`sub-trait-${key}`}
                  >
                    {ENS_TRAIT_LABELS[key]}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id={`sub-trait-${key}`}
                      value={value}
                      onChange={(e) =>
                        setFormValues((current) => ({
                          ...current,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={ENS_TRAIT_LABELS[key]}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleProposeTraitUpdate(key)}
                      disabled={
                        !value.trim() ||
                        isBusy ||
                        !authenticated ||
                        busyKey !== null ||
                        safeApiUnavailable
                      }
                    >
                      {isBusy && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                      )}
                      Propose
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
