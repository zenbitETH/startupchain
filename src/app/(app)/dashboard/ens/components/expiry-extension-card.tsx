'use client'

import { ExternalLink, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useSafeProposalError } from '@/hooks/use-safe-proposal-error'
import { useSafeWallet } from '@/hooks/use-safe-wallet'
import { buildRenewEnsTransaction } from '@/lib/blockchain/ens-management'
import { getSafeQueueUrl } from '@/lib/blockchain/safe-links'
import { proposeSafeTransactionFromWallet } from '@/lib/blockchain/safe-proposal-client'

import { getEnsRenewalQuoteAction } from '../actions'
import {
  type RenewalQuoteSnapshot,
  type RenewalValueState,
  applyRenewalQuoteToValue,
  canSubmitRenewalProposal,
  createRenewalValueState,
  enableManualRenewalOverride,
  parseRenewalValue,
  resetRenewalValueToQuote,
  updateRenewalValueInput,
} from './expiry-extension-model'
import { SafeProposalServiceNotice } from './safe-proposal-service-notice'
import { WalletConnectionWarning } from './wallet-connection-warning'

function RenewalValueInput({
  valueState,
  setValueState,
  placeholder,
  disabled,
  helperText,
  showOverrideControls,
}: {
  valueState: RenewalValueState
  setValueState: React.Dispatch<React.SetStateAction<RenewalValueState>>
  placeholder: string
  disabled: boolean
  helperText: string
  showOverrideControls: boolean
}) {
  return (
    <div className="mt-3">
      <label className="mb-1 block text-xs font-medium" htmlFor="renewal-value">
        Renewal value (wei)
      </label>
      <input
        id="renewal-value"
        type="text"
        value={valueState.renewalValue}
        onChange={(e) =>
          setValueState((current) =>
            updateRenewalValueInput(current, e.target.value)
          )
        }
        placeholder={placeholder}
        disabled={disabled}
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
      />
      <p className="text-muted-foreground mt-1 text-xs">{helperText}</p>
      {showOverrideControls && valueState.manualOverrideActive && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-amber-500/10 px-2 py-1 font-medium text-amber-700">
            {valueState.staleManualOverride
              ? 'Manual override differs from latest quote'
              : 'Manual override active'}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-auto px-2 py-1 text-xs"
            onClick={() =>
              setValueState((current) => resetRenewalValueToQuote(current))
            }
          >
            Use quoted value
          </Button>
        </div>
      )}
    </div>
  )
}

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

  const {
    errorMessage,
    safeApiUnavailable,
    handleError,
    setError,
    clearError,
    markApiAvailable,
  } = useSafeProposalError()

  const [selectedDuration, setSelectedDuration] = useState(0)
  const [isBusy, setIsBusy] = useState(false)
  const [quoteState, setQuoteState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; quote: RenewalQuoteSnapshot }
    | { status: 'error'; error: string }
  >({ status: 'idle' })
  const [valueState, setValueState] = useState(createRenewalValueState())
  const latestQuoteRequest = useRef(0)

  const duration = DURATION_OPTIONS[selectedDuration].seconds
  const canQuote = Boolean(chainId && controllerAddress)
  const canPropose =
    !safeApiUnavailable &&
    canSubmitRenewalProposal({
      authenticated,
      chainId,
      safeAddress,
      controllerAddress,
      isBusy,
      quoteStatus: quoteState.status,
      valueState,
    })
  const quoteSnapshot = quoteState.status === 'ready' ? quoteState.quote : null
  const renewalValuePlaceholder = quoteSnapshot?.totalWei ?? 'Quoted wei value'
  const isRenewalValueDisabled =
    quoteState.status === 'loading' ||
    (quoteState.status === 'error' && !valueState.manualOverrideEnabled)
  const renewalValueHelperText =
    quoteState.status === 'ready'
      ? 'Auto-filled from ENS rentPrice. You can override it if needed.'
      : quoteState.status === 'error'
        ? 'Manual entry stays disabled until you explicitly enable an override.'
        : 'Waiting for the latest ENS renewal quote.'

  useEffect(() => {
    if (!canQuote || !chainId) {
      setQuoteState({ status: 'idle' })
      setValueState(createRenewalValueState())
      return
    }

    const requestId = latestQuoteRequest.current + 1
    latestQuoteRequest.current = requestId

    setQuoteState({ status: 'loading' })

    void getEnsRenewalQuoteAction({
      ensName,
      durationSeconds: duration,
      chainId,
    })
      .then((result) => {
        if (latestQuoteRequest.current !== requestId) {
          return
        }

        if (!result.ok) {
          setQuoteState({ status: 'error', error: result.error })
          setValueState((current) => ({
            ...current,
            quotedValue: null,
            manualOverrideActive: current.manualOverrideEnabled,
            staleManualOverride: false,
          }))
          return
        }

        const nextQuote: RenewalQuoteSnapshot = {
          baseWei: result.baseWei,
          premiumWei: result.premiumWei,
          totalWei: result.totalWei,
          baseEth: result.baseEth,
          premiumEth: result.premiumEth,
          totalEth: result.totalEth,
          estimatedTotalUsd: result.estimatedTotalUsd,
          usdEstimateSource: result.usdEstimateSource,
        }

        setQuoteState({ status: 'ready', quote: nextQuote })
        setValueState((current) => applyRenewalQuoteToValue(current, nextQuote))
      })
      .catch((transportError: unknown) => {
        if (latestQuoteRequest.current !== requestId) {
          return
        }

        setQuoteState({
          status: 'error',
          error:
            transportError instanceof Error
              ? transportError.message
              : 'Network error while fetching renewal quote.',
        })
        setValueState((current) => ({
          ...current,
          quotedValue: null,
          manualOverrideActive: current.manualOverrideEnabled,
          staleManualOverride: false,
        }))
      })
  }, [canQuote, chainId, duration, ensName])

  async function handleProposeRenewal() {
    if (!canPropose || !controllerAddress || !safeAddress || !chainId) return

    const value = parseRenewalValue(valueState.renewalValue)
    if (value === null) {
      setError('Invalid value: enter a valid number in wei.')
      return
    }

    try {
      setIsBusy(true)
      clearError()

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

      markApiAvailable()
      router.refresh()
    } catch (error) {
      handleError(error, 'Failed to propose renewal')
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
          ? 'Propose a renewal via Safe using the latest ENS quote or an explicit manual override.'
          : 'Extend your ENS registration from the ENS app or Safe queue.'}
      </p>

      {!authenticated && chainId && safeAddress && <WalletConnectionWarning />}

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-xl border border-current/20 px-3 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      {safeApiUnavailable && <SafeProposalServiceNotice />}

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

          {quoteState.status === 'loading' && (
            <div className="rounded-xl border border-dashed px-3 py-3 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                <p>Loading ENS renewal quote...</p>
              </div>
            </div>
          )}

          {quoteSnapshot && (
            <div className="rounded-xl border px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">Quoted renewal price</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Latest quote from the ENS controller for {ensName}.
                  </p>
                </div>
                <div className="text-right">
                  {quoteSnapshot.estimatedTotalUsd ? (
                    <>
                      <p className="text-foreground text-xl font-bold">
                        ${quoteSnapshot.estimatedTotalUsd}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Estimated total
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm font-medium">
                        {quoteSnapshot.totalEth} ETH
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-foreground text-xl font-bold">
                        {quoteSnapshot.totalEth} ETH
                      </p>
                      <p className="text-muted-foreground text-xs">
                        USD estimate unavailable
                      </p>
                    </>
                  )}
                </div>
              </div>
              <details className="mt-3">
                <summary className="text-muted-foreground cursor-pointer text-xs font-medium select-none">
                  Advanced quote details
                </summary>
                <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                  <p>Base: {quoteSnapshot.baseEth} ETH</p>
                  {quoteSnapshot.premiumWei !== '0' && (
                    <p>Premium: {quoteSnapshot.premiumEth} ETH</p>
                  )}
                  <p>Raw value: {quoteSnapshot.totalWei} wei</p>
                </div>
                <RenewalValueInput
                  valueState={valueState}
                  setValueState={setValueState}
                  placeholder={renewalValuePlaceholder}
                  disabled={isRenewalValueDisabled}
                  helperText={renewalValueHelperText}
                  showOverrideControls={Boolean(quoteSnapshot)}
                />
              </details>
            </div>
          )}

          {quoteState.status === 'error' && (
            <div className="rounded-xl border border-dashed px-4 py-3 text-sm">
              <p className="font-medium">Quote unavailable</p>
              <p className="text-muted-foreground mt-1">{quoteState.error}</p>
              {!valueState.manualOverrideEnabled && (
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setValueState((current) =>
                        enableManualRenewalOverride(current)
                      )
                    }
                  >
                    Enter manual override
                  </Button>
                </div>
              )}
              <details className="mt-3" open>
                <summary className="text-muted-foreground cursor-pointer text-xs font-medium select-none">
                  Advanced quote details
                </summary>
                <RenewalValueInput
                  valueState={valueState}
                  setValueState={setValueState}
                  placeholder={renewalValuePlaceholder}
                  disabled={isRenewalValueDisabled}
                  helperText={renewalValueHelperText}
                  showOverrideControls={false}
                />
              </details>
            </div>
          )}

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
