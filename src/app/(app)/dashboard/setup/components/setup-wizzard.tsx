'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { parseEther } from 'viem'
import { useWriteContract } from 'wagmi'

import { useEnsCost } from '@/hooks/use-ens-cost'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import {
  useDraftStore,
  type Shareholder,
} from '@/lib/store/draft'

// StartupChain ABI for requestRegistration
const STARTUP_CHAIN_ABI = [
  {
    inputs: [
      { internalType: 'string', name: '_ensName', type: 'string' },
      { internalType: 'address[]', name: '_founders', type: 'address[]' },
    ],
    name: 'requestRegistration',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

// TODO: Get this from env or config
const STARTUP_CHAIN_ADDRESS = process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS as `0x${string}`

interface SetupWizardProps {
  initialEnsName: string
}

export function SetupWizard({ initialEnsName }: SetupWizardProps) {
  const { connect, authenticated, user } = useWalletAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  // Get ENS cost estimate
  const { data: costData, isLoading: isLoadingCost } = useEnsCost(initialEnsName, true)

  // Wagmi write contract hook
  const { writeContractAsync } = useWriteContract()

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
    return <div className="text-sm text-muted-foreground">Loading wizard…</div>
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

    if (!costData?.costs?.costEth) {
      setError('Unable to calculate registration cost. Please try again.')
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      const founders = draft.shareholders.map((f) => f.walletAddress as `0x${string}`)

      // Calculate total value to send (ENS cost + buffer)
      // We use the cost calculated by useEnsCost which already includes buffer
      const valueToSend = costData.costs.costWei

      console.log('📝 Requesting registration...', {
        ensName: initialEnsName,
        founders,
        value: valueToSend.toString(),
      })

      const txHash = await writeContractAsync({
        address: STARTUP_CHAIN_ADDRESS,
        abi: STARTUP_CHAIN_ABI,
        functionName: 'requestRegistration',
        args: [initialEnsName, founders],
        value: valueToSend,
      })

      console.log('✅ Registration requested:', txHash)
      setRegistrationTxHash(txHash)

    } catch (err) {
      console.error('Failed to create business:', err)
      const message = err instanceof Error ? err.message : 'Failed to create business'
      setError(message)
    } finally {
      setIsRegistering(false)
    }
  }

  // Success State
  if (registrationTxHash) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Registration in Progress</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            We are securing <span className="font-semibold text-foreground">{initialEnsName}.eth</span>.
            This takes about 2-3 minutes. You can close this page.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-left text-sm">
          <p className="font-medium text-foreground">Transaction Sent</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
            {registrationTxHash}
          </p>
          <a
            href={`https://sepolia.etherscan.io/tx/${registrationTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            View on Etherscan
          </a>
        </div>

        <a
          href="/dashboard"
          className="rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Go to Dashboard
        </a>
      </div>
    )
  }

  const disableCreateButton =
    isRegistering ||
    isLoadingCost ||
    (!authenticated && draft.shareholders.some((founder) => !founder.walletAddress.trim())) ||
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
          {['Company Details', 'Founders & Equity', 'Review & Deploy'].map((step, index) => (
            <div
              key={step}
              className={`flex-1 text-center ${
                index <= draft.currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((draft.currentStep + 1) / draft.totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary">
            <div className="text-xl font-bold text-white">
              {initialEnsName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">
              {initialEnsName}.eth
            </p>
            <p className="text-sm text-muted-foreground">
              Your ENS business name
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Company Structure</h3>
        <div className="flex rounded-2xl bg-background p-1">
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
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="different-address"
              checked={draft.registerToDifferentAddress}
              onChange={(event) =>
                setRegisterToDifferentAddress(event.currentTarget.checked)
              }
              className="rounded border border-border text-primary focus:ring-primary"
            />
            <label htmlFor="different-address" className="text-sm text-foreground">
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
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                The ENS name will be registered to this address instead of your wallet.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
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
            <div key={founder.id} className="rounded-xl border border-border p-4">
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
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
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
                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 pr-8 text-center text-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </div>
                    </div>
                  </div>
                )}

                {draft.isMultipleFounders && draft.shareholders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFounder(founder.id)}
                    className="rounded-2xl p-2 text-muted-foreground transition-colors hover:text-destructive"
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
              className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-4 text-lg font-medium transition-colors hover:bg-primary hover:text-background"
            >
              <Plus className="h-5 w-5" />
              Add Founder
            </button>
          )}
        </div>

        {draft.isMultipleFounders && Math.abs(totalEquity - 100) > 0.01 && (
          <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">
              Equity must total 100%. Currently: {totalEquity.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCreateBusiness}
          disabled={disableCreateButton}
          className={createButtonClasses}
        >
          {isRegistering ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </span>
          ) : !authenticated ? (
            'Connect Wallet & Create'
          ) : isLoadingCost ? (
            'Calculating Cost…'
          ) : (
            `Register & Create (Pay ${costData?.costs?.costEth || '...'} ETH)`
          )}
        </button>
      </div>
    </div>
  )
}
