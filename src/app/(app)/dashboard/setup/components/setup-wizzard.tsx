'use client'

import { Check, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { parseEther } from 'viem'
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { useEnsCost } from '@/hooks/use-ens-cost'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { type Shareholder, useDraftStore } from '@/lib/store/draft'

const MIN_REQUIRED_PAYMENT = parseEther('0.01')

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
  {
    inputs: [{ internalType: 'string', name: '', type: 'string' }],
    name: 'ensNameToCompanyId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// TODO: Get this from env or config
const STARTUP_CHAIN_ADDRESS = process.env
  .NEXT_PUBLIC_STARTUPCHAIN_ADDRESS as `0x${string}`

interface RegistrationStatusProps {
  txHash: `0x${string}`
  ensName: string
  onSuccess: () => void
}

function RegistrationStatus({
  txHash,
  ensName,
  onSuccess,
}: RegistrationStatusProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [logs, setLogs] = useState<string[]>([
    `Transaction submitted: ${txHash.slice(0, 6)}...${txHash.slice(-4)}`,
  ])

  // 1. Wait for transaction receipt
  const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // 2. Poll for company registration
  const { data: companyId } = useReadContract({
    address: STARTUP_CHAIN_ADDRESS,
    abi: STARTUP_CHAIN_ABI,
    functionName: 'ensNameToCompanyId',
    args: [ensName],
    query: {
      refetchInterval: 3000, // Poll every 3 seconds
      enabled: isTxConfirmed, // Only start polling after tx is confirmed
    },
  })

  // Step transitions
  useEffect(() => {
    if (isTxConfirmed && step === 1) {
      setStep(2)
      setLogs((prev) => [...prev, 'Transaction confirmed on-chain.'])
      // Auto-advance to processing after a brief pause to show the "Confirmed" state
      setTimeout(() => {
        setStep(3)
        setLogs((prev) => [
          ...prev,
          'Waiting for background registration process...',
          'This includes a mandatory 60s ENS waiting period.',
        ])
      }, 1500)
    }
  }, [isTxConfirmed, step])

  useEffect(() => {
    if (companyId && companyId > 0n && step === 3) {
      setStep(4)
      setLogs((prev) => [
        ...prev,
        'Registration successful! Company ID: ' + companyId.toString(),
      ])
      // Small delay before triggering success callback
      setTimeout(() => {
        onSuccess()
        router.push('/dashboard')
      }, 2000)
    }
  }, [companyId, step, onSuccess, router])

  const steps = [
    {
      id: 1,
      name: 'Transaction Submitted',
      status: step > 1 ? 'complete' : 'current',
    },
    {
      id: 2,
      name: 'Transaction Confirmed',
      status: step > 2 ? 'complete' : step === 2 ? 'current' : 'upcoming',
    },
    {
      id: 3,
      name: 'Registration Processing',
      status: step > 3 ? 'complete' : step === 3 ? 'current' : 'upcoming',
    },
    {
      id: 4,
      name: 'Complete!',
      status: step === 4 ? 'complete' : 'upcoming',
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Stepper */}
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center justify-between w-full">
            {steps.map((s, stepIdx) => (
              <li
                key={s.name}
                className={`${
                  stepIdx !== steps.length - 1 ? 'flex-1' : ''
                } relative flex flex-col items-center`}
              >
                <div className="flex items-center w-full">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 z-10 ${
                      s.status === 'complete'
                        ? 'bg-primary border-primary'
                        : s.status === 'current'
                          ? 'border-primary bg-background'
                          : 'border-muted bg-background'
                    }`}
                  >
                    {s.status === 'complete' ? (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : s.status === 'current' ? (
                      <span
                        className="bg-primary h-2.5 w-2.5 rounded-full"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="bg-transparent h-2.5 w-2.5 rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 -ml-1 ${
                        s.status === 'complete' ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2 text-xs font-medium text-gray-500 text-center absolute top-8 w-32 -ml-12">
                  {s.name}
                </div>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-4 text-center pt-8">
          <h2 className="text-2xl font-bold">
            {step === 4 ? 'Company Registered!' : 'Registration in Progress'}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xs">
            We are securing{' '}
            <span className="text-foreground font-semibold">
              {ensName}.eth
            </span>
            . This takes about 2-3 minutes.
          </p>
        </div>

        {/* Logs */}
        <div className="border-border bg-muted/30 rounded-xl border p-4 text-left text-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-foreground font-medium">Status Log</p>
            {step < 4 && <Loader2 className="text-primary h-3 w-3 animate-spin" />}
          </div>
          <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 max-h-32 space-y-1 overflow-y-auto font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="text-muted-foreground">
                <span className="text-primary mr-2">{'>'}</span>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Link */}
        <div className="flex justify-center">
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            View Transaction on Etherscan
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {step === 4 && (
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 block w-full rounded-xl py-4 text-center text-lg font-semibold transition-all"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  )
}

interface SetupWizardProps {
  initialEnsName: string
}

export function SetupWizard({ initialEnsName }: SetupWizardProps) {
  const { connect, authenticated, user } = useWalletAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(
    null
  )
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
  const { data: costData, isLoading: isLoadingCost } = useEnsCost(
    initialEnsName,
    true
  )

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

    if (!costData?.costs?.costEth) {
      setError('Unable to calculate registration cost. Please try again.')
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      const founders = draft.shareholders.map(
        (f) => f.walletAddress as `0x${string}`
      )

      // Calculate total value to send (ENS cost + buffer)
      // We use the cost calculated by useEnsCost which already includes buffer
      // Ensure we send at least 0.01 ETH as required by the contract
      const valueToSend =
        costData.costs.costWei > MIN_REQUIRED_PAYMENT
          ? costData.costs.costWei
          : MIN_REQUIRED_PAYMENT

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
      const message =
        err instanceof Error ? err.message : 'Failed to create business'
      setError(message)
    } finally {
      setIsRegistering(false)
    }
  }

  // Success State
  if (registrationTxHash) {
    return (
      <RegistrationStatus
        txHash={registrationTxHash as `0x${string}`}
        ensName={initialEnsName}
        onSuccess={() => {
          // Optional: Auto-redirect or just let the user click the button
          // router.push('/dashboard')
        }}
      />
    )
  }

  const disableCreateButton =
    isRegistering ||
    isLoadingCost ||
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
