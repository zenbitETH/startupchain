'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { ENSCostEstimate } from '@/components/ens/ens-cost-estimate'
import { CongratulationsModal } from '@/components/modals/congratulations-modal'
import { CountdownModal } from '@/components/modals/countdown-modal'
import { useSmartWallet } from '@/hooks/use-smart-wallet'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { type Shareholder, useDraftStore } from '@/lib/store/draft'

interface SetupWizardProps {
  initialEnsName: string
}

export function SetupWizard({ initialEnsName }: SetupWizardProps) {
  const router = useRouter()
  const { connect, authenticated, user } = useWalletAuth()
  const {
    createBusinessAccount,
    isCreating,
    error,
    businessAccount,
    transactionHashes,
    showCongratulations,
    setShowCongratulations,
    commitmentCountdown,
    pendingTxHash,
    isWaitingForReceipt,
  } = useSmartWallet()

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

  useEffect(() => {
    if (!draft) {
      initializeDraft(initialEnsName)
    }
  }, [draft, initialEnsName, initializeDraft])

  useEffect(() => {
    if (!authenticated || !user || !draft || draft.shareholders.length > 0) {
      return
    }

    const fallbackAddress =
      user.wallet?.address || user.email?.address || user.phone?.number || ''

    addShareholder(fallbackAddress, 100)
  }, [authenticated, user, draft, addShareholder])

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
    if (!authenticated) {
      await connect()
      return
    }

    if (draft.registerToDifferentAddress && !draft.customAddress.trim()) {
      return
    }

    try {
      const registrationAddress = draft.registerToDifferentAddress
        ? draft.customAddress
        : undefined

      const founders = draft.shareholders.map(
        ({ walletAddress, equityPercentage }) => ({
          address: walletAddress,
          equity: equityPercentage.toString(),
        })
      )

      await createBusinessAccount(initialEnsName, founders, registrationAddress)
    } catch (err) {
      console.error('Failed to create business:', err)
    }
  }

  const disableCreateButton =
    isCreating ||
    isWaitingForReceipt ||
    pendingTxHash !== null ||
    commitmentCountdown !== null ||
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
            (step, index) => (
              <div
                key={step}
                className={`flex-1 text-center ${
                  index <= draft.currentStep
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {step}
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
          <div className="from-secondary to-primary flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br">
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
                The ENS name will be registered to this address instead of your
                wallet.
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

      {error && (
        <div className="border-destructive/20 bg-destructive/10 rounded-2xl border p-3">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCreateBusiness}
          disabled={disableCreateButton}
      className={createButtonClasses}
    >
      {commitmentCountdown !== null
        ? `Waiting… ${commitmentCountdown}s`
        : isCreating || isWaitingForReceipt || pendingTxHash
          ? 'Registering company…'
          : !authenticated
            ? 'Connect Wallet & Create'
            : 'Create Business'}
        </button>
      </div>

      {businessAccount && (
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => setShowCongratulations(false)}
          ensName={businessAccount.ensName.replace('.eth', '')}
          smartWalletAddress={businessAccount.smartAccountAddress}
          commitTxHash={transactionHashes.commitTx}
          registrationTxHash={transactionHashes.registrationTx}
          onContinue={() => {
            setShowCongratulations(false)
            router.push('/dashboard')
            router.refresh()
          }}
        />
      )}

      <ENSCostEstimate
        ensName={initialEnsName}
        isOpen={false}
        onProceed={() => {}}
        onCancel={() => {}}
      />

      <CountdownModal
        isOpen={commitmentCountdown !== null}
        countdown={commitmentCountdown ?? 0}
      />
    </div>
  )
}
