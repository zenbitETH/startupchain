'use client'

import { ExternalLink, Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isAddress } from 'viem'
import { useRouter } from 'next/navigation'

import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { buildSetEnsTraitTransaction, type EnsTraitKey, type EnsTraits } from '@/lib/blockchain/ens-management'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import {
  isSafeProposeClientError,
  proposeSafeTransactionFromWallet,
} from '@/lib/blockchain/safe-proposal-client'
import { useWallets } from '@/lib/privy'
import { shortenAddress } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PendingTraitUpdate = {
  value: string
  safeTxHash: string
}

type TraitKey = EnsTraitKey

const traitLabels: Record<TraitKey, string> = {
  avatar: 'Avatar URL',
  description: 'Description',
  url: 'Website URL',
}

type PrivyWallet = {
  address?: string
  chainId?: number | string
  switchChain?: (chainId: number) => Promise<void>
  getEthereumProvider?: () => Promise<{
    request: (args: { method: string, params?: unknown[] | object }) => Promise<unknown>
  }>
}

function parseWalletChainId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) {
      return parsed
    }
  }
  return null
}

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
  const { authenticated, connect } = useWalletAuth()
  const walletsResult = useWallets()
  const wallets = useMemo(
    () => walletsResult?.wallets ?? [],
    [walletsResult?.wallets],
  )
  const walletsRef = useRef<PrivyWallet[]>(wallets as PrivyWallet[])

  const [formValues, setFormValues] = useState<EnsTraits>(traits)
  const [busyKey, setBusyKey] = useState<TraitKey | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [safeApiUnavailable, setSafeApiUnavailable] = useState(false)
  const [pending, setPending] = useState<Record<TraitKey, PendingTraitUpdate | null>>({
    avatar: null,
    description: null,
    url: null,
  })

  useEffect(() => {
    setFormValues(traits)
  }, [traits])

  useEffect(() => {
    walletsRef.current = wallets as PrivyWallet[]
  }, [wallets])

  useEffect(() => {
    setPending((current) => {
      const next = { ...current }
      for (const key of Object.keys(current) as TraitKey[]) {
        const pendingUpdate = current[key]
        if (!pendingUpdate)
          continue

        if (traits[key].trim() === pendingUpdate.value.trim()) {
          next[key] = null
        }
      }
      return next
    })
  }, [traits])

  const hasPending = useMemo(
    () => Object.values(pending).some(Boolean),
    [pending],
  )

  useEffect(() => {
    if (!hasPending)
      return
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, 15_000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasPending, router])

  async function waitForPrimaryWallet(): Promise<PrivyWallet | undefined> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const wallet = walletsRef.current[0]
      if (wallet) {
        return wallet
      }
      await new Promise(resolve => window.setTimeout(resolve, 100))
    }

    return walletsRef.current[0]
  }

  async function ensureWalletReady() {
    if (!authenticated) {
      await connect()
    }

    const wallet = await waitForPrimaryWallet()
    if (!wallet) {
      throw new Error('Connect a founder wallet to submit Safe proposals')
    }

    if (wallet.switchChain) {
      const walletChain
        = parseWalletChainId(wallet.chainId)
      if (walletChain === null || walletChain !== chainId) {
        try {
          await wallet.switchChain(chainId)
        }
        catch {
          throw new Error('Failed to switch to required network. Please switch manually.')
        }
      }
    }

    const provider = await wallet.getEthereumProvider?.()
    if (!provider) {
      throw new Error('Wallet provider is unavailable')
    }

    const providerChainId = parseWalletChainId(
      await provider.request({ method: 'eth_chainId' }),
    )
    if (providerChainId !== null && providerChainId !== chainId) {
      throw new Error('Wallet is on the wrong network. Please switch and try again.')
    }

    if (!wallet.address || !isAddress(wallet.address)) {
      throw new Error('Wallet address is unavailable')
    }

    return {
      walletAddress: wallet.address as `0x${string}`,
      provider,
    }
  }

  async function handleProposeTraitUpdate(key: TraitKey) {
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
      setPending(current => ({
        ...current,
        [key]: { value, safeTxHash },
      }))
      router.refresh()
    }
    catch (error) {
      if (isSafeProposeClientError(error) && error.code === 'SAFE_API_KEY_MISSING') {
        setSafeApiUnavailable(true)
        setErrorMessage('Safe proposal service is not configured. Add SAFE_API_KEY on server.')
      }
      else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Failed to propose ENS trait update',
        )
      }
    }
    finally {
      setBusyKey(null)
    }
  }

  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-lg font-semibold">ENS profile traits</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Propose updates via Safe and reflect values after onchain confirmation.
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
        <div className="bg-amber-500/10 text-amber-700 mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 px-3 py-2 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Wallet connection required to submit Safe proposals.</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-xl border border-current/20 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      {safeApiUnavailable && (
        <div className="mt-4 rounded-xl border border-dashed px-3 py-3 text-sm">
          <p className="font-medium">Safe proposal service is not configured.</p>
          <p className="text-muted-foreground mt-1">
            Proposal actions are disabled until
            {' '}
            <code className="font-mono">SAFE_API_KEY</code>
            {' '}
            is configured on the server.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {(Object.keys(traitLabels) as TraitKey[]).map((key) => {
          const value = formValues[key]
          const isDirty = value.trim() !== traits[key].trim()
          const isBusy = busyKey === key
          const pendingUpdate = pending[key]
          const disabled = !isDirty || isBusy || !authenticated || safeApiUnavailable

          return (
            <div key={key} className="border-border/70 rounded-xl border p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-sm font-medium" htmlFor={`ens-trait-${key}`}>
                  {traitLabels[key]}
                </label>
                {pendingUpdate && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700">
                    Proposed
                  </span>
                )}
              </div>

              {key === 'description'
                ? (
                    <textarea
                      id={`ens-trait-${key}`}
                      value={value}
                      onChange={event =>
                        setFormValues(current => ({
                          ...current,
                          [key]: event.target.value,
                        }))}
                      rows={3}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    />
                  )
                : (
                    <Input
                      id={`ens-trait-${key}`}
                      value={value}
                      onChange={event =>
                        setFormValues(current => ({
                          ...current,
                          [key]: event.target.value,
                        }))}
                    />
                  )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">
                  Current:
                  {' '}
                  {traits[key] || 'not set'}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleProposeTraitUpdate(key)}
                  disabled={disabled}
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />}
                  Propose update
                </Button>
              </div>

              {pendingUpdate && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Safe tx:
                  {' '}
                  {pendingUpdate.safeTxHash.slice(0, 12)}
                  ...
                  {' '}
                  Awaiting execution + indexing confirmation.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
