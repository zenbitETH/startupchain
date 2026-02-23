'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isAddress } from 'viem'

import { useCompanyRegistration } from '@/hooks/use-company-registration'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { calculateThreshold } from '@/lib/blockchain/safe-factory'
import { STARTUPCHAIN_CHAIN_ID } from '@/lib/blockchain/startupchain-config'
import { useDraftStore } from '@/lib/store/draft'

import { CostBreakdownCard } from './cost-breakdown-card'
import { EnsNameCard } from './ens-name-card'
import { FoundersForm } from './founders-form'
import { RegistrationProgressCard } from './registration-progress-card'

const LOG_PREFIX = '[UI:SetupWizard]'

interface SetupWizardProps {
  initialEnsName: string
}

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
    if (field === 'walletAddress') {
      updateShareholder(id, { walletAddress: value })
    } else if (field === 'equityPercentage') {
      updateShareholder(id, { equityPercentage: Number.parseFloat(value) || 0 })
    }
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
      const founders = draft.shareholders.map(
        ({ walletAddress, equityPercentage }) => ({
          address: walletAddress,
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

  const disableCreateButton =
    step !== 'idle' ||
    isLoadingCosts ||
    (!authenticated &&
      draft.shareholders.some((founder) => !founder.walletAddress.trim())) ||
    (draft.isMultipleFounders && Math.abs(totalEquity - 100) > 0.01) ||
    (draft.registerToDifferentAddress && !draft.customAddress.trim())

  return (
    <div className="space-y-10">
      <section className="border-primary/30 bg-card relative overflow-hidden rounded-3xl border p-7 shadow-sm md:p-8">
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
            <EnsNameCard ensName={initialEnsName} />
            <FoundersForm
              shareholders={draft.shareholders}
              isMultipleFounders={draft.isMultipleFounders}
              registerToDifferentAddress={draft.registerToDifferentAddress}
              customAddress={draft.customAddress}
              onFounderModeChange={handleFounderModeChange}
              onAddFounder={handleAddFounder}
              onRemoveFounder={handleRemoveFounder}
              onUpdateFounder={handleUpdateFounder}
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
