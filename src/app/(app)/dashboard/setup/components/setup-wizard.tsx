'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { isAddress } from 'viem'

import {
  resolveFounderIdentityAction,
  type FounderIdentityResolution,
} from '../actions'
import { useCompanyRegistration } from '@/hooks/use-company-registration'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { calculateThreshold } from '@/lib/blockchain/safe-factory'
import { STARTUPCHAIN_CHAIN_ID } from '@/lib/blockchain/startupchain-config'
import { useDraftStore } from '@/lib/store/draft'

import { CostBreakdownCard } from './cost-breakdown-card'
import {
  clearFounderValidationTimer,
  createIdleFounderValidation,
  scheduleFounderValidation,
  shouldApplyFounderResolution,
  type FounderValidationState,
} from './founder-validation-utils'
import { FoundersForm } from './founders-form'
import { RegistrationProgressCard } from './registration-progress-card'

const LOG_PREFIX = '[UI:SetupWizard]'

interface SetupWizardProps {
  initialEnsName: string
}

type FounderValidationMap = Record<string, FounderValidationState | undefined>

interface FounderValidationResult {
  founderId: string
  valid: boolean
  resolvedAddress: string | null
}
const FOUNDER_VALIDATION_DEBOUNCE_MS = 350

const launchSteps = new Set([
  'awaiting-payment',
  'payment-pending',
  'committing',
  'waiting',
  'deploying-safe',
  'registering-ens',
  'awaiting-signature',
  'signing-company',
  'completed',
])

export function SetupWizard({ initialEnsName }: SetupWizardProps) {
  const router = useRouter()
  const {
    connect,
    authenticated,
    user,
    chainId: walletChainId,
  } = useWalletAuth()
  const {
    step,
    failedPhase,
    countdown,
    error: registrationError,
    costBreakdown,
    canComplete,
    calculateCosts,
    initializeRegistration,
    sendPayment,
    completeRegistration,
    treasuryAddress,
    paymentTxHash,
    isSendingPayment,
    isConfirmingPayment,
    signRecordCompany,
    isSubmittingCompanySignature,
    retryCurrentPhase,
    reset,
  } = useCompanyRegistration()

  const [isLoadingCosts, setIsLoadingCosts] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [validationByFounderId, setValidationByFounderId] =
    useState<FounderValidationMap>({})
  const validationTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout> | undefined>
  >({})
  const validationVersionByFounderIdRef = useRef<Record<string, number>>({})

  // Use wallet chain or fall back to default
  const chainId = walletChainId ?? STARTUPCHAIN_CHAIN_ID

  const draft = useDraftStore((state) => state.draft)
  const initializeDraft = useDraftStore((state) => state.initializeDraft)
  const clearDraftIfChainMismatch = useDraftStore(
    (state) => state.clearDraftIfChainMismatch
  )
  const clearDraftIfOwnerMismatch = useDraftStore(
    (state) => state.clearDraftIfOwnerMismatch
  )
  const addShareholder = useDraftStore((state) => state.addShareholder)
  const removeShareholder = useDraftStore((state) => state.removeShareholder)
  const updateShareholder = useDraftStore((state) => state.updateShareholder)
  const setFounderMode = useDraftStore((state) => state.setFounderMode)
  const setCustomAddress = useDraftStore((state) => state.setCustomAddress)
  const setRegisterToDifferentAddress = useDraftStore(
    (state) => state.setRegisterToDifferentAddress
  )

  // Clear draft if chain changed
  useEffect(() => {
    clearDraftIfChainMismatch(chainId)
  }, [chainId, clearDraftIfChainMismatch])

  // Clear draft if different wallet connected (prevents using another user's draft)
  useEffect(() => {
    const userWallet = user?.wallet?.address
    if (userWallet) {
      clearDraftIfOwnerMismatch(userWallet)
    }
  }, [user?.wallet?.address, clearDraftIfOwnerMismatch])

  // Initialize draft
  useEffect(() => {
    if (!draft) {
      const userWallet = user?.wallet?.address
      initializeDraft(initialEnsName, chainId, userWallet)
    }
  }, [draft, initialEnsName, initializeDraft, chainId, user?.wallet?.address])

  // Auto-populate founder with user's wallet
  useEffect(() => {
    if (!authenticated || !user || !draft || draft.shareholders.length > 0) {
      return
    }

    const userWallet = user.wallet?.address
    if (userWallet && isAddress(userWallet)) {
      addShareholder(userWallet, 100)
    }
  }, [authenticated, user, draft, addShareholder])

  // Keep founder validation map in sync with current shareholder rows.
  // Auto-mark the single read-only founder row as valid when it already has a 0x address.
  useEffect(() => {
    if (!draft) {
      return
    }

    setValidationByFounderId((previous) => {
      const next: FounderValidationMap = {}
      let changed = Object.keys(previous).length !== draft.shareholders.length

      draft.shareholders.forEach((founder, index) => {
        const existing = previous[founder.id]
        const founderInput = founder.walletAddress

        if (existing && existing.input === founderInput) {
          next[founder.id] = existing
          return
        }

        const autoMarkAsValidAddress =
          !draft.isMultipleFounders &&
          index === 0 &&
          Boolean(founderInput.trim()) &&
          isAddress(founderInput.trim())

        if (autoMarkAsValidAddress) {
          next[founder.id] = {
            status: 'valid',
            input: founderInput,
            resolvedAddress: founderInput.trim(),
            ensName: null,
            source: 'address',
            error: null,
          }
        } else {
          next[founder.id] = createIdleFounderValidation(founderInput)
        }

        changed = true
      })

      return changed ? next : previous
    })
  }, [draft])

  // Clear timers/version slots for founders removed from the form.
  useEffect(() => {
    if (!draft) {
      return
    }

    const activeFounderIds = new Set(draft.shareholders.map((founder) => founder.id))
    const timerFounderIds = Object.keys(validationTimersRef.current)

    timerFounderIds.forEach((founderId) => {
      if (!activeFounderIds.has(founderId)) {
        clearFounderValidationTimer(founderId, validationTimersRef.current)
        delete validationVersionByFounderIdRef.current[founderId]
      }
    })
  }, [draft])

  // Prevent debounce timers from firing after unmount.
  useEffect(() => {
    const timers = validationTimersRef.current
    return () => {
      const founderIds = Object.keys(timers)
      founderIds.forEach((founderId) => {
        clearFounderValidationTimer(founderId, timers)
      })
    }
  }, [])

  // Load costs when draft is ready
  useEffect(() => {
    if (!draft || !authenticated) return

    console.log(LOG_PREFIX, 'Loading costs for ENS:', initialEnsName)
    setIsLoadingCosts(true)
    const founderCount = Math.max(1, draft.shareholders.length)
    calculateCosts(initialEnsName, 1, founderCount)
      .then((costs) => {
        console.log(LOG_PREFIX, 'Costs calculated:', costs)
      })
      .catch((err) => {
        console.error(LOG_PREFIX, 'Failed to calculate costs:', err)
      })
      .finally(() => {
        setIsLoadingCosts(false)
      })
  }, [
    draft,
    authenticated,
    initialEnsName,
    calculateCosts,
    draft?.shareholders.length,
  ])

  // Auto-complete registration when commitment window is ready
  useEffect(() => {
    if (canComplete && step === 'waiting') {
      console.log(
        LOG_PREFIX,
        'canComplete=true, step=waiting -> calling completeRegistration'
      )
      completeRegistration().catch((err) => {
        console.error(LOG_PREFIX, 'Failed to complete registration:', err)
      })
    }
  }, [canComplete, step, completeRegistration])

  // Redirect when registration is fully completed (after user signs recordCompany)
  useEffect(() => {
    if (step === 'completed') {
      console.log(LOG_PREFIX, 'Registration completed! Redirecting to dashboard...')
      router.push('/dashboard/ens')
      router.refresh()
    }
  }, [step, router])

  if (!draft) {
    return <div className="text-muted-foreground text-sm">Loading wizard…</div>
  }

  const totalEquity = draft.shareholders.reduce(
    (sum, founder) => sum + founder.equityPercentage,
    0
  )

  const applyFounderResolution = (
    input: string,
    resolution: FounderIdentityResolution
  ): FounderValidationState => {
    if (resolution.error || !resolution.resolvedAddress) {
      return {
        status: 'invalid',
        input,
        resolvedAddress: null,
        ensName: resolution.ensName,
        source: resolution.source,
        error: resolution.error || 'Unable to resolve founder identity.',
      }
    }

    return {
      status: 'valid',
      input,
      resolvedAddress: resolution.resolvedAddress,
      ensName: resolution.ensName,
      source: resolution.source,
      error: null,
    }
  }

  const getNextFounderValidationVersion = (founderId: string) => {
    const nextVersion = (validationVersionByFounderIdRef.current[founderId] ?? 0) + 1
    validationVersionByFounderIdRef.current[founderId] = nextVersion
    return nextVersion
  }

  const validateFounderById = async (
    founderId: string,
    options?: {
      inputOverride?: string
      requestVersion?: number
      setValidatingState?: boolean
    }
  ): Promise<FounderValidationResult> => {
    const currentDraft = useDraftStore.getState().draft
    const founder = currentDraft?.shareholders.find(
      (candidate) => candidate.id === founderId
    )

    if (!founder) {
      return { founderId, valid: false, resolvedAddress: null }
    }

    const founderInput = (options?.inputOverride ?? founder.walletAddress).trim()
    if (!founderInput) {
      setValidationByFounderId((previous) => ({
        ...previous,
        [founderId]: createIdleFounderValidation(founder.walletAddress),
      }))
      return { founderId, valid: false, resolvedAddress: null }
    }

    const requestVersion =
      options?.requestVersion ?? validationVersionByFounderIdRef.current[founderId] ?? 0

    if (options?.setValidatingState !== false) {
      setValidationByFounderId((previous) => ({
        ...previous,
        [founderId]: {
          status: 'validating',
          input: founder.walletAddress,
          resolvedAddress: null,
          ensName: null,
          source: null,
          error: null,
        },
      }))
    }

    try {
      const resolution = await resolveFounderIdentityAction(founderInput)
      const latestDraft = useDraftStore.getState().draft
      const latestFounder = latestDraft?.shareholders.find(
        (candidate) => candidate.id === founderId
      )

      if (!latestFounder || latestFounder.walletAddress.trim() !== founderInput) {
        return { founderId, valid: false, resolvedAddress: null }
      }

      const shouldApplyResult = shouldApplyFounderResolution({
        requestVersion,
        latestVersion: validationVersionByFounderIdRef.current[founderId] ?? 0,
        requestInput: founderInput,
        latestInput: latestFounder.walletAddress,
      })
      if (!shouldApplyResult) {
        return { founderId, valid: false, resolvedAddress: null }
      }

      const nextValidation = applyFounderResolution(
        latestFounder.walletAddress,
        resolution
      )

      setValidationByFounderId((previous) => ({
        ...previous,
        [founderId]: nextValidation,
      }))

      return {
        founderId,
        valid:
          nextValidation.status === 'valid' && !!nextValidation.resolvedAddress,
        resolvedAddress: nextValidation.resolvedAddress,
      }
    } catch (error) {
      const latestDraft = useDraftStore.getState().draft
      const latestFounder = latestDraft?.shareholders.find(
        (candidate) => candidate.id === founderId
      )
      if (!latestFounder) {
        return { founderId, valid: false, resolvedAddress: null }
      }

      const shouldApplyError = shouldApplyFounderResolution({
        requestVersion,
        latestVersion: validationVersionByFounderIdRef.current[founderId] ?? 0,
        requestInput: founderInput,
        latestInput: latestFounder.walletAddress,
      })
      if (!shouldApplyError) {
        return { founderId, valid: false, resolvedAddress: null }
      }

      setValidationByFounderId((previous) => ({
        ...previous,
        [founderId]: {
          status: 'invalid',
          input: latestFounder.walletAddress,
          resolvedAddress: null,
          ensName: null,
          source: null,
          error: 'Unable to resolve ENS right now. Try again or use a 0x address.',
        },
      }))

      console.error(LOG_PREFIX, 'Founder validation failed:', error)
      return { founderId, valid: false, resolvedAddress: null }
    }
  }

  const queueFounderValidation = (founderId: string, input: string) => {
    const requestVersion = getNextFounderValidationVersion(founderId)
    scheduleFounderValidation({
      founderId,
      input,
      delayMs: FOUNDER_VALIDATION_DEBOUNCE_MS,
      timers: validationTimersRef.current,
      onDebouncedValidate: (debouncedFounderId, debouncedInput) => {
        setValidationByFounderId((previous) => ({
          ...previous,
          [debouncedFounderId]: {
            status: 'validating',
            input: debouncedInput,
            resolvedAddress: null,
            ensName: null,
            source: null,
            error: null,
          },
        }))
        validateFounderById(debouncedFounderId, {
          inputOverride: debouncedInput,
          requestVersion,
          setValidatingState: false,
        }).catch((error) => {
          console.error(LOG_PREFIX, 'Founder debounce validation failed:', error)
        })
      },
    })
  }

  const handleFounderModeChange = (isMultiple: boolean) => {
    setFounderMode(isMultiple)
  }

  const handleAddFounder = () => {
    addShareholder('', 0)
  }

  const handleRemoveFounder = (id: string) => {
    removeShareholder(id)
  }

  const handleUpdateFounder = (
    id: string,
    field: 'walletAddress' | 'equityPercentage',
    value: string
  ) => {
    if (field === 'equityPercentage') {
      updateShareholder(id, { equityPercentage: Number.parseFloat(value) || 0 })
    }
  }

  const handleFounderInputChange = (founderId: string, value: string) => {
    updateShareholder(founderId, { walletAddress: value })
    setValidationByFounderId((previous) => ({
      ...previous,
      [founderId]: createIdleFounderValidation(value),
    }))

    const trimmedValue = value.trim()
    if (!trimmedValue) {
      getNextFounderValidationVersion(founderId)
      clearFounderValidationTimer(founderId, validationTimersRef.current)
      return
    }

    queueFounderValidation(founderId, value)
  }

  const handleCreateBusiness = async () => {
    console.log(LOG_PREFIX, '=== handleCreateBusiness START ===')
    console.log(LOG_PREFIX, 'authenticated:', authenticated)
    console.log(LOG_PREFIX, 'Connected wallet:', user?.wallet?.address)
    console.log(LOG_PREFIX, 'Draft owner wallet:', draft?.ownerWallet)
    console.log(LOG_PREFIX, 'Draft shareholders:', draft?.shareholders)

    if (!authenticated) {
      console.log(LOG_PREFIX, 'Not authenticated, calling connect()')
      await connect()
      return
    }

    if (draft.registerToDifferentAddress && !draft.customAddress.trim()) {
      setLocalError('Please enter a valid registration address')
      return
    }

    setLocalError(null)

    try {
      const validationResults = await Promise.all(
        draft.shareholders.map((founder) => {
          clearFounderValidationTimer(founder.id, validationTimersRef.current)
          const requestVersion = getNextFounderValidationVersion(founder.id)
          return validateFounderById(founder.id, { requestVersion })
        })
      )
      const hasInvalidFounder = validationResults.some(
        (result) => !result.valid || !result.resolvedAddress
      )

      if (hasInvalidFounder) {
        return
      }

      const resolvedAddressByFounderId = new Map(
        validationResults.map((result) => [
          result.founderId,
          result.resolvedAddress,
        ])
      )

      const founders = draft.shareholders.map(
        ({ id, equityPercentage }) => ({
          address: resolvedAddressByFounderId.get(id) || '',
          equity: equityPercentage.toString(),
        })
      )

      const threshold = calculateThreshold(founders.length)
      console.log(LOG_PREFIX, 'Prepared founders:', founders)
      console.log(
        LOG_PREFIX,
        'Founder addresses being sent:',
        founders.map((f) => f.address)
      )
      console.log(LOG_PREFIX, 'Threshold:', threshold)

      await initializeRegistration({
        ensName: initialEnsName,
        founders,
        threshold,
        durationYears: 1,
      })
    } catch (err) {
      console.error(LOG_PREFIX, 'Failed to initialize registration:', err)
    }
  }

  const handleSendPayment = async () => {
    if (!authenticated) {
      await connect()
      return
    }

    console.log(LOG_PREFIX, '=== handleSendPayment START ===')
    console.log(LOG_PREFIX, 'Sending payment to treasury:', treasuryAddress)
    console.log(LOG_PREFIX, 'Amount:', costBreakdown?.totalEth, 'ETH')
    sendPayment()
  }

  const handleRetryPhase = () => {
    retryCurrentPhase().catch((err) => {
      console.error(LOG_PREFIX, 'Retry failed:', err)
    })
  }

  const error = registrationError || localError
  const isPaymentInFlight = isSendingPayment || isConfirmingPayment
  const paymentAmountEth = costBreakdown
    ? parseFloat(costBreakdown.totalEth).toFixed(5)
    : null

  const showLaunchFailure =
    step === 'failed' &&
    (Boolean(treasuryAddress) ||
      Boolean(paymentTxHash) ||
      failedPhase === 'safe' ||
      failedPhase === 'startupchain')
  const showLaunchSurface = launchSteps.has(step) || showLaunchFailure

  const hasUnresolvedFounderIdentity =
    authenticated &&
    draft.shareholders.some((founder) => {
      const founderInput = founder.walletAddress.trim()
      if (!founderInput) {
        return true
      }

      const validation = validationByFounderId[founder.id]
      if (!validation) {
        return true
      }

      if (validation.status === 'validating' || validation.status === 'invalid') {
        return true
      }

      if (validation.status === 'idle') {
        return true
      }

      return (
        validation.input.trim() !== founderInput || !validation.resolvedAddress
      )
    })

  const disableCreateButton =
    step !== 'idle' ||
    isLoadingCosts ||
    (!authenticated &&
      draft.shareholders.some((founder) => !founder.walletAddress.trim())) ||
    hasUnresolvedFounderIdentity ||
    (draft.isMultipleFounders && Math.abs(totalEquity - 100) > 0.01) ||
    (draft.registerToDifferentAddress && !draft.customAddress.trim())

  return (
    <div className="space-y-10">
      <section className="bg-card border-border relative overflow-hidden rounded-2xl border p-6 shadow-sm md:p-8">
        <div className="from-primary/12 via-primary/6 pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r to-transparent" />
        <div className="relative">
          <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            Create Company
          </p>
          <h2 className="text-foreground mt-2 min-w-0 break-words text-2xl font-semibold tracking-tight md:text-3xl">
            Launch <span className="break-all">{initialEnsName}.eth</span> with confidence
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            You’ll see every step clearly: ENS identity, Safe treasury, and final
            StartupChain registration.
          </p>
        </div>
      </section>

      {showLaunchSurface ? (
        <div className="space-y-6">
          <RegistrationProgressCard
            step={step}
            countdown={countdown}
            error={error}
            failedPhase={failedPhase}
            paymentAmountEth={paymentAmountEth}
            permissionDenied={step === 'awaiting-payment' && !authenticated}
            isPaymentInFlight={isPaymentInFlight}
            onPayAndStart={handleSendPayment}
            onSign={signRecordCompany}
            isSignSubmitting={isSubmittingCompanySignature}
            onRetry={handleRetryPhase}
            onBackToEdit={step === 'awaiting-payment' ? reset : undefined}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            <FoundersForm
              shareholders={draft.shareholders}
              isMultipleFounders={draft.isMultipleFounders}
              registerToDifferentAddress={draft.registerToDifferentAddress}
              customAddress={draft.customAddress}
              onFounderModeChange={handleFounderModeChange}
              onAddFounder={handleAddFounder}
              onRemoveFounder={handleRemoveFounder}
              onUpdateFounder={handleUpdateFounder}
              onFounderInputChange={handleFounderInputChange}
              validationByFounderId={validationByFounderId}
              onRegisterToDifferentAddressChange={setRegisterToDifferentAddress}
              onCustomAddressChange={setCustomAddress}
            />
          </div>

          <aside className="space-y-5">
            {authenticated && (
              <CostBreakdownCard costs={costBreakdown} isLoading={isLoadingCosts} />
            )}

            {error && (
              <div className="border-destructive/30 bg-destructive/10 rounded-2xl border p-3">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateBusiness}
              disabled={disableCreateButton}
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring w-full rounded-2xl px-6 py-4 text-base font-semibold transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
            >
              {isLoadingCosts
                ? 'Preparing launch...'
                : !authenticated
                  ? 'Connect Wallet'
                  : 'Continue to launch'}
            </button>
            <p className="text-muted-foreground text-xs">
              Next screen will ask for one payment, then guide you through the 3
              launch phases.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
