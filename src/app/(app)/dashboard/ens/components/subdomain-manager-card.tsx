'use client'

import { ExternalLink, Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAddress } from 'viem'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  buildCreateSubdomainTransaction,
  buildRevokeSubdomainTransaction,
  normalizeSubdomainLabel,
  type SubdomainRecord,
} from '@/lib/blockchain/ens-management'
import {
  isSafeProposeClientError,
  proposeSafeTransactionFromWallet,
} from '@/lib/blockchain/safe-proposal-client'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { useWallets } from '@/lib/privy'
import { shortenAddress } from '@/lib/utils'

type PendingSubdomainOperation = {
  type: 'create' | 'revoke'
  label: string
  owner?: string
  safeTxHash: string
}

type BusySubdomainAction
  = | { type: 'create' }
    | { type: 'revoke'; label: string }
    | null

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

export function SubdomainManagerCard({
  companyId,
  chainId,
  safeAddress,
  startupChainAddress,
  subdomains,
  subdomainsSupported,
}: {
  companyId: string
  chainId: number
  safeAddress: `0x${string}`
  startupChainAddress: `0x${string}`
  subdomains: SubdomainRecord[]
  subdomainsSupported: boolean
}) {
  const router = useRouter()
  const { authenticated, connect, primaryAddress } = useWalletAuth()
  const walletsResult = useWallets()
  const wallets = useMemo(
    () => walletsResult?.wallets ?? [],
    [walletsResult?.wallets],
  )
  const walletsRef = useRef<PrivyWallet[]>(wallets as PrivyWallet[])

  const [labelInput, setLabelInput] = useState('')
  const [ownerInput, setOwnerInput] = useState(primaryAddress ?? '')
  const [ownerTouched, setOwnerTouched] = useState(false)
  const [busyAction, setBusyAction] = useState<BusySubdomainAction>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [safeApiUnavailable, setSafeApiUnavailable] = useState(false)
  const [pendingOps, setPendingOps] = useState<PendingSubdomainOperation[]>([])
  const pendingOpsKey = useMemo(
    () =>
      pendingOps
        .map(op => `${op.type}:${op.label}:${op.owner ?? ''}:${op.safeTxHash}`)
        .join('|'),
    [pendingOps],
  )

  useEffect(() => {
    if (!ownerTouched && !ownerInput && primaryAddress) {
      setOwnerInput(primaryAddress)
    }
  }, [ownerInput, ownerTouched, primaryAddress])

  useEffect(() => {
    walletsRef.current = wallets as PrivyWallet[]
  }, [wallets])

  useEffect(() => {
    if (pendingOps.length === 0)
      return

    setPendingOps((current) =>
      current.filter((op) => {
        const currentItem = subdomains.find(sub => sub.name === op.label)
        if (op.type === 'create') {
          return !(
            currentItem
            && currentItem.active
            && (!op.owner || currentItem.owner.toLowerCase() === op.owner.toLowerCase())
          )
        }

        return !(currentItem && !currentItem.active)
      }),
    )
  }, [subdomains, pendingOpsKey])

  const hasPending = pendingOps.length > 0

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

  const activeSubdomains = useMemo(
    () => subdomains.filter(subdomain => subdomain.active),
    [subdomains],
  )
  const anyActionBusy = Boolean(busyAction)
  const createBusy = busyAction?.type === 'create'

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

  async function handleCreateSubdomain() {
    if (!subdomainsSupported) {
      return
    }

    try {
      setBusyAction({ type: 'create' })
      setErrorMessage(null)

      const normalizedLabel = normalizeSubdomainLabel(labelInput)
      if (!isAddress(ownerInput)) {
        throw new Error('Owner address is invalid')
      }

      const { walletAddress, provider } = await ensureWalletReady()
      const transaction = buildCreateSubdomainTransaction({
        startupChainAddress,
        companyId: BigInt(companyId),
        label: normalizedLabel,
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
      setPendingOps(current => [
        ...current,
        {
          type: 'create',
          label: normalizedLabel,
          owner: ownerInput,
          safeTxHash,
        },
      ])
      setLabelInput('')
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
            : 'Failed to propose subdomain creation',
        )
      }
    }
    finally {
      setBusyAction(null)
    }
  }

  async function handleRevokeSubdomain(label: string) {
    if (!subdomainsSupported) {
      return
    }

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
      setPendingOps(current => [
        ...current,
        {
          type: 'revoke',
          label,
          safeTxHash,
        },
      ])
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
            : 'Failed to propose subdomain revoke',
        )
      }
    }
    finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground text-lg font-semibold">Subdomain management</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            List, create, and revoke member subdomains through Safe proposals.
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
        <div className="bg-amber-500/10 text-amber-700 mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 px-3 py-2 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Wallet connection required to submit Safe proposals.</p>
        </div>
      )}

      {!subdomainsSupported && (
        <div className="mt-4 rounded-xl border border-dashed px-3 py-3 text-sm">
          <p className="font-medium">Subdomain actions unavailable on current deployment.</p>
          <p className="text-muted-foreground mt-1">
            This network contract does not expose subdomain methods yet. ENS trait edits remain available.
          </p>
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

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-xl border border-current/20 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div className="border-border/70 rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium">Create subdomain</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium" htmlFor="subdomain-label">
                Label
              </label>
              <Input
                id="subdomain-label"
                value={labelInput}
                onChange={event => setLabelInput(event.target.value)}
                placeholder="alice"
                disabled={anyActionBusy || !authenticated || !subdomainsSupported || safeApiUnavailable}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" htmlFor="subdomain-owner">
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
                disabled={anyActionBusy || !authenticated || !subdomainsSupported || safeApiUnavailable}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateSubdomain}
              disabled={
                anyActionBusy
                || !authenticated
                || !labelInput.trim()
                || !ownerInput.trim()
                || !subdomainsSupported
                || safeApiUnavailable
              }
            >
              {createBusy && <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />}
              Propose create
            </Button>
          </div>
        </div>

        <div className="border-border/70 rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Active subdomains</p>
            <span className="text-muted-foreground text-xs">
              {activeSubdomains.length}
              {' '}
              active
            </span>
          </div>

          {activeSubdomains.length === 0
            ? (
                <p className="text-muted-foreground text-sm">
                  No active subdomains yet.
                </p>
              )
            : (
                <div className="space-y-2">
                  {activeSubdomains.map((subdomain) => (
                    <div
                      key={`${subdomain.name}-${subdomain.owner}`}
                      className="bg-muted/40 border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{subdomain.name}</p>
                        <p className="text-muted-foreground font-mono text-xs">
                          {shortenAddress(subdomain.owner)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeSubdomain(subdomain.name)}
                        disabled={anyActionBusy || !authenticated || !subdomainsSupported || safeApiUnavailable}
                      >
                        {busyAction?.type === 'revoke' && busyAction.label === subdomain.name && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                        )}
                        Propose revoke
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
                {op.type === 'create' ? 'Create' : 'Revoke'}
                {' '}
                <span className="font-mono">{op.label}</span>
                {' '}
                -
                {' '}
                {op.safeTxHash.slice(0, 12)}
                ...
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
