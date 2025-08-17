import { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, Clock, ExternalLink } from 'lucide-react'
import { useEnsRegistration } from '@/hooks/use-ens-registration'

interface ENSCostEstimateProps {
  ensName: string
  onProceed: () => void
  onCancel: () => void
  isOpen: boolean
}

export function ENSCostEstimate({ ensName, onProceed, onCancel, isOpen }: ENSCostEstimateProps) {
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
        console.log('📊 Fetching ENS costs for:', ensName)
        
        // Get registration cost
        const costData = await getRegistrationCost(ensName, 1) // 1 year
        setCosts(costData)
        
        // Get wallet balance
        const balanceData = await checkWalletBalance()
        setBalance(balanceData)
        
        console.log('💰 Cost estimation:', {
          name: ensName,
          cost: costData.costEth,
          balance: balanceData.balance,
          hasEnough: balanceData.hasEnough
        })
        
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
        <div className="bg-background border-border relative overflow-hidden rounded-2xl border shadow-2xl">
          {/* Header */}
          <div className="border-border border-b px-6 py-4">
            <h3 className="text-foreground text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              ENS Registration Cost
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Review costs before proceeding
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Calculating costs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive text-sm">{error}</p>
                <button
                  onClick={onCancel}
                  className="mt-4 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* ENS Name */}
                <div className="bg-primary/10 border-primary/20 rounded-xl border p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="from-primary to-accent flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br">
                      <span className="text-primary-foreground text-lg font-bold">
                        {ensName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">{ensName}.eth</p>
                      <p className="text-muted-foreground text-sm">1 year registration</p>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Registration Fee</span>
                    <span className="text-foreground font-mono">{costs?.costEth} ETH</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className="text-foreground font-mono">{balance?.balance} ETH</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-foreground font-semibold">Status</span>
                    <span className={`font-semibold ${balance?.hasEnough ? 'text-green-600' : 'text-red-600'}`}>
                      {balance?.hasEnough ? '✅ Sufficient' : '❌ Insufficient'}
                    </span>
                  </div>
                </div>

                {/* Process Info */}
                <div className="bg-muted/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium text-sm">Registration Process</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        1. Commitment transaction (~1 min wait)<br />
                        2. Registration transaction<br />
                        3. ENS name will point to your business wallet
                      </p>
                    </div>
                  </div>
                </div>

                {/* Insufficient Balance Warning */}
                {!balance?.hasEnough && (
                  <div className="bg-destructive/10 border-destructive/20 rounded-xl border p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="text-destructive font-medium text-sm">Insufficient Balance</p>
                        <p className="text-destructive/80 text-xs mt-1">
                          Get Sepolia ETH from the faucet to continue
                        </p>
                        <a
                          href="https://sepoliafaucet.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-destructive hover:underline"
                        >
                          Open Sepolia Faucet <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onProceed}
                    disabled={!balance?.hasEnough}
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
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