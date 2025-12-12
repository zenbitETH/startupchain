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
import { PaymentStep } from './payment-step'
import { RegistrationProgressCard } from './registration-progress-card'
import { WizardStepsIndicator } from './wizard-steps-indicator'

const LOG_PREFIX = '[UI:SetupWizard]'

interface SetupWizardProps {
  initialEnsName: string
}

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
      completeRegistration()
        .then((result) => {
          console.log(LOG_PREFIX, 'completeRegistration success:', result)
          // Only redirect when fully completed (after user signs recordCompany)
          // If status is 'ready-to-record', stay on page for user to sign
          if (result.status === 'completed') {
            router.push('/dashboard/ens')
            router.refresh()
          }
          // If 'ready-to-record', the hook will set step to 'awaiting-signature'
          // and auto-trigger/show button for user signing
        })
        .catch((err) => {
          console.error(LOG_PREFIX, 'Failed to complete registration:', err)
        })
    }
  }, [canComplete, step, completeRegistration, router])

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

      console.log(LOG_PREFIX, 'Calling initializeRegistration...')
      const result = await initializeRegistration({
        ensName: initialEnsName,
        founders,
        threshold,
        durationYears: 1,
      })
      console.log(LOG_PREFIX, 'initializeRegistration result:', result)

      // Now in 'awaiting-payment' step - UI will show payment button
    } catch (err) {
      console.error(LOG_PREFIX, 'Failed to initialize registration:', err)
    }
  }

  const handleSendPayment = () => {
    console.log(LOG_PREFIX, '=== handleSendPayment START ===')
    console.log(LOG_PREFIX, 'Sending payment to treasury:', treasuryAddress)
    console.log(LOG_PREFIX, 'Amount:', costBreakdown?.totalEth, 'ETH')
    sendPayment()
  }

  const isRegistering =
    step !== 'idle' && step !== 'failed' && step !== 'completed'
  const isAwaitingPayment = step === 'awaiting-payment'
  const error = registrationError || localError

  const disableCreateButton =
    isRegistering ||
    isLoadingCosts ||
    (!authenticated &&
      draft.shareholders.some((founder) => !founder.walletAddress.trim())) ||
    (draft.isMultipleFounders && Math.abs(totalEquity - 100) > 0.01) ||
    (draft.registerToDifferentAddress && !draft.customAddress.trim())

  const createButtonClasses = [
    'rounded-2xl px-8 py-4 text-lg font-semibold transition-all duration-200',
    'disabled:cursor-not-allowed disabled:opacity-50',
    disableCreateButton
      ? 'bg-muted text-muted-foreground'
      : 'bg-primary text-background hover:bg-primary/90 hover:text-white',
  ].join(' ')

  return (
    <div className="space-y-6">
      <WizardStepsIndicator
        currentStep={draft.currentStep}
        totalSteps={draft.totalSteps}
      />

      {/* Show registration progress when in progress */}
      {isRegistering && (
        <div className="mx-auto max-w-2xl">
          <EnsNameCard ensName={initialEnsName} />
          <div className="mt-6">
            <RegistrationProgressCard
              step={step}
              countdown={countdown}
              paymentTxHash={paymentTxHash}
              onSign={signRecordCompany}
            />
          </div>
        </div>
      )}

      {/* Payment step - show when awaiting payment */}
      {isAwaitingPayment && costBreakdown && (
        <div className="mx-auto max-w-2xl">
          <EnsNameCard ensName={initialEnsName} />
          <div className="mt-6">
            <PaymentStep
              costBreakdown={costBreakdown}
              treasuryAddress={treasuryAddress}
              isSendingPayment={isSendingPayment}
              isConfirmingPayment={isConfirmingPayment}
              onSendPayment={handleSendPayment}
            />
          </div>
        </div>
      )}

      {/* Hide form fields during registration or payment */}
      {!isRegistering && !isAwaitingPayment && (
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

          <div className="space-y-6">
            {/* Cost breakdown - only show when authenticated */}
            {authenticated && (
              <CostBreakdownCard
                costs={costBreakdown}
                isLoading={isLoadingCosts}
              />
            )}

            {error && (
              <div className="border-destructive/20 bg-destructive/10 rounded-xl border p-3">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateBusiness}
              disabled={disableCreateButton}
              className={`${createButtonClasses} w-full`}
            >
              {isLoadingCosts
                ? 'Calculating...'
                : !authenticated
                  ? 'Connect Wallet'
                  : costBreakdown
                    ? `Pay ${parseFloat(costBreakdown.totalEth).toFixed(5)} ETH`
                    : 'Create Business'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
