'use client'

import { Info, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isAddress } from 'viem'

import {
  type CostBreakdown,
  useCompanyRegistration,
} from '@/hooks/use-company-registration'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { calculateThreshold } from '@/lib/blockchain/safe-factory'
import { type Shareholder, useDraftStore } from '@/lib/store/draft'

const LOG_PREFIX = '[UI:SetupWizard]'

interface SetupWizardProps {
  initialEnsName: string
}

function CostBreakdownCard({
  costs,
  isLoading,
}: {
  costs: CostBreakdown | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">
            Calculating costs...
          </span>
        </div>
      </div>
    )
  }

  if (!costs) return null

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Info className="h-5 w-5" />
        Registration Cost
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ENS Registration (1 year)</span>
          <span className="font-mono">{costs.ensRegistrationCostEth} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Safe Wallet Deployment</span>
          <span className="font-mono">~{costs.safeDeploymentCostEth} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Service Fee (25%)
            <span className="ml-1 text-xs opacity-70">
              — supports StartupChain development
            </span>
          </span>
          <span className="font-mono">{costs.serviceFeeEth} ETH</span>
        </div>
        <div className="border-border border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-primary font-mono text-lg font-bold">
              {costs.totalEth} ETH
            </span>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        You will pay this amount from your connected wallet. The service fee
        helps maintain and improve StartupChain.
      </p>
    </div>
  )
}

function RegistrationProgress({
  step,
  countdown,
  paymentTxHash,
}: {
  step: string
  countdown: number | null
  treasuryAddress?: string | null
  paymentTxHash?: string | null
}) {
  const stepLabels: Record<string, string> = {
    checking: 'Checking availability...',
    'awaiting-payment': 'Waiting for payment...',
    'payment-pending': 'Confirming payment...',
    committing: 'Submitting commitment transaction...',
    waiting: `Waiting for commitment window (${countdown ?? 0}s remaining)`,
    'deploying-safe': 'Creating your Safe wallet...',
    'registering-ens': 'Registering ENS name to your Safe...',
    'registering-company': 'Recording company on-chain...',
    completed: 'Registration complete!',
    failed: 'Registration failed',
  }

  const stepProgress: Record<string, number> = {
    idle: 0,
    checking: 5,
    'awaiting-payment': 10,
    'payment-pending': 15,
    committing: 25,
    waiting: 40,
    'deploying-safe': 55,
    'registering-ens': 70,
    'registering-company': 85,
    completed: 100,
    failed: 0,
  }

  return (
    <div className="border-primary/20 bg-primary/5 rounded-2xl border p-6">
      <div className="mb-3 flex items-center gap-3">
        {step !== 'completed' && step !== 'failed' && (
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        )}
        <span className="font-medium">{stepLabels[step] || step}</span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${stepProgress[step] ?? 0}%` }}
        />
      </div>
      {step === 'payment-pending' && paymentTxHash && (
        <p className="text-muted-foreground mt-3 text-xs font-mono">
          Tx: {paymentTxHash.slice(0, 10)}...{paymentTxHash.slice(-8)}
        </p>
      )}
    </div>
  )
}

export function SetupWizard({ initialEnsName }: SetupWizardProps) {
  const router = useRouter()
  const { connect, authenticated, user } = useWalletAuth()
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
    reset,
    safeAddress,
    treasuryAddress,
    paymentTxHash,
    isSendingPayment,
    isConfirmingPayment,
  } = useCompanyRegistration()

  const [isLoadingCosts, setIsLoadingCosts] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const draft = useDraftStore((state) => state.draft)
  const initializeDraft = useDraftStore((state) => state.initializeDraft)
  const addShareholder = useDraftStore((state) => state.addShareholder)
  const removeShareholder = useDraftStore((state) => state.removeShareholder)
  const updateShareholder = useDraftStore((state) => state.updateShareholder)
  const setFounderMode = useDraftStore((state) => state.setFounderMode)
  const setCustomAddress = useDraftStore((state) => state.setCustomAddress)
  const setRegisterToDifferentAddress = useDraftStore(
    (state) => state.setRegisterToDifferentAddress
  )

  // Initialize draft
  useEffect(() => {
    if (!draft) {
      initializeDraft(initialEnsName)
    }
  }, [draft, initialEnsName, initializeDraft])

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
  }, [draft, authenticated, initialEnsName, calculateCosts, draft?.shareholders.length])

  // Auto-complete registration when commitment window is ready
  useEffect(() => {
    if (canComplete && step === 'waiting') {
      console.log(LOG_PREFIX, 'canComplete=true, step=waiting -> calling completeRegistration')
      completeRegistration()
        .then((result) => {
          console.log(LOG_PREFIX, 'completeRegistration success:', result)
          router.push('/dashboard/ens')
          router.refresh()
        })
        .catch((err) => {
          console.error(LOG_PREFIX, 'Failed to complete registration:', err)
        })
    }
  }, [canComplete, step, completeRegistration, router])

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
    const updates: Partial<Shareholder> = {}

    if (field === 'walletAddress') {
      updates.walletAddress = value
    } else if (field === 'equityPercentage') {
      updates.equityPercentage = Number.parseFloat(value) || 0
    }

    updateShareholder(id, updates)
  }

  const handleCreateBusiness = async () => {
    console.log(LOG_PREFIX, '=== handleCreateBusiness START ===')
    console.log(LOG_PREFIX, 'authenticated:', authenticated)
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

  const isRegistering = step !== 'idle' && step !== 'failed' && step !== 'completed'
  const isAwaitingPayment = step === 'awaiting-payment'
  const isPaymentInProgress = step === 'payment-pending' || isSendingPayment || isConfirmingPayment
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
    <div className="space-y-8">
      <div className="mb-8">
        <div className="mb-2 flex justify-between">
          {['Company Details', 'Founders & Equity', 'Review & Deploy'].map(
            (stepName, index) => (
              <div
                key={stepName}
                className={`flex-1 text-center ${
                  index <= draft.currentStep
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {stepName}
              </div>
            )
          )}
        </div>
        <div className="bg-muted h-2 w-full rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((draft.currentStep + 1) / draft.totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-3">
          <div className="from-secondary to-primary flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br">
            <div className="text-xl font-bold text-white">
              {initialEnsName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="text-foreground text-xl font-semibold">
              {initialEnsName}.eth
            </p>
            <p className="text-muted-foreground text-sm">
              Your ENS business name
            </p>
          </div>
        </div>
      </div>

      {/* Show registration progress when in progress */}
      {isRegistering && (
        <RegistrationProgress
          step={step}
          countdown={countdown}
          paymentTxHash={paymentTxHash}
        />
      )}

      {/* Payment step - show when awaiting payment */}
      {isAwaitingPayment && costBreakdown && (
        <div className="border-primary/20 bg-primary/5 rounded-2xl border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Confirm Payment</h3>
          <p className="text-muted-foreground text-sm">
            Send {costBreakdown.totalEth} ETH to the StartupChain treasury to begin registration.
            This covers ENS registration, Safe deployment, and service fees.
          </p>
          {treasuryAddress && (
            <p className="text-muted-foreground text-xs font-mono">
              Treasury: {treasuryAddress}
            </p>
          )}
          <button
            type="button"
            onClick={handleSendPayment}
            disabled={isPaymentInProgress}
            className="bg-primary text-background hover:bg-primary/90 w-full rounded-2xl px-8 py-4 text-lg font-semibold transition-all duration-200 disabled:opacity-50"
          >
            {isPaymentInProgress ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {isSendingPayment ? 'Confirm in wallet...' : 'Confirming payment...'}
              </span>
            ) : (
              `Pay ${costBreakdown.totalEth} ETH`
            )}
          </button>
        </div>
      )}

      {/* Hide form fields during registration or payment */}
      {!isRegistering && !isAwaitingPayment && (
        <>
          <div className="border-border bg-card rounded-2xl border p-6">
            <h3 className="mb-4 text-lg font-semibold">Company Structure</h3>
            <div className="bg-background flex rounded-2xl p-1">
              <button
                type="button"
                onClick={() => handleFounderModeChange(false)}
                className={`flex-1 cursor-pointer rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  !draft.isMultipleFounders
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Solo founder
              </button>
              <button
                type="button"
                onClick={() => handleFounderModeChange(true)}
                className={`flex-1 cursor-pointer rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  draft.isMultipleFounders
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Multiple founders
              </button>
            </div>
          </div>

          {!draft.isMultipleFounders && (
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="different-address"
                  checked={draft.registerToDifferentAddress}
                  onChange={(event) =>
                    setRegisterToDifferentAddress(event.currentTarget.checked)
                  }
                  className="border-border text-primary focus:ring-primary rounded border"
                />
                <label
                  htmlFor="different-address"
                  className="text-foreground text-sm"
                >
                  Register ENS to a different address
                </label>
              </div>
              {draft.registerToDifferentAddress && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Enter ETH address (0x...)"
                    value={draft.customAddress}
                    onChange={(event) => setCustomAddress(event.target.value)}
                    className="border-border bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary w-full rounded-2xl border px-4 py-3 text-lg transition-all duration-200 focus:ring-2"
                  />
                  <p className="text-muted-foreground mt-2 text-sm">
                    The ENS name will be registered to this address instead of
                    your wallet.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="border-border bg-card rounded-2xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {draft.isMultipleFounders ? 'Founders & Equity' : 'Your Details'}
              </h3>
              {draft.isMultipleFounders && (
                <div
                  className={`text-lg font-medium ${
                    Math.abs(totalEquity - 100) < 0.01
                      ? 'text-primary'
                      : 'text-destructive'
                  }`}
                >
                  Total: {totalEquity.toFixed(1)}%
                </div>
              )}
            </div>

            <div className="space-y-3">
              {draft.shareholders.map((founder) => (
                <div
                  key={founder.id}
                  className="border-border rounded-xl border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Email or ETH address"
                        value={founder.walletAddress}
                        onChange={(event) =>
                          handleUpdateFounder(
                            founder.id,
                            'walletAddress',
                            event.target.value
                          )
                        }
                        className="border-border bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary w-full rounded-2xl border px-4 py-3 text-lg transition-all duration-200 focus:ring-2"
                      />
                    </div>

                    {draft.isMultipleFounders && (
                      <div className="w-24">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={founder.equityPercentage}
                            onChange={(event) =>
                              handleUpdateFounder(
                                founder.id,
                                'equityPercentage',
                                event.target.value
                              )
                            }
                            className="border-border bg-background focus:border-primary focus:ring-primary w-full rounded-2xl border px-3 py-3 pr-8 text-center text-lg transition-all duration-200 focus:ring-2"
                          />
                          <div className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-sm">
                            %
                          </div>
                        </div>
                      </div>
                    )}

                    {draft.isMultipleFounders && draft.shareholders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFounder(founder.id)}
                        className="text-muted-foreground hover:text-destructive rounded-2xl p-2 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {draft.isMultipleFounders && (
                <button
                  type="button"
                  onClick={handleAddFounder}
                  className="hover:bg-primary hover:text-background mx-auto flex items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-4 text-lg font-medium transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add Founder
                </button>
              )}
            </div>

            {draft.isMultipleFounders && Math.abs(totalEquity - 100) > 0.01 && (
              <div className="border-destructive/20 bg-destructive/10 mt-4 rounded-2xl border p-3">
                <p className="text-destructive text-sm font-medium">
                  Equity must total 100%. Currently: {totalEquity.toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Cost breakdown - only show when authenticated */}
          {authenticated && (
            <CostBreakdownCard costs={costBreakdown} isLoading={isLoadingCosts} />
          )}
        </>
      )}

      {error && (
        <div className="border-destructive/20 bg-destructive/10 rounded-2xl border p-3">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      {!isRegistering && !isAwaitingPayment && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCreateBusiness}
            disabled={disableCreateButton}
            className={createButtonClasses}
          >
            {isLoadingCosts
              ? 'Calculating costs...'
              : !authenticated
                ? 'Connect Wallet & Create'
                : costBreakdown
                  ? `Continue to Payment (${costBreakdown.totalEth} ETH)`
                  : 'Create Business'}
          </button>
        </div>
      )}
    </div>
  )
}
