import { AlertTriangle, Clock, DollarSign, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useEnsRegistration } from '@/hooks/use-ens-registration'

interface ENSCostEstimateProps {
  ensName: string
  onProceed: () => void
  onCancel: () => void
  isOpen: boolean
}

export function ENSCostEstimate({
  ensName,
  onProceed,
  onCancel,
  isOpen,
}: ENSCostEstimateProps) {
  const { getRegistrationCost, checkWalletBalance } = useEnsRegistration()
  const [costs, setCosts] = useState<{
    costEth: string
    costWei: bigint
  } | null>(null)
  const [balance, setBalance] = useState<{
    balance: string
    hasEnough: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !ensName) return

    const fetchCosts = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get registration cost
        const costData = await getRegistrationCost(ensName, 1) // 1 year
        setCosts(costData)

        // Get wallet balance
        const balanceData = await checkWalletBalance()
        setBalance(balanceData)
      } catch (err) {
        console.error('Failed to fetch costs:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch costs')
      } finally {
        setLoading(false)
      }
    }

    fetchCosts()
  }, [isOpen, ensName, getRegistrationCost, checkWalletBalance])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md">
        <div className="bg-card border-border relative overflow-hidden rounded-2xl border shadow-2xl">
          {/* Header */}
          <div className="border-border border-b px-6 py-4">
            <h3 className="text-foreground flex items-center gap-2 text-xl font-bold">
              <DollarSign className="text-primary h-5 w-5" />
              ENS Registration Cost
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Review costs before proceeding
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="py-8 text-center">
                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                <p className="text-muted-foreground">Calculating costs...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <AlertTriangle className="text-destructive mx-auto mb-4 h-12 w-12" />
                <p className="text-destructive text-sm">{error}</p>
                <button
                  onClick={onCancel}
                  className="bg-muted hover:bg-muted/80 mt-4 rounded-2xl px-4 py-2 text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* ENS Name */}
                <div className="bg-primary/10 border-primary/20 mb-6 rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <div className="from-primary to-secondary flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br">
                      <span className="text-lg font-bold text-white">
                        {ensName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">
                        {ensName}.eth
                      </p>
                      <p className="text-muted-foreground text-sm">
                        1 year registration
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mb-6 space-y-4">
                  <div className="border-border/50 flex items-center justify-between border-b py-2">
                    <span className="text-muted-foreground">
                      Registration Fee
                    </span>
                    <span className="text-foreground font-mono">
                      {costs?.costEth} ETH
                    </span>
                  </div>

                  <div className="border-border/50 flex items-center justify-between border-b py-2">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className="text-foreground font-mono">
                      {balance?.balance} ETH
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground font-semibold">
                      Status
                    </span>
                    <span
                      className={`font-semibold ${balance?.hasEnough ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {balance?.hasEnough ? '✅ Sufficient' : '❌ Insufficient'}
                    </span>
                  </div>
                </div>

                {/* Process Info */}
                <div className="bg-muted/20 mb-6 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="text-primary mt-0.5 h-5 w-5" />
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        Registration Process
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        1. Commitment transaction (~1 min wait)
                        <br />
                        2. Registration transaction
                        <br />
                        3. ENS name will point to your business wallet
                      </p>
                    </div>
                  </div>
                </div>

                {/* Insufficient Balance Warning */}
                {!balance?.hasEnough && (
                  <div className="bg-destructive/10 border-destructive/20 mb-6 rounded-2xl border p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-destructive mt-0.5 h-5 w-5" />
                      <div>
                        <p className="text-destructive text-sm font-medium">
                          Insufficient Balance
                        </p>
                        <p className="text-destructive/80 mt-1 text-xs">
                          Get Sepolia ETH from the faucet to continue
                        </p>
                        <a
                          href="https://sepoliafaucet.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-destructive mt-2 inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          Open Sepolia Faucet{' '}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="bg-background hover:bg-secondary hover:text-background text-foreground flex-1 cursor-pointer rounded-2xl px-4 py-3 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onProceed}
                    disabled={!balance?.hasEnough}
                    className="bg-primary/80 hover:bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground flex-1 cursor-pointer rounded-2xl px-4 py-3 font-medium transition-colors hover:text-white"
                  >
                    {balance?.hasEnough ? 'Proceed' : 'Need More ETH'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
